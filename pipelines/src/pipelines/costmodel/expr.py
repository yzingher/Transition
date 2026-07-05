"""Tiny deterministic expression evaluator for cost-model formulas.

Deliberately minimal: numbers, identifiers, + - * /, unary minus, parentheses.
No functions, no conditionals, no attribute access. A model that needs more
should be decomposed, not the language grown (see models/SCHEMA.md).

Mirrored by web/src/lib/engine.ts — both are pinned by models/tests/golden.json.
"""

from __future__ import annotations

import ast


class FormulaError(ValueError):
    pass


_ALLOWED_BINOPS = {ast.Add, ast.Sub, ast.Mult, ast.Div}


def evaluate(formula: str, names: dict[str, float]) -> float:
    try:
        tree = ast.parse(formula, mode="eval")
    except SyntaxError as exc:
        raise FormulaError(f"unparseable formula: {formula!r}") from exc
    return _eval(tree.body, names, formula)


def _eval(node: ast.expr, names: dict[str, float], formula: str) -> float:
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
            return float(node.value)
        raise FormulaError(f"non-numeric constant in {formula!r}")
    if isinstance(node, ast.Name):
        if node.id not in names:
            raise FormulaError(f"unknown name {node.id!r} in {formula!r}")
        return names[node.id]
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        return -_eval(node.operand, names, formula)
    if isinstance(node, ast.BinOp) and type(node.op) in _ALLOWED_BINOPS:
        left = _eval(node.left, names, formula)
        right = _eval(node.right, names, formula)
        if isinstance(node.op, ast.Add):
            return left + right
        if isinstance(node.op, ast.Sub):
            return left - right
        if isinstance(node.op, ast.Mult):
            return left * right
        if right == 0:
            raise FormulaError(f"division by zero in {formula!r}")
        return left / right
    raise FormulaError(f"disallowed syntax in {formula!r}: {ast.dump(node)}")


def referenced_names(formula: str) -> set[str]:
    try:
        tree = ast.parse(formula, mode="eval")
    except SyntaxError as exc:
        raise FormulaError(f"unparseable formula: {formula!r}") from exc
    return {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
