import { parse as mjsParse } from 'mathjs';
import nerdamer from '../solver/cas';
import { normalizeExpr, parseProblem } from '../solver/parse';

function toTeX(expr: string): string | null {
  try {
    return nerdamer(expr).toTeX();
  } catch {
    // fall through
  }
  try {
    return mjsParse(expr).toTex();
  } catch {
    return null;
  }
}

/**
 * Convert loose user input into a LaTeX string for live preview.
 * Returns null when input is empty, incomplete, or invalid — the caller
 * should show nothing or a muted placeholder.
 * Never throws.
 */
export function toPreviewLatex(input: string): string | null {
  if (input == null) return null;
  const raw = (input as string).trim();
  if (!raw) return null;

  try {
    const parsed = parseProblem(raw);
    let expr = (parsed.expr ?? '').trim();
    if (!expr) return null;

    // Equations: render each side separately joined by "="
    if (expr.includes('=')) {
      const sides = expr.split('=');
      const texSides: string[] = [];
      for (const side of sides) {
        const t = side.trim();
        if (!t) return null;
        const norm = normalizeExpr(t);
        if (!norm) return null;
        if (/[+\-*/^]$/.test(norm)) return null;
        const open = (norm.match(/\(/g) ?? []).length;
        const close = (norm.match(/\)/g) ?? []).length;
        if (open !== close) return null;
        if (!/[a-zA-Z0-9)]/.test(norm)) return null;
        const tex = toTeX(norm);
        if (!tex || !tex.trim()) return null;
        texSides.push(tex);
      }
      if (texSides.length === 0) return null;
      return texSides.join(' = ');
    }

    const norm = normalizeExpr(expr);
    if (!norm) return null;
    if (/[+\-*/^]$/.test(norm)) return null;
    const open = (norm.match(/\(/g) ?? []).length;
    const close = (norm.match(/\)/g) ?? []).length;
    if (open !== close) return null;
    if (!/[a-zA-Z0-9)]/.test(norm)) return null;

    const tex = toTeX(norm);
    if (!tex || !tex.trim()) return null;
    return tex;
  } catch {
    return null;
  }
}
