# Model Card: injection_baseline (v1.0.0)

## 1. Intended Use
Lightweight CPU-first stand-in classifier for prompt injection before GPU DeBERTa arrives.

## 2. Training Data & Provenance
Partition A text (1,701 samples) using TF-IDF word and character n-grams.

## 3. Evaluation Metrics
| Metric | Value |
| :--- | :--- |
| Validation Tuned Threshold | 0.1000 |
| Test Set Recall | 100.0% |
| Test Set FPR | 0.0% |


## 4. Known Limitations
Linear model with n-gram features; sensitive to character substitutions and heavy novel phrasing.

## 5. Failure Modes & Edge Cases
Sophisticated jailbreaks relying on deep nested roleplay or non-English polyglots.
