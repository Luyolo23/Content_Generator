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
      <div className="animate-rise card-surface relative overflow-hidden p-8 text-center sm:p-10">
        {pct >= 50 && <Confetti />}
        <div className="bg-brand relative mx-auto flex size-20 items-center justify-center rounded-[40%_60%_55%_45%] shadow-lift">
          <Trophy className="size-9 text-primary-foreground" aria-hidden />
        </div>
        <h3 className="relative mt-6 text-4xl font-semibold">
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
      <Progress value={progress} className="mt-3 h-2.5 rounded-full bg-muted" />

      <h3 className="mt-6 max-w-[60ch] text-2xl leading-snug font-semibold">{current.question}</h3>

      <div className="mt-6 grid gap-3 sm:grid-cols-2" role="group" aria-label="Answer options">
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
                "flex min-h-16 w-full items-start gap-3 rounded-2xl border-2 bg-card p-4 text-left shadow-soft transition-all",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                !revealed && "border-border hover:-translate-y-0.5 hover:border-primary hover:shadow-lift",
                revealed && isCorrect && "border-success bg-success/10",
                revealed && isPicked && !isCorrect && "border-destructive bg-destructive/10",
                revealed && !isCorrect && !isPicked && "border-border opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  revealed && isCorrect && "border-success bg-success text-success-foreground",
                  revealed &&
                    isPicked &&
                    !isCorrect &&
                    "border-destructive bg-destructive text-destructive-foreground",
                )}
              >
                {revealed && isCorrect ? (
                  <Check className="size-4" aria-hidden />
                ) : revealed && isPicked ? (
                  <X className="size-4" aria-hidden />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="pt-1 text-sm leading-relaxed sm:text-base">{option}</span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div
          className={cn(
            "animate-rise accent-left mt-5 rounded-2xl p-4",
            selected === current.correctIndex ? "border-l-success bg-success/10" : "border-l-destructive bg-destructive/10",
          )}
          role="status"
        >
          <p className="flex items-center gap-2 text-sm font-semibold">
            {selected === current.correctIndex ? (
              <><Check className="size-4 text-success" aria-hidden /> Correct</>
            ) : (
              <><X className="size-4 text-destructive" aria-hidden /> Not quite</>
            )}
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

const CONFETTI_TONES = ["bg-primary", "bg-teal", "bg-warm", "bg-success"];

/** Gentle CSS confetti; hidden entirely when the user prefers reduced motion. */
function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className={cn("confetti-piece", CONFETTI_TONES[i % CONFETTI_TONES.length])}
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 7) * 0.12}s`,
            ["--drift" as string]: `${((i * 53) % 80) - 40}px`,
          }}
        />
      ))}
    </div>
  );
}
