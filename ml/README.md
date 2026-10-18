# AgentShield-X: ML Training & Evaluation Pipeline

CPU-first, reproducible machine learning subsystem protecting LLM agents against prompt injection, tool misuse, data exfiltration, goal hijacking, and behavioral anomalies.

---

## 1. Directory Architecture

```
ml/
  interfaces.py         # Shared DetectorOutput & ToolCallEvent schemas (Section 4)
  configs/              # YAML configurations (seeds, thresholds, parameters)
  data/
    generators/         # Synthetic data generators (text, traces, pairs)
    raw/                # Raw ingested datasets
    processed/          # Cleaned & normalized corpora
    splits/             # Disjoint partitions A (60%), B (20%), V (20%) & frozen test set
    DATA_CARD.md        # Dataset provenance, hashes, and distribution breakdown
  features/             # Session aggregate & sequential feature extractors
  detectors/            # Detectors implementing score(event_or_text) -> DetectorOutput
    similarity/         # MiniLM sentence embeddings & FAISS vector search
    anomaly/            # Markov sequence model, Isolation Forest, Sequence Autoencoder
    intent/             # Task/action consistency scorer
    injection_baseline/ # Stand-in TF-IDF classifier
    injection/          # DeBERTa ONNX adapter with automatic fallback
  risk/                 # Calibrated LightGBM stacker & tiered thresholds
  eval/                 # Evaluation harness, ablations, reports
  export/               # Model packaging (ONNX, joblib, manifest.json, model_card.md)
  tests/                # 29 unit tests (leakage, calibration, thresholds, smoke)
models/                 # Versioned production model artifacts (1.0.0/)
  similarity/1.0.0/     # FAISS Index + family metadata
  anomaly/1.0.0/        # Markov matrix, Isolation Forest, Autoencoder ONNX
  intent/1.0.0/         # Logistic Regression intent classifier
  risk/1.0.0/           # Monotonic LightGBM stacker + Platt calibrator
  injection_baseline/   # TF-IDF + Logistic Regression stand-in
```

---

## 2. Shared Interface Contract (`ml/interfaces.py`)

All detectors adhere to the standardized Pydantic v2 schemas:

```python
class DetectorOutput(BaseModel):
    detector: str            # "injection" | "similarity" | "anomaly" | "intent"
    score: float             # 0..1, higher = riskier
    flagged: bool            # score >= tuned threshold
    threshold: float
    evidence: dict = {}      # Nearest attack, top features, etc.
    model_version: str
    latency_ms: float

class ToolCallEvent(BaseModel):
    session_id: str
    step: int
    tool: str
    sensitivity: str         # low | medium | high | critical
    arguments: dict
    task_text: str
    context_segments: list[dict]
    taint: list[str]
```

---

## 3. Retraining Pipeline Commands

Execute targets via `make <target>` on Unix or `python ml/make.py <target>` across all platforms:

| Target | Command | Description |
| :--- | :--- | :--- |
| **Data Generation** | `python ml/make.py data` | Generates text, traces, pairs, and partition splits A, B, V, and Test |
| **Train Baseline** | `python -m ml.detectors.injection_baseline.train` | Trains TF-IDF + Logistic Regression stand-in |
| **Train Similarity** | `python ml/make.py train-similarity` | Builds FAISS index on Partition A attacks |
| **Train Anomaly** | `python ml/make.py train-anomaly` | Trains Markov chain, Isolation Forest, and Autoencoder |
| **Train Intent** | `python ml/make.py train-intent` | Fits intent consistency classifier on task/action pairs |
| **Train Stacker** | `python ml/make.py train-stacker` | Fits Monotonic LightGBM and calibrates on Partition V |
| **Run Tests** | `python ml/make.py test` | Executes all 29 pytest validation suites |
| **Evaluate Harness** | `python ml/make.py eval` | Runs full test set evaluation and generates markdown/json reports |
| **Package Artifacts** | `python ml/make.py export` | Generates `manifest.json`, `thresholds.json`, and `model_card.md` |
| **Run All** | `python ml/make.py all` | Executes data generation, training, evaluation, packaging, and tests |

---

## 4. Subsystem Modules

### 4.1 Synthetic Data Generators (`ml/data/generators/`)
- `text_generator.py`: Generates 840 attacks across 12 families and 2,520 benign corporate communications (25% near-misses with imperative commands).
- `trace_simulator.py`: Simulates 5,000 benign sessions (15 corporate task templates) and 800 multi-step attack sessions across 8 attack patterns (`goal_hijack_exfil`, `honeytool_touch`, `runaway_loop`, `rare_transition`, etc.).
- `pair_generator.py`: 16,046 paraphrased `(task_text, tool, arguments)` pairs with intent labels.
- `splits.py`: Enforces zero-leakage split protocol: holds out whole attack families (`base64_obfuscated`, `multilingual`, `payload_split`, `rare_transition`, `slow_and_low`) and holds out 3 benign task templates for the frozen test set.

### 4.2 Similarity Detector (`ml/detectors/similarity/`)
- Embeds attacks with `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional).
- Inner-product FAISS vector index with normalized vectors (cosine similarity).
- Tuned threshold on validation set V meets false-positive budget $\le 2\%$.
- Includes a local Qdrant adapter with the identical interface contract.

### 4.3 Anomaly Detectors (`ml/detectors/anomaly/`)
- Trained strictly on benign sessions from Partition A (unsupervised).
- **Markov Transition Model**: Laplace-smoothed tool transition matrix; flags unseen tool sequences.
- **Isolation Forest**: 100 estimators over 14 session-level aggregate features.
- **Sequence Autoencoder**: PyTorch LSTM encoder-decoder over tool embeddings and step metrics, exported to ONNX format.
- Combined live rank-average score for multi-turn sessions.

### 4.4 Intent Consistency Scorer (`ml/detectors/intent/`)
- 6 semantic & policy features: task-action cosine similarity, tool-in-allowed-template flag, external destination indicator, volume delta, sensitivity level, untrusted taint flow.
- Simple, ultra-fast Logistic Regression with threshold tuned on Partition V.

### 4.5 Risk Stacker & Calibration (`ml/risk/`)
- Monotonic LightGBM stacker: higher detector scores are mathematically constrained to never lower risk ($+1$ monotonicity across all features).
- Out-of-fold training on Partition B detector outputs (zero detector leakage).
- Calibrated using regularized Platt scaling (`C=0.5`) on Partition V.
- Generates tiered operational thresholds: `ALLOW`, `SANITIZE`, `ESCALATE`, `BLOCK`, `KILL_SESSION`, with deterministic hard-overrides for canary tokens and honeytool triggers.

### 4.6 Live Inference Engine (`ml/inference.py`)
- `score_event(event: ToolCallEvent) -> Decision`: Runs all detectors in parallel via `ThreadPoolExecutor` with per-detector timeouts.
- Graceful degradation: If a detector fails or times out, inference proceeds with remaining detectors, flagging `degraded=True`.
- Hard-override security rules force immediate BLOCK or KILL_SESSION.

---

## 5. Production Model Artifacts (`models/`)

Exported artifacts adhere to semantic versioning (`1.0.0`) with complete provenance:
- `models/similarity/1.0.0/`: `index.faiss`, `manifest.json`, `threshold.json`, `model_card.md`
- `models/anomaly/1.0.0/`: `markov.json`, `isolation_forest.joblib`, `autoencoder.onnx`, `manifest.json`, `thresholds.json`, `model_card.md`
- `models/intent/1.0.0/`: `intent_model.joblib`, `manifest.json`, `thresholds.json`, `model_card.md`
- `models/risk/1.0.0/`: `stacker.joblib`, `calibrator.joblib`, `manifest.json`, `thresholds.json`, `model_card.md`
- `models/injection_baseline/1.0.0/`: `tfidf.joblib`, `model.joblib`, `manifest.json`, `thresholds.json`, `model_card.md`
- `models/injection/1.0.0/`: Adapter directory for GPU-trained DeBERTa ONNX model (`model.int8.onnx`). Fallback active when model is absent.
