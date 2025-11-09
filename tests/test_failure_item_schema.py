from lib.errorcook.failure_item import FailureItem

def test_valid_creation():
    fi = FailureItem(module="moduleA", item="should do this")
    assert fi.validate()

def test_empty_module_raises():
    try:
        FailureItem(module="", item="x")
        assert False, "Expected ValueError"
    except ValueError:
        pass

def test_empty_item_raises():
    try:
        FailureItem(module="m", item="")
        assert False, "Expected ValueError"
    except ValueError:
        pass
