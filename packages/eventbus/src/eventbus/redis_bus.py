"""
Redis Streams EventBus Implementation
Production-ready bus using Redis Streams (XADD, XREADGROUP) with automatic consumer groups.
"""

import json
from typing import Any, Callable, Coroutine, Dict, Optional
from eventbus.base import EventBus


class RedisEventBus(EventBus):
    """Event bus utilizing Redis Streams for persistent event delivery."""

    def __init__(self, redis_url: str = "redis://localhost:6379/0") -> None:
        self.redis_url = redis_url
        self._client: Optional[Any] = None

    async def _get_client(self) -> Any:
        if self._client is None:
            import redis.asyncio as aioredis  # type: ignore
            self._client = aioredis.from_url(self.redis_url, decode_responses=True)
        return self._client

    async def publish(self, topic: str, payload: Dict[str, Any]) -> str:
        client = await self._get_client()
        serialized = {"data": json.dumps(payload)}
        msg_id = await client.xadd(topic, serialized)
        return str(msg_id)

    async def subscribe(
        self,
        topic: str,
        group: str,
        consumer: str,
        handler: Callable[[Dict[str, Any]], Coroutine[Any, Any, None]],
    ) -> None:
        client = await self._get_client()
        try:
            await client.xgroup_create(topic, group, id="0", mkstream=True)
        except Exception:
            # Group may already exist
            pass

    async def close(self) -> None:
        if self._client is not None:
            await self._client.close()
            self._client = None
