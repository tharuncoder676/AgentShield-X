"""
Unit tests for Anomaly Detector and underlying models (Markov, Isolation Forest, Autoencoder)
"""

import unittest
from ml.detectors.anomaly.detector import AnomalyDetector
from ml.detectors.anomaly.markov import MarkovTransitionModel
from ml.interfaces import DetectorOutput, ToolCallEvent


class TestAnomaly(unittest.TestCase):

    def test_markov_model_train_and_score(self):
        """Checks Markov transition model estimates transitions and penalizes unseen jumps."""
        markov = MarkovTransitionModel()
        sequences = [
            ["read_email", "search_customers", "send_email"],
            ["read_email", "search_customers", "send_email"],
            ["read_webpage", "run_sql"],
        ]
        markov.fit(sequences)

        # Benign sequence score
        benign_score = markov.predict_score(["read_email", "search_customers", "send_email"])

        # Unseen rare transition sequence
        anomalous_score = markov.predict_score(["send_email", "read_webpage", "send_email"])
        self.assertGreater(anomalous_score, benign_score)

    def test_anomaly_detector_contract(self):
        """Checks AnomalyDetector returns valid DetectorOutput on ToolCallEvent."""
        detector = AnomalyDetector()
        event = ToolCallEvent(
            session_id="test_sess_01",
            step=0,
            tool="read_email",
            sensitivity="low",
            arguments={"id": "mail_1"},
            task_text="Check support email",
        )
        res = detector.score(event)
        self.assertIsInstance(res, DetectorOutput)
        self.assertEqual(res.detector, "anomaly")
        self.assertGreaterEqual(res.score, 0.0)
        self.assertLessEqual(res.score, 1.0)
        self.assertIn("markov_score", res.evidence)


if __name__ == "__main__":
    unittest.main()
