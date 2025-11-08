import pytest
from compliance_checker import all_compliant, MypyChecker, RuffChecker


class _Good:
    def run(self) -> bool:
        return True


class _Bad:
    def run(self) -> bool:
        return False


def test_all_compliant_all_good():
    assert all_compliant([_Good(), _Good()])


def test_all_compliant_fails_when_any_bad():
    assert not all_compliant([_Good(), _Bad()])
