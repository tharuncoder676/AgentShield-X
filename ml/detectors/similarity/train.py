"""
AgentShield-X Similarity Detector Training & Calibration Pipeline
Implements Section 6.2 requirements:
- Embeds all attack texts in Partition A with all-MiniLM-L6-v2.
- Normalizes vectors and builds FAISS index + Qdrant adapter.
- Tunes threshold on Partition V to meet FPR <= 2% on benign text (including near-misses).
- Reports threshold-vs-recall curve.
- Evaluates on frozen test set, reporting recall per attack family (highlighting held-out families).
- Measures single-item CPU embedding and search latency (p50 and p95).
- Performs ablation: similarity alone vs. TF-IDF baseline alone vs. both.
- Saves versioned artifacts to models/similarity/1.0.0/ and models/injection_baseline/1.0.0/.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Tuple

import numpy as np

from ml.detectors.injection_baseline.baseline import InjectionBaselineDetector
from ml.detectors.similarity.embedder import MiniLMEmbedder
from ml.detectors.similarity.index import SimilarityVectorIndex

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "ml", "data", "splits")
SIM_MODEL_DIR = os.path.join(BASE_DIR, "models", "similarity", "1.0.0")
BASE_MODEL_DIR = os.path.join(BASE_DIR, "models", "injection_baseline", "1.0.0")


def load_jsonl(path: str) -> List[Dict[str, Any]]:
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return records


def run_training() -> Dict[str, Any]:
    t_start = time.time()
    print("=" * 65)
    print("AgentShield-X: Training Similarity Detector & Baseline (Step 3)")
    print("=" * 65)

    embedder = MiniLMEmbedder.get_instance()

    # 1. Load Partition A (Train), V (Validation/Tuning), and Test
    train_texts = load_jsonl(os.path.join(DATA_DIR, "text_A.jsonl"))
    val_texts = load_jsonl(os.path.join(DATA_DIR, "text_V.jsonl"))
    test_texts = load_jsonl(os.path.join(DATA_DIR, "text_test.jsonl"))

    print(f"Loaded datasets: Train_A={len(train_texts)}, Val_V={len(val_texts)}, Test={len(test_texts)}")

    # 2. Train Injection Baseline (TF-IDF + Logistic Regression) on Partition A
    print("\n[1/5] Fitting TF-IDF + LogisticRegression baseline on Partition A...")
    baseline_detector = InjectionBaselineDetector()
    X_train_base = [r["text"] for r in train_texts]
    y_train_base = [r["label"] for r in train_texts]
    baseline_detector.fit(X_train_base, y_train_base)

    # Tune baseline threshold on Partition V (FPR <= 0.02)
    X_val_base = [r["text"] for r in val_texts]
    y_val_base = [r["label"] for r in val_texts]
    base_thresh = baseline_detector.tune_threshold(X_val_base, y_val_base, max_fpr=0.02)
    baseline_detector.save(BASE_MODEL_DIR)
    print(f"  -> Baseline tuned threshold on V: {base_thresh:.4f}")

    # 3. Build FAISS & Qdrant Index on Partition A Attacks
    print("\n[2/5] Embedding Partition A attack texts with all-MiniLM-L6-v2...")
    attack_samples_a = [r for r in train_texts if r["label"] == 1]
    attack_texts_a = [r["text"] for r in attack_samples_a]

    attack_embeddings_a, emb_time_ms = embedder.encode(attack_texts_a, batch_size=64)
    print(f"  -> Embedded {len(attack_texts_a)} attacks into {attack_embeddings_a.shape} in {emb_time_ms:.1f}ms")

    vector_index = SimilarityVectorIndex(dim=384, use_qdrant=True)
    vector_index.add_vectors(attack_embeddings_a, attack_samples_a)
    print(f"  -> Added {len(attack_samples_a)} vectors to FAISS IndexFlatIP & in-memory Qdrant")

    # 4. Threshold Tuning on Partition V (FPR <= 2% on benign including near-misses)
    print("\n[3/5] Tuning similarity threshold on Partition V (FPR budget <= 2%)...")
    val_embs, _ = embedder.encode([r["text"] for r in val_texts], batch_size=64)

    val_scores = []
    for i in range(len(val_texts)):
        res = vector_index.search(val_embs[i:i+1], top_k=1)
        val_scores.append(res["max_score"])
    val_scores = np.array(val_scores)

    val_labels = np.array([r["label"] for r in val_texts])
    benign_mask = val_labels == 0
    attack_mask = val_labels == 1

    benign_scores = val_scores[benign_mask]
    attack_scores = val_scores[attack_mask]

    # Find threshold where FPR on benign <= 0.02
    sorted_benign = np.sort(benign_scores)[::-1]
    cutoff_idx = int(np.floor(0.02 * len(benign_scores)))
    sim_threshold = float(sorted_benign[cutoff_idx]) + 1e-4 if cutoff_idx < len(sorted_benign) else 0.70
    sim_threshold = float(np.clip(sim_threshold, 0.40, 0.95))

    measured_val_fpr = float(np.mean(benign_scores >= sim_threshold))
    measured_val_recall = float(np.mean(attack_scores >= sim_threshold))

    print(f"  -> Selected similarity threshold: {sim_threshold:.4f}")
    print(f"  -> Validation FPR on Benign (including near-misses): {measured_val_fpr * 100:.2f}% (Budget: <= 2.0%)")
    print(f"  -> Validation Recall on Attacks: {measured_val_recall * 100:.2f}%")

    # Threshold-vs-Recall curve on V
    print("  -> Threshold-vs-Recall Curve on Validation Set:")
    curve_points = []
    for th in [0.40, 0.50, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85]:
        th_recall = float(np.mean(attack_scores >= th))
        th_fpr = float(np.mean(benign_scores >= th))
        curve_points.append({"threshold": th, "recall": round(th_recall, 4), "fpr": round(th_fpr, 4)})
        print(f"     Threshold={th:.2f} | Recall={th_recall*100:5.1f}% | FPR={th_fpr*100:4.1f}%")

    # 5. Evaluate on Test Set (Seen vs Held-Out Families)
    print("\n[4/5] Evaluating on Frozen Test Set...")
    test_embs, _ = embedder.encode([r["text"] for r in test_texts], batch_size=64)

    test_sim_scores = []
    for i in range(len(test_texts)):
        res = vector_index.search(test_embs[i:i+1], top_k=3)
        test_sim_scores.append(res["max_score"])
    test_sim_scores = np.array(test_sim_scores)

    test_labels = np.array([r["label"] for r in test_texts])
    test_benign_mask = test_labels == 0
    test_fpr = float(np.mean(test_sim_scores[test_benign_mask] >= sim_threshold))

    # Recall per attack family
    family_recalls = {}
    held_out_families = ["base64_obfuscated", "multilingual", "payload_split"]

    print("\n  Per-Attack-Family Recall on Test:")
    for fam in sorted(list(set(r.get("attack_family", "unknown") for r in test_texts if r["label"] == 1))):
        fam_mask = np.array([r.get("attack_family") == fam for r in test_texts])
        fam_scores = test_sim_scores[fam_mask]
        rec = float(np.mean(fam_scores >= sim_threshold)) if len(fam_scores) > 0 else 0.0
        family_recalls[fam] = rec
        tag = "[HELD-OUT]" if fam in held_out_families else "[SEEN]"
        print(f"     {fam:28s} {tag:10s} : Recall = {rec * 100:5.1f}% ({np.sum(fam_mask)} samples)")

    seen_mask = np.array([r["label"] == 1 and r.get("attack_family") not in held_out_families for r in test_texts])
    held_out_mask = np.array([r["label"] == 1 and r.get("attack_family") in held_out_families for r in test_texts])

    seen_recall = float(np.mean(test_sim_scores[seen_mask] >= sim_threshold))
    held_out_recall = float(np.mean(test_sim_scores[held_out_mask] >= sim_threshold))
    total_test_recall = float(np.mean(test_sim_scores[test_labels == 1] >= sim_threshold))

    print(f"\n  Summary Metrics:")
    print(f"     Similarity Recall on SEEN families:     {seen_recall * 100:.2f}% (Target: >= 85%)")
    print(f"     Similarity Recall on HELD-OUT families: {held_out_recall * 100:.2f}%")
    print(f"     Total Test Recall on all attacks:       {total_test_recall * 100:.2f}%")
    print(f"     Test FPR on benign & near-misses:       {test_fpr * 100:.2f}% (Budget: <= 2%)")

    # 6. Latency Benchmarking (Single-item CPU p50 / p95)
    print("\n[5/5] Measuring single-item CPU latency (p50 and p95)...")
    latencies_embed = []
    latencies_search = []
    benchmark_samples = [r["text"] for r in test_texts[:100]]

    for text in benchmark_samples:
        t0 = time.perf_counter()
        q_vec, _ = embedder.encode(text)
        lat_emb = (time.perf_counter() - t0) * 1000.0

        t1 = time.perf_counter()
        vector_index.search(q_vec, top_k=3)
        lat_search = (time.perf_counter() - t1) * 1000.0

        latencies_embed.append(lat_emb)
        latencies_search.append(lat_search)

    p50_emb = float(np.percentile(latencies_embed, 50))
    p95_emb = float(np.percentile(latencies_embed, 95))
    p50_search = float(np.percentile(latencies_search, 50))
    p95_search = float(np.percentile(latencies_search, 95))
    total_p95 = p95_emb + p95_search

    print(f"  -> MiniLM Embedding CPU Latency: p50={p50_emb:.2f}ms, p95={p95_emb:.2f}ms")
    print(f"  -> FAISS Vector Search Latency:   p50={p50_search:.2f}ms, p95={p95_search:.2f}ms")
    print(f"  -> Combined Similarity Latency:   p95={total_p95:.2f}ms")

    # 7. Ablation Study: Similarity vs Baseline vs Both
    print("\n  Ablation Study on Test Set:")
    base_test_probs = baseline_detector.pipeline.predict_proba([r["text"] for r in test_texts])[:, 1]
    base_preds = base_test_probs >= base_thresh
    sim_preds = test_sim_scores >= sim_threshold
    both_preds = np.logical_or(base_preds, sim_preds)

    def get_rec_fpr(preds, labels):
        rec = float(np.mean(preds[labels == 1]))
        fpr = float(np.mean(preds[labels == 0]))
        return rec, fpr

    sim_rec, sim_fpr = get_rec_fpr(sim_preds, test_labels)
    base_rec, base_fpr = get_rec_fpr(base_preds, test_labels)
    both_rec, both_fpr = get_rec_fpr(both_preds, test_labels)

    print(f"     1. Similarity Alone:  Recall={sim_rec*100:5.1f}% | FPR={sim_fpr*100:4.1f}%")
    print(f"     2. Baseline Alone:    Recall={base_rec*100:5.1f}% | FPR={base_fpr*100:4.1f}%")
    print(f"     3. Both (Logical OR): Recall={both_rec*100:5.1f}% | FPR={both_fpr*100:4.1f}%")

    # 8. Save Artifacts to models/similarity/1.0.0/
    vector_index.save(SIM_MODEL_DIR)
    with open(os.path.join(SIM_MODEL_DIR, "threshold.json"), "w", encoding="utf-8") as f:
        json.dump({
            "threshold": sim_threshold,
            "fpr_budget": 0.02,
            "measured_val_fpr": measured_val_fpr,
            "measured_val_recall": measured_val_recall,
        }, f, indent=2)

    with open(os.path.join(SIM_MODEL_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({
            "model_name": "similarity_minilm_faiss",
            "version": "1.0.0",
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "embedder": "sentence-transformers/all-MiniLM-L6-v2",
            "threshold": sim_threshold,
            "latency_p95_ms": total_p95,
            "seen_family_recall": seen_recall,
            "held_out_family_recall": held_out_recall,
        }, f, indent=2)

    elapsed_total = round(time.time() - t_start, 2)
    print(f"\n[DONE] Similarity detector training completed in {elapsed_total}s.")

    return {
        "similarity_threshold": sim_threshold,
        "seen_family_recall": seen_recall,
        "held_out_family_recall": held_out_recall,
        "test_fpr": test_fpr,
        "latency_p95_ms": total_p95,
        "runtime_s": elapsed_total,
    }


if __name__ == "__main__":
    run_training()
