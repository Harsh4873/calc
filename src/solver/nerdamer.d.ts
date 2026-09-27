declare module 'nerdamer' {
  interface Nerdamer {
    (expression: string, subs?: Record<string, string | number>, option?: string | string[]): Nerdamer;
    text(option?: string): string;
    toTeX(): string;
    toString(): string;
    solveFor(variable: string): Nerdamer;
    evaluate(): Nerdamer;
    expand(): Nerdamer;
    add(x: string | number): Nerdamer;
    factor(): Nerdamer;
    getExpressions(): Nerdamer[];
    setConstant(name: string, value: number): void;
  }
  const nerdamer: Nerdamer & {
    diff(expr: string, variable: string, n?: number): Nerdamer;
    integrate(expr: string, variable: string): Nerdamer;
    factor(expr: string): Nerdamer;
    expand(expr: string): Nerdamer;
    solve(expr: string, variable: string): Nerdamer;
    solveEquations(equations: string | string[], variables?: string | string[]): unknown;
    convertToLaTeX(expr: string): string;
    getCore(): unknown;
  };
  export default nerdamer;
}

declare module 'nerdamer/all.min.js';
declare module 'nerdamer/Algebra.js';
declare module 'nerdamer/Calculus.js';
declare module 'nerdamer/Solve.js';
declare module 'nerdamer/Extra.js';
