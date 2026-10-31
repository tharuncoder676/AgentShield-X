# Contributing to AgentShield-X

Thank you for your interest in contributing to **AgentShield-X**, the open-source deterministic runtime security platform for autonomous AI agents!

> **Architect & Creator:** Tharunkumar.S | AgentShield-X Security Labs  
> **Repository:** [https://github.com/tharuncoder676/AgentShield-X](https://github.com/tharuncoder676/AgentShield-X)

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors.

---

## How to Contribute

### 1. Contributing Detection Rules
Custom detection rules are defined in `detectors/rules/` or via the **AgentShield Rule Builder**. Rules should compile to high-speed AST evaluators with zero runtime overhead.

### 2. Contributing CLI Plugins & Connectors
To create a new connector or plugin:
1. Implement your connector in `packages/shield_core/src/shield_core/connectors/`.
2. Add comprehensive unit tests in `tests/unit/test_connectors.py`.
3. Submit a pull request referencing the framework (e.g., LlamaIndex, DSPy).

### 3. Development Workflow

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/tharuncoder676/AgentShield-X.git
   cd AgentShield-X
   ```

2. Set up Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
   pip install -e packages/shield_core -e services/control_api
   ```

3. Run the test suite:
   ```bash
   pytest tests/unit -v
   ```
   All PRs must pass 100% of the unit test suite before merge.

4. Start development server:
   ```bash
   python start_server.py
   npm run dev --prefix apps/console
   ```

