.PHONY: demo demo-real demo-lite demo-replay scan scan-enforce poison-off poison-on watch test test-real clean

demo:          ## guided demo: same agent, shield off then on
	python scripts/demo.py

demo-real:     ## guided demo using production AgentShield-X engine and cryptographic audit chain
	python ../../scripts/demo_real.py

demo-lite:     ## guided demo using AgentShield-lite reference implementation
	python ../../scripts/demo_lite.py

demo-replay:   ## simulate counterfactual policy evaluation on historical traces
	python ../../scripts/demo_replay.py

scan:          ## static check for dangerous tool combinations (shield off)
	python -m shield scan --mode off

scan-enforce:  ## same scan with the shield enforcing
	python -m shield scan --mode enforce

poison-off:    ## plant canary payloads, shield off
	python -m shield poison --shield off

poison-on:     ## plant canary payloads, shield enforcing
	python -m shield poison --shield enforce

watch:         ## print the decision log
	python -m shield watch

test:
	python -m pytest -q

test-real:     ## run full production AgentShield-X test harness
	python -m pytest ../../tests/real/ -v

clean:
	rm -f logs/decisions.jsonl data/outbox/*.json

