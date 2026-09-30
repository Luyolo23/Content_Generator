import { Loader2, Search, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ANALOGY_STYLES,
  CODE_LANGUAGES,
  EXAMPLE_TOPICS,
  EXPERIMENTAL_LANGUAGES,
  LANGUAGES,
  LEVELS,
  MAX_TOPIC_LENGTH,
  type AnalogyStyle,
  type CodeLanguage,
  type Language,
  type Level,
  type PackRequest,
} from "@/lib/concept-types";

interface TopicFormProps {
  defaults: PackRequest;
  loading: boolean;
  onSubmit: (request: PackRequest) => void;
}

export function TopicForm({ defaults, loading, onSubmit }: TopicFormProps) {
  const [topic, setTopic] = useState(defaults.topic);
  const [level, setLevel] = useState<Level>(defaults.level);
  const [analogyStyle, setAnalogyStyle] = useState<AnalogyStyle>(defaults.analogyStyle);
  const [includeCode, setIncludeCode] = useState(defaults.includeCode);
  const [language, setLanguage] = useState<Language>(defaults.language);
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>(defaults.codeLanguage);
  const [error, setError] = useState<string | null>(null);

  function submit(nextTopic = topic) {
    const trimmed = nextTopic.trim().slice(0, MAX_TOPIC_LENGTH);
    if (!trimmed) {
      setError("Type a concept you want to understand.");
      return;
    }
    setError(null);
    onSubmit({ topic: trimmed, level, analogyStyle, includeCode, language, codeLanguage });
  }

  const isExperimental = EXPERIMENTAL_LANGUAGES.includes(language);

  return (
    <form
      className="card-surface p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Label htmlFor="topic" className="font-display text-base">
        What do you want to understand?
      </Label>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="topic"
            value={topic}
            maxLength={MAX_TOPIC_LENGTH}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How does HTTPS actually keep data private?"
            aria-describedby="topic-help"
            aria-invalid={error ? true : undefined}
            className="h-12 rounded-xl pr-16 pl-11 text-base"
          />
          <span
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs text-muted-foreground tabular-nums"
            aria-hidden
          >
            {topic.length}/{MAX_TOPIC_LENGTH}
          </span>
        </div>
        <Button type="submit" variant="hero" size="lg" disabled={loading} className="sm:w-44">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Building…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden /> Explain it
            </>
          )}
        </Button>
      </div>

      <p id="topic-help" className="mt-2 min-h-5 text-sm">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : (
          <span className="text-muted-foreground">Any concept — technical or not. Up to 200 characters.</span>
        )}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {EXAMPLE_TOPICS.map((example) => (
          <Button
            key={example}
            type="button"
            variant="chip"
            size="pill"
            onClick={() => {
              setTopic(example);
              submit(example);
            }}
          >
            {example}
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="level">Level</Label>
          <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
            <SelectTrigger id="level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="analogy">Analogy style</Label>
          <Select value={analogyStyle} onValueChange={(v) => setAnalogyStyle(v as AnalogyStyle)}>
            <SelectTrigger id="analogy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANALOGY_STYLES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="language">Language</Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  <span className="flex items-center gap-2">
                    {l}
                    {EXPERIMENTAL_LANGUAGES.includes(l) && (
                      <Badge variant="secondary" className="text-[10px]">
                        experimental
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="include-code">Code examples</Label>
          <div className="flex h-9 items-center gap-3">
            <Switch id="include-code" checked={includeCode} onCheckedChange={setIncludeCode} />
            <Select
              value={codeLanguage}
              onValueChange={(v) => setCodeLanguage(v as CodeLanguage)}
              disabled={!includeCode}
            >
              <SelectTrigger aria-label="Code language" className="h-9 flex-1">
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
        </div>
      </div>

      {isExperimental && (
        <p className="mt-4 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          {language} support is experimental — the AI may make language or accuracy mistakes. Double-check
          anything important.
        </p>
      )}
    </form>
  );
}
