import pytest

from pipelines.costmodel.expr import FormulaError, evaluate, referenced_names


def test_arithmetic():
    assert evaluate("2 + 3 * 4", {}) == 14
    assert evaluate("(2 + 3) * 4", {}) == 20
    assert evaluate("a / b - c", {"a": 10, "b": 4, "c": 0.5}) == 2.0
    assert evaluate("-a + 5", {"a": 2}) == 3


def test_unknown_name():
    with pytest.raises(FormulaError, match="unknown name"):
        evaluate("a + b", {"a": 1})


def test_disallowed_syntax():
    for bad in ["__import__('os')", "a ** 2", "a if b else c", "[1,2]", "f(1)"]:
        with pytest.raises(FormulaError):
            evaluate(bad, {"a": 1, "b": 1, "c": 1})


def test_division_by_zero():
    with pytest.raises(FormulaError, match="division by zero"):
        evaluate("1 / a", {"a": 0})


def test_referenced_names():
    assert referenced_names("x * (y + 2) / z") == {"x", "y", "z"}
