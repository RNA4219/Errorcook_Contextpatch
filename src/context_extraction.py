"""
Module for extracting minimal context relevant to failures
Based on IMPLEMENTATION_REFERENCE_FILES.md specification
"""
import os
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path
import json


@dataclass
class ContextFile:
    """Represents a file in the context with its content and relevance"""
    path: str
    content: str
    relevance_score: float
    related_failures: List[str]  # List of failure messages this file is related to


class MinimalContextExtractor:
    """Extracts minimal context (diffs and related files) relevant to failures"""
    
    def __init__(self, repo_root: str, max_context_files: int = 5, max_context_lines: int = 1000):
        self.repo_root = Path(repo_root)
        self.max_context_files = max_context_files
        self.max_context_lines = max_context_lines
        
    def extract_context(self, failure_paths: List[str], related_paths: Optional[List[str]] = None) -> List[ContextFile]:
        """
        Extract minimal context for the given failure paths
        
        Args:
            failure_paths: List of file paths where failures occurred
            related_paths: Additional related file paths to consider
            
        Returns:
            List of ContextFile objects with relevant context
        """
        all_paths = set(failure_paths)
        if related_paths:
            all_paths.update(related_paths)
        
        context_files = []
        
        for path in all_paths:
            file_path = Path(path)
            
            # If path is relative, make it relative to repo root
            if not file_path.is_absolute():
                full_path = self.repo_root / file_path
            else:
                full_path = file_path
            
            # Verify the file exists before processing
            if full_path.exists() and full_path.is_file():
                content = self._read_file_with_limit(full_path)
                
                # Calculate relevance score based on path similarity with failure paths
                relevance = self._calculate_relevance_score(str(full_path), failure_paths)
                
                context_files.append(ContextFile(
                    path=str(full_path),
                    content=content,
                    relevance_score=relevance,
                    related_failures=[]  # Will be populated based on actual correlation
                ))
        
        # Sort by relevance and return top files
        context_files.sort(key=lambda x: x.relevance_score, reverse=True)
        return context_files[:self.max_context_files]
    
    def _read_file_with_limit(self, file_path: Path, max_lines: int = 500) -> str:
        """Read file content with line limit to avoid huge files"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = []
                for i, line in enumerate(f):
                    if i >= max_lines:
                        lines.append(f"... (file truncated, showing first {max_lines} lines)")
                        break
                    lines.append(line.rstrip())
                return "\n".join(lines)
        except Exception:
            return f"Could not read file: {file_path}"
    
    def _calculate_relevance_score(self, file_path: str, failure_paths: List[str]) -> float:
        """Calculate relevance score based on similarity to failure paths"""
        score = 0.0
        
        for failure_path in failure_paths:
            # Direct match gets highest score
            if failure_path in file_path or file_path in failure_path:
                score += 1.0
                continue
                
            # Same directory gets medium score
            failure_dir = os.path.dirname(failure_path)
            file_dir = os.path.dirname(file_path)
            if failure_dir == file_dir:
                score += 0.5
                continue
                
            # Related names get lower score
            failure_base = os.path.splitext(os.path.basename(failure_path))[0]
            file_base = os.path.splitext(os.path.basename(file_path))[0]
            if failure_base == file_base or failure_base in file_base or file_base in failure_base:
                score += 0.3
        
        # Normalize score to 0-1 range
        max_possible_score = len(failure_paths)
        if max_possible_score > 0:
            score = min(1.0, score / max_possible_score)
        
        return score


def extract_related_files_from_diff(diff_content: str, repo_root: str) -> List[str]:
    """
    Extract file paths from diff content that might be relevant to failures
    
    Args:
        diff_content: Unified diff content
        repo_root: Repository root directory
        
    Returns:
        List of related file paths
    """
    files = set()
    repo_path = Path(repo_root)
    
    # Look for file paths in diff headers
    lines = diff_content.split('\n')
    for line in lines:
        if line.startswith('--- ') or line.startswith('+++ '):
            # Extract file path from diff header: --- a/path/to/file
            parts = line.split(' ', 2)
            if len(parts) >= 2:
                path = parts[1]
                # Remove the a/ or b/ prefix if present
                if path.startswith('a/') or path.startswith('b/'):
                    path = path[2:]
                
                # Create full path relative to repo root
                full_path = repo_path / path
                if full_path.exists():
                    files.add(str(full_path))
    
    return list(files)


def extract_related_functions_or_classes(error_message: str, file_path: str) -> List[str]:
    """
    Extract function or class names from error message that might be relevant
    
    Args:
        error_message: Error message to analyze
        file_path: Path to the source file
        
    Returns:
        List of relevant function/class names
    """
    all_names = set()

    # Pattern to capture fully qualified names like 'module.function' or 'Class.method'
    # This is more robust for Python tracebacks
    qualified_name_pattern = r"([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)+)"
    all_names.update(re.findall(qualified_name_pattern, error_message))

    # Pattern to capture simple function/method names followed by parentheses
    # e.g., 'add()' in 'calculator.add() missing...'
    simple_func_pattern = r"([a-zA-Z_][a-zA-Z0-9_]*)\("
    all_names.update(re.findall(simple_func_pattern, error_message))

    # If the error message contains a file path, try to extract function/class names
    # that are likely defined in that file.
    # This part would require more advanced parsing or AST analysis, which is out of scope
    # for a lightweight regex-based extraction. For now, we rely on names in the error message.

    return list(all_names)


def get_related_source_files(failure_context: Dict[str, Any], repo_root: str) -> List[str]:
    """
    Get additional related source files based on failure context
    
    Args:
        failure_context: Context of failures
        repo_root: Repository root directory
        
    Returns:
        List of related source file paths
    """
    related_files = set()
    
    # Look for any file references in error details
    if 'details' in failure_context:
        # Look for file paths in error details
        path_pattern = r"([a-zA-Z0-9_\-./]+(?:\.py|\.js|\.ts|\.tsx|\.jsx|\.java|\.go|\.rs|\.cpp|\.c|\.h|\.hpp|\.html|\.css|\.scss|\.json|\.yaml|\.yml|\.md|\.txt|\.xml)):\d+"
        matches = re.findall(path_pattern, failure_context['details'])
        for match in matches:
            # Only add files that exist in the repo
            full_path = Path(repo_root) / match
            if full_path.exists():
                related_files.add(str(full_path))
    
    # If patch info is available, extract files from there
    if 'patch' in failure_context and 'unified_diff' in failure_context['patch']:
        patch_files = extract_related_files_from_diff(
            failure_context['patch']['unified_diff'], 
            repo_root
        )
        related_files.update(patch_files)
    
    # Look for related functions/classes that might be in other files
    if 'message' in failure_context:
        if 'path' in failure_context:
            func_names = extract_related_functions_or_classes(
                failure_context['message'], 
                failure_context['path']
            )
            # This would require more sophisticated analysis to find where these functions are defined
    
    return list(related_files)