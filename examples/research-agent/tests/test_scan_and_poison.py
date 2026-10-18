import base64

from agent import tools
from shield import poison, scan, shield
from shield.__main__ import main


def test_scan_finds_the_dangerous_combination_and_marks_mitigation():
    open_rep = scan.scan("off")
    assert open_rep["findings"][0]["id"] == "AS-001" and open_rep["findings"][0]["status"] == "open"
    assert scan.exit_code(open_rep, "high") == 1
    fixed = scan.scan("enforce")
    assert fixed["findings"][0]["status"].startswith("mitigated")
    assert scan.exit_code(fixed, "high") == 0
    assert fixed["blast_radius"]["entry_points"] == ["read_webpage"]


def test_wilson_interval_known_values():
    lo, hi = poison.wilson(0, 10)
    assert lo == 0.0 and 0.27 < hi < 0.29
    lo, hi = poison.wilson(10, 10)
    assert hi == 1.0 and 0.71 < lo < 0.73
    assert poison.wilson(0, 0) == (0.0, 1.0)


def test_poison_finds_exploit_when_shield_off_and_none_when_enforced():
    off = poison.poison("Summarize pages/company-blog.html", "company-blog.html", trials=8, mode="off")
    on = poison.poison("Summarize pages/company-blog.html", "company-blog.html", trials=8, mode="enforce")
    assert poison.overall_rate(off) > 0.3
    assert poison.overall_rate(on) == 0.0
    by = {(r["family"], r["placement"]): r for r in off["rows"]}
    assert by[("base64", "end")]["attempted"] == 0       # mock model cannot decode: not reproduced
    assert by[("override", "end")]["executed"] > 0


def test_poison_never_executes_sinks_and_restores_state():
    poison.poison("Summarize pages/company-blog.html", "company-blog.html", trials=3, mode="off")
    assert not tools.OUTBOX.exists() or not list(tools.OUTBOX.glob("*.json"))
    assert tools.SHADOW["on"] is False and tools.PAGE_OVERRIDES == {} and shield.mode == "off"


def test_ci_exit_codes():
    args = ["poison", "--trials", "3", "--ci"]
    assert main(args + ["--shield", "off"]) == 1
    assert main(args + ["--shield", "enforce"]) == 0


def test_base64_payload_is_a_canary_only():
    text = poison.payload_families()["base64"].split(": ", 1)[1]
    assert poison.CANARY in base64.b64decode(text).decode()
