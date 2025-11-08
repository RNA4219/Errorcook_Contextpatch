from typing import Any, Optional

class ContextPatch:
    """Lightweight patch applier to modify a context object in a controlled way.

    This is a minimal skeleton intended to be extended by concrete implementations
    used by the ErrorCook workflow. It provides a single patch method that accepts
    an initial context and a patch function, returning the patched context.
    """

    def __init__(self, context: Optional[Any] = None) -> None:
        self.context = context

    def patch(self, patch_fn) -> Any:
        """Apply a patch function to the context and return the result.

        The patch_fn is expected to be a callable that takes the current context
        and returns a new context. If no context is set, an empty dict is used.
        """
        base = self.context if self.context is not None else {}
        return patch_fn(base)
