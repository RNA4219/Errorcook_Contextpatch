from typing import Any, Dict

class ContextPatchError(Exception):
    pass

# Minimal recursive merge for patching two dictionaries.
def _merge(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(a)
    for k, v in b.items():
        if k in result and isinstance(result[k], dict):
            if isinstance(v, dict):
                result[k] = _merge(result[k], v)
            else:
                raise ContextPatchError(f"Cannot merge dict with non-dict for key '{k}'")
        else:
            result[k] = v
    return result


def apply_patch(target: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    """Apply a patch into a target dict using recursive merge.

    - Non-destructive: only adds/overrides keys present in patch
    - If a value is a dict in both target and patch, merge recursively
    - Otherwise, patch value overwrites target value
    """
    if not isinstance(target, dict) or not isinstance(patch, dict):
        raise ContextPatchError("Both target and patch must be dictionaries")
    return _merge(target, patch)
