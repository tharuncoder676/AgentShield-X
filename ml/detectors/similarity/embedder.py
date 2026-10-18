"""
AgentShield-X MiniLM Embedder
Loads sentence-transformers/all-MiniLM-L6-v2, generates L2-normalized 384-dim embeddings.
Optimized for CPU inference.
"""

from __future__ import annotations

import time
from typing import List, Union

import numpy as np
from sentence_transformers import SentenceTransformer


class MiniLMEmbedder:
    """Wrapper around all-MiniLM-L6-v2 with automatic L2-normalization."""

    _instance = None

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        # Ensure evaluation mode on CPU
        self.model.eval()

    @classmethod
    def get_instance(cls) -> MiniLMEmbedder:
        """Singleton getter to prevent multiple model instances in memory."""
        if cls._instance is None:
            cls._instance = MiniLMEmbedder()
        return cls._instance

    def encode(self, texts: Union[str, List[str]], batch_size: int = 64) -> Tuple[np.ndarray, float]:
        """
        Encodes texts to L2-normalized float32 numpy array.
        Returns (embeddings, elapsed_ms).
        """
        t0 = time.perf_counter()
        if isinstance(texts, str):
            texts = [texts]

        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,  # Crucial: cosine similarity == inner product
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        return embeddings.astype(np.float32), elapsed_ms
