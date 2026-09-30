import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Minimal dependency-free syntax highlighting: comments, strings, keywords, numbers. */
const KEYWORDS =
  /\b(abstract|async|await|boolean|break|case|catch|class|const|continue|def|default|delete|do|elif|else|except|export|extends|False|final|finally|float|for|from|function|if|import|in|instanceof|int|interface|is|lambda|let|new|None|not|null|or|and|package|pass|print|private|protected|public|raise|return|self|static|String|super|switch|this|throw|throws|True|try|type|typeof|undefined|var|void|while|with|yield)\b/g;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlight(code: string): string {
  let html = escapeHtml(code);
  html = html.replace(
    /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|"[^"\n]*"|'[^'\n]*')/g,
    '<span class="text-teal">$1</span>',
  );
  html = html.replace(/(^|\n)(\s*)(#|\/\/)(.*)/g, '$1$2<span class="text-muted-foreground">$3$4</span>');
  html = html.replace(KEYWORDS, '<span class="text-primary font-medium">$1</span>');
  html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="text-warm">$1</span>');
  return html;
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-secondary/50">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{label ?? "code"}</span>
        <Button variant="ghost" size="sm" onClick={copy} aria-label="Copy code to clipboard">
          {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          <span className="ml-1.5 text-xs">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code
          className="font-mono"
          // Highlighting operates on HTML-escaped text produced above.
          dangerouslySetInnerHTML={{ __html: highlight(code) }}
        />
      </pre>
    </div>
  );
}
