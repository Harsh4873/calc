import { evaluate as mjsEvaluate, format as mjsFormat, parse as mjsParse } from 'mathjs';
import nerdamer from './cas';
import { normalizeExpr, parseProblem } from './parse';
import type { SolveResult, SolveStep } from './types';

function toTeX(expr: string): string {
  try {
    return nerdamer(expr).toTeX();
  } catch {
    try {
      return mjsParse(expr).toTex();
    } catch {
      return expr;
    }
  }
}

function casText(expr: string): string {
  return nerdamer(expr).toString();
}

function fmtNumber(value: unknown): string {
  return mjsFormat(value, { precision: 14 }).replace(/(\.\d*?)0+($|e)/, '$1$2').replace(/\.$/, '');
}

// ---------- individual solvers ----------

function solveArithmetic(expr: string): SolveResult {
  const norm = normalizeExpr(expr);
  const value = mjsEvaluate(norm);
  const text = fmtNumber(value);
  const steps: SolveStep[] = [
    { title: 'Expression', latex: toTeX(norm), detail: expr.trim() },
    { title: 'Result', latex: `${toTeX(norm)} = ${text}` },
  ];
  return {
    type: 'arithmetic',
    input: expr,
    answerLatex: text,
    answerText: text,
    steps,
  };
}

function solveSimplify(expr: string): SolveResult {
  const norm = normalizeExpr(expr);
  const simplified = casText(`simplify(${norm})`);
  const steps: SolveStep[] = [
    { title: 'Input', latex: toTeX(norm) },
    { title: 'Simplified', latex: toTeX(simplified) },
  ];
  return {
    type: 'simplify',
    input: expr,
    answerLatex: toTeX(simplified),
    answerText: simplified,
    steps,
  };
}

function solveExpand(expr: string): SolveResult {
  const norm = normalizeExpr(expr);
  const expanded = casText(`expand(${norm})`);
  return {
    type: 'expand',
    input: expr,
    answerLatex: toTeX(expanded),
    answerText: expanded,
    steps: [
      { title: 'Input', latex: toTeX(norm) },
      { title: 'Expanded', latex: toTeX(expanded) },
    ],
  };
}

function solveFactor(expr: string): SolveResult {
  const norm = normalizeExpr(expr);
  const factored = casText(`factor(${norm})`);
  return {
    type: 'factor',
    input: expr,
    answerLatex: toTeX(factored),
    answerText: factored,
    steps: [
      { title: 'Input', latex: toTeX(norm) },
      { title: 'Factored form', latex: toTeX(factored) },
    ],
  };
}

function splitEquation(expr: string): { lhs: string; rhs: string } {
  const idx = expr.indexOf('=');
  if (idx === -1) return { lhs: expr, rhs: '0' };
  return { lhs: expr.slice(0, idx), rhs: expr.slice(idx + 1) };
}

function solveEquation(expr: string, variable: string): SolveResult {
  const { lhs, rhs } = splitEquation(expr);
  const nl = normalizeExpr(lhs);
  const nr = normalizeExpr(rhs);
  const eq = `${nl}=${nr}`;
  // nerdamer solve returns a bracketed list e.g. [2,3]
  const raw = nerdamer(`solve(${eq}, ${variable})`).toString();
  const roots = raw
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const rootsText = roots.length
    ? roots.map((r) => `${variable}=${r}`).join(', ')
    : 'no solution';
  const rootsLatex = roots.length
    ? roots.map((r) => `${variable}=${toTeX(r)}`).join(',\\quad ')
    : '\\text{no real solution}';

  const steps: SolveStep[] = [
    { title: 'Equation', latex: `${toTeX(nl)} = ${toTeX(nr)}` },
    { title: 'Move all terms to one side', latex: `${toTeX(`(${nl})-(${nr})`)} = 0` },
    { title: roots.length > 1 ? 'Solutions' : 'Solution', latex: rootsLatex },
  ];

  return {
    type: 'solve',
    input: expr,
    answerLatex: rootsLatex,
    answerText: rootsText,
    steps,
  };
}

function solveDerivative(expr: string, variable: string): SolveResult {
  const norm = normalizeExpr(expr);
  const deriv = nerdamer(`diff(${norm}, ${variable})`).toString();
  const simplified = casText(`simplify(${deriv})`);
  return {
    type: 'derivative',
    input: expr,
    answerLatex: toTeX(simplified),
    answerText: simplified,
    steps: [
      { title: 'Differentiate with respect to ' + variable, latex: `\\frac{d}{d${variable}}\\left(${toTeX(norm)}\\right)` },
      { title: 'Derivative', latex: toTeX(simplified) },
    ],
  };
}

function solveIntegral(expr: string, variable: string): SolveResult {
  const norm = normalizeExpr(expr);
  const integral = nerdamer(`integrate(${norm}, ${variable})`).toString();
  const simplified = casText(`simplify(${integral})`);
  return {
    type: 'integral',
    input: expr,
    answerLatex: `${toTeX(simplified)} + C`,
    answerText: `${simplified} + C`,
    steps: [
      { title: 'Integrate with respect to ' + variable, latex: `\\int ${toTeX(norm)}\\,d${variable}` },
      { title: 'Antiderivative', latex: `${toTeX(simplified)} + C` },
    ],
  };
}

// ---------- dispatcher ----------

export function solve(input: string): SolveResult {
  const raw = (input ?? '').trim();
  if (!raw) {
    return errorResult(raw, 'unknown', 'Enter a problem to solve.');
  }

  const parsed = parseProblem(raw);

  try {
    switch (parsed.type) {
      case 'arithmetic':
        return solveArithmetic(parsed.expr);
      case 'evaluate':
        return solveArithmetic(parsed.expr);
      case 'simplify':
        return solveSimplify(parsed.expr);
      case 'expand':
        return solveExpand(parsed.expr);
      case 'factor':
        return solveFactor(parsed.expr);
      case 'solve':
        return solveEquation(parsed.expr, parsed.variable);
      case 'derivative':
        return solveDerivative(parsed.expr, parsed.variable);
      case 'integral':
        return solveIntegral(parsed.expr, parsed.variable);
      default:
        return errorResult(raw, 'unknown', 'Could not recognize this problem type. Try "solve x^2-5x+6=0" or "derivative of x^3".');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResult(raw, parsed.type, `Could not solve this ${parsed.type} problem: ${message}`);
  }
}

function errorResult(input: string, type: SolveResult['type'], error: string): SolveResult {
  return {
    type,
    input,
    answerLatex: '',
    answerText: '',
    steps: [],
    error,
  };
}
