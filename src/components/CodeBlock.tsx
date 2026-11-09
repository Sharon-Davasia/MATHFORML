"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import type { CodeExample } from "@/content/schema";

function paintCode(code: string) {
  const token = /(#[^\n]*|\/\/[^\n]*|"[^"\n]*"|'[^'\n]*'|\b(?:import|from|as|for|in|if|else|return|def|class|print|True|False|None|with|lambda|and|or|not)\b|\b\d+(?:\.\d+)?(?:e-?\d+)?\b)/g;
  return code.split(token).map((part, index) => {
    let kind = "code-plain";
    if (/^(#|\/\/)/.test(part)) kind = "code-comment";
    else if (/^["']/.test(part)) kind = "code-string";
    else if (/^(import|from|as|for|in|if|else|return|def|class|print|True|False|None|with|lambda|and|or|not)$/.test(part)) kind = "code-keyword";
    else if (/^\d/.test(part)) kind = "code-number";
    return <span className={kind} key={`${index}-${part}`}>{part}</span>;
  });
}

export function CodeBlock({ example, compact = false }: { example: CodeExample; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(example.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return (
    <section className={`code-card ${compact ? "code-card-compact" : ""}`}>
      <div className="code-header">
        <div className="code-title"><span className="terminal-mark"><Terminal size={14} /></span><span>{example.title}</span><span className="code-language">{example.language}</span></div>
        <button className="copy-button" type="button" onClick={copy} aria-label="Copy code">
          {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="code-body"><code>{paintCode(example.code)}</code></pre>
      {!compact && example.explanation.length > 0 && (
        <div className="code-explanation">{example.explanation.map((line) => <p key={line}><span>↳</span>{line}</p>)}</div>
      )}
      {example.numericalCheck && !compact && <p className="code-check"><strong>Numerical check</strong><span>{example.numericalCheck}</span></p>}
    </section>
  );
}
