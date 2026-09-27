import katex from 'katex';
import { useMemo } from 'react';

interface MathProps {
  latex: string;
  display?: boolean;
  ariaLabel?: string;
}

/** Render a LaTeX string with KaTeX, falling back to raw text on error. */
export default function Math({ latex, display = false, ariaLabel }: MathProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        output: 'html',
      });
    } catch {
      return null;
    }
  }, [latex, display]);

  if (html === null) {
    return <code className="math-fallback">{latex}</code>;
  }

  return (
    <span
      className={display ? 'math math-display' : 'math math-inline'}
      role="math"
      aria-label={ariaLabel ?? latex}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
