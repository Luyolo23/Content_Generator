import { Check, RotateCcw, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/concept-types";

interface QuizSectionProps {
  questions: QuizQuestion[];
  topic: string;
  onComplete: (score: number, total: number) => void;
}

export function QuizSection({ questions, topic, onComplete }: QuizSectionProps) {
  const [pool, setPool] = useState<QuizQuestion[]>(questions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [missed, setMissed] = useState<QuizQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setPool(questions);
    setIndex(0);
    setSelected(null);
    setMissed([]);
    setScore(0);
    setDone(false);
  }, [questions]);

  const current = pool[index];
  const progress = useMemo(() => (index / Math.max(pool.length, 1)) * 100, [index, pool.length]);

  function choose(option: number) {
    if (selected !== null || !current) return;
    setSelected(option);
    if (option === current.correctIndex) setScore((s) => s + 1);
    else setMissed((m) => [...m, current]);
  }

  function next() {
    if (index + 1 >= pool.length) {
      setDone(true);
      onComplete(score, pool.length);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  function restart(questionSet: QuizQuestion[]) {
    setPool(questionSet);
    setIndex(0);
    setSelected(null);
    setMissed([]);
    setScore(0);
    setDone(false);
  }

  if (done) {
    const pct = Math.round((score / Math.max(pool.length, 1)) * 100);
    return (
      <div className="animate-rise card-surface p-8 text-center">
        <div className="bg-brand mx-auto flex size-16 items-center justify-center rounded-2xl">
          <Trophy className="size-8 text-primary-foreground" aria-hidden />
        </div>
        <h3 className="mt-5 text-2xl font-semibold">
          {score} / {pool.length} correct
        </h3>
        <p className="mt-2 text-muted-foreground">
          {pct >= 80
            ? `You've got ${topic} down.`
            : pct >= 50
              ? "Solid start — one more pass will lock it in."
              : "Worth re-reading the explanation, then trying again."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {missed.length > 0 && (
            <Button variant="hero" onClick={() => restart(missed)}>
              <RotateCcw className="size-4" aria-hidden /> Retry {missed.length} missed
            </Button>
          )}
          <Button variant="outline" onClick={() => restart(questions)}>
            Restart full quiz
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="card-surface p-6 sm:p-8">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question {index + 1} of {pool.length}
        </span>
        <span className="tabular-nums">Score {score}</span>
      </div>
      <Progress value={progress} className="mt-3 h-1.5" />

      <h3 className="mt-6 text-xl leading-snug font-semibold">{current.question}</h3>

      <div className="mt-5 space-y-3" role="group" aria-label="Answer options">
        {current.options.map((option, i) => {
          const isCorrect = i === current.correctIndex;
          const isPicked = selected === i;
          const revealed = selected !== null;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(i)}
              disabled={revealed}
              aria-pressed={isPicked}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                !revealed && "border-border hover:border-primary hover:bg-muted/60",
                revealed && isCorrect && "border-success bg-success/10",
                revealed && isPicked && !isCorrect && "border-destructive bg-destructive/10",
                revealed && !isCorrect && !isPicked && "border-border opacity-60",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  revealed && isCorrect && "border-success bg-success text-success-foreground",
                  revealed &&
                    isPicked &&
                    !isCorrect &&
                    "border-destructive bg-destructive text-destructive-foreground",
                )}
              >
                {revealed && isCorrect ? (
                  <Check className="size-3.5" aria-hidden />
                ) : revealed && isPicked ? (
                  <X className="size-3.5" aria-hidden />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="text-sm leading-relaxed">{option}</span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="animate-rise mt-5 rounded-xl bg-muted p-4" role="status">
          <p className="text-sm font-medium">
            {selected === current.correctIndex ? "Correct" : "Not quite"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{current.explanation}</p>
          <Button variant="hero" className="mt-4" onClick={next}>
            {index + 1 >= pool.length ? "See results" : "Next question"}
          </Button>
        </div>
      )}
    </div>
  );
}
