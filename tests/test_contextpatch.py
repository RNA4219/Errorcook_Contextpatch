import json
import pytest
from src.workflows.contextpatch import FailureItem, generate_patch

def test_generate_patch_basic():
    f1 = FailureItem(tool='pytest', path='src/foo.py', message='example error', details='err', severity='error', meta={'line_number': 10})
    f2 = FailureItem(tool='mypy', path='src/bar.py', message='type error', details='err', severity='error', meta={'line_number': 20})
    patch = generate_patch([f1, f2])
    assert 'hypothesis' in patch
    assert 'suspects' in patch
    assert 'patch' in patch
    assert 'tests' in patch
    assert isinstance(patch['suspects'], list)
    assert len(patch['suspects']) == 2
    assert patch['suspects'][0]['file'] == 'src/foo.py'
    assert patch['suspects'][0]['line'] == 10
    assert patch['suspects'][1]['file'] == 'src/bar.py'
    assert patch['suspects'][1]['line'] == 20
    assert 'unified_diff' in patch['patch']
    assert len(patch['tests']) == 1
    assert patch['tests'][0]['path'] == 'test_patch.py'

def test_generate_patch_empty_failures():
    with pytest.raises(ValueError, match="No failures to patch"):
        generate_patch([])

def test_generate_patch_single_failure():
    f1 = FailureItem(tool='pytest', path='src/single.py', message='single error', details='err', severity='error', meta={'line_number': 5})
    patch = generate_patch([f1])
    assert len(patch['suspects']) == 1
    assert patch['suspects'][0]['file'] == 'src/single.py'
    assert patch['suspects'][0]['line'] == 5

def test_generate_patch_meta_no_line_number():
    f1 = FailureItem(tool='eslint', path='src/nolines.js', message='lint error', details='err', severity='warning', meta={})
    patch = generate_patch([f1])
    assert patch['suspects'][0]['line'] == 0

def test_generate_patch_meta_invalid_line_number():
    f1 = FailureItem(tool='eslint', path='src/invalidlines.js', message='lint error', details='err', severity='warning', meta={'line_number': 'abc'})
    patch = generate_patch([f1])
    assert patch['suspects'][0]['line'] == 0

def test_generate_patch_multiple_failures_limit():
    failures = [
        FailureItem(tool='pytest', path=f'src/file{i}.py', message=f'error {i}', details='err', severity='error', meta={'line_number': i})
        for i in range(5)
    ]
    patch = generate_patch(failures)
    assert len(patch['suspects']) == 3 # Should limit to 3 suspects
    assert patch['suspects'][0]['file'] == 'src/file0.py'
    assert patch['suspects'][2]['file'] == 'src/file2.py'

