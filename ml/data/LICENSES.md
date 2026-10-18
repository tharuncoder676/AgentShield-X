# Dataset Licenses and Provenance

## Public Injection & Benchmark Datasets
- **SPML (System Prompt Leakage & Injection Benchmark)**: MIT License.
- **Deepset Prompt Injections**: CC-BY-SA 4.0 / Open Data.
- **AgentDojo Benchmark Corpus**: Apache 2.0.
- **OWASP LLM Top 10 Attack Samples**: CC-BY-SA 4.0.

## Proprietary Synthetic Corpora
- **AgentShield-X Synthetic Indirect Injections**: Generated internally for AgentShield-X security evaluations.
  - Payloads: Hidden HTML/markdown comments, instruction overrides, system note impersonations, base64 smuggling, homoglyph substitutions, delimiter breakout.
- **AgentShield-X Benign Near-Miss Suite**: Imperative business instructions in legitimate context (invoices, customer service, partner meetings) designed to rigorously stress-test false positive rejection.
- **AgentTrace-2000**: Synthesized multi-turn agent session traces (benign workflows vs goal hijacking).
