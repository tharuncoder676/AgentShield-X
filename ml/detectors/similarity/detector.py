"""
AgentShield-X Similarity Detector
Implements Section 4 BaseDetector interface:
score(event_or_text) -> DetectorOutput
Loads exported FAISS index and tuned threshold.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, Optional, Union

from ml.detectors.similarity.embedder import MiniLMEmbedder
from ml.detectors.similarity.index import SimilarityVectorIndex
from ml.interfaces import BaseDetector, DetectorOutput, ToolCallEvent

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SIM_MODEL_DIR = os.path.join(BASE_DIR, "models", "similarity", "1.0.0")


class SimilarityDetector(BaseDetector):
    """
    Vector similarity detector matching inputs against known attack corpus.
    Outputs normalized cosine risk score and nearest attack evidence.
    """

    def __init__(self, model_dir: Optional[str] = None, threshold: float = 0.70):
        self.model_version = "1.0.0"
        self.target_dir = model_dir or SIM_MODEL_DIR
        self.threshold = threshold
        self.index = SimilarityVectorIndex(dim=384)
        self.embedder = MiniLMEmbedder.get_instance()

        thresh_path = os.path.join(self.target_dir, "threshold.json")
        if os.path.exists(thresh_path):
            try:
                with open(thresh_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    self.threshold = cfg.get("threshold", threshold)
            except Exception:
                pass

        if os.path.exists(os.path.join(self.target_dir, "index.faiss")):
            self.index.load(self.target_dir)

    def score(self, event_or_text: Union[ToolCallEvent, str]) -> DetectorOutput:
        """Embeds text, queries FAISS index, and returns DetectorOutput."""
        t0 = time.perf_counter()

        if isinstance(event_or_text, ToolCallEvent):
            text = event_or_text.task_text
            for seg in event_or_text.context_segments:
                text += " " + seg.get("text", "")
        else:
            text = str(event_or_text)

        # 1. Embedding
        query_vec, embed_ms = self.embedder.encode(text)

        # 2. Vector search
        t_search0 = time.perf_counter()
        search_res = self.index.search(query_vec, top_k=3)
        search_ms = (time.perf_counter() - t_search0) * 1000.0

        score = search_res["max_score"]
        flagged = score >= self.threshold
        total_latency_ms = (time.perf_counter() - t0) * 1000.0

        top_hit = search_res["top_neighbors"][0] if search_res["top_neighbors"] else {}

        return DetectorOutput(
            detector="similarity",
            score=round(score, 4),
            flagged=flagged,
            threshold=round(self.threshold, 4),
            evidence={
                "nearest_attack_id": top_hit.get("doc_id", "none"),
                "nearest_family": top_hit.get("attack_family", "none"),
                "top_similarity": top_hit.get("similarity", 0.0),
                "top_3_neighbors": search_res["top_neighbors"],
                "embed_latency_ms": round(embed_ms, 2),
                "search_latency_ms": round(search_ms, 2),
            },
            model_version=self.model_version,
            latency_ms=round(total_latency_ms, 2),
        )

    def get_manifest(self) -> Dict[str, Any]:
        return {
            "model_name": "similarity_minilm_faiss",
            "version": self.model_version,
            "embedder": "sentence-transformers/all-MiniLM-L6-v2",
            "index_type": "FAISS IndexFlatIP",
            "threshold": self.threshold,
            "indexed_samples": len(self.index.metadata),
        }
