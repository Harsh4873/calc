import { describe, expect, it } from 'vitest';
import { applyBackspace, applyInsert } from '../src/lib/insertAtCaret';

describe('applyInsert', () => {
  it('inserts at caret with no selection', () => {
    const r = applyInsert('ab', 1, 1, { before: '+' });
    expect(r.value).toBe('a+b');
    expect(r.caret).toBe(2);
  });

  it('places caret between before and after when empty selection', () => {
    const r = applyInsert('x', 1, 1, { before: 'sin(', after: ')' });
    expect(r.value).toBe('xsin()');
    expect(r.caret).toBe(5); // after "sin("
  });

  it('wraps a selection', () => {
    const r = applyInsert('2x+1', 0, 4, { before: 'abs(', after: ')' });
    expect(r.value).toBe('abs(2x+1)');
    expect(r.caret).toBe(8); // after selection, before closing )
  });

  it('builds a fraction template', () => {
    const r = applyInsert('', 0, 0, { before: '(', after: ')/()' });
    expect(r.value).toBe('()/()');
    expect(r.caret).toBe(1);
  });

  it('clamps out-of-range selection', () => {
    const r = applyInsert('hi', 99, 99, { before: '!' });
    expect(r.value).toBe('hi!');
    expect(r.caret).toBe(3);
  });
});

describe('applyBackspace', () => {
  it('deletes the character before the caret', () => {
    const r = applyBackspace('abc', 2, 2);
    expect(r.value).toBe('ac');
    expect(r.caret).toBe(1);
  });

  it('deletes the selection', () => {
    const r = applyBackspace('abcdef', 2, 5);
    expect(r.value).toBe('abf');
    expect(r.caret).toBe(2);
  });

  it('is a no-op at start', () => {
    const r = applyBackspace('ab', 0, 0);
    expect(r.value).toBe('ab');
    expect(r.caret).toBe(0);
  });
});
