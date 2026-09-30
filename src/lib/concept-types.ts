/**
 * Shared, client-safe types and option lists for Concept Coach.
 * Imported by both the UI and the server functions.
 */

export const LEVELS = ["ELI5", "Beginner", "Intermediate", "Advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const ANALOGY_STYLES = [
  "Everyday life",
  "Sports",
  "Cooking",
  "South African context",
  "Gaming",
] as const;
export type AnalogyStyle = (typeof ANALOGY_STYLES)[number];

export const LANGUAGES = ["English", "Afrikaans", "isiZulu"] as const;
export type Language = (typeof LANGUAGES)[number];

/** Languages where AI output quality is not guaranteed. */
export const EXPERIMENTAL_LANGUAGES: Language[] = ["Afrikaans", "isiZulu"];

export const CODE_LANGUAGES = ["Python", "Java", "JavaScript"] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const MAX_TOPIC_LENGTH = 200;

export interface PackRequest {
  topic: string;
  level: Level;
  analogyStyle: AnalogyStyle;
  includeCode: boolean;
  language: Language;
  codeLanguage: CodeLanguage;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface CodeExample {
  language: string;
  snippet: string;
  explanation: string;
}

export interface LearningPack {
  tldr: string;
  explanation: string[];
  analogy: string;
  code: CodeExample | null;
  misconceptions: string[];
  takeaways: string[];
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  followUps: string[];
}

export interface PackResponse {
  pack: LearningPack;
  cached: boolean;
  request: PackRequest;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Stable, typed error codes returned by the backend. */
export type ApiErrorCode =
  | "invalid_input"
  | "rate_limited"
  | "upstream_rate_limited"
  | "timeout"
  | "invalid_ai_response"
  | "missing_key"
  | "upstream_error";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export function isApiError(value: unknown): value is { error: ApiError } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "object"
  );
}

/** Move a level one step easier or harder, clamped at the ends. */
export function shiftLevel(level: Level, direction: -1 | 1): Level {
  const index = LEVELS.indexOf(level);
  const next = Math.min(LEVELS.length - 1, Math.max(0, index + direction));
  return LEVELS[next] as Level;
}

export const EXAMPLE_TOPICS = [
  "Docker containers",
  "Recursion",
  "REST vs GraphQL",
  "Photosynthesis",
  "Compound interest",
] as const;
