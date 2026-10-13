import { describe, expect, it } from 'vitest';
import { PAD_ROWS } from '../src/components/SymbolPad';
import { solve } from '../src/solver';
import { parseProblem, normalizeExpr } from '../src/solver';

function norm(s: string): string {
  // remove spaces for resilient comparison
  return s.replace(/\s+/g, '');
}

describe('parseProblem', () => {
  it('detects arithmetic', () => {
    expect(parseProblem('2+2*3').type).toBe('arithmetic');
  });
  it('detects solve via = sign', () => {
    expect(parseProblem('x^2 - 5x + 6 = 0').type).toBe('solve');
  });
  it('detects derivative via d/dx', () => {
    const p = parseProblem('d/dx x^3');
    expect(p.type).toBe('derivative');
    expect(p.variable).toBe('x');
  });
  it('detects integral', () => {
    expect(parseProblem('integrate x^2').type).toBe('integral');
    const spaced = parseProblem('∫ x^2 dx');
    expect(spaced.type).toBe('integral');
    expect(spaced.expr.replace(/\s+/g, '')).toBe('x^2');
    expect(spaced.variable).toBe('x');
    const glued = parseProblem('∫x^2dx');
    expect(glued.type).toBe('integral');
    expect(glued.expr.replace(/\s+/g, '')).toBe('x^2');
  });
  it('detects factor / expand / simplify', () => {
    expect(parseProblem('factor x^2 - 9').type).toBe('factor');
    expect(parseProblem('expand (x+1)^2').type).toBe('expand');
    expect(parseProblem('simplify (x^2 + 2x + 1)').type).toBe('simplify');
  });
});

describe('normalizeExpr', () => {
  it('inserts implicit multiplication', () => {
    expect(normalizeExpr('2x')).toBe('2*x');
    expect(normalizeExpr('5x + 6')).toBe('5*x+6');
    expect(normalizeExpr('2(3+4)')).toBe('2*(3+4)');
  });

  it('keeps scientific notation and digit-suffix functions', () => {
    expect(normalizeExpr('1e10')).toBe('1e10');
    expect(normalizeExpr('2e-3')).toBe('2e-3');
    expect(normalizeExpr('6.02e+23')).toBe('6.02e+23');
    expect(normalizeExpr('log10(100)')).toBe('log10(100)');
  });

  it('maps keypad functions onto the engines', () => {
    expect(normalizeExpr('ln(1)')).toBe('log(1)');
    expect(normalizeExpr('nthRoot(8, 3)')).toBe('nthroot(8,3)');
    expect(normalizeExpr('√16')).toBe('sqrt(16)');
    expect(normalizeExpr('∛8')).toBe('cbrt(8)');
    expect(normalizeExpr('√x')).toBe('sqrt(x)');
  });
});

describe('solve — required examples', () => {
  it('2+2*3 = 8', () => {
    const r = solve('2+2*3');
    expect(r.error).toBeUndefined();
    expect(r.answerText).toBe('8');
  });

  it('simplify (x^2 + 2x + 1) => (x+1)^2 equivalent', () => {
    const r = solve('simplify (x^2 + 2x + 1)');
    expect(r.error).toBeUndefined();
    // nerdamer may return (1+x)^2 or (x+1)^2
    expect(norm(r.answerText)).toMatch(/\(1\+x\)\^2|\(x\+1\)\^2/);
  });

  it('solve x^2 - 5x + 6 = 0 => x=2, x=3', () => {
    const r = solve('solve x^2 - 5x + 6 = 0');
    expect(r.error).toBeUndefined();
    const t = norm(r.answerText);
    expect(t).toContain('x=2');
    expect(t).toContain('x=3');
  });

  it('factor x^2 - 9 => (x-3)(x+3) equivalent', () => {
    const r = solve('factor x^2 - 9');
    expect(r.error).toBeUndefined();
    const t = norm(r.answerText);
    // Accept any ordering / optional * between factors; must be product of (±3±x)(±3±x)
    expect(t).toMatch(/\((-3\+x|x-3)\)\*?\((3\+x|x\+3)\)|\((3\+x|x\+3)\)\*?\((-3\+x|x-3)\)/);
  });

  it('derivative of x^3 => 3x^2', () => {
    const r = solve('derivative of x^3');
    expect(r.error).toBeUndefined();
    expect(norm(r.answerText)).toMatch(/3\*?x\^2/);
  });

  it('d/dx x^3 => 3x^2', () => {
    const r = solve('d/dx x^3');
    expect(r.error).toBeUndefined();
    expect(norm(r.answerText)).toMatch(/3\*?x\^2/);
  });

  it('integrate x^2 => x^3/3 (+C)', () => {
    const r = solve('integrate x^2');
    expect(r.error).toBeUndefined();
    const t = norm(r.answerText);
    expect(t).toMatch(/x\^3\/3|\(?1\/3\)?\*?x\^3/);
    expect(t).toContain('+C');
  });
});

describe('solve — extra behaviour', () => {
  it('evaluates arithmetic with functions', () => {
    const r = solve('sqrt(16) + 2^3');
    expect(r.answerText).toBe('12');
  });

  it('handles expand', () => {
    const r = solve('expand (x+1)^2');
    // nerdamer orders ascending powers: 1+2*x+x^2
    expect(norm(r.answerText)).toMatch(/1\+2\*?x\+x\^2|x\^2\+2\*?x\+1/);
  });

  it('returns a clear error for empty input', () => {
    const r = solve('   ');
    expect(r.error).toBeTruthy();
  });

  it('never throws for gibberish', () => {
    expect(() => solve(')(@#$')).not.toThrow();
  });

  it('evaluates scientific notation', () => {
    expect(solve('1e10').answerText).toBe('1e+10');
    expect(solve('2e-3').answerText).toBe('0.002');
    expect(solve('1e-15').answerText).toBe('1e-15');
    expect(solve('6.02e23').answerText).toBe('6.02e+23');
  });

  it('evaluates keypad functions that the engines name differently', () => {
    expect(solve('log10(100)').error).toBeUndefined();
    expect(solve('log10(100)').answerText).toBe('2');
    expect(solve('ln(1)').answerText).toBe('0');
    expect(solve('ln(e)').answerText).toBe('1');
    expect(solve('nthRoot(8, 3)').answerText).toBe('2');
    expect(solve('√16').answerText).toBe('4');
    expect(solve('∛8').answerText).toBe('2');
  });

  it('returns exact zeros for sin(pi) and cos(pi/2)', () => {
    expect(solve('sin(pi)').answerText).toBe('0');
    expect(solve('cos(pi/2)').answerText).toBe('0');
    expect(solve('tan(pi)').answerText).toBe('0');
  });

  it('integrates unicode and glued differentials', () => {
    for (const input of ['∫ x^2 dx', '∫x^2 dx', '∫x^2dx']) {
      const r = solve(input);
      expect(r.error, input).toBeUndefined();
      expect(r.type, input).toBe('integral');
      const t = norm(r.answerText);
      expect(t, input).toMatch(/x\^3\/3|\(?1\/3\)?\*?x\^3/);
      expect(t, input).not.toContain('dx');
    }
    expect(norm(solve('integrate dx').answerText)).toMatch(/^x\+C$/);
  });

  it('keeps 2pi symbolic', () => {
    expect(norm(solve('2pi').answerText)).toBe('2*pi');
  });

  it('inserts a base-10 log from the log key', () => {
    const logKey = PAD_ROWS.flatMap((row) => row.keys).find((key) => key.id === 'log');
    expect(logKey?.before).toBe('log10(');
    expect(logKey?.ariaLabel).toMatch(/base 10/i);
  });
});
