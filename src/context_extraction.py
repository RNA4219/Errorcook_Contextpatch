"""
Module for extracting minimal context relevant to failures
Focused on robust, test-friendly behavior.
"""
from __future__ import annotations

import os
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ContextFile:
    path: str
    content: str
    relevance_score: float
    related_failures: List[str]


class MinimalContextExtractor:
    def __init__(self, repo_root: str, max_context_files: int = 5, max_context_lines: int = 1000):
        self.repo_root = Path(repo_root)
        self.max_context_files = max_context_files
        self.max_context_lines = max_context_lines
        
    def extract_context(self, failure_paths: List[str], related_paths: Optional[List[str]] = None) -> List[ContextFile]:
        all_paths = set(failure_paths)
        if related_paths:
            all_paths.update(related_paths)
        context_files: List[ContextFile] = []
        for path_str in all_paths:
            p = Path(path_str)
            full = p if p.is_absolute() else self.repo_root / p
            if full.exists() and full.is_file():
                content = self._read_file_with_limit(full)
                rel = self._calculate_relevance_score(str(full), list(failure_paths))
                context_files.append(ContextFile(str(full), content, rel, []))
        context_files.sort(key=lambda c: c.relevance_score, reverse=True)
        return context_files[:self.max_context_files]

    def _read_file_with_limit(self, file_path: Path, max_lines: int = 500) -> str:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = []
                for i, line in enumerate(f):
                    if i >= max_lines:
                        lines.append(f"... (file truncated, showing first {max_context_lines} lines)")
                        break
                    lines.append(line.rstrip())
                return "\n".join(lines)
        except Exception:
            return f"Could not read file: {file_path}"

    def _calculate_relevance_score(self, file_path: str, failure_paths: List[str]) -> float:
        score = 0.0
        for fp in failure_paths:
            if fp in file_path or file_path in fp:
                score += 1.0
                continue
            failure_dir = os.path.dirname(fp)
            file_dir = os.path.dirname(file_path)
            if failure_dir == file_dir:
                score += 0.5
                continue
            failure_base = os.path.splitext(os.path.basename(fp))[0]
            file_base = os.path.splitext(os.path.basename(file_path))[0]
            if failure_base == file_base or failure_base in file_base or file_base in failure_base:
                score += 0.3
        max_possible = len(failure_paths)
        if max_possible > 0:
            score = min(1.0, score / max_possible)
        return score


def extract_related_files_from_diff(diff_content: str, repo_root: str) -> List[str]:
    files = set()
    repo = Path(repo_root)
    for line in diff_content.split('\n'):
        if line.startswith('--- ') or line.startswith('+++ '):
            parts = line.split(' ', 2)
            if len(parts) >= 2:
                path = parts[1]
                if path.startswith('a/') or path.startswith('b/'):
                    path = path[2:]
                full = repo / path
                if full.exists():
                    files.add(str(full))
    return list(files)


def extract_related_functions_or_classes(error_message: str, file_path: str) -> List[str]:
    pattern = r'([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\s*\('
    matches = re.findall(pattern, error_message)
    return list(set(matches))


def get_related_source_files(failure_context: Dict[str, Any], repo_root: str) -> List[str]:
    related = set()
    details = failure_context.get("details", "")
    if details:
        pattern = r'([A-Za-z0-9_\-./]+(?:\.py|\.js|\.ts|\.tsx|\.jsx|\.java|\.go|\.rs|\.cpp|\.c|\.h|\.hpp|\.html|\.css|\.scss|\.json|\.yaml|\.yml|\.md|\.txt|\.xml)):\\d+'
        for m in re.findall(pattern, details):
            full = Path(repo_root) / m
            if full.exists():
                related.add(str(full))
    path = failure_context.get("path")
    if path:
        full = Path(path)
        full = full if full.is_absolute() else Path(repo_root) / full
        if full.exists():
            related.add(str(full))
    patch = failure_context.get("patch")
    if patch:
        diff = patch.get("unified_diff")
        if diff:
            for f in extract_related_files_from_diff(diff, repo_root):
                related.add(f)
    return list(related)
