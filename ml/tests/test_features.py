"""
Unit tests for Session and Step Feature Extraction
Verifies known sessions produce expected features (Section 9 requirement).
"""

import unittest
from ml.features.session import extract_session_features, session_features_to_vector, shannon_entropy


class TestFeatures(unittest.TestCase):

    def test_shannon_entropy(self):
        """Checks entropy of simple vs random strings."""
        self.assertEqual(shannon_entropy(""), 0.0)
        self.assertEqual(shannon_entropy("aaaaaa"), 0.0)
        self.assertGreater(shannon_entropy("abcdef123456"), 3.0)

    def test_known_session_features(self):
        """Verifies known benign and malicious sessions produce accurate features."""
        # 1. Benign session
        benign_events = [
            {"tool": "read_webpage", "sensitivity": "low", "bytes_out": 200, "tokens_used": 100, "latency_ms": 30.0, "arguments": {"url": "https://example.test"}},
            {"tool": "read_webpage", "sensitivity": "low", "bytes_out": 300, "tokens_used": 150, "latency_ms": 40.0, "arguments": {"url": "https://example.test/2"}},
        ]
        feats = extract_session_features(benign_events)
        self.assertEqual(feats["num_steps"], 2.0)
        self.assertEqual(feats["distinct_tools"], 1.0)
        self.assertEqual(feats["has_never_seen_tool"], 0.0)
        self.assertEqual(feats["sensitive_tool_count"], 0.0)
        self.assertEqual(feats["repeated_call_ratio"], 1.0)
        self.assertEqual(feats["total_bytes_out"], 500.0)

        # 2. Malicious session with honeytool
        malicious_events = [
            {"tool": "read_email", "sensitivity": "low", "bytes_out": 100, "tokens_used": 50, "latency_ms": 20.0, "arguments": {}},
            {"tool": "export_all_customers", "sensitivity": "critical", "bytes_out": 50000, "tokens_used": 1200, "latency_ms": 250.0, "arguments": {"sink": "leak"}},
        ]
        feats_mal = extract_session_features(malicious_events)
        self.assertEqual(feats_mal["num_steps"], 2.0)
        self.assertEqual(feats_mal["has_never_seen_tool"], 1.0)  # export_all_customers is not in benign set
        self.assertEqual(feats_mal["sensitive_tool_count"], 1.0)
        self.assertEqual(feats_mal["total_bytes_out"], 50100.0)

        # 3. Vector serialization
        vec = session_features_to_vector(feats_mal)
        self.assertEqual(len(vec), 14)
        self.assertIsInstance(vec[0], float)


if __name__ == "__main__":
    unittest.main()
