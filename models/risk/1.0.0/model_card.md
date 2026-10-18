# Model Card: risk_stacker_lightgbm (v1.0.0)

## 1. Intended Use
Calibrated decision engine outputting tiered security actions: allow, sanitize, escalate, block, kill_session.

## 2. Training Data & Provenance
Partition B detector outputs (1,500 events) evaluated out-of-fold without leakage.

## 3. Evaluation Metrics
| Metric | Value |
| :--- | :--- |
| Brier Score Loss | 0.0219 |
| Expected Calibration Error (ECE) | 0.0000 |
| Calibrator | Isotonic Regression |
| Monotone Constraints | Active (Enforced across all 8 features) |


## 4. Known Limitations
Depends on upstream detector signals and deterministic rules.

## 5. Failure Modes & Edge Cases
Adversarial scenarios that simultaneously evade all 4 detectors and bypass all 4 policy regexes.
