"""
AgentShield-X Strict No-Leakage Verification Test
Section 5.4 non-negotiable requirements:
1. No document ID or normalized text appears in more than one text partition.
2. No session ID appears in more than one trace partition.
3. Held-out text families (base64_obfuscated, multilingual, payload_split) NEVER appear outside the test set.
4. Held-out trace families (slow_and_low, rare_transition) and held-out templates NEVER appear outside the test set.
"""

import json
import os
import unittest
from typing import Dict, List, Set

from ml.data.generators.text_generator import HELD_OUT_TEXT_FAMILIES
from ml.data.generators.trace_simulator import HELD_OUT_BENIGN_TEMPLATES, HELD_OUT_TRACE_FAMILIES

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SPLITS_DIR = os.path.join(BASE_DIR, "ml", "data", "splits")


class TestNoLeakage(unittest.TestCase):

    def _load_jsonl(self, filename: str) -> List[Dict]:
        path = os.path.join(SPLITS_DIR, filename)
        if not os.path.exists(path):
            self.skipTest(f"{filename} not generated yet. Run 'make data' first.")
        records = []
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    records.append(json.loads(line))
        return records

    def test_text_partition_disjointness_and_held_outs(self):
        """Verifies text datasets have zero doc_id or text overlap, and held-out families are isolated."""
        text_a = self._load_jsonl("text_A.jsonl")
        text_b = self._load_jsonl("text_B.jsonl")
        text_v = self._load_jsonl("text_V.jsonl")
        text_test = self._load_jsonl("text_test.jsonl")

        partitions = {
            "A": text_a,
            "B": text_b,
            "V": text_v,
            "test": text_test,
        }

        # 1. Check doc_id disjointness across all 4 sets
        seen_doc_ids: Dict[str, str] = {}
        seen_texts: Dict[str, str] = {}

        for part_name, records in partitions.items():
            for r in records:
                doc_id = r["doc_id"]
                norm_text = r["text"].strip().lower()

                if doc_id in seen_doc_ids and seen_doc_ids[doc_id] != part_name:
                    self.fail(f"Leakage detected: doc_id {doc_id} found in both {seen_doc_ids[doc_id]} and {part_name}")
                seen_doc_ids[doc_id] = part_name

                if norm_text in seen_texts and seen_texts[norm_text] != part_name:
                    self.fail(f"Leakage detected: normalized text '{norm_text[:40]}...' found in both {seen_texts[norm_text]} and {part_name}")
                seen_texts[norm_text] = part_name

        # 2. Check held-out attack families ONLY appear in test
        for part_name in ["A", "B", "V"]:
            for r in partitions[part_name]:
                fam = r.get("attack_family", "")
                self.assertNotIn(
                    fam, HELD_OUT_TEXT_FAMILIES,
                    f"Violation: Held-out text attack family '{fam}' appeared in partition {part_name}!"
                )

        # 3. Check test actually contains the held-out families
        test_fams = {r.get("attack_family") for r in text_test}
        for fam in HELD_OUT_TEXT_FAMILIES:
            self.assertIn(fam, test_fams, f"Expected held-out family '{fam}' in test set")

    def test_trace_partition_disjointness_and_held_outs(self):
        """Verifies session IDs are strictly disjoint and held-out trace families stay in test."""
        traces_a = self._load_jsonl("traces_train_A.jsonl")
        traces_b = self._load_jsonl("traces_stacker_B.jsonl")
        traces_v = self._load_jsonl("traces_val_V.jsonl")
        traces_test = self._load_jsonl("traces_test.jsonl")

        partitions = {
            "A": traces_a,
            "B": traces_b,
            "V": traces_v,
            "test": traces_test,
        }

        seen_sessions: Dict[str, str] = {}

        for part_name, events in partitions.items():
            for ev in events:
                sid = ev["session_id"]
                if sid in seen_sessions:
                    self.assertEqual(
                        seen_sessions[sid], part_name,
                        f"Leakage detected: session_id {sid} split across {seen_sessions[sid]} and {part_name}"
                    )
                seen_sessions[sid] = part_name

        # Verify held-out trace families never appear in A, B, or V
        for part_name in ["A", "B", "V"]:
            for ev in partitions[part_name]:
                fam = ev.get("attack_family", "")
                tmpl = ev.get("task_template", "")
                self.assertNotIn(
                    fam, HELD_OUT_TRACE_FAMILIES,
                    f"Violation: Held-out trace family '{fam}' found in partition {part_name}"
                )
                self.assertNotIn(
                    tmpl, HELD_OUT_BENIGN_TEMPLATES,
                    f"Violation: Held-out template '{tmpl}' found in partition {part_name}"
                )

        # Verify test contains held-out trace families and templates
        test_fams = {ev.get("attack_family") for ev in traces_test}
        test_tmpls = {ev.get("task_template") for ev in traces_test}
        for fam in HELD_OUT_TRACE_FAMILIES:
            self.assertIn(fam, test_fams, f"Held-out trace family '{fam}' missing from test")
        for tmpl in HELD_OUT_BENIGN_TEMPLATES:
            self.assertIn(tmpl, test_tmpls, f"Held-out template '{tmpl}' missing from test")


if __name__ == "__main__":
    unittest.main()
