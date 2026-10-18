"""
AgentShield-X EventBus Abstraction
Defines the streaming event bus interface for publishing ToolCallEvents,
Decisions, Incidents, and Audit events.
"""

from abc import ABC, abstractmethod
from typing import Any, Callable, Coroutine, Dict


class EventBus(ABC):
    """Abstract interface for the event bus (Redis Streams locally, Kafka in production)."""

    @abstractmethod
    async def publish(self, topic: str, payload: Dict[str, Any]) -> str:
        """Publish an event to a topic/stream. Returns message ID."""
        pass

    @abstractmethod
    async def subscribe(
        self,
        topic: str,
        group: str,
        consumer: str,
        handler: Callable[[Dict[str, Any]], Coroutine[Any, Any, None]],
    ) -> None:
        """Subscribe to a topic/stream with consumer group semantics."""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close bus connections."""
        pass
