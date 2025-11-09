import pytest

# Skeleton for unit tests for ErrorContext and ContextExtractor

def test_context_dataclass_exists():
    from src.core.context import ErrorContext  # type: ignore
    ec = ErrorContext(file_path="a.py", line_number=1, code_snippet="print('hi')")
    assert ec.file_path == "a.py"


def test_context_extractor_interface():
    from src.core.context import ContextExtractor
    class Dummy(ContextExtractor):
        def extract_context(self, file_path: str, line_number: int):
            return None
    assert Dummy is not None
