import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/lib/concept-types";

export function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [cards]);

  const card = cards[index];
  if (!card) return null;

  function move(step: number) {
    setFlipped(false);
    setIndex((i) => (i + step + cards.length) % cards.length);
  }

  return (
    <div className="card-surface p-6 sm:p-8">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        <span>Click the card to flip</span>
      </div>

      <div className="flip-scene mt-4">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "Show the question" : "Show the answer"}
          className="flip-inner focus-visible:ring-ring block min-h-56 w-full cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:outline-none"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <span className="flip-face bg-brand flex min-h-56 w-full items-center justify-center rounded-2xl p-8 text-center">
            <span className="font-display text-xl font-semibold text-primary-foreground">{card.front}</span>
          </span>
          <span
            className="flip-face absolute inset-0 flex items-center justify-center rounded-2xl border border-border bg-card p-8 text-center"
            style={{ transform: "rotateY(180deg)" }}
          >
            <span className="text-base leading-relaxed text-card-foreground">{card.back}</span>
          </span>
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" onClick={() => move(-1)} aria-label="Previous card">
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <Button variant="outline" onClick={() => setFlipped((f) => !f)}>
          <RefreshCw className="size-4" aria-hidden /> Flip
        </Button>
        <Button variant="outline" size="icon" onClick={() => move(1)} aria-label="Next card">
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
