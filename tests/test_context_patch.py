import unittest

from src.errorcook.context_patch import apply_patch, ContextPatchError


class TestContextPatch(unittest.TestCase):
    def test_basic_replace(self):
        orig = "hello OLD world"
        new = "beautiful"
        res = apply_patch(orig, "OLD", new)
        self.assertEqual(res, "hello beautiful world")

    def test_old_text_not_found(self):
        with self.assertRaises(ContextPatchError):
            apply_patch("no match here", "MISSING", "X")

    def test_with_context_guards(self):
        orig = "start <OLD> end"
        res = apply_patch(orig, "<OLD>", "<NEW>", before="start ", after=" end")
        self.assertEqual(res, "start <NEW> end")
