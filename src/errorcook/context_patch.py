from __future__ import annotations

from typing import Optional

class ContextPatchError(Exception):
    pass


def apply_patch(original: str, old_text: str, new_text: str, before: Optional[str] = None, after: Optional[str] = None) -> str:
    """Return a new string where the exact snippet 'old_text' is replaced by 'new_text'.

    - If 'before' is provided, ensure the text preceding 'old_text' contains 'before'.
    - If 'after' is provided, ensure the text following 'old_text' contains 'after'.
    - This is a minimal, non-destructive patcher designed for tests and small patches.
    """
    idx = original.find(old_text)
    if idx == -1:
        raise ContextPatchError("old_text not found in original content")

    # Optional guard checks for surrounding context
    if before is not None:
        if idx < len(before) or original[idx - len(before): idx] != before:
            raise ContextPatchError("context before not matched")
    if after is not None:
        end_pos = idx + len(old_text)
        if end_pos + len(after) > len(original) or original[end_pos: end_pos + len(after)] != after:
            raise ContextPatchError("context after not matched")

    return original[:idx] + new_text + original[idx + len(old_text) :]
