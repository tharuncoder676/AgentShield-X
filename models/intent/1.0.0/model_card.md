# Model Card: intent_consistency_scorer (v1.0.0)

## 1. Intended Use
Scoring alignment between high-level user prompt goals and granular tool call actions.

## 2. Training Data & Provenance
Partition A paraphrased task/action pairs (1,500 pairs) with 6 semantic & policy features.

## 3. Evaluation Metrics
| Metric | Value |
| :--- | :--- |
| ROC-AUC on Held-Out Templates | 0.9880 |
| Precision at Tuned Threshold | 97.25% |
| Recall at Tuned Threshold | 89.08% |
| False Positive Rate | 0.51% |


## 4. Known Limitations
Depends on descriptive task prompt context. Vague prompts ('do the task') reduce semantic cosine signal.

## 5. Failure Modes & Edge Cases
Tasks with ambiguous multi-purpose goals where the user prompt explicitly permits arbitrary external communication.
