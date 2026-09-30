import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";

import { CodeBlock } from "@/components/code-block";
import { SiteHeader } from "@/components/site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ALL_PROMPTS, MODEL, renderPrompt } from "@/lib/prompts";

export const Route = createFileRoute("/prompt-lab")({
  head: () => ({
    meta: [
      { title: "Prompt Lab — Concept Coach" },
      {
        name: "description",
        content:
          "See the exact prompts powering Concept Coach: role, context, constraints, output format, examples and version history.",
      },
      { property: "og:title", content: "Prompt Lab — Concept Coach" },
      {
        property: "og:description",
        content: "The real prompts behind every Concept Coach learning pack, quiz, flashcard set and chat reply.",
      },
    ],
  }),
  component: PromptLabPage,
});

function PromptLabPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="card-surface bg-hero-glow p-7 sm:p-9">
          <Badge variant="secondary" className="mb-3">
            <FlaskConical className="mr-1 size-3" aria-hidden /> Transparency
          </Badge>
          <h1 className="text-3xl font-semibold sm:text-4xl">Prompt Lab</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            These are the actual prompts Concept Coach sends. The page reads them from the same constants file
            the backend uses, so what you see here is what runs. Current model:{" "}
            <code className="font-mono text-sm text-foreground">{MODEL}</code>.
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-8 space-y-4">
          {ALL_PROMPTS.map((prompt) => (
            <AccordionItem
              key={prompt.id}
              value={prompt.id}
              className="card-surface border px-5 sm:px-6"
            >
              <AccordionTrigger className="py-5 text-left">
                <span>
                  <span className="font-display block text-lg font-semibold">{prompt.name}</span>
                  <span className="mt-1 block text-sm font-normal text-muted-foreground">
                    {prompt.purpose}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Role</h3>
                    <p className="mt-2 text-sm leading-relaxed">{prompt.role}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Context</h3>
                    <p className="mt-2 text-sm leading-relaxed">{prompt.context}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    Constraints
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
                    {prompt.constraints.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary" aria-hidden>
                          •
                        </span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    Output format
                  </h3>
                  <CodeBlock code={prompt.outputFormat} label="output format" />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                      Example input
                    </h3>
                    <CodeBlock code={prompt.exampleInput} label="input" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                      Example output
                    </h3>
                    <CodeBlock code={prompt.exampleOutput} label="output" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    Version history
                  </h3>
                  <ol className="mt-3 space-y-3 border-l border-border pl-4">
                    {prompt.versions.map((v) => (
                      <li key={v.version} className="relative text-sm">
                        <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-primary" aria-hidden />
                        <span className="font-semibold">{v.version}</span>
                        <span className="mt-0.5 block text-muted-foreground">{v.note}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    Assembled system message
                  </h3>
                  <CodeBlock code={renderPrompt(prompt)} label="system" />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
    </div>
  );
}
