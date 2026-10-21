"""
AgentShield-X MCP Security Proxy Core
Runs an in-line, zero-trust security gate between any MCP client (Claude Desktop, AI agent)
and any upstream MCP server (stdio command or remote process).
"""

from __future__ import annotations

import asyncio
import logging
import shlex
import sys
from typing import Any, Dict, List, Optional, Union

from shield_mcp.models import JSONRPCMessage, ProxyAction
from shield_mcp.pipeline import MCPSecurityPipeline
from shield_mcp.transport import parse_message, serialize_message

logger = logging.getLogger("agentshield.mcp.proxy")


class MCPSecurityProxy:
    """
    Transparent bidirectional proxy that intercepts, verifies, and sanitizes
    MCP protocol traffic.
    """

    def __init__(
        self,
        upstream_cmd: Union[str, List[str]],
        pipeline: MCPSecurityPipeline,
        server_id: str = "upstream-mcp",
    ) -> None:
        if isinstance(upstream_cmd, str):
            self.upstream_cmd = shlex.split(upstream_cmd)
        else:
            self.upstream_cmd = list(upstream_cmd)

        self.pipeline = pipeline
        self.server_id = server_id
        self.context: Dict[str, Any] = {"server_id": server_id}
        self.pending_requests: Dict[Union[str, int], JSONRPCMessage] = {}
        self.is_running = False
        self._proc: Optional[asyncio.subprocess.Process] = None

    async def run(self) -> None:
        """Launches upstream server and runs stdio proxy loop."""
        logger.info(f"Starting AgentShield MCP Proxy for command: {self.upstream_cmd}")

        try:
            self._proc = await asyncio.create_subprocess_exec(
                *self.upstream_cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=sys.stderr,
            )
        except Exception as e:
            logger.error(f"Failed to spawn upstream MCP server: {e}")
            raise

        self.is_running = True

        # Wrap sys.stdin using StreamReader in an executor or async connect
        loop = asyncio.get_running_loop()
        client_reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(client_reader)
        await loop.connect_read_pipe(lambda: protocol, sys.stdin)

        client_writer_transport, _ = await loop.connect_write_pipe(
            asyncio.streams.FlowControlMixin, sys.stdout
        )
        client_writer = asyncio.StreamWriter(
            client_writer_transport, None, client_reader, loop
        )

        try:
            await asyncio.gather(
                self._client_to_upstream(client_reader, client_writer),
                self._upstream_to_client(client_writer),
            )
        finally:
            self.stop()

    async def _client_to_upstream(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """Handles requests sent from client agent to upstream server."""
        assert self._proc and self._proc.stdin

        while self.is_running:
            line_bytes = await reader.readline()
            if not line_bytes:
                break

            line_str = line_bytes.decode("utf-8", errors="replace")
            msg = parse_message(line_str)
            if not msg:
                # Malformed or blank line, forward raw
                self._proc.stdin.write(line_bytes)
                await self._proc.stdin.drain()
                continue

            # Run through client request pipeline
            result = await self.pipeline.process_client_request(msg, self.context)

            if result.action == ProxyAction.BLOCK and result.message:
                # Short-circuit: write blocked response directly back to client without calling upstream
                blocked_bytes = serialize_message(result.message).encode("utf-8")
                writer.write(blocked_bytes)
                await writer.drain()
                continue

            target_msg = result.message or msg

            # Track pending request by ID to correlate upstream response
            if target_msg.id is not None and target_msg.method:
                self.pending_requests[target_msg.id] = target_msg

            out_bytes = serialize_message(target_msg).encode("utf-8")
            self._proc.stdin.write(out_bytes)
            await self._proc.stdin.drain()

    async def _upstream_to_client(self, writer: asyncio.StreamWriter) -> None:
        """Handles responses sent from upstream server back to client agent."""
        assert self._proc and self._proc.stdout

        while self.is_running:
            line_bytes = await self._proc.stdout.readline()
            if not line_bytes:
                break

            line_str = line_bytes.decode("utf-8", errors="replace")
            msg = parse_message(line_str)
            if not msg:
                writer.write(line_bytes)
                await writer.drain()
                continue

            original_req = None
            if msg.id is not None:
                original_req = self.pending_requests.pop(msg.id, None)

            # Run through upstream response pipeline (rug-pull check, poisoning scan, tainting)
            result = await self.pipeline.process_upstream_response(
                msg, original_req, self.context
            )

            target_msg = result.message or msg
            out_bytes = serialize_message(target_msg).encode("utf-8")
            writer.write(out_bytes)
            await writer.drain()

    def stop(self) -> None:
        """Terminates upstream server and terminates proxy loops."""
        self.is_running = False
        if self._proc:
            try:
                self._proc.terminate()
            except ProcessLookupError:
                pass
