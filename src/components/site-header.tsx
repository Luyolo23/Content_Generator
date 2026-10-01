import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { to: "/", label: "Learn" },
  { to: "/prompt-lab", label: "Prompt Lab" },
  { to: "/about", label: "How it works" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex min-h-11 items-center gap-2.5 rounded-full" aria-label="Concept Coach home">
          <span className="bg-brand flex size-10 items-center justify-center rounded-[40%_60%_55%_45%] shadow-soft">
            <Sprout className="size-5 text-primary-foreground" aria-hidden />
          </span>
          <span className="hidden font-display text-xl font-semibold sm:inline">Concept Coach</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-4"
              activeProps={{ className: "bg-secondary text-foreground" }}
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
