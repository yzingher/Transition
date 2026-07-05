/**
 * Deterministic should-cost engine — TypeScript twin of
 * pipelines/src/pipelines/costmodel/engine.py.
 *
 * Both implementations are pinned to identical output by
 * models/tests/golden.json (see decisions/0002). The expression language is
 * deliberately tiny: numbers, identifiers, + - * /, unary minus, parentheses.
 *
 * P10/P90 are full-correlation scenario bounds, not sampled percentiles
 * (decisions/0003): per-parameter direction is detected numerically, then the
 * cost-minimising and cost-maximising vectors are composed.
 */

export interface ParameterDef {
  key: string;
  label: string;
  unit: string;
  range: { low: number; mid: number; high: number };
  claims: string[];
  notes?: string;
}

export interface FormulaDef {
  key: string;
  label: string;
  formula: string;
}

export interface CostModelDef {
  id: string;
  version: string;
  title: string;
  sector: string;
  unit: string;
  status: string;
  description: string;
  parameters: ParameterDef[];
  components: FormulaDef[];
  outputs: FormulaDef[];
  primary_output: string;
}

export interface RangeResult {
  p10: number;
  p50: number;
  p90: number;
  directions: Record<string, -1 | 0 | 1>;
  centralValues: Record<string, number>;
}

// ---- expression evaluator ----------------------------------------------

type Token =
  | { kind: "num"; value: number }
  | { kind: "name"; value: string }
  | { kind: "op"; value: "+" | "-" | "*" | "/" | "(" | ")" };

export class FormulaError extends Error {}

function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < formula.length) {
    const ch = formula[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < formula.length && /[0-9._]/.test(formula[j])) j++;
      const raw = formula.slice(i, j);
      const value = Number(raw.replace(/_/g, ""));
      if (Number.isNaN(value)) throw new FormulaError(`bad number ${raw} in ${formula}`);
      tokens.push({ kind: "num", value });
      i = j;
    } else if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < formula.length && /\w/.test(formula[j])) j++;
      tokens.push({ kind: "name", value: formula.slice(i, j) });
      i = j;
    } else if ("+-*/()".includes(ch)) {
      tokens.push({ kind: "op", value: ch as "+" | "-" | "*" | "/" | "(" | ")" });
      i++;
    } else {
      throw new FormulaError(`disallowed character ${JSON.stringify(ch)} in ${formula}`);
    }
  }
  return tokens;
}

/** Recursive-descent parser mirroring Python ast semantics for + - * / and unary minus. */
export function evaluate(formula: string, names: Record<string, number>): number {
  const tokens = tokenize(formula);
  let pos = 0;

  const peek = () => tokens[pos];
  const takeOp = (...ops: string[]): string | null => {
    const t = tokens[pos];
    if (t && t.kind === "op" && ops.includes(t.value)) {
      pos++;
      return t.value;
    }
    return null;
  };

  function parseExpr(): number {
    let left = parseTerm();
    let op: string | null;
    while ((op = takeOp("+", "-")) !== null) {
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    let op: string | null;
    while ((op = takeOp("*", "/")) !== null) {
      const right = parseFactor();
      if (op === "*") {
        left = left * right;
      } else {
        if (right === 0) throw new FormulaError(`division by zero in ${formula}`);
        left = left / right;
      }
    }
    return left;
  }

  function parseFactor(): number {
    if (takeOp("-")) return -parseFactor();
    if (takeOp("(")) {
      const value = parseExpr();
      if (!takeOp(")")) throw new FormulaError(`missing ) in ${formula}`);
      return value;
    }
    const t = peek();
    if (t && t.kind === "num") {
      pos++;
      return t.value;
    }
    if (t && t.kind === "name") {
      pos++;
      if (!(t.value in names)) throw new FormulaError(`unknown name ${t.value} in ${formula}`);
      return names[t.value];
    }
    throw new FormulaError(`unexpected end of formula ${formula}`);
  }

  const result = parseExpr();
  if (pos !== tokens.length) throw new FormulaError(`trailing tokens in ${formula}`);
  return result;
}

// ---- model evaluation ---------------------------------------------------

export function evaluateScenario(
  model: CostModelDef,
  values: Record<string, number>,
): Record<string, number> {
  const names: Record<string, number> = { ...values };
  for (const f of [...model.components, ...model.outputs]) {
    names[f.key] = evaluate(f.formula, names);
  }
  return names;
}

function primary(model: CostModelDef, values: Record<string, number>): number {
  return evaluateScenario(model, values)[model.primary_output];
}

export function midValues(model: CostModelDef): Record<string, number> {
  return Object.fromEntries(model.parameters.map((p) => [p.key, p.range.mid]));
}

export function evaluateRange(model: CostModelDef): RangeResult {
  const mid = midValues(model);
  const centralValues = evaluateScenario(model, mid);
  const p50 = centralValues[model.primary_output];

  const directions: Record<string, -1 | 0 | 1> = {};
  for (const p of model.parameters) {
    const lo = primary(model, { ...mid, [p.key]: p.range.low });
    const hi = primary(model, { ...mid, [p.key]: p.range.high });
    directions[p.key] = hi === lo ? 0 : hi > lo ? 1 : -1;
  }

  const minVec = Object.fromEntries(
    model.parameters.map((p) => [p.key, directions[p.key] >= 0 ? p.range.low : p.range.high]),
  );
  const maxVec = Object.fromEntries(
    model.parameters.map((p) => [p.key, directions[p.key] >= 0 ? p.range.high : p.range.low]),
  );
  const p10 = primary(model, minVec);
  const p90 = primary(model, maxVec);

  if (!(p10 <= p50 && p50 <= p90)) {
    throw new FormulaError(`${model.id}: bound composition failed — model not monotone`);
  }
  return { p10, p50, p90, directions, centralValues };
}
