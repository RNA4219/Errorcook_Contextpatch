import importlib.util
from pathlib import Path


def load_inspector():
    current_dir = Path(__file__).resolve().parent
    inspector_path = current_dir.parent / 'src' / 'errorcook' / 'inspect_repo.py'
    spec = importlib.util.spec_from_file_location('inspect_repo', str(inspector_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.detect_tools


def test_detect_tools_positive(tmp_path):
    repo = tmp_path
    (repo / 'pyproject.toml').write_text('[tool.mypy]\n')
    (repo / 'package.json').write_text('{"dependencies": {"jest": "^26.0.0"}}')
    (repo / 'requirements.txt').write_text('')
    (repo / 'tests').mkdir()
    (repo / 'tests' / 'test_example.py').write_text('def test_dummy(): pass\n')
    detect_tools = load_inspector()
    res = detect_tools(str(repo))
    assert res['has_mypy_config'] is True
    assert res['has_node_tests'] is True
    assert res['tests_directory_present'] is True


def test_detect_tools_negative(tmp_path):
    repo = tmp_path
    (repo / 'pyproject.toml').write_text('')
    (repo / 'package.json').write_text('{}')
    detect_tools = load_inspector()
    res = detect_tools(str(repo))
    assert res['has_mypy_config'] is False
    assert res['has_node_tests'] is False
    assert res['tests_directory_present'] is False
