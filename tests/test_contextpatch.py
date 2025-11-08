import unittest
from src.errorcook.contextpatch import ContextPatch

class TestContextPatch(unittest.TestCase):
    def test_patch_applies_function(self):
        ctx = {"a": 1}
        patcher = ContextPatch(ctx)
        new_ctx = patcher.patch(lambda c: {**c, "b": 2})
        assert new_ctx["a"] == 1
        assert new_ctx["b"] == 2

    def test_patch_without_initial_context(self):
        patcher = ContextPatch()
        new_ctx = patcher.patch(lambda c: {**c, "x": 42})
        assert new_ctx["x"] == 42
