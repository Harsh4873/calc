import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LivePreview from './components/LivePreview';
import Math from './components/Math';
import SymbolPad, { type PadAction } from './components/SymbolPad';
import { EXAMPLES } from './examples';
import { applyBackspace, applyInsert } from './lib/insertAtCaret';
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

const PAD_KEY = 'calc.symbolPad.open.v1';
const PREVIEW_KEY = 'calc.preview.open.v1';

function loadPadOpen(): boolean {
  try {
    return localStorage.getItem(PAD_KEY) === '1';
  } catch {
    return false;
  }
}

function savePadOpen(open: boolean): void {
  try {
    localStorage.setItem(PAD_KEY, open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function loadPreviewOpen(): boolean {
  try {
    const v = localStorage.getItem(PREVIEW_KEY);
    // default ON: missing => true, '0' => false
    if (v === null) return true;
    return v !== '0';
  } catch {
    return true;
  }
}

function savePreviewOpen(open: boolean): void {
  try {
    localStorage.setItem(PREVIEW_KEY, open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SolveResult | null>(null);
  const [padOpen, setPadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const { entries, add, clear } = useHistory();
  const { theme, cycle } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track selection so pad inserts work even if focus briefly blurs.
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  useEffect(() => {
    setPadOpen(loadPadOpen());
    setPreviewOpen(loadPreviewOpen());
  }, []);

  const setPadOpenPersist = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setPadOpen((prev) => {
      const next = typeof open === 'function' ? open(prev) : open;
      savePadOpen(next);
      return next;
    });
  }, []);

  const setPreviewOpenPersist = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setPreviewOpen((prev) => {
      const next = typeof open === 'function' ? (open as (p: boolean) => boolean)(prev) : open;
      savePreviewOpen(next);
      return next;
    });
  }, []);

  const rememberSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    selectionRef.current = {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    };
  }, []);

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

  const applyToInput = useCallback((nextValue: string, caret: number) => {
    setInput(nextValue);
    selectionRef.current = { start: caret, end: caret };
    // Restore focus + caret after React commits the value.
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }, []);

  const onPadAction = useCallback(
    (action: PadAction) => {
      const el = textareaRef.current;
      let start = selectionRef.current.start;
      let end = selectionRef.current.end;
      // Prefer live selection when the textarea still has focus.
      if (el && document.activeElement === el) {
        start = el.selectionStart ?? start;
        end = el.selectionEnd ?? end;
      }
      const value = el?.value ?? input;
      const result =
        action.kind === 'backspace'
          ? applyBackspace(value, start, end)
          : applyInsert(value, start, end, action.spec);
      applyToInput(result.value, result.caret);
    },
    [applyToInput, input],
  );

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
            <div className="input-label-row">
              <label htmlFor="problem" className="input-label">
                Enter a math problem
              </label>
              <div className="input-toggles">
                <button
                  type="button"
                  className={`preview-toggle${previewOpen ? ' is-open' : ''}`}
                  onClick={() => setPreviewOpenPersist((o) => !o)}
                  aria-pressed={previewOpen}
                  aria-expanded={previewOpen}
                  aria-controls="live-preview"
                  title={previewOpen ? 'Hide preview' : 'Show preview'}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className={`symbols-toggle${padOpen ? ' is-open' : ''}`}
                  onClick={() => setPadOpenPersist((o) => !o)}
                  aria-pressed={padOpen}
                  aria-expanded={padOpen}
                  aria-controls="symbol-pad"
                  title={padOpen ? 'Hide symbol pad' : 'Show symbol pad'}
                >
                  <span className="symbols-toggle-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="10" width="18" height="10" rx="2" />
                      <path d="M7 14h.01M12 14h.01M17 14h.01M7 17h.01M12 17h.01M17 17h.01" />
                      <path d="M8 7l2-3 2 3 2-3 2 3" />
                    </svg>
                  </span>
                  Symbols
                </button>
              </div>
            </div>
            <textarea
              id="problem"
              ref={textareaRef}
              className="problem-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onSelect={rememberSelection}
              onKeyUp={rememberSelection}
              onClick={rememberSelection}
              onBlur={rememberSelection}
              placeholder="e.g. solve x^2 - 5x + 6 = 0"
              rows={3}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            {previewOpen && (
              <div id="live-preview">
                <LivePreview input={input} />
              </div>
            )}
            <div id="symbol-pad">
              <SymbolPad
                open={padOpen}
                onClose={() => setPadOpenPersist(false)}
                onAction={onPadAction}
              />
            </div>
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
