from math_operations import add, subtract


def test_addition():
    """Test addition function"""
    assert add(2, 2) == 4  # Correct result for 2 + 2


def test_subtraction():
    """Test subtraction function"""
    assert subtract(5, 3) == 2  # Correct result for 5 - 3