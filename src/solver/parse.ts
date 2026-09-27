import type { ProblemType } from './types';

export interface Parsed {
  type: ProblemType;
  /** The math expression stripped of command words. */
  expr: string;
  /** Detected variable for calculus / solve, defaults to x. */
  variable: string;
  /** Raw input. */
  raw: string;
}

const VAR_RE = /\b(?:with respect to|w\.r\.t\.?|wrt|for|in terms of|d\/d)\s*([a-zA-Z])\b/;

function guessVariable(expr: string, fallback = 'x'): string {
  // Prefer x, then y, then first single letter that is not a known constant/function.
  const reserved = new Set(['e']);
  const letters = (expr.match(/\b[a-zA-Z]\b/g) ?? []).filter((l) => !reserved.has(l));
  if (letters.includes('x')) return 'x';
  if (letters.includes('y')) return 'y';
  return letters[0] ?? fallback;
}

/**
 * Convert loose human syntax into something the CAS understands.
 * - implicit multiplication: 2x -> 2*x, )( -> )*(, x( -> x*(
 * - unicode operators
 */
export function normalizeExpr(input: string): string {
  let s = input.trim();
  s = s
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/−/g, '-')
    .replace(/\^\s*/g, '^')
    .replace(/√\s*/g, 'sqrt');
  // number followed by variable or ( -> multiply
  s = s.replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2');
  // variable or ) followed by ( -> multiply
  s = s.replace(/([a-zA-Z)])\s*\(/g, (m, p1) => {
    // don't break function calls like sin(, sqrt(, log(
    return /[a-zA-Z]/.test(p1) ? m : `${p1}*(`;
  });
  // ) followed by variable/number -> multiply
  s = s.replace(/\)\s*([a-zA-Z0-9])/g, ')*$1');
  return s.replace(/\s+/g, '');
}

/** Detect the problem type and pull out the core expression. */
export function parseProblem(raw: string): Parsed {
  const original = raw.trim();
  const lower = original.toLowerCase();
  const variable = (VAR_RE.exec(lower)?.[1] ?? '').trim();

  // Strip a trailing "with respect to x" style qualifier from the expression body.
  const stripQualifier = (s: string) => s.replace(VAR_RE, '').trim();

  // ---- Derivative ----
  // "d/dx x^3", "derivative of x^3", "differentiate x^3"
  let m =
    /^d\s*\/\s*d\s*([a-zA-Z])\s*(.+)$/i.exec(original) ||
    null;
  if (m) {
    const body = stripQualifier(m[2]);
    return { type: 'derivative', expr: body, variable: m[1], raw: original };
  }
  if (/^(the\s+)?(derivative|differentiate|diff)\b/i.test(lower)) {
    const body = stripQualifier(original.replace(/^(the\s+)?(derivative|differentiate|diff)(\s+of)?/i, ''));
    return { type: 'derivative', expr: body, variable: variable || guessVariable(body), raw: original };
  }

  // ---- Integral ----
  // "integrate x^2", "integral of x^2", "∫ x^2 dx"
  if (/(^|\b)(integrate|integral|antiderivative|∫)\b/i.test(lower)) {
    let body = original
      .replace(/∫/g, '')
      .replace(/^(the\s+)?(integrate|integral|antiderivative)(\s+of)?/i, '');
    // pull dx variable if present
    const dv = /\bd\s*([a-zA-Z])\s*$/i.exec(body);
    const v = dv?.[1] ?? variable;
    body = body.replace(/\bd\s*[a-zA-Z]\s*$/i, '');
    body = stripQualifier(body);
    return { type: 'integral', expr: body, variable: v || guessVariable(body), raw: original };
  }

  // ---- Solve equation ----
  if (/^solve\b/i.test(lower) || (/=/.test(original) && !/^(simplify|expand|factor)/i.test(lower))) {
    const body = stripQualifier(original.replace(/^solve\b/i, '')).trim();
    return { type: 'solve', expr: body, variable: variable || guessVariable(body), raw: original };
  }

  // ---- Factor ----
  if (/^factor(ize|ise)?\b/i.test(lower)) {
    const body = stripQualifier(original.replace(/^factor(ize|ise)?\b/i, ''));
    return { type: 'factor', expr: body, variable: variable || guessVariable(body), raw: original };
  }

  // ---- Expand ----
  if (/^expand\b/i.test(lower)) {
    const body = stripQualifier(original.replace(/^expand\b/i, ''));
    return { type: 'expand', expr: body, variable: variable || guessVariable(body), raw: original };
  }

  // ---- Simplify ----
  if (/^simplify\b/i.test(lower)) {
    const body = stripQualifier(original.replace(/^simplify\b/i, ''));
    return { type: 'simplify', expr: body, variable: variable || guessVariable(body), raw: original };
  }

  // ---- Evaluate keyword ----
  if (/^(evaluate|eval|calculate|compute|what is)\b/i.test(lower)) {
    const body = original.replace(/^(evaluate|eval|calculate|compute|what is)\b/i, '').replace(/\?$/, '').trim();
    const hasVar = /[a-zA-Z]/.test(body.replace(/\b(pi|e|sqrt|sin|cos|tan|log|ln|abs|exp)\b/gi, ''));
    return { type: hasVar ? 'simplify' : 'arithmetic', expr: body, variable: guessVariable(body), raw: original };
  }

  // ---- Bare expression: arithmetic if no free variables, else simplify ----
  const stripped = original.replace(/\b(pi|e|sqrt|sin|cos|tan|asin|acos|atan|log|ln|abs|exp|mod)\b/gi, '');
  const hasVar = /[a-zA-Z]/.test(stripped);
  return {
    type: hasVar ? 'simplify' : 'arithmetic',
    expr: original,
    variable: guessVariable(original),
    raw: original,
  };
}
