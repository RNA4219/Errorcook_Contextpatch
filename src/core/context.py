from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod


@dataclass
class ErrorContext:
    file_path: str
    line_number: int
    code_snippet: str
    variable_states: Optional[Dict[str, Any]] = None
    call_stack: Optional[List[str]] = None
    # Additional context fields can be added here


class ContextExtractor(ABC):
    """Abstract base class for context extractors."""

    @abstractmethod
    def extract_context(self, file_path: str, line_number: int) -> ErrorContext:
        """Extracts relevant context around an error location."""
        pass
