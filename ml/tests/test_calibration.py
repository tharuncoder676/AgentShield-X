"""
Unit tests for Probability Calibration
Section 9 requirement: monotonic, outputs in [0,1].
"""

import os
import unittest
import numpy as np
import joblib

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RISK_MODEL_DIR = os.path.join(BASE_DIR, "models", "risk", "1.0.0")


class TestCalibration(unittest.TestCase):

    def test_calibrator_monotonic_and_range(self):
        """Verifies calibrator output is monotonic and strictly in [0, 1]."""
        model_path = os.path.join(RISK_MODEL_DIR, "stacker.joblib")
        if not os.path.exists(model_path):
            self.skipTest("stacker.joblib not generated yet. Run 'make train-stacker' first.")

        data = joblib.load(model_path)
        calibrator = data["calibrator"]
        cal_type = data["calibrator_type"]

        test_inputs = np.linspace(0.0, 1.0, 50)
        if cal_type == "isotonic":
            cal_probs = calibrator.predict(test_inputs)
        else:
            cal_probs = calibrator.predict_proba(test_inputs.reshape(-1, 1))[:, 1]

        # 1. Output range [0, 1]
        self.assertTrue(np.all(cal_probs >= 0.0), f"Found probability < 0: {np.min(cal_probs)}")
        self.assertTrue(np.all(cal_probs <= 1.0), f"Found probability > 1: {np.max(cal_probs)}")

        # 2. Monotonic non-decreasing
        diffs = np.diff(cal_probs)
        self.assertTrue(np.all(diffs >= -1e-6), "Calibrated probabilities violate monotonicity!")


if __name__ == "__main__":
    unittest.main()
