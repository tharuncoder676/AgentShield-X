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
