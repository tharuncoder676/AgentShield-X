# Model Card: anomaly_ensemble (v1.0.0)

## 1. Intended Use
Unsupervised detection of behavioral anomalies, honeytool touches, runaway loops, and rare tool sequences.

## 2. Training Data & Provenance
Partition A benign sessions only (2,155 sessions) across 12 legitimate corporate task templates.

## 3. Evaluation Metrics
| Metric | Value |
| :--- | :--- |
| Isolation Forest ROC-AUC | 0.9977 |
| Autoencoder ROC-AUC | 0.9226 |
| Ensemble Recall at 1% FPR | 86.54% |
| Rare Transition [Held-Out] Recall | 100.0% |
| Slow and Low [Held-Out] Recall | 100.0% |


## 4. Known Limitations
Trained purely on normal behavior; cannot distinguish between highly sophisticated low-rate benign actions and targeted slow attacks without multi-turn history.

## 5. Failure Modes & Edge Cases
Attacks that strictly mimic legitimate arguments and stay well below standard volume thresholds.
