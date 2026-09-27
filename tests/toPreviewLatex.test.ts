import { describe, expect, it } from 'vitest';
import { toPreviewLatex } from '../src/lib/toPreviewLatex';

describe('toPreviewLatex', () => {
  it('returns null for empty and whitespace', () => {
    expect(toPreviewLatex('')).toBeNull();
    expect(toPreviewLatex('   ')).toBeNull();
    expect(toPreviewLatex('\n\t')).toBeNull();
  });

  it('returns latex for simple expression', () => {
    const r = toPreviewLatex('x^2');
    expect(r).not.toBeNull();
    expect(r).toContain('x');
    expect(r).toContain('2');
  });

  it('handles implicit multiplication 2x', () => {
    const r = toPreviewLatex('2x');
    expect(r).not.toBeNull();
    // nerdamer renders as 2 \cdot x or 2x
    expect(r!).toMatch(/2/);
    expect(r!).toMatch(/x/);
  });

  it('strips command words via parseProblem', () => {
    const a = toPreviewLatex('solve x^2 - 5x + 6 = 0');
    const b = toPreviewLatex('x^2 - 5x + 6 = 0');
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    // Both should contain same core latex after stripping "solve"
    expect(a).toEqual(b);
  });

  it('strips factor/expand/simplify prefixes', () => {
    expect(toPreviewLatex('factor x^2 - 9')).not.toBeNull();
    expect(toPreviewLatex('expand (x+1)^2')).not.toBeNull();
    expect(toPreviewLatex('simplify x^2 + 2x + 1')).not.toBeNull();
    // Bare expr should be non-null
    const bare = toPreviewLatex('x^2 - 9');
    const withCmd = toPreviewLatex('factor x^2 - 9');
    expect(bare).toEqual(withCmd);
  });

  it('handles equations with = sign', () => {
    const r = toPreviewLatex('x^2 - 5x + 6 = 0');
    expect(r).not.toBeNull();
    expect(r!).toContain('=');
    expect(r!).toContain('x');
  });

  it('returns null for trailing operator (incomplete)', () => {
    expect(toPreviewLatex('x+')).toBeNull();
    expect(toPreviewLatex('x^')).toBeNull();
    expect(toPreviewLatex('2*')).toBeNull();
  });

  it('returns null for unbalanced parentheses', () => {
    expect(toPreviewLatex('(x+1')).toBeNull();
    expect(toPreviewLatex('((x+2)')).toBeNull();
  });

  it('returns null for incomplete equation like x^2 =', () => {
    expect(toPreviewLatex('x^2 =')).toBeNull();
    expect(toPreviewLatex('= 0')).toBeNull();
  });

  it('returns null for bare command words', () => {
    expect(toPreviewLatex('solve')).toBeNull();
    expect(toPreviewLatex('factor')).toBeNull();
    expect(toPreviewLatex('integrate')).toBeNull();
    expect(toPreviewLatex('derivative')).toBeNull();
  });

  it('renders derivative-style input via expr only', () => {
    const r = toPreviewLatex('derivative of x^3');
    expect(r).not.toBeNull();
    expect(r!).toContain('x');
    expect(r!).toContain('3');
  });

  it('renders trig and sqrt', () => {
    expect(toPreviewLatex('sin(x)')).not.toBeNull();
    expect(toPreviewLatex('sqrt(16)')).not.toBeNull();
  });

  it('never throws for gibberish', () => {
    expect(() => toPreviewLatex(')(@#$')).not.toThrow();
    expect(toPreviewLatex(')(@#$')).toBeNull();
  });

  it('never throws for nullish or weird inputs', () => {
    // @ts-expect-error intentional bad input
    expect(toPreviewLatex(null)).toBeNull();
    // @ts-expect-error
    expect(toPreviewLatex(undefined)).toBeNull();
  });

  it('handles symbol pad fraction-like inputs', () => {
    // "(x+1)/()"(incomplete) should be null or non-throw
    const r = toPreviewLatex('(a)/(b)');
    expect(r).not.toBeNull();
  });
});
