import pytest

from errorcook.context_patch import apply_patch, ContextPatchError


def test_apply_patch_simple_override():
    target = {"a": 1, "b": {"x": 1}}
    patch = {"b": {"y": 2}, "c": 3}
    result = apply_patch(target, patch)
    assert result["a"] == 1
    assert result["c"] == 3
    assert result["b"]["x"] == 1
    assert result["b"]["y"] == 2


def test_apply_patch_overwrite_scalar():
    target = {"a": 1}
    patch = {"a": 2}
    result = apply_patch(target, patch)
    assert result["a"] == 2


def test_apply_patch_invalid_types_raises():
    with pytest.raises(ContextPatchError):
        apply_patch("not-a-dict", {"a": 1})

    with pytest.raises(ContextPatchError):
        apply_patch({"a": 1}, "not-a-dict")


def test_context_patch_error_type():
    with pytest.raises(ContextPatchError):
        # Force a type error inside the function by passing bad patch types
        apply_patch({"a": 1}, {"a": [1, 2, 3]})
