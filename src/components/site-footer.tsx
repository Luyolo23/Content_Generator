import { Link } from "@tanstack/react-router";
import { Github, Leaf } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2">
          <Leaf className="size-4 text-primary" aria-hidden />
          Concept Coach — a warm little study journal. AI can be wrong; verify what matters.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/prompt-lab" className="hover:text-foreground">Prompt Lab</Link>
          <Link to="/about" className="hover:text-foreground">How it works</Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Github className="size-4" aria-hidden /> GitHub
          </a>
          <span>
            Photos from{" "}
            <a href="https://unsplash.com" target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-foreground">
              Unsplash
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
