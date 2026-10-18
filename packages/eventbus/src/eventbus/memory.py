"""
In-Memory EventBus Implementation
High-throughput asyncio queue-based event bus for local development and unit tests.
"""

from __future__ import annotations

import asyncio
import uuid
from typing import Any, Callable, Coroutine, Dict, List
from eventbus.base import EventBus


class MemoryEventBus(EventBus):
    """In-memory event bus implementing async pub/sub without external broker."""

    def __init__(self) -> None:
        self._subscribers: Dict[str, List[Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]]] = {}
        self._events: Dict[str, List[Dict[str, Any]]] = {}

    async def publish(self, topic: str, payload: Dict[str, Any]) -> str:
        msg_id = f"mem-{uuid.uuid4().hex[:8]}"
        record = dict(payload)
        record["_msg_id"] = msg_id
        if topic not in self._events:
            self._events[topic] = []
        self._events[topic].append(record)

        # Notify any subscribed handlers asynchronously
        handlers = self._subscribers.get(topic, [])
        for handler in handlers:
            asyncio.create_task(handler(record))

        return msg_id

    async def subscribe(
        self,
        topic: str,
        group: str,
        consumer: str,
        handler: Callable[[Dict[str, Any]], Coroutine[Any, Any, None]],
    ) -> None:
        if topic not in self._subscribers:
            self._subscribers[topic] = []
        self._subscribers[topic].append(handler)

    async def close(self) -> None:
        self._subscribers.clear()
        self._events.clear()
