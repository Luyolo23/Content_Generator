import { Flame, GraduationCap, History, Search, Target, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HistoryEntry, Stats } from "@/lib/session-store";

interface HistorySidebarProps {
  history: HistoryEntry[];
  stats: Stats;
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

export function HistorySidebar({ history, stats, activeId, onSelect, onDelete }: HistorySidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => history.filter((e) => e.topic.toLowerCase().includes(query.trim().toLowerCase())),
    [history, query],
  );

  const avgScore = useMemo(() => {
    if (stats.quizResults.length === 0) return null;
    const total = stats.quizResults.reduce((sum, r) => sum + r.score / Math.max(r.total, 1), 0);
    return Math.round((total / stats.quizResults.length) * 100);
  }, [stats.quizResults]);

  return (
    <aside className="space-y-5" aria-label="Your study session">
      <section className="card-surface p-5">
        <h2 className="font-display text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Your progress
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-muted p-3">
            <Flame className="mx-auto size-4 text-warm" aria-hidden />
            <p className="mt-1.5 text-xl font-semibold tabular-nums">{stats.streakDays}</p>
            <p className="text-[11px] text-muted-foreground">day streak</p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <GraduationCap className="mx-auto size-4 text-primary" aria-hidden />
            <p className="mt-1.5 text-xl font-semibold tabular-nums">{stats.topicsLearned}</p>
            <p className="text-[11px] text-muted-foreground">topics</p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <Target className="mx-auto size-4 text-teal" aria-hidden />
            <p className="mt-1.5 text-xl font-semibold tabular-nums">{avgScore === null ? "—" : `${avgScore}%`}</p>
            <p className="text-[11px] text-muted-foreground">avg quiz</p>
          </div>
        </div>
        {stats.quizResults.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            {stats.quizResults.slice(0, 3).map((r, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="truncate">{r.topic}</span>
                <span className="tabular-nums">
                  {r.score}/{r.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-surface p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <History className="size-4" aria-hidden /> Past topics
        </h2>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history"
            aria-label="Search past topics"
            className="h-9 pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {history.length === 0 ? "Topics you study are saved here on this device." : "No matches."}
          </p>
        ) : (
          <ul className="mt-3 space-y-1">
            {filtered.map((entry) => (
              <li
                key={entry.id}
                className={`group flex items-center gap-1 rounded-lg px-1 transition-colors ${
                  entry.id === activeId ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(entry)}
                  className="focus-visible:ring-ring flex-1 rounded-lg px-2 py-2 text-left focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="block truncate text-sm font-medium">{entry.topic}</span>
                  <span className="block text-xs text-muted-foreground">{entry.request.level}</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-60 hover:opacity-100"
                  onClick={() => onDelete(entry.id)}
                  aria-label={`Delete ${entry.topic} from history`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
