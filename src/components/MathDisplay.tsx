"use client";

import { BlockMath, InlineMath } from "react-katex";
import type { Formula } from "@/content/schema";

export function MathBlock({ math, className = "" }: { math: string; className?: string }) {
  return <div className={`math-block ${className}`}><BlockMath math={math} /></div>;
}

export function MathInline({ math }: { math: string }) {
  return <InlineMath math={math} />;
}

export function FormulaCard({ formula, index }: { formula: Formula; index: number }) {
  return (
    <article className="formula-card">
      <div className="formula-topline"><span className="formula-index">{String(index + 1).padStart(2, "0")}</span><h4>{formula.label}</h4></div>
      <MathBlock math={formula.latex} />
      {formula.mlNote && <p className="formula-note">{formula.mlNote}</p>}
      {Object.keys(formula.variables).length > 0 && (
        <dl className="symbol-list">
          {Object.entries(formula.variables).map(([symbol, meaning]) => (
            <div key={symbol}><dt>{symbol}</dt><dd>{meaning}</dd></div>
          ))}
        </dl>
      )}
    </article>
  );
}
