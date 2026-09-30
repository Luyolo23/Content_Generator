/**
 * Server functions backing Concept Coach.
 *
 * Everything that touches the Groq API lives here: the API key is read inside
 * the handlers, so it never reaches the browser bundle.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import {
  ANALOGY_STYLES,
  CODE_LANGUAGES,
  LANGUAGES,
  LEVELS,
  MAX_TOPIC_LENGTH,
  type ApiError,
  type ChatMessage,
  type LearningPack,
  type PackRequest,
  type PackResponse,
} from "./concept-types";
import {
  GROQ_ENDPOINT,
  MODEL,
  PACK_PROMPT,
  REPAIR_PROMPT,
  buildFollowUpSystem,
  buildPackUserMessage,
  renderPrompt,
} from "./prompts";

/* ------------------------------------------------------------------ input */

const packInput = z.object({
  topic: z.string().trim().min(1, "Enter a topic").max(MAX_TOPIC_LENGTH),
  level: z.enum(LEVELS),
  analogyStyle: z.enum(ANALOGY_STYLES),
  includeCode: z.boolean(),
  language: z.enum(LANGUAGES),
  codeLanguage: z.enum(CODE_LANGUAGES),
});

const chatInput = z.object({
  topic: z.string().trim().min(1).max(MAX_TOPIC_LENGTH),
  level: z.enum(LEVELS),
  language: z.enum(LANGUAGES),
  question: z.string().trim().min(1).max(500),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(40),
});

/** Strips control characters and prompt-injection style fences from user text. */
function sanitise(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/```/g, "").trim();
}

/* ------------------------------------------------------- rate limit + cache */

const REQUEST_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 30_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const packCache = new Map<string, { pack: LearningPack; expiresAt: number }>();

function clientKey(): string {
  return (
    getRequestHeader("cf-connecting-ip") ??
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  );
}

function checkRateLimit(): ApiError | null {
  const key = clientKey();
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + REQUEST_WINDOW_MS });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
    return { code: "rate_limited", message: "You're going a bit fast. Try again in a minute." };
  }
  return null;
}

function cacheKey(req: PackRequest): string {
  return [
    req.topic.toLowerCase().trim(),
    req.level,
    req.analogyStyle,
    req.includeCode ? "code" : "nocode",
    req.codeLanguage,
    req.language,
  ].join("|");
}

/* ------------------------------------------------------------- groq client */

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

class GroqError extends Error {
  constructor(public apiError: ApiError) {
    super(apiError.message);
  }
}

async function callGroq(opts: {
  apiKey: string;
  messages: GroqMessage[];
  temperature: number;
  maxTokens: number;
  json?: boolean;
}): Promise<string> {
  let response: Response;
  try {
    response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: opts.messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new GroqError({
      code: timedOut ? "timeout" : "upstream_error",
      message: timedOut
        ? "That took too long to generate. Please try again."
        : "Couldn't reach the AI service. Check your connection and retry.",
    });
  }

  if (response.status === 429) {
    throw new GroqError({
      code: "upstream_rate_limited",
      message: "Too many requests, please try again in a minute.",
    });
  }

  if (!response.ok) {
    console.error("Groq error", response.status, await response.text().catch(() => ""));
    throw new GroqError({
      code: "upstream_error",
      message: "The AI service had a problem generating this. Please retry.",
    });
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new GroqError({ code: "invalid_ai_response", message: "The AI returned an empty answer." });
  }
  return content;
}

/* ---------------------------------------------------------- pack validation */

/** Removes ```json fences the model sometimes adds despite instructions. */
function stripFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const body = fenced?.[1] ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

const packSchema = z.object({
  tldr: z.string().min(1),
  explanation: z.array(z.string().min(1)).min(2),
  analogy: z.string().min(1),
  code: z
    .object({
      language: z.string().min(1),
      snippet: z.string().min(1),
      explanation: z.string().default(""),
    })
    .nullable()
    .optional(),
  misconceptions: z.array(z.string().min(1)).min(1),
  takeaways: z.array(z.string().min(1)).min(2),
  quiz: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).min(2),
        correctIndex: z.number().int().min(0),
        explanation: z.string().default(""),
      }),
    )
    .min(1),
  flashcards: z.array(z.object({ front: z.string().min(1), back: z.string().min(1) })).min(2),
  followUps: z.array(z.string().min(1)).min(1),
});

/** Shuffles each question's options server-side so the answer position is unpredictable. */
function shuffleQuiz(pack: LearningPack): LearningPack {
  return {
    ...pack,
    quiz: pack.quiz.map((q) => {
      const correct = q.options[q.correctIndex] ?? q.options[0];
      const shuffled = [...q.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j] as string, shuffled[i] as string];
      }
      const nextIndex = shuffled.indexOf(correct as string);
      return { ...q, options: shuffled, correctIndex: nextIndex < 0 ? 0 : nextIndex };
    }),
  };
}

function parsePack(raw: string): LearningPack | null {
  try {
    const parsed = packSchema.parse(JSON.parse(stripFences(raw)));
    const quiz = parsed.quiz
      .slice(0, 5)
      .map((q) => ({ ...q, options: q.options.slice(0, 4) }))
      .filter((q) => q.correctIndex < q.options.length);
    if (quiz.length === 0) return null;
    return {
      tldr: parsed.tldr,
      explanation: parsed.explanation,
      analogy: parsed.analogy,
      code: parsed.code ?? null,
      misconceptions: parsed.misconceptions.slice(0, 3),
      takeaways: parsed.takeaways.slice(0, 5),
      quiz,
      flashcards: parsed.flashcards.slice(0, 8),
      followUps: parsed.followUps.slice(0, 3),
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------ server fns */

export const generatePack = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => packInput.parse(input))
  .handler(async ({ data }): Promise<PackResponse | { error: ApiError }> => {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) {
      return { error: { code: "missing_key", message: "The AI service isn't configured yet." } };
    }

    const limited = checkRateLimit();
    if (limited) return { error: limited };

    const request: PackRequest = { ...data, topic: sanitise(data.topic) };
    if (!request.topic) {
      return { error: { code: "invalid_input", message: "Please enter a topic." } };
    }

    const key = cacheKey(request);
    const hit = packCache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return { pack: hit.pack, cached: true, request };
    }

    const system = renderPrompt(PACK_PROMPT);
    const user = buildPackUserMessage(request);

    try {
      const first = await callGroq({
        apiKey,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.6,
        maxTokens: 4000,
        json: true,
      });

      let pack = parsePack(first);

      // One repair attempt only — never loop on the model.
      if (!pack) {
        const repaired = await callGroq({
          apiKey,
          messages: [
            { role: "system", content: renderPrompt(REPAIR_PROMPT) },
            { role: "user", content: `${user}\n\nPrevious invalid response:\n${first.slice(0, 8000)}` },
          ],
          temperature: 0.2,
          maxTokens: 4000,
          json: true,
        });
        pack = parsePack(repaired);
      }

      if (!pack) {
        return {
          error: {
            code: "invalid_ai_response",
            message: "The AI response came back malformed. Please try again.",
          },
        };
      }

      const finalPack = shuffleQuiz(pack);
      packCache.set(key, { pack: finalPack, expiresAt: Date.now() + CACHE_TTL_MS });
      return { pack: finalPack, cached: false, request };
    } catch (error) {
      if (error instanceof GroqError) return { error: error.apiError };
      console.error("generate-pack failed", error);
      return { error: { code: "upstream_error", message: "Something went wrong. Please retry." } };
    }
  });

export const followUpChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => chatInput.parse(input))
  .handler(async ({ data }): Promise<{ reply: string } | { error: ApiError }> => {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) {
      return { error: { code: "missing_key", message: "The AI service isn't configured yet." } };
    }

    const limited = checkRateLimit();
    if (limited) return { error: limited };

    // Keep only the last 10 messages of history.
    const history: ChatMessage[] = data.history.slice(-10);

    try {
      const reply = await callGroq({
        apiKey,
        messages: [
          { role: "system", content: buildFollowUpSystem(sanitise(data.topic), data.level, data.language) },
          ...history.map((m) => ({ role: m.role, content: sanitise(m.content) }) as GroqMessage),
          { role: "user", content: sanitise(data.question) },
        ],
        temperature: 0.5,
        maxTokens: 800,
      });
      return { reply: reply.trim() };
    } catch (error) {
      if (error instanceof GroqError) return { error: error.apiError };
      console.error("follow-up-chat failed", error);
      return { error: { code: "upstream_error", message: "Something went wrong. Please retry." } };
    }
  });
