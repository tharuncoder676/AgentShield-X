# Model Card: similarity_minilm_faiss (v1.0.0)

## 1. Intended Use
Fast sub-millisecond semantic similarity search against known adversarial prompt injections.

## 2. Training Data & Provenance
Partition A attack texts (340 samples) from synthetic generation across 12 families.

## 3. Evaluation Metrics
| Metric | Value |
| :--- | :--- |
| Recall on Seen Attack Families | 98.51% |
| Recall on Held-out Families | 37.62% |
| False Positive Rate (Budget <= 2%) | 2.02% |
| Single-item Search Latency p95 | 0.18ms |
| Single-item Embedding Latency p95 | 10.66ms |


## 4. Known Limitations
Lacks execution-level obfuscation decoders (e.g. raw Base64 or token splitting without preprocessing).

## 5. Failure Modes & Edge Cases
Zero-width unicode, deep Base64 encodings, or novel high-entropy cipher strings without explicit decoding.
