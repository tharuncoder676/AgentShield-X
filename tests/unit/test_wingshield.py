"""
Unit tests for Wingshield Copilot: Autonomous Conversational AI & Computer Automation Matrix.
Creator: Tharunkumar.S
"""

import pytest
from shield_core.wingshield import (
    WingshieldCopilotEngine,
    ComputerAutomation,
    WingshieldKnowledge,
)


class TestWingshieldCopilot:
    def test_greeting_and_attribution(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")
        assert engine.recipient == "Tharun"
        assert "Tharunkumar.S" in WingshieldKnowledge.KNOWLEDGE["creator"]
        assert "Wingshield Copilot" in WingshieldKnowledge.KNOWLEDGE["identity"]

    def test_conversational_knowledge_retrieval(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")
        
        reply1, exit1 = engine.process_command("who created you?")
        assert not exit1
        assert "Tharunkumar.S" in reply1

        reply2, exit2 = engine.process_command("explain the research agent")
        assert not exit2
        assert "Research Agent" in reply2
        assert "3.4 milliseconds" in reply2

        reply3, exit3 = engine.process_command("what is an mcp rugpull")
        assert not exit3
        assert "SHA-256" in reply3

    def test_system_diagnostics_telemetry(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")
        reply, should_exit = engine.process_command("system status")
        assert not should_exit
        assert "Operating System" in reply

    def test_calendar_scheduling_dispatch(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")
        reply, should_exit = engine.process_command("set calendar for AgentShield Security Demo")
        assert not should_exit
        assert "calendar" in reply.lower()

    def test_cli_command_execution(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")
        # Run a safe command like 'echo wingshield_online'
        reply, should_exit = engine.process_command("cmd echo wingshield_online")
        assert not should_exit
        assert "wingshield_online" in reply

    def test_exit_command(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")
        reply, should_exit = engine.process_command("exit")
        assert should_exit
        assert "Goodbye Tharun" in reply

    def test_security_scan_invocation(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")
        reply, should_exit = engine.process_command("scan this repo")
        assert not should_exit
        assert "AST Blast Radius" in reply

    def test_morning_digest_and_briefing(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")
        reply, should_exit = engine.process_command("morning digest")
        assert not should_exit
        assert "DAILY MORNING BRIEFING" in reply
        assert "Tharunkumar.S" in reply
        assert "Battery" in reply

    def test_openjarvis_knowledge_and_weather(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")
        reply, should_exit = engine.process_command("tell me about openjarvis")
        assert not should_exit
        assert "OpenJarvis" in reply
        assert "Stanford" in reply

        reply_w, should_exit_w = engine.process_command("what is the weather")
        assert not should_exit_w
        assert "Weather" in reply_w

    def test_trace_store_persistence(self, tmp_path):
        from shield_core.wingshield import WingshieldTraceStore
        db_file = tmp_path / "test_traces.db"
        store = WingshieldTraceStore(db_path=db_file)
        
        t_id = store.record(query="test query", action_type="test_action", result="success", latency_ms=1.5)
        assert t_id.startswith("trace_")
        assert store.count() == 1

        recent = store.get_recent(limit=5)
        assert len(recent) == 1
        assert recent[0]["query"] == "test query"
        assert recent[0]["latency_ms"] == 1.5

    def test_scheduler_task_lifecycle(self, tmp_path):
        from shield_core.wingshield import WingshieldScheduler
        db_file = tmp_path / "test_schedule.db"
        scheduler = WingshieldScheduler(db_path=db_file)

        task = scheduler.add_task(prompt="scan this repo", schedule_type="interval", schedule_value="1h")
        assert task["id"].startswith("task_")
        assert task["status"] == "active"

        tasks = scheduler.list_tasks()
        assert len(tasks) == 1
        assert tasks[0]["prompt"] == "scan this repo"

        cancelled = scheduler.cancel_task(task["id"])
        assert cancelled
        tasks_active = scheduler.list_tasks(status="active")
        assert len(tasks_active) == 0

    def test_wingshield_doctor_diagnostics(self):
        from shield_core.wingshield import WingshieldDoctor
        diag = WingshieldDoctor.run_diagnostics()
        assert "checks" in diag
        assert diag["lead_architect"] == "Tharunkumar.S"
        report = WingshieldDoctor.format_report(diag)
        assert "AGENTSHIELD-X & WINGSHIELD SYSTEM HEALTH DIAGNOSTICS" in report
        assert "Tharunkumar.S" in report

    def test_engine_doctor_traces_scheduler_commands(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")

        reply_doc, exit_doc = engine.process_command("doctor")
        assert not exit_doc
        assert "SYSTEM HEALTH DIAGNOSTICS" in reply_doc

        reply_trace, exit_trace = engine.process_command("show traces")
        assert not exit_trace
        assert "TRACES" in reply_trace

        reply_sched, exit_sched = engine.process_command("schedule list")
        assert not exit_sched
        assert "Scheduled" in reply_sched or "tasks" in reply_sched

    def test_youtube_chrome_and_app_opening(self):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")

        # YouTube direct & search
        r_yt1, _ = engine.process_command("open youtube")
        assert "Opening YouTube" in r_yt1

        r_yt2, _ = engine.process_command("youtube")
        assert "Opening YouTube" in r_yt2

        r_yt3, _ = engine.process_command("play youtube")
        assert "Opening YouTube" in r_yt3

        r_yt4, _ = engine.process_command("search youtube for machine learning")
        assert "Searching YouTube for: 'machine learning'" in r_yt4

        # Chrome & Google
        r_ch1, _ = engine.process_command("open chrome")
        assert "Opening Google Chrome" in r_ch1

        r_ch2, _ = engine.process_command("chrome")
        assert "Opening Google Chrome" in r_ch2

        r_g1, _ = engine.process_command("open google")
        assert "Opening Google" in r_g1

        r_g2, _ = engine.process_command("google")
        assert "Opening Google" in r_g2

        r_g3, _ = engine.process_command("search google for AI agent security")
        assert "Searching Google for: 'ai agent security'" in r_g3

        # Web & Desktop apps
        r_wa, _ = engine.process_command("open whatsapp")
        assert "Opening WhatsApp" in r_wa

        r_calc, _ = engine.process_command("open calculator")
        assert "Opening Calculator" in r_calc

        r_code, _ = engine.process_command("open vs code")
        assert "Visual Studio Code" in r_code

        # Terminal launchers
        r_ashield, _ = engine.process_command("agentshield")
        assert "AgentShield-X CLI terminal" in r_ashield

        r_wake, _ = engine.process_command("agentshield wakeup")
        assert "Wingshield Copilot" in r_wake

    def test_voice_stream_dual_terminal_and_app_dispatch(self, monkeypatch):
        engine = WingshieldCopilotEngine(greeting_recipient="Tharun")

        wingshield_calls = []
        agentshield_calls = []
        app_calls = []

        from shield_core.wingshield import ComputerAutomation
        monkeypatch.setattr(ComputerAutomation, "open_wingshield_terminal", lambda: wingshield_calls.append(True) or (True, "Wingshield Opened"))
        monkeypatch.setattr(ComputerAutomation, "open_agentshield_cli_terminal", lambda: agentshield_calls.append(True) or (True, "AgentShield CLI Opened"))
        monkeypatch.setattr(ComputerAutomation, "open_app", lambda app: app_calls.append(app) or (True, f"Opened {app}"))

        # 1. agentshield wakeup -> opens Wingshield terminal
        engine.handle_voice_stream("agentshield wakeup")
        assert len(wingshield_calls) == 1
        assert len(agentshield_calls) == 0

        # 2. agentshield -> opens original AgentShield CLI terminal
        engine.handle_voice_stream("agentshield")
        assert len(agentshield_calls) == 1

        # 3. agentshield cli -> opens original AgentShield CLI terminal
        engine.handle_voice_stream("agentshield cli")
        assert len(agentshield_calls) == 2

        # 4. open youtube -> opens youtube
        engine.handle_voice_stream("open youtube")
        assert "youtube" in app_calls

        # 5. open chrome -> opens chrome
        engine.handle_voice_stream("open chrome")
        assert "chrome" in app_calls

        # 6. open vs code -> opens vscode
        engine.handle_voice_stream("open vs code")
        assert "vscode" in app_calls


