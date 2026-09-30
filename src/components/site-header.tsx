import { Link } from "@tanstack/react-router";
import { Brain } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { to: "/", label: "Learn" },
  { to: "/prompt-lab", label: "Prompt Lab" },
  { to: "/about", label: "How it works" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Concept Coach home">
          <span className="bg-brand flex size-9 items-center justify-center rounded-xl shadow-soft">
            <Brain className="size-5 text-primary-foreground" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Concept Coach</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
