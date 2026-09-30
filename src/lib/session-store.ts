/**
 * Browser-only persistence: session history, stats and theme.
 * Every read is guarded so it is safe to import during SSR.
 */

import type { LearningPack, PackRequest } from "./concept-types";

const HISTORY_KEY = "concept-coach:history";
const STATS_KEY = "concept-coach:stats";
export const THEME_KEY = "concept-coach:theme";

export interface HistoryEntry {
  id: string;
  topic: string;
  createdAt: number;
  request: PackRequest;
  pack: LearningPack;
}

export interface QuizResult {
  topic: string;
  score: number;
  total: number;
  at: number;
}

export interface Stats {
  topicsLearned: number;
  streakDays: number;
  lastStudyDay: string | null;
  quizResults: QuizResult[];
}

const EMPTY_STATS: Stats = { topicsLearned: 0, streakDays: 0, lastStudyDay: null, quizResults: [] };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — history is a nicety, not critical */
  }
}

export function loadHistory(): HistoryEntry[] {
  return read<HistoryEntry[]>(HISTORY_KEY, []);
}

export function saveHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const existing = loadHistory().filter(
    (e) => e.topic.toLowerCase() !== entry.topic.toLowerCase() || e.request.level !== entry.request.level,
  );
  const next = [entry, ...existing].slice(0, 50);
  write(HISTORY_KEY, next);
  return next;
}

export function deleteHistoryEntry(id: string): HistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  write(HISTORY_KEY, next);
  return next;
}

export function loadStats(): Stats {
  return read<Stats>(STATS_KEY, EMPTY_STATS);
}

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Counts a completed topic and advances the daily streak. */
export function recordTopicStudied(): Stats {
  const stats = loadStats();
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));

  let streakDays = stats.streakDays;
  if (stats.lastStudyDay !== today) {
    streakDays = stats.lastStudyDay === yesterday ? stats.streakDays + 1 : 1;
  }
  if (streakDays === 0) streakDays = 1;

  const next: Stats = {
    ...stats,
    topicsLearned: stats.topicsLearned + 1,
    streakDays,
    lastStudyDay: today,
  };
  write(STATS_KEY, next);
  return next;
}

export function recordQuizResult(result: QuizResult): Stats {
  const stats = loadStats();
  const next: Stats = { ...stats, quizResults: [result, ...stats.quizResults].slice(0, 20) };
  write(STATS_KEY, next);
  return next;
}
