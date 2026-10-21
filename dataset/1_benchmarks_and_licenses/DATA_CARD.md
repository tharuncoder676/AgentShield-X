# AgentShield-X Dataset Data Card

- **Created**: 2026-10-16 11:16:08 UTC
- **Master Data SHA-256**: `ad585c913a7c371c627f6ed7f776af3d39b7f078ad158f1dd72b0d2ffce4251c`
- **Random Seed**: 42
- **Fictional Target Organization**: NexusCorp (`*.example.test`)
- **Safety Standard**: Zero real malware, exploits, or functional keys. All samples are benign-calibrated synthetic prompt injections and tool misuse patterns.

---

## 1. Split Protocol (Master Build Prompt Section 5.4)

### Held-out Families (Frozen Test Set Only)
- **Text Attack Families Held Out**: `base64_obfuscated, multilingual, payload_split`
- **Trace Attack Families Held Out**: `rare_transition, slow_and_low`
- **Benign Task Templates Held Out**: `held_out_expense_reconciliation, held_out_it_asset_inventory, held_out_customer_churn_predictor`

### Partitioning Rules
- **Partition A (60%)**: Detector training only (`text_A.jsonl`, `traces_train_A.jsonl`, `pairs_train_A.jsonl`).
- **Partition B (20%)**: Stacker training only (`text_B.jsonl`, `traces_stacker_B.jsonl`, `pairs_stacker_B.jsonl`).
- **Partition V (20%)**: Validation and threshold calibration (`text_V.jsonl`, `traces_val_V.jsonl`, `pairs_val_V.jsonl`).
- **Test Set**: Evaluated exactly once for final evaluation reports. Contains both seen and held-out families.

---

## 2. Partition Summary Counts

| Partition | Text Samples | Trace Sessions | Task/Action Pairs |
| :--- | :--- | :--- | :--- |
| **Train A (60%)** | 1701 | 2479 | 6880 |
| **Stacker B (20%)** | 567 | 826 | 2286 |
| **Validation V (20%)** | 567 | 828 | 2260 |
| **Frozen Test** | 525 | 1667 | 4620 |

---

## 3. Cryptographic Hashes (Reproducibility)

| Filename | SHA-256 Digest |
| :--- | :--- |
| `pairs_stacker_B.jsonl` | `5ed9ccd288218cd53056636f8bba9d25a8bdda628c665c7af9d3edd7516c140e` |
| `pairs_test.jsonl` | `2a35852fbf879a34d8a64a7e0ec7dc3ae6397b24aa8d0beaac13a75ef524483a` |
| `pairs_train_A.jsonl` | `d5bf4079296c20d8614ec7921d7b9aad5e235d654d36d12e97641f14695a48da` |
| `pairs_val_V.jsonl` | `a7436d1cb79f660d72ddf3be22382527b41c50656a7317330fcd9be2313fe6e7` |
| `text_A.jsonl` | `8a065765dc8a1713de3f7ca73b8a16f4c2d4ca49711ff0575c8b14a023e197bf` |
| `text_B.jsonl` | `e8f965ebb80fdefa75d88206acdee8afe664200a02e9574d7675df4c40b34a0f` |
| `text_V.jsonl` | `b1675decef96c0825763717b5c2929f2078832b8eef3335fbe0af152f934064d` |
| `text_test.jsonl` | `208a732ccbf9eb0486dfc09476db55337a38edf31a7f5190b9f6dc46b0808523` |
| `traces_stacker_B.jsonl` | `b6f81dae1565a0fe80d287e043861bedf5b5b7c3de551db937d3376a9245b712` |
| `traces_test.jsonl` | `d70e155ea187435f057850de3624d47c2da8213037cd2b3009eefa27a5e23e9a` |
| `traces_train_A.jsonl` | `65b70f558b1fa4c779438801ee85b4e22f94b484d29b94018b2e541dae99e66e` |
| `traces_val_V.jsonl` | `d42a0eb81ceebef2330480978449d5b232a5d5cfa48dd23db59445ce29a66a01` |

---

## 4. Manual Review
A random sample of 100 attack rows and 100 benign rows (including near-misses) has been exported to:
`ml/data/review_sample.csv` for human inspection.
