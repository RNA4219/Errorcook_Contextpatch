"""
Tests for minimal context extraction functionality
Based on IMPLEMENTATION_REFERENCE_FILES.md specification
"""
import os
import tempfile
from pathlib import Path
import pytest
from src.context_extraction import (
    MinimalContextExtractor,
    ContextFile,
    extract_related_files_from_diff,
    extract_related_functions_or_classes,
    get_related_source_files
)


class TestMinimalContextExtractor:
    """Test the MinimalContextExtractor functionality"""
    
    def setup_method(self):
        """Set up a temporary directory for testing"""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.repo_root = self.temp_dir
        
        # Create test files
        self.test_file1 = self.temp_dir / "test_module.py"
        self.test_file1.write_text("""
def add(a, b):
    return a + b

def test_add():
    assert add(2, 3) == 5
""")
        
        self.test_file2 = self.temp_dir / "src" / "calculator.py"
        self.test_file2.parent.mkdir(exist_ok=True)
        self.test_file2.write_text("""
class Calculator:
    def multiply(self, a, b):
        return a * b
""")
        
        self.test_file3 = self.temp_dir / "docs" / "readme.md"
        self.test_file3.parent.mkdir(exist_ok=True)
        self.test_file3.write_text("# Documentation")
    
    def teardown_method(self):
        """Clean up temporary directory"""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_extract_context_basic(self):
        """Test basic context extraction"""
        extractor = MinimalContextExtractor(str(self.repo_root))
        failure_paths = [str(self.test_file1)]
        
        context_files = extractor.extract_context(failure_paths)
        
        assert len(context_files) == 1
        assert context_files[0].path == str(self.test_file1)
        assert "def add(a, b):" in context_files[0].content
        assert context_files[0].relevance_score == 1.0
    
    def test_extract_context_multiple_files(self):
        """Test context extraction with multiple failure paths"""
        extractor = MinimalContextExtractor(str(self.repo_root), max_context_files=3)
        failure_paths = [str(self.test_file1), str(self.test_file2)]
        
        context_files = extractor.extract_context(failure_paths)
        
        assert len(context_files) == 2
        
        paths = {cf.path for cf in context_files}
        assert str(self.test_file1) in paths
        assert str(self.test_file2) in paths
        
        # Check that content was read correctly
        for cf in context_files:
            if cf.path == str(self.test_file1):
                assert "def add(a, b):" in cf.content
            elif cf.path == str(self.test_file2):
                assert "class Calculator:" in cf.content
    
    def test_extract_context_with_related_paths(self):
        """Test context extraction with additional related paths"""
        extractor = MinimalContextExtractor(str(self.repo_root), max_context_files=3)
        failure_paths = [str(self.test_file1)]
        related_paths = [str(self.test_file2)]
        
        context_files = extractor.extract_context(failure_paths, related_paths)
        
        assert len(context_files) == 2
        
        paths = {cf.path for cf in context_files}
        assert str(self.test_file1) in paths
        assert str(self.test_file2) in paths
    
    def test_relevance_scoring(self):
        """Test relevance scoring based on path similarity"""
        extractor = MinimalContextExtractor(str(self.repo_root))
        
        # Test direct match scoring
        score = extractor._calculate_relevance_score(
            str(self.test_file1),
            [str(self.test_file1)]
        )
        assert score == 1.0
        
        # Test same directory scoring
        score = extractor._calculate_relevance_score(
            str(self.test_file2),
            [str(self.test_file2.parent / "other_file.py")]
        )
        assert score == 0.5  # Same directory
    
    def test_file_truncation(self):
        """Test that large files are truncated"""
        large_file = self.temp_dir / "large_file.py"
        large_content = "\n".join([f"line_{i}" for i in range(1000)])
        large_file.write_text(large_content)
        
        extractor = MinimalContextExtractor(str(self.repo_root))
        context_files = extractor.extract_context([str(large_file)])
        
        assert len(context_files) == 1
        # File should be truncated to first 500 lines
        assert "line_100" in context_files[0].content
        assert "line_600" not in context_files[0].content  # Beyond the limit
        assert "... (file truncated" in context_files[0].content


class TestUtilityFunctions:
    """Test utility functions for context extraction"""
    
    def test_extract_related_files_from_diff(self):
        """Test extraction of related files from diff content"""
        diff_content = """--- a/src/calculator.py
+++ b/src/calculator.py
@@ -1,5 +1,5 @@
 class Calculator:
-    def add(self, a, b):
-        return a + b
+    def add(self, a, b):
+        return a + b + 0  # Fixed bug
"""
        
        repo_root = "/fake/repo"
        # Create a mock file structure for testing
        related_files = extract_related_files_from_diff(diff_content, repo_root)
        
        # Since the files don't exist in the fake repo, result would be empty
        # But we can test the parsing logic by creating actual test files
        with tempfile.TemporaryDirectory() as temp_dir:
            test_file = Path(temp_dir) / "src" / "calculator.py"
            test_file.parent.mkdir(parents=True, exist_ok=True)
            test_file.write_text("test content")
            
            related_files = extract_related_files_from_diff(diff_content, temp_dir)
            assert str(test_file) in related_files
    
    def test_extract_related_functions_or_classes(self):
        """Test extraction of function/class names from error messages"""
        error_message = "TypeError: calculator.add() missing 1 required positional argument: 'b'"
        
        # This test requires a specific file path
        functions = extract_related_functions_or_classes(error_message, "test_file.py")
        
        assert "calculator.add" in functions
        assert "add" in functions
    
    def test_get_related_source_files(self):
        """Test getting related source files from failure context"""
        # Create a temporary directory and file for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            test_file = Path(temp_dir) / "test_file.py"
            test_file.write_text("def test_func(): pass")
            
            failure_context = {
                "details": f"{test_file}:10: Some error occurred",
                "path": str(test_file),
                "message": "Error in test_func()"
            }
            
            related_files = get_related_source_files(failure_context, temp_dir)
            
            # Should include the file mentioned in details
            assert str(test_file) in related_files