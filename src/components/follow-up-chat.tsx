import { useServerFn } from "@tanstack/react-start";
import { Loader2, SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { followUpChat } from "@/lib/concept.functions";
import { isApiError, type ChatMessage, type PackRequest } from "@/lib/concept-types";
import { cn } from "@/lib/utils";

interface FollowUpChatProps {
  request: PackRequest;
  suggestions: string[];
}

export function FollowUpChat({ request, suggestions }: FollowUpChatProps) {
  const ask = useServerFn(followUpChat);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [request.topic, request.level]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || busy) return;
    setInput("");
    setError(null);
    const history = messages;
    setMessages([...history, { role: "user", content: trimmed }]);
    setBusy(true);
    try {
      const result = await ask({
        data: {
          topic: request.topic,
          level: request.level,
          language: request.language,
          question: trimmed,
          history,
        },
      });
      if (isApiError(result)) {
        setError(result.error.message);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: result.reply }]);
      }
    } catch {
      setError("That didn't send. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-surface flex flex-col p-6 sm:p-8">
      <h3 className="font-display text-lg font-semibold">Go deeper</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask anything else about {request.topic}. The conversation keeps its context.
      </p>

      <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && !busy && (
          <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            No questions yet — pick a suggestion below or type your own.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "animate-rise max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <Button key={s} variant="chip" size="pill" onClick={() => send(s)} disabled={busy}>
            {s}
          </Button>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question…"
          aria-label="Ask a follow-up question"
          maxLength={500}
          className="h-11 rounded-xl"
        />
        <Button type="submit" variant="hero" size="icon" className="h-11 w-11" disabled={busy} aria-label="Send question">
          <SendHorizonal className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
