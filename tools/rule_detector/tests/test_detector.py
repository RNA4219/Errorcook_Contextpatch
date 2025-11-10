import unittest
import os
import sys

# Ensure the inner package is importable when running from repo root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from rule_detector import detect_rules

class TestDetector(unittest.TestCase):
    def test_detect_rules_on_empty(self):
        res = detect_rules("")
        self.assertIsInstance(res, dict)
        self.assertIn("typescript", res)
        self.assertIn("python", res)
        self.assertIn("general", res)
        self.assertIn("tsconfig_found", res["typescript"])
        self.assertIn("pyproject_found", res["python"])

if __name__ == '__main__':
    unittest.main()
