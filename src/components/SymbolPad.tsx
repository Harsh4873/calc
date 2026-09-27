import { useEffect, useRef } from 'react';
import type { InsertSpec } from '../lib/insertAtCaret';

export interface PadKey {
  id: string;
  /** Visible label (unicode / short text). */
  label: string;
  ariaLabel: string;
  before: string;
  after?: string;
  /** Stretch across more columns on wide layouts. */
  wide?: boolean;
}

export interface PadRow {
  title: string;
  keys: PadKey[];
}

/** Keys that insert text the existing solver/parser already understands. */
export const PAD_ROWS: PadRow[] = [
  {
    title: 'Basic',
    keys: [
      { id: 'plus', label: '+', ariaLabel: 'Plus', before: '+' },
      { id: 'minus', label: '−', ariaLabel: 'Minus', before: '-' },
      { id: 'times', label: '×', ariaLabel: 'Multiply', before: '*' },
      { id: 'div', label: '÷', ariaLabel: 'Divide', before: '/' },
      { id: 'eq', label: '=', ariaLabel: 'Equals', before: '=' },
      { id: 'lparen', label: '(', ariaLabel: 'Left parenthesis', before: '(' },
      { id: 'rparen', label: ')', ariaLabel: 'Right parenthesis', before: ')' },
      { id: 'comma', label: ',', ariaLabel: 'Comma', before: ',' },
      { id: 'dot', label: '.', ariaLabel: 'Decimal point', before: '.' },
    ],
  },
  {
    title: 'Powers & roots',
    keys: [
      { id: 'sq', label: 'x²', ariaLabel: 'Squared', before: '^2' },
      { id: 'cu', label: 'x³', ariaLabel: 'Cubed', before: '^3' },
      { id: 'pow', label: 'xⁿ', ariaLabel: 'Power', before: '^(', after: ')' },
      { id: 'sqrt', label: '√', ariaLabel: 'Square root', before: 'sqrt(', after: ')' },
      { id: 'cbrt', label: '∛', ariaLabel: 'Cube root', before: 'cbrt(', after: ')' },
      {
        id: 'nthroot',
        label: 'ⁿ√',
        ariaLabel: 'Nth root',
        before: 'nthRoot(',
        after: ', )',
      },
    ],
  },
  {
    title: 'Fractions & abs',
    keys: [
      {
        id: 'frac',
        label: 'a/b',
        ariaLabel: 'Fraction',
        before: '(',
        after: ')/()',
      },
      { id: 'slash', label: '/', ariaLabel: 'Slash', before: '/' },
      {
        id: 'abs',
        label: '|x|',
        ariaLabel: 'Absolute value',
        before: 'abs(',
        after: ')',
      },
    ],
  },
  {
    title: 'Constants',
    keys: [
      { id: 'pi', label: 'π', ariaLabel: 'Pi', before: 'pi' },
      { id: 'e', label: 'e', ariaLabel: 'Euler number e', before: 'e' },
      { id: 'inf', label: '∞', ariaLabel: 'Infinity', before: 'Infinity' },
    ],
  },
  {
    title: 'Trig & log',
    keys: [
      { id: 'sin', label: 'sin', ariaLabel: 'Sine', before: 'sin(', after: ')' },
      { id: 'cos', label: 'cos', ariaLabel: 'Cosine', before: 'cos(', after: ')' },
      { id: 'tan', label: 'tan', ariaLabel: 'Tangent', before: 'tan(', after: ')' },
      { id: 'asin', label: 'arcsin', ariaLabel: 'Arcsine', before: 'asin(', after: ')' },
      { id: 'acos', label: 'arccos', ariaLabel: 'Arccosine', before: 'acos(', after: ')' },
      { id: 'atan', label: 'arctan', ariaLabel: 'Arctangent', before: 'atan(', after: ')' },
      { id: 'ln', label: 'ln', ariaLabel: 'Natural log', before: 'ln(', after: ')' },
      { id: 'log', label: 'log', ariaLabel: 'Log base 10', before: 'log(', after: ')' },
    ],
  },
  {
    title: 'Calculus & algebra',
    keys: [
      { id: 'ddx', label: 'd/dx', ariaLabel: 'Derivative d/dx', before: 'd/dx ', wide: true },
      { id: 'int', label: '∫', ariaLabel: 'Integrate', before: 'integrate ', wide: true },
      { id: 'solve', label: 'solve', ariaLabel: 'Solve', before: 'solve ', wide: true },
      { id: 'simp', label: 'simplify', ariaLabel: 'Simplify', before: 'simplify ', wide: true },
      { id: 'factor', label: 'factor', ariaLabel: 'Factor', before: 'factor ', wide: true },
      { id: 'expand', label: 'expand', ariaLabel: 'Expand', before: 'expand ', wide: true },
    ],
  },
  {
    title: 'Variables',
    keys: [
      { id: 'x', label: 'x', ariaLabel: 'Variable x', before: 'x' },
      { id: 'y', label: 'y', ariaLabel: 'Variable y', before: 'y' },
      { id: 'z', label: 'z', ariaLabel: 'Variable z', before: 'z' },
      { id: 'n', label: 'n', ariaLabel: 'Variable n', before: 'n' },
    ],
  },
];

export type PadAction =
  | { kind: 'insert'; spec: InsertSpec }
  | { kind: 'backspace' };

interface SymbolPadProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: PadAction) => void;
}

export default function SymbolPad({ open, onClose, onAction }: SymbolPadProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className="symbol-pad"
      role="toolbar"
      aria-label="Math symbol pad"
    >
      <div className="symbol-pad-head">
        <span className="symbol-pad-title">Symbols</span>
        <button
          type="button"
          className="symbol-pad-close"
          onClick={onClose}
          aria-label="Close symbol pad"
        >
          ×
        </button>
      </div>

      {PAD_ROWS.map((row) => (
        <div key={row.title} className="symbol-pad-row" role="group" aria-label={row.title}>
          <div className="symbol-pad-row-label">{row.title}</div>
          <div className="symbol-pad-keys">
            {row.keys.map((key) => (
              <button
                key={key.id}
                type="button"
                className={`symbol-key${key.wide ? ' symbol-key-wide' : ''}`}
                aria-label={key.ariaLabel}
                title={key.ariaLabel}
                onMouseDown={(e) => {
                  // Keep textarea focus / selection; don't steal focus on mousedown.
                  e.preventDefault();
                }}
                onClick={() =>
                  onAction({
                    kind: 'insert',
                    spec: { before: key.before, after: key.after },
                  })
                }
              >
                {key.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="symbol-pad-row" role="group" aria-label="Edit">
        <div className="symbol-pad-row-label">Edit</div>
        <div className="symbol-pad-keys">
          <button
            type="button"
            className="symbol-key symbol-key-wide"
            aria-label="Backspace"
            title="Backspace"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onAction({ kind: 'backspace' })}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
