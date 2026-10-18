.PHONY: help test-real test scan scan-enforce demo-real demo-lite demo-replay baselines dev-backend dev-console

help:          ## Show this help message
	@echo "Available Makefile targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

test-real:     ## Run full real test harness (utility, attacks, overhead, stability, scanner)
	python -m pytest tests/real/ -v

test:          ## Run all tests across the repository
	python -m pytest tests/ -v

scan:          ## Run AST tool scanner on sample repo in observe mode
	python scripts/scan_repo.py --repo examples/research-agent --mode off

scan-enforce:  ## Run AST tool scanner on sample repo in enforce mode
	python scripts/scan_repo.py --repo examples/research-agent --mode enforce --fail-on high

demo-real:     ## Run interactive end-to-end demo using production AgentShield-X engine
	python scripts/demo_real.py

demo-lite:     ## Run interactive demo using AgentShield-lite reference implementation
	python scripts/demo_lite.py

demo-replay:   ## Run retroactive policy simulation replay demo
	python scripts/demo_replay.py

baselines:     ## Run head-to-head empirical comparison across defense layers
	python -m pytest tests/real/test_baselines.py -v

dev-backend:   ## Start local Decision & Control API services
	python scripts/run_dev_backend.py

dev-console:   ## Start local Vite Console dashboard
	npm run dev --prefix apps/console
