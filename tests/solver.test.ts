import { describe, expect, it } from 'vitest';
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
});
