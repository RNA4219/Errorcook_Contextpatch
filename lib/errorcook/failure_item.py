from __future__ import annotations
from dataclasses import dataclass
from typing import Optional

@dataclass
class FailureItem:
    module: str
    item: str
    retryable: bool = False

    def __post_init__(self) -> None:
        if not self.module:
            raise ValueError("module must not be empty")
        if not self.item:
            raise ValueError("item must not be empty")

    def validate(self) -> bool:
        # Minimal validation placeholder for tests
        return bool(self.module and self.item)
