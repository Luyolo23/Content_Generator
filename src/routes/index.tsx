import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { HistorySidebar } from "@/components/history-sidebar";
import { PackSkeleton } from "@/components/pack-skeleton";
import { PackView } from "@/components/pack-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SmartImage } from "@/components/smart-image";
import { IMAGES } from "@/lib/images";
import { TopicForm } from "@/components/topic-form";
import { Button } from "@/components/ui/button";
import { generatePack } from "@/lib/concept.functions";
import {
  isApiError,
  type ApiError,
  type LearningPack,
  type PackRequest,
} from "@/lib/concept-types";
import {
  deleteHistoryEntry,
  loadHistory,
  loadStats,
  recordQuizResult,
  recordTopicStudied,
  saveHistoryEntry,
  type HistoryEntry,
  type Stats,
} from "@/lib/session-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Concept Coach — Understand any concept, your way" },
      {
        name: "description",
        content:
          "Enter any topic and get an AI learning pack: plain-language explanation, analogy, code, quiz, flashcards and a follow-up chat.",
      },
      { property: "og:title", content: "Concept Coach — Understand any concept, your way" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content:
          "AI study packs with explanations, analogies, quizzes and flashcards, tuned to your level and language.",
      },
    ],
  }),
  component: HomePage,
});

const DEFAULT_REQUEST: PackRequest = {
  topic: "",
  level: "Beginner",
  analogyStyle: "Everyday life",
  includeCode: true,
  language: "English",
  codeLanguage: "Python",
};

const EMPTY_STATS: Stats = { topicsLearned: 0, streakDays: 0, lastStudyDay: null, quizResults: [] };

function HomePage() {
  const runGeneratePack = useServerFn(generatePack);

  const [request, setRequest] = useState<PackRequest | null>(null);
  const [pack, setPack] = useState<LearningPack | null>(null);
  const [cached, setCached] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastAttempt, setLastAttempt] = useState<PackRequest | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Browser storage is only read after hydration.
  useEffect(() => {
    setHistory(loadHistory());
    setStats(loadStats());
  }, []);

  async function generate(next: PackRequest) {
    setBusy(true);
    setError(null);
    setLastAttempt(next);
    setPack(null);
    setRequest(next);
    try {
      const result = await runGeneratePack({ data: next });
      if (isApiError(result)) {
        setError(result.error);
        return;
      }
      setPack(result.pack);
      setCached(result.cached);
      setRequest(result.request);

      const entry: HistoryEntry = {
        id: `${Date.now()}`,
        topic: result.request.topic,
        createdAt: Date.now(),
        request: result.request,
        pack: result.pack,
      };
      setHistory(saveHistoryEntry(entry));
      setActiveId(entry.id);
      if (!result.cached) setStats(recordTopicStudied());
    } catch {
      setError({
        code: "upstream_error",
        message: "We couldn't reach the server. Check your connection and retry.",
      });
    } finally {
      setBusy(false);
    }
  }

  function openHistoryEntry(entry: HistoryEntry) {
    setRequest(entry.request);
    setPack(entry.pack);
    setCached(true);
    setError(null);
    setActiveId(entry.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleQuizComplete(score: number, total: number) {
    if (!request) return;
    setStats(recordQuizResult({ topic: request.topic, score, total, at: Date.now() }));
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {!pack && !busy && !error ? (
          <section className="bg-hero-glow relative mb-12 grid items-center gap-10 rounded-[2.5rem] p-2 sm:p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="animate-rise">
              <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
                A study journal that explains back
              </p>
              <h1 className="mt-5 text-5xl leading-[1.02] font-semibold text-balance sm:text-6xl lg:text-7xl">
                Understand <em className="text-warm not-italic">anything</em>, at your own pace.
              </h1>
              <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">
                One topic in, a full study pack out: explanation, analogy, code, quiz, flashcards and a tutor that
                keeps the conversation going.
              </p>
              <div className="mt-8">
                <TopicForm key="new" defaults={DEFAULT_REQUEST} loading={busy} onSubmit={generate} />
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-3 translate-x-3 translate-y-3 rounded-[2rem] border border-primary/20 bg-primary/10" aria-hidden />
              <SmartImage
                {...IMAGES.hero.studying}
                eager
                className="relative aspect-[6/7] w-full rounded-[2rem] border-4 border-card shadow-lift"
                imgClassName="object-cover object-center"
              />
              <span className="absolute right-5 bottom-5 rounded-full bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-soft backdrop-blur">
                Learn at your own pace
              </span>
            </div>
          </section>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            {(pack || busy || error) && (
              <TopicForm
                key={request?.topic ?? "new"}
                defaults={request ?? DEFAULT_REQUEST}
                loading={busy}
                onSubmit={generate}
              />
            )}

            {busy && <PackSkeleton />}

            {error && !busy && (
              <div className="card-surface animate-rise accent-left border-l-destructive p-8 text-center" role="alert">
                <AlertCircle className="mx-auto size-10 text-destructive" aria-hidden />
                <h2 className="mt-4 text-xl font-semibold">That didn't work</h2>
                <p className="mt-2 text-muted-foreground">{error.message}</p>
                {lastAttempt && (
                  <Button variant="hero" className="mt-6" onClick={() => generate(lastAttempt)}>
                    <RotateCcw className="size-4" aria-hidden /> Try again
                  </Button>
                )}
              </div>
            )}

            {pack && request && !busy && (
              <PackView
                pack={pack}
                request={request}
                cached={cached}
                busy={busy}
                onRegenerate={generate}
                onQuizComplete={handleQuizComplete}
              />
            )}
          </div>

          <HistorySidebar
            history={history}
            stats={stats}
            activeId={activeId}
            onSelect={openHistoryEntry}
            onDelete={(id) => {
              setHistory(deleteHistoryEntry(id));
              if (id === activeId) setActiveId(null);
            }}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
