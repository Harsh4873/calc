export interface Example {
  label: string;
  input: string;
}

export const EXAMPLES: Example[] = [
  { label: 'Arithmetic', input: '2+2*3' },
  { label: 'Simplify', input: 'simplify (x^2 + 2x + 1)' },
  { label: 'Solve', input: 'solve x^2 - 5x + 6 = 0' },
  { label: 'Factor', input: 'factor x^2 - 9' },
  { label: 'Derivative', input: 'd/dx x^3' },
  { label: 'Integral', input: 'integrate x^2' },
  { label: 'Expand', input: 'expand (x+1)^3' },
];
