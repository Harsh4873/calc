export type StepKind = 'info' | 'result';

export interface SolveStep {
  title: string;
  latex?: string;
  detail?: string;
}

export type ProblemType =
  | 'arithmetic'
  | 'evaluate'
  | 'simplify'
  | 'expand'
  | 'factor'
  | 'solve'
  | 'derivative'
  | 'integral'
  | 'unknown';

export interface SolveResult {
  type: ProblemType;
  input: string;
  answerLatex: string;
  answerText: string;
  steps: SolveStep[];
  error?: string;
}
