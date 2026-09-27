import { useEffect, useState } from 'react';
import { toPreviewLatex } from '../lib/toPreviewLatex';
import Math from './Math';

interface LivePreviewProps {
  input: string;
  debounceMs?: number;
}

export default function LivePreview({ input, debounceMs = 200 }: LivePreviewProps) {
  const [latex, setLatex] = useState<string | null>(() => {
    try {
      return toPreviewLatex(input);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        setLatex(toPreviewLatex(input));
      } catch {
        setLatex(null);
      }
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [input, debounceMs]);

  const trimmed = input.trim();
  // Keep region in DOM for aria-live even when empty; hide visually when empty.
  if (!trimmed) {
    return (
      <div
        className="live-preview live-preview-empty"
        aria-live="polite"
        aria-atomic="true"
        hidden
      />
    );
  }

  const hasLatex = latex != null && latex.trim().length > 0;

  return (
    <div className="live-preview" aria-live="polite" aria-atomic="true">
      {hasLatex ? (
        <div className="live-preview-math">
          <Math latex={latex as string} />
        </div>
      ) : (
        <span className="live-preview-muted" aria-hidden="true">
          …
        </span>
      )}
    </div>
  );
}
