import type { Difficulty, QuestionKind } from "@/content/schema";

export type StudyMode = "revision" | "deep";
export type ThemeMode = "light" | "dark";

export interface QuestionResult {
  correct: boolean;
  attempts: number;
  lastAttempt: string;
  nextReview: string;
}

export interface ProgressState {
  version: 1;
  mode: StudyMode;
  theme: ThemeMode;
  topicModes: Record<string, StudyMode>;
  completedRevision: string[];
  completedDeep: string[];
  ladder: Record<string, number>;
  questionResults: Record<string, QuestionResult>;
  bookmarks: string[];
  notes: Record<string, string>;
  activeDates: string[];
}

export const STORAGE_KEY = "mathforml.progress.v1";

export function defaultProgress(): ProgressState {
  return {
    version: 1,
    mode: "revision",
    theme: "light",
    topicModes: {},
    completedRevision: [],
    completedDeep: [],
    ladder: {},
    questionResults: {},
    bookmarks: [],
    notes: {},
    activeDates: [],
  };
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return { ...defaultProgress(), ...parsed, version: 1 };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: ProgressState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be disabled or full; the in-memory study session still works.
  }
}

function dayStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function recordActivity(progress: ProgressState): ProgressState {
  const today = dayStamp();
  return { ...progress, activeDates: [...new Set([...progress.activeDates, today])].sort() };
}

export function currentStreak(dates: string[]) {
  if (!dates.length) return 0;
  const active = new Set(dates);
  const cursor = new Date();
  let count = 0;
  while (active.has(dayStamp(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function recordQuestion(
  progress: ProgressState,
  questionId: string,
  topicId: string,
  correct: boolean,
  kind: QuestionKind,
  difficulty: Difficulty,
): ProgressState {
  const now = new Date();
  const previous = progress.questionResults[questionId];
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + (correct ? 4 : 1));
  const previousLevel = progress.ladder[topicId] ?? 0;
  const earnedLevel = correct
    ? kind === "code" && previousLevel >= 3
      ? 4
      : difficulty === "Hard"
        ? 3
        : difficulty === "Medium"
          ? 2
          : 1
    : previousLevel;
  return recordActivity({
    ...progress,
    ladder: { ...progress.ladder, [topicId]: Math.max(previousLevel, earnedLevel) },
    questionResults: {
      ...progress.questionResults,
      [questionId]: {
        correct,
        attempts: (previous?.attempts ?? 0) + 1,
        lastAttempt: now.toISOString(),
        nextReview: nextReview.toISOString(),
      },
    },
  });
}

export function isDue(result: QuestionResult, now = Date.now()) {
  return new Date(result.nextReview).getTime() <= now;
}
