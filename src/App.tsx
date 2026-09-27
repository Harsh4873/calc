import { useCallback, useMemo, useRef, useState } from 'react';
import Math from './components/Math';
import { EXAMPLES } from './examples';
import { solve } from './solver';
import type { SolveResult } from './solver';
import { useHistory } from './useHistory';
import { useTheme } from './useTheme';

const TYPE_LABELS: Record<string, string> = {
  arithmetic: 'Arithmetic',
  evaluate: 'Evaluate',
  simplify: 'Simplify',
  expand: 'Expand',
  factor: 'Factor',
  solve: 'Equation',
  derivative: 'Derivative',
  integral: 'Integral',
  unknown: 'Unknown',
};

const THEME_LABEL: Record<string, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SolveResult | null>(null);
  const { entries, add, clear } = useHistory();
  const { theme, cycle } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runSolve = useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!value) {
        setResult(null);
        return;
      }
      const res = solve(value);
      setResult(res);
      if (!res.error && res.answerText) {
        add(value, res.answerText);
      }
    },
    [add],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSolve(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      runSolve(input);
    }
  };

  const useExample = (value: string) => {
    setInput(value);
    runSolve(value);
    textareaRef.current?.focus();
  };

  const typeLabel = useMemo(
    () => (result ? TYPE_LABELS[result.type] ?? result.type : ''),
    [result],
  );

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="34" height="34">
              <rect width="64" height="64" rx="16" fill="var(--accent)" />
              <path d="M18 26h9M22.5 21.5v9" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              <path d="M35 24l8 8M43 24l-8 8" stroke="#c7f9ec" strokeWidth="3" strokeLinecap="round" />
              <path d="M18 40h28" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
          <div className="brand-text">
            <h1>Calc</h1>
            <a href="https://harsh.bet/calc/" className="brand-url">
              harsh.bet/calc
            </a>
          </div>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={cycle}
          aria-label={`Theme: ${THEME_LABEL[theme]}. Click to change.`}
        >
          {THEME_LABEL[theme]}
        </button>
      </header>

      <main className="layout">
        <section className="solver">
          <form onSubmit={onSubmit} className="input-card">
            <label htmlFor="problem" className="input-label">
              Enter a math problem
            </label>
            <textarea
              id="problem"
              ref={textareaRef}
              className="problem-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g. solve x^2 - 5x + 6 = 0"
              rows={3}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <div className="input-row">
              <span className="hint">Press Enter to solve · Shift+Enter for a new line</span>
              <button type="submit" className="solve-btn">
                Solve
              </button>
            </div>
          </form>

          <div className="examples" role="group" aria-label="Example problems">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.input}
                type="button"
                className="chip"
                onClick={() => useExample(ex.input)}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {result && (
            <div className="result-panel" aria-live="polite">
              {result.error ? (
                <div className="error" role="alert">
                  <strong>Can’t solve that yet.</strong>
                  <p>{result.error}</p>
                </div>
              ) : (
                <>
                  <div className="result-head">
                    <span className="badge">{typeLabel}</span>
                  </div>
                  <div className="answer">
                    <div className="answer-label">Answer</div>
                    <div className="answer-math">
                      <Math latex={result.answerLatex} display ariaLabel={result.answerText} />
                    </div>
                    <div className="answer-text">{result.answerText}</div>
                  </div>
                  {result.steps.length > 0 && (
                    <ol className="steps">
                      {result.steps.map((step, i) => (
                        <li key={i} className="step">
                          <div className="step-title">{step.title}</div>
                          {step.latex && (
                            <div className="step-math">
                              <Math latex={step.latex} display />
                            </div>
                          )}
                          {step.detail && <div className="step-detail">{step.detail}</div>}
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        <aside className="history" aria-label="History">
          <div className="history-head">
            <h2>History</h2>
            {entries.length > 0 && (
              <button type="button" className="link-btn" onClick={clear}>
                Clear
              </button>
            )}
          </div>
          {entries.length === 0 ? (
            <p className="history-empty">
              Solved problems appear here. Stored only on this device.
            </p>
          ) : (
            <ul className="history-list">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className="history-item"
                    onClick={() => useExample(entry.input)}
                  >
                    <span className="history-input">{entry.input}</span>
                    <span className="history-answer">= {entry.answerText}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>

      <footer className="footer">
        <p>
          Solved locally in your browser — nothing leaves this device. Powered by math.js and
          nerdamer with KaTeX rendering.
        </p>
      </footer>
    </div>
  );
}
