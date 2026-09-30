import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Lightbulb,
  ListChecks,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { CodeBlock } from "@/components/code-block";
import { FlashcardDeck } from "@/components/flashcard-deck";
import { FollowUpChat } from "@/components/follow-up-chat";
import { QuizSection } from "@/components/quiz-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadMarkdown, packToMarkdown, slugify } from "@/lib/pack-markdown";
import {
  CODE_LANGUAGES,
  shiftLevel,
  type CodeLanguage,
  type LearningPack,
  type PackRequest,
} from "@/lib/concept-types";

interface PackViewProps {
  pack: LearningPack;
  request: PackRequest;
  cached: boolean;
  busy: boolean;
  onRegenerate: (next: PackRequest) => void;
  onQuizComplete: (score: number, total: number) => void;
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-rise card-surface p-6 sm:p-7">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
        {icon}
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PackView({
  pack,
  request,
  cached,
  busy,
  onRegenerate,
  onQuizComplete,
}: PackViewProps) {
  const [copied, setCopied] = useState(false);
  const markdown = packToMarkdown(pack, request);

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-6">
      <div className="animate-rise card-surface bg-hero-glow p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{request.level}</Badge>
          <Badge variant="secondary">{request.analogyStyle}</Badge>
          <Badge variant="secondary">{request.language}</Badge>
          {cached && (
            <Badge className="bg-teal text-teal-foreground">
              <Zap className="mr-1 size-3" aria-hidden /> Loaded from cache
            </Badge>
          )}
        </div>
        <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{request.topic}</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {pack.tldr}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy || request.level === "ELI5"}
            onClick={() => onRegenerate({ ...request, level: shiftLevel(request.level, -1) })}
          >
            <TrendingDown className="size-4" aria-hidden /> Make it simpler
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || request.level === "Advanced"}
            onClick={() => onRegenerate({ ...request, level: shiftLevel(request.level, 1) })}
          >
            <TrendingUp className="size-4" aria-hidden /> Make it harder
          </Button>
          <Button variant="outline" size="sm" onClick={copyMarkdown}>
            {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy as Markdown"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadMarkdown(`${slugify(request.topic) || "learning-pack"}.md`, markdown)}
          >
            <Download className="size-4" aria-hidden /> Download
          </Button>
        </div>
      </div>

      <Tabs defaultValue="learn">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="cards">Flashcards</TabsTrigger>
          <TabsTrigger value="deeper">Go deeper</TabsTrigger>
        </TabsList>

        <TabsContent value="learn" className="mt-5 space-y-6">
          <SectionCard icon={<ListChecks className="size-5 text-primary" aria-hidden />} title="Explanation">
            <ol className="space-y-4">
              {pack.explanation.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </SectionCard>

          <SectionCard icon={<Lightbulb className="size-5 text-warm" aria-hidden />} title="Analogy">
            <p className="leading-relaxed">{pack.analogy}</p>
          </SectionCard>

          {pack.code && (
            <section className="animate-rise card-surface p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Sparkles className="size-5 text-teal" aria-hidden /> Code example
                </h3>
                <Select
                  value={request.codeLanguage}
                  onValueChange={(v) =>
                    onRegenerate({ ...request, includeCode: true, codeLanguage: v as CodeLanguage })
                  }
                  disabled={busy}
                >
                  <SelectTrigger aria-label="Code language" className="h-9 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CODE_LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4">
                <CodeBlock code={pack.code.snippet} label={pack.code.language} />
                {pack.code.explanation && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pack.code.explanation}</p>
                )}
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              icon={<AlertTriangle className="size-5 text-destructive" aria-hidden />}
              title="Common misconceptions"
            >
              <ul className="space-y-3">
                {pack.misconceptions.map((m, i) => (
                  <li key={i} className="rounded-xl bg-destructive/10 p-3 text-sm leading-relaxed">
                    {m}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard icon={<Check className="size-5 text-success" aria-hidden />} title="Key takeaways">
              <ul className="space-y-3">
                {pack.takeaways.map((t, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="mt-5">
          <QuizSection questions={pack.quiz} topic={request.topic} onComplete={onQuizComplete} />
        </TabsContent>

        <TabsContent value="cards" className="mt-5">
          <FlashcardDeck cards={pack.flashcards} />
        </TabsContent>

        <TabsContent value="deeper" className="mt-5">
          <FollowUpChat request={request} suggestions={pack.followUps} />
        </TabsContent>
      </Tabs>

      <p className="pb-4 text-center text-xs text-muted-foreground">
        AI can be wrong. Verify anything you rely on.
      </p>
    </div>
  );
}
