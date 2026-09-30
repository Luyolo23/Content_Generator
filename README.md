# Concept Coach

An AI-powered study and tech explainer. Enter any concept, pick your level and analogy style, and get a full
learning pack: TL;DR, step-by-step explanation, analogy, optional code example, misconceptions, takeaways, a
5-question quiz, flashcards and a context-aware follow-up chat.

## Features

- Topic input with example chips, level (ELI5 → Advanced), analogy style (including a South African context
  mode), code toggle with Python / Java / JavaScript, and English plus experimental Afrikaans and isiZulu
- Structured result: TL;DR, explanation steps, analogy, syntax-highlighted code with copy, 3 misconceptions,
  key takeaways
- Interactive quiz, one question at a time, instant green/red feedback with per-answer explanations, final
  score screen and a "retry missed questions" option
- Flashcard deck with a flip animation and next/previous navigation
- "Go deeper" chat with maintained conversation context and suggested follow-up chips
- "Make it simpler" / "Make it harder" one-click regeneration
- Export the pack as Markdown (copy or download)
- Session history, search and delete, plus a study-streak / topics-learned / quiz-average card — all stored
  in localStorage on your device
- Dark and light mode, mobile-first responsive layout, keyboard-navigable with aria labels
- Friendly error states for rate limits, network failures and malformed AI responses, each with a retry

## Setup

```bash
bun install
bun run dev
```

### Environment variables

| Name | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq API key. Stored as an encrypted secret and read only inside server function handlers. |

The key is never exposed to the browser and is not kept in a committed `.env` file.

## Architecture

```
Browser (React 19 + TanStack Router)
  -> server function (edge runtime, holds GROQ_API_KEY)
       - per-IP rate limit (12 req/min)
       - 24h in-memory cache keyed by topic + settings
       - 30s timeout
  -> Groq POST /openai/v1/chat/completions  (response_format: json_object)
  -> strip fences, parse, validate with Zod, one repair retry if invalid
  -> shuffle quiz options server-side, cache, return typed pack
Browser localStorage: history, streak, quiz score history
```

Key files:

- `src/lib/prompts.ts` — every system prompt plus the model constant; `/prompt-lab` renders these same objects
- `src/lib/concept.functions.ts` — `generatePack` and `followUpChat` server functions
- `src/lib/concept-types.ts` — shared types and option lists
- `src/lib/session-store.ts` — localStorage history and stats
- `src/components/` — topic form, pack view, quiz, flashcards, chat, history sidebar
- `src/routes/` — `/` (learn), `/prompt-lab`, `/about`

## Pages

- `/` — the learning experience
- `/prompt-lab` — every prompt with role / context / constraints / output format, examples and version history
- `/about` — architecture, tech stack, design decisions and a responsible-AI note

## Future improvements

- Persist history to a database so it follows the learner across devices
- Stream the explanation as it generates instead of waiting for the full JSON
- Spaced-repetition scheduling for flashcards
- Shareable public links for a generated pack
- Human-reviewed quality checks for the Afrikaans and isiZulu modes
