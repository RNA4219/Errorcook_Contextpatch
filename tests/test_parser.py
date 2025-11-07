import unittest
from src.parsers.parser import parse_input


class TestParser(unittest.TestCase):
    def test_simple_key_value(self):
        text = """objective: fix bug
        description: sample"""
        result = parse_input(text)
        self.assertIn('objective', result)
        self.assertEqual(result['objective'], 'fix bug')

    def test_list_under_key(self):
        text = """errors:
        - file1.py: error 1
        - file2.py: error 2"""
        result = parse_input(text)
        self.assertIn('errors', result)
        self.assertIsInstance(result['errors'], list)
        self.assertEqual(result['errors'][0], 'file1.py: error 1')


if __name__ == '__main__':
    unittest.main()
