/** Spec for inserting (and optionally wrapping) text at a caret/selection. */
export interface InsertSpec {
  /** Text placed before the current selection (or at the caret). */
  before: string;
  /** Text placed after the selection. Caret lands between before+selection and after. */
  after?: string;
}

export interface InsertResult {
  value: string;
  /** New caret position (selection collapsed). */
  caret: number;
}

/**
 * Insert `before` + selection + `after` into `value` at [start, end).
 * When there is no selection, caret ends up between `before` and `after`.
 * When there is a selection, it is wrapped and the caret sits just after it
 * (before `after`), matching common math-pad wrap behaviour.
 */
export function applyInsert(
  value: string,
  start: number,
  end: number,
  spec: InsertSpec,
): InsertResult {
  const s = Math.max(0, Math.min(start, value.length));
  const e = Math.max(s, Math.min(end, value.length));
  const prefix = value.slice(0, s);
  const selected = value.slice(s, e);
  const suffix = value.slice(e);
  const before = spec.before;
  const after = spec.after ?? '';
  const next = prefix + before + selected + after + suffix;
  const caret = prefix.length + before.length + selected.length;
  return { value: next, caret };
}

/** Delete one code-unit before the caret, or the current selection. */
export function applyBackspace(
  value: string,
  start: number,
  end: number,
): InsertResult {
  const s = Math.max(0, Math.min(start, value.length));
  const e = Math.max(s, Math.min(end, value.length));
  if (s !== e) {
    return { value: value.slice(0, s) + value.slice(e), caret: s };
  }
  if (s === 0) return { value, caret: 0 };
  return { value: value.slice(0, s - 1) + value.slice(s), caret: s - 1 };
}
