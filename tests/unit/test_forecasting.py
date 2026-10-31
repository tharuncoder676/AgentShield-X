"""Unit tests for AgentShield Predictive Threat Forecasting Engine.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

import pytest
from shield_core.forecasting import (
    PredictiveThreatForecaster,
    default_forecaster,
    ForecastDataPoint,
    HighRiskWindow,
    AgentRiskForecast,
)


def test_24h_forecast_generation():
    forecaster = PredictiveThreatForecaster()
    points = forecaster.generate_24h_forecast()

    assert len(points) == 24
    for p in points:
        assert isinstance(p, ForecastDataPoint)
        assert p.hour_offset >= 1 and p.hour_offset <= 24
        assert p.bound_p10 <= p.projected_attacks_p50 <= p.bound_p90
        assert p.confidence_pct >= 80.0
        assert p.risk_level in ("NORMAL", "ELEVATED", "HIGH")
        assert "UTC" in p.timestamp_iso


def test_high_risk_windows():
    forecaster = PredictiveThreatForecaster()
    windows = forecaster.get_high_risk_windows()

    assert len(windows) >= 2
    for w in windows:
        assert isinstance(w, HighRiskWindow)
        assert w.window_id.startswith("WINDOW-SURGE-")
        assert w.predicted_surge_pct > 0.0
        assert w.dominant_attack_vector
        assert w.recommended_mitigation


def test_agent_vulnerability_forecast():
    forecaster = PredictiveThreatForecaster()
    agents = forecaster.get_agent_vulnerability_forecast()

    assert len(agents) >= 4
    for a in agents:
        assert isinstance(a, AgentRiskForecast)
        assert a.agent_id
        assert a.target_probability_pct > 0.0
        assert a.forecasted_risk_tier in ("CRITICAL", "HIGH", "MEDIUM")
        assert len(a.predicted_threat_vectors) > 0


def test_forecast_summary_aggregation():
    forecaster = PredictiveThreatForecaster()
    summary = forecaster.get_forecast_summary()

    assert summary["forecast_period"] == "24h_rolling"
    assert summary["total_projected_attacks_24h"] > 500
    assert summary["peak_hourly_volume"] > 50
    assert summary["mean_model_confidence_pct"] >= 85.0
    assert len(summary["hourly_projection"]) == 24
    assert len(summary["high_risk_windows"]) >= 2
    assert len(summary["agent_vulnerability_forecast"]) >= 4

