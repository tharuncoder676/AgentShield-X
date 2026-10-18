# Demo script (about 3 minutes) and likely judge questions

## Flow
1. **Setup (20 s).** "Here is a normal research agent: it reads web pages, reads private notes, and can send email. Four tools in `agent/tools.py`."
2. **The problem (40 s).** `python scripts/demo.py`, stop after scenario 2. "A page with hidden text told the agent to email the customer list. With no shield it did."
3. **The fix (40 s).** Scroll to scenario 3. "Same page, shield on: blocked, with the reason: the task is 'summarize', and a summarize task cannot read notes."
4. **No false alarms (20 s).** Scenario 6: a normal email task to the team address goes through.
5. **Developer workflow (50 s).** `python -m shield scan` ("which tool combinations are dangerous"), then `python -m shield poison --shield off` then `--shield enforce` ("42 of 80 poisoned runs got through, now 0").
6. **CI (10 s).** Show `.github/workflows/agent-security.yml`: a pull request fails if the agent becomes exploitable.

## If a judge says "try it on my repo"
Run only `python -m shield scan` on a copy of their tool list (it is static and instant). Do not promise `poison` on code you have not seen; it needs their model and time. If you miss a case, say so and show where a rule would go.

## Likely questions
- **Is the model real?** No: a deterministic MockModel that follows instructions found in pages, so the demo is reproducible. The shield behaviour is real; model behaviour is simulated. A real model needs a `Model` adapter.
- **Isn't this just a filter?** No. It does not try to recognise attack text. It limits what the task is allowed to do (task contracts), follows where data came from (taint), and traps decoys (honeytools).
- **What does the full AgentShield-X add?** Trained detectors, a policy engine, audit log, console, MCP proxy, and the developer upgrades.
- **What does it not catch?** Attacks that stay inside what the task is allowed to do, and anything the contract does not model. Say this plainly.
- **Why not 100%?** No security tool gives that. The poison report gives rates with confidence intervals, never "proven safe".
