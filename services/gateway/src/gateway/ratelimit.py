"""
AgentShield-X Token Bucket Rate Limiter
Prevents DoS, runaway agent loops, and enforces tenant tier limits.
"""

import time
from typing import Dict


class TokenBucketRateLimiter:
    """
    In-memory token bucket rate limiter per tenant.
    Configurable capacity and replenishment rate.
    """

    def __init__(self, capacity: float = 1000.0, refill_rate_per_sec: float = 500.0) -> None:
        self.capacity = capacity
        self.refill_rate = refill_rate_per_sec
        # Maps tenant_id -> (tokens, last_update_timestamp)
        self._buckets: Dict[str, tuple[float, float]] = {}

    def is_allowed(self, tenant_id: str, tokens: float = 1.0) -> bool:
        now = time.time()
        curr_tokens, last_update = self._buckets.get(tenant_id, (self.capacity, now))

        # Add newly accrued tokens
        delta = now - last_update
        accrued = delta * self.refill_rate
        curr_tokens = min(self.capacity, curr_tokens + accrued)

        if curr_tokens >= tokens:
            self._buckets[tenant_id] = (curr_tokens - tokens, now)
            return True
        else:
            self._buckets[tenant_id] = (curr_tokens, now)
            return False
