"""
AgentShield-X Vector Index & Qdrant Adapter
Builds FAISS IndexFlatIP (inner product) and local in-memory Qdrant adapter
behind the same unified interface.
Section 6.2 requirements.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional, Tuple

import faiss
import numpy as np


class SimilarityVectorIndex:
    """
    Dual-backend vector index supporting FAISS and local Qdrant.
    Normalized embeddings guarantee inner product == cosine similarity.
    """

    def __init__(self, dim: int = 384, use_qdrant: bool = False):
        self.dim = dim
        self.use_qdrant = use_qdrant
        self.metadata: List[Dict[str, Any]] = []
        self.faiss_index: Optional[faiss.IndexFlatIP] = None
        self.qdrant_client = None
        self.collection_name = "agentshield_attacks"

        self.faiss_index = faiss.IndexFlatIP(dim)

        if use_qdrant:
            try:
                from qdrant_client import QdrantClient
                from qdrant_client.models import Distance, VectorParams
                self.qdrant_client = QdrantClient(":memory:")
                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
                )
            except Exception as e:
                self.qdrant_client = None

    def add_vectors(self, vectors: np.ndarray, metadata: List[Dict[str, Any]]) -> None:
        """Adds normalized float32 vectors with metadata."""
        if vectors.dtype != np.float32:
            vectors = vectors.astype(np.float32)

        start_idx = len(self.metadata)
        self.metadata.extend(metadata)
        self.faiss_index.add(vectors)

        if self.qdrant_client is not None:
            from qdrant_client.models import PointStruct
            points = [
                PointStruct(
                    id=start_idx + i,
                    vector=vectors[i].tolist(),
                    payload=metadata[i],
                )
                for i in range(len(vectors))
            ]
            self.qdrant_client.upsert(collection_name=self.collection_name, points=points)

    def search(self, query_vector: np.ndarray, top_k: int = 3) -> Dict[str, Any]:
        """
        Searches top_k nearest neighbors by cosine similarity.
        Returns dict with:
          max_score: float (0..1)
          top_neighbors: list of {id, family, score, text_snippet}
        """
        if query_vector.ndim == 1:
            query_vector = np.expand_dims(query_vector, axis=0)
        if query_vector.dtype != np.float32:
            query_vector = query_vector.astype(np.float32)

        top_k = min(top_k, len(self.metadata))
        if top_k == 0:
            return {"max_score": 0.0, "top_neighbors": []}

        distances, indices = self.faiss_index.search(query_vector, top_k)
        sims = distances[0]
        idxs = indices[0]

        top_neighbors = []
        for sim, idx in zip(sims, idxs):
            if idx < 0 or idx >= len(self.metadata):
                continue
            meta = self.metadata[idx]
            # FAISS IP with normalized vectors is in [-1, 1], clamp to [0, 1]
            score_clamped = float(np.clip(sim, 0.0, 1.0))
            top_neighbors.append({
                "doc_id": meta.get("doc_id", f"atk_{idx}"),
                "attack_family": meta.get("attack_family", "unknown"),
                "similarity": round(score_clamped, 4),
                "text_snippet": meta.get("text", "")[:80],
            })

        max_score = top_neighbors[0]["similarity"] if top_neighbors else 0.0
        return {
            "max_score": max_score,
            "top_neighbors": top_neighbors,
        }

    def save(self, dest_dir: str) -> None:
        """Saves FAISS index and metadata to disk."""
        os.makedirs(dest_dir, exist_ok=True)
        faiss_path = os.path.join(dest_dir, "index.faiss")
        meta_path = os.path.join(dest_dir, "metadata.json")

        faiss.write_index(self.faiss_index, faiss_path)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=2)

    def load(self, src_dir: str) -> None:
        """Loads FAISS index and metadata from disk."""
        faiss_path = os.path.join(src_dir, "index.faiss")
        meta_path = os.path.join(src_dir, "metadata.json")

        if not os.path.exists(faiss_path) or not os.path.exists(meta_path):
            raise FileNotFoundError(f"Missing similarity artifacts in {src_dir}")

        self.faiss_index = faiss.read_index(faiss_path)
        with open(meta_path, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)
