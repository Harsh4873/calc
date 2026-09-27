import { useCallback, useEffect, useState } from 'react';

export interface HistoryEntry {
  id: string;
  input: string;
  answerText: string;
  at: number;
}

const KEY = 'calc.history.v1';
const MAX = 20;

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }
}

let counter = 0;
function makeId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

/** Private, on-device history stored in localStorage only. */
export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(load());
  }, []);

  const add = useCallback((input: string, answerText: string) => {
    setEntries((prev) => {
      const trimmed = input.trim();
      const next = [
        { id: makeId(), input: trimmed, answerText, at: Date.now() },
        ...prev.filter((e) => e.input !== trimmed),
      ].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    save([]);
  }, []);

  return { entries, add, clear };
}
