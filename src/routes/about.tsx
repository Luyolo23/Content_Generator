import { createFileRoute } from "@tanstack/react-router";
import { Github, ShieldCheck } from "lucide-react";

import { CodeBlock } from "@/components/code-block";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { MODEL } from "@/lib/prompts";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How Concept Coach works" },
      {
        name: "description",
        content:
          "The architecture behind Concept Coach: React frontend, server functions, Groq API, JSON validation, caching, rate limiting and responsible-AI notes.",
      },
      { property: "og:title", content: "How Concept Coach works" },
      {
        property: "og:description",
        content: "Architecture, tech stack and design decisions behind Concept Coach.",
      },
    ],
  }),
  component: AboutPage,
});

const ARCHITECTURE = `  Browser (React + TanStack Router)
        |
        |  typed RPC call  { topic, level, analogyStyle, includeCode, language }
        v
  Server function  (runs on the edge, holds GROQ_API_KEY)
        |-- rate limit per IP        (12 requests / minute)
        |-- 24h in-memory pack cache (keyed by topic + settings)
        |-- 30s request timeout
        v
  Groq  POST /openai/v1/chat/completions
        model: ${MODEL}
        response_format: { type: "json_object" }
        |
        v
  Parse -> strip fences -> validate shape -> repair once if invalid
        |
        v
  Shuffle quiz options -> cache -> return typed pack to the browser
        |
        v
  localStorage: session history, streak, quiz scores (never leaves the device)`;

const STACK = [
  ["Frontend", "React 19, TanStack Router, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons"],
  ["Backend", "TanStack Start server functions running at the edge"],
  ["AI", `Groq OpenAI-compatible chat completions, model ${MODEL}`],
  ["Validation", "Zod on both the request input and the AI's JSON output"],
  ["Storage", "Browser localStorage for history and stats; in-memory server cache for packs"],
];

const DECISIONS = [
  [
    "The API key lives server-side",
    "The Groq key is stored as an encrypted secret and read only inside the server function handler. It is never sent to the browser, so it can't be scraped from the bundle or network tab.",
  ],
  [
    "JSON validation with a single repair retry",
    "The model is asked for JSON only, but output is still fenced or malformed occasionally. Responses are de-fenced, parsed safely and validated against a schema. If that fails, one repair pass fixes the structure — never an endless retry loop.",
  ],
  [
    "Caching by request signature",
    "Packs are cached for 24 hours against a key built from the lowercased topic plus every setting. Repeat requests return instantly and cost nothing, and the UI says when a pack came from cache.",
  ],
  [
    "Rate limiting and timeouts",
    "Each visitor gets 12 generations a minute, and every upstream call aborts after 30 seconds. A 429 from Groq is translated into a plain 'try again in a minute' message rather than a stack trace.",
  ],
  [
    "Server-side answer shuffling",
    "Language models like putting the correct option first. Options are shuffled and correctIndex remapped on the server, so answer position never leaks.",
  ],
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="card-surface bg-hero-glow p-7 sm:p-9">
          <h1 className="text-3xl font-semibold sm:text-4xl">How it works</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Concept Coach is a thin, fast frontend in front of one well-constrained AI call. Here's the whole
            pipeline, end to end.
          </p>
        </div>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Architecture</h2>
          <div className="mt-4">
            <CodeBlock code={ARCHITECTURE} label="request flow" />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Tech stack</h2>
          <dl className="mt-4 space-y-3">
            {STACK.map(([name, detail]) => (
              <div key={name} className="card-surface flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
                <dt className="w-32 shrink-0 font-semibold">{name}</dt>
                <dd className="text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Design decisions</h2>
          <div className="mt-4 space-y-4">
            {DECISIONS.map(([title, body]) => (
              <article key={title} className="card-surface p-5 sm:p-6">
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="card-surface border-warm/50 p-6">
            <Badge className="bg-warm text-warm-foreground">
              <ShieldCheck className="mr-1 size-3" aria-hidden /> Responsible AI
            </Badge>
            <h2 className="mt-3 text-xl font-semibold">AI can be wrong</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Every pack is generated on the spot by a language model. The prompts push hard for accuracy and
              for admitting uncertainty, but mistakes still happen — especially with numbers, dates, niche
              topics and the experimental Afrikaans and isiZulu modes. Treat Concept Coach as a fast first
              explanation, and verify anything you'll rely on for work, study or money decisions.
            </p>
          </div>
        </section>

        <section className="mt-10 pb-6">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            className="card-surface flex items-center gap-3 p-5 transition-shadow hover:shadow-lift"
          >
            <Github className="size-5" aria-hidden />
            <span>
              <span className="block font-semibold">Source code</span>
              <span className="block text-sm text-muted-foreground">
                Repository link placeholder — swap this for your GitHub URL.
              </span>
            </span>
          </a>
        </section>
      </main>
    </div>
  );
}
