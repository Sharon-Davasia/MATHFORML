"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, ChevronDown, CircleHelp, Clock3, GitBranch, Sparkles } from "lucide-react";
import type { Question, Topic } from "@/content/schema";
import type { StudyMode } from "@/lib/progress";
import { CodeBlock } from "./CodeBlock";
import { FormulaCard, MathBlock } from "./MathDisplay";
import { PracticePanel } from "./PracticePanel";
import { DerivationStepper, InteractiveWidget } from "./Widgets";
import type { QuestionResult } from "@/lib/progress";

const ladderLabels = ["Intuition", "Formal definition", "Derivation", "ML application & code"];

export function LessonView({
  topic,
  mode,
  globalMode,
  hasOverride,
  onSetMode,
  onUseGlobal,
  bookmarked,
  onToggleBookmark,
  note,
  onNoteChange,
  completedRevision,
  completedDeep,
  ladderLevel,
  results,
  onAnswer,
  onComplete,
  onOpenTopic,
  previous,
  next,
}: {
  topic: Topic;
  mode: StudyMode;
  globalMode: StudyMode;
  hasOverride: boolean;
  onSetMode: (mode: StudyMode) => void;
  onUseGlobal: () => void;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  note: string;
  onNoteChange: (note: string) => void;
  completedRevision: boolean;
  completedDeep: boolean;
  ladderLevel: number;
  results: Record<string, QuestionResult>;
  onAnswer: (question: Question, correct: boolean) => void;
  onComplete: (mode: StudyMode) => void;
  onOpenTopic: (topicId: string) => void;
  previous?: Topic;
  next?: Topic;
}) {
  const [prediction, setPrediction] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const moduleName = topic.moduleId === "linear-algebra" ? "Linear algebra" : topic.moduleId === "calculus" ? "Calculus & optimization" : topic.moduleId === "probability" ? "Probability & information" : "Statistics for ML";
  const questions = mode === "deep" ? [...topic.revision.questions, ...topic.deep.extraQuestions] : topic.revision.questions;
  const isComplete = mode === "deep" ? completedDeep : completedRevision;
  return (
    <div className="lesson-page">
      <div className="lesson-breadcrumb"><button onClick={() => onOpenTopic("")} aria-label="Back to overview"><ArrowLeft size={15} /></button><span>{moduleName}</span><span className="crumb-separator">/</span><span>{topic.shortTitle}</span></div>
      <header className="lesson-hero">
        <div className="lesson-title-group"><div className="tag-row"><span className={`module-chip module-${topic.moduleId}`}>{moduleName}</span>{topic.tags.slice(0, 2).map((tag) => <span className="lesson-tag" key={tag}>{tag}</span>)}</div><h1>{topic.title}</h1><p>{topic.subtitle}</p><div className="lesson-meta"><span><Clock3 size={14} />{mode === "revision" ? topic.revision.duration : "30–60 min"}</span><span><BookOpen size={14} />{topic.revision.questions.length + (mode === "deep" ? topic.deep.extraQuestions.length : 0)} practice prompts</span><span><GitBranch size={14} />{topic.prerequisites.length} prerequisites</span></div></div>
        <div className="lesson-tools"><button className={`icon-action ${bookmarked ? "icon-action-active" : ""}`} onClick={onToggleBookmark} aria-label={bookmarked ? "Remove bookmark" : "Bookmark topic"}><Bookmark size={17} fill={bookmarked ? "currentColor" : "none"} /></button><span className="lesson-tools-label">{bookmarked ? "Saved" : "Save topic"}</span></div>
      </header>

      <div className="topic-mode-strip"><div><Sparkles size={16} /><span><b>{hasOverride ? "Topic mode" : "Following your global mode"}</b><small>{mode === "revision" ? "Fast review · roughly 10 minutes" : "Deep mastery · derivations and proof sketches"}</small></span></div><div className="topic-mode-actions"><div className="segmented-control compact-segmented" role="group" aria-label="Mode for this topic"><button className={mode === "revision" ? "selected" : ""} onClick={() => onSetMode("revision")}>Revision</button><button className={mode === "deep" ? "selected" : ""} onClick={() => onSetMode("deep")}>Deep</button></div>{hasOverride && <button className="follow-mode-button" onClick={onUseGlobal}>Use global ({globalMode})</button>}</div></div>

      <section className="why-banner"><div className="why-icon">Why</div><div><span className="eyebrow">Why it matters in ML</span><p>{topic.revision.whyItMatters}</p></div><span className="banner-corner">↗</span></section>

      <div className="lesson-grid">
        <section className="lesson-card intuition-card"><div className="section-heading"><span className="section-icon icon-sage">01</span><div><span className="eyebrow">Build an intuition</span><h2>Start with the picture</h2></div></div><p className="large-copy">{topic.revision.intuition}</p><div className="intuition-caption"><span>Think in model behavior</span><span>not symbols first</span></div></section>
        <section className="lesson-card formula-section"><div className="section-heading"><span className="section-icon icon-lilac">02</span><div><span className="eyebrow">Formal definition</span><h2>Core formulas</h2></div><button className="help-button" onClick={() => setShowGlossary((value) => !value)} aria-expanded={showGlossary} aria-label="Toggle formula symbol glossary"><CircleHelp size={16} /></button></div><div className="formula-list">{topic.revision.formulas.map((formula, index) => <FormulaCard formula={formula} index={index} key={formula.id} />)}</div>{showGlossary && <div className="formula-glossary"><b>Reading the notation</b><p>{topic.revision.formulas.flatMap((formula) => Object.entries(formula.variables).map(([symbol, meaning]) => `${symbol}: ${meaning}`)).join(" · ")}</p></div>}</section>
      </div>

      <section className="lesson-card connection-card"><div className="section-heading"><span className="section-icon icon-blue">03</span><div><span className="eyebrow">Step-by-step ML connection</span><h2>Where the math enters a model</h2></div></div><ol className="connection-steps">{topic.revision.mlWalkthrough.map((step, index) => <li key={`${index}-${step}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol></section>

      <div className="lesson-grid">
        <section className="lesson-card example-card"><div className="section-heading"><span className="section-icon icon-peach">04</span><div><span className="eyebrow">Work it through</span><h2>Small-number example</h2></div></div><p className="example-question">{topic.revision.workedExample.prompt}</p><ol className="example-steps">{topic.revision.workedExample.solution.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol><div className="example-answer"><Check size={15} /><span>Answer</span><b>{topic.revision.workedExample.answer}</b></div></section>
        <section className="lesson-card model-card"><div className="section-heading"><span className="section-icon icon-amber">05</span><div><span className="eyebrow">From formula to model</span><h2>Seen in real systems</h2></div></div><div className="model-list">{topic.revision.modelAppearances.map((item, index) => <div key={item}><span className="model-dot">0{index + 1}</span><p>{item}</p></div>)}</div><div className="prereq-list"><b>Connect the web</b><div>{topic.prerequisites.map((item) => <span key={item}>{item}</span>)}{topic.downstream.map((item) => <span className="downstream-tag" key={item}>→ {item}</span>)}</div></div></section>
      </div>

      <section className="visualization-section"><div className="section-heading"><span className="section-icon icon-mint">06</span><div><span className="eyebrow">See it move</span><h2>Interactive visualization</h2></div></div><div className={`predict-prompt ${prediction ? "predict-revealed" : ""}`}><span className="predict-icon">?</span><p><b>Pause and predict</b>{prediction ? topic.deep.thinkFirst[0]?.reveal ?? "Compare your prediction with the live values in the widget. The mathematics determines the direction and scale." : topic.revision.visualizationPrompt}</p><button onClick={() => setPrediction((value) => !value)}>{prediction ? "Hide reflection" : "Reveal a hint"}<ChevronDown size={14} /></button></div><InteractiveWidget id={topic.widget} derivation={topic.deep.derivations[0]} /></section>

      <section className="lesson-card code-section"><div className="section-heading"><span className="section-icon icon-sage">07</span><div><span className="eyebrow">Build from scratch</span><h2>Run the core computation</h2></div></div><p className="section-intro">A small numerical check makes the convention concrete. Copy the snippet, run it, then compare its output to the hand calculation above.</p><CodeBlock example={topic.revision.code} /></section>

      <div className="lesson-grid">
        <section className="lesson-card mistakes-card"><div className="section-heading"><span className="section-icon icon-rose">08</span><div><span className="eyebrow">Common mistakes & interview traps</span><h2>What to catch early</h2></div></div><ul className="plain-list mistake-list">{topic.revision.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></section>
        <section className="lesson-card takeaways-card"><div className="section-heading"><span className="section-icon icon-blue">09</span><div><span className="eyebrow">Quick revision</span><h2>Keep these five</h2></div></div><ol className="takeaway-list">{topic.revision.quickTakeaways.slice(0, 5).map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></section>
      </div>

      {mode === "deep" && <section className="deep-section" id="deep-layer">
        <div className="deep-heading"><div><span className="deep-badge"><Sparkles size={13} />Explain in depth</span><h2>Go past the formula.</h2><p>Derive it, inspect its geometry, and check where its assumptions break.</p></div><div className="deep-time"><Clock3 size={14} />30–60 min</div></div>
        <section className="lesson-card principle-card"><div className="section-heading"><span className="section-icon icon-lilac">A</span><div><span className="eyebrow">First-principles story</span><h3>What problem needed this idea?</h3></div></div><p>{topic.deep.firstPrinciples}</p></section>
        <div className="deep-derivations">{topic.deep.derivations.map((derivation, index) => <DerivationStepper key={`${derivation.title}-${index}`} derivation={derivation} />)}</div>
        <div className="lesson-grid deep-two-col"><section className="lesson-card"><div className="section-heading"><span className="section-icon icon-blue">B</span><div><span className="eyebrow">Geometry & visual intuition</span><h3>What moves in the space?</h3></div></div><p>{topic.deep.geometry}</p></section><section className="lesson-card"><div className="section-heading"><span className="section-icon icon-amber">C</span><div><span className="eyebrow">Short proof sketch</span><h3>Why the result holds</h3></div></div><p>{topic.deep.proofSketch}</p></section></div>
        <div className="lesson-grid deep-two-col"><section className="lesson-card"><div className="section-heading"><span className="section-icon icon-rose">D</span><div><span className="eyebrow">Assumptions & failure modes</span><h3>Where this can break</h3></div></div><ul className="plain-list">{topic.deep.assumptions.map((item) => <li key={item}><b>Assumption</b>{item}</li>)}{topic.deep.edgeCases.map((item) => <li key={item}><b>Edge case</b>{item}</li>)}</ul></section><section className="lesson-card"><div className="section-heading"><span className="section-icon icon-peach">E</span><div><span className="eyebrow">Why not the alternative?</span><h3>Compare the modeling choice</h3></div></div>{topic.deep.alternatives.map((alternative) => <div className="alternative-card" key={alternative.name}><b>{alternative.name}</b><p>{alternative.why}</p></div>)}<div className="misconception-box"><b>Misconception busters</b>{topic.deep.misconceptions.map((item) => <p key={item}>“{item}”</p>)}</div></section></div>
        <section className="lesson-card deep-code-section"><div className="section-heading"><span className="section-icon icon-sage">F</span><div><span className="eyebrow">Pure NumPy → PyTorch</span><h3>Same math, two implementations</h3></div></div><p className="section-intro">The first block exposes the operations. The second uses tensor operations (and autograd where the topic is differentiable); compare the small outputs, not just the syntax.</p><CodeBlock example={topic.deep.fromScratch} /><CodeBlock example={topic.deep.frameworkEquivalent} /></section>
        <div className="think-first-grid">{topic.deep.thinkFirst.map((item, index) => <ThinkFirstCard key={`${item.prompt}-${index}`} prompt={item.prompt} reveal={item.reveal} index={index} />)}</div>
        <div className="lesson-grid deep-two-col"><section className="lesson-card connection-web-card"><div className="section-heading"><span className="section-icon icon-lilac">G</span><div><span className="eyebrow">Connection web</span><h3>What to know next</h3></div></div><div className="connection-web"><div><b>Prerequisites</b>{topic.deep.prerequisites.map((item) => <span key={item}>{item}</span>)}</div><ArrowRight size={17} /><div><b>Downstream</b>{topic.deep.downstream.map((item) => <span key={item}>{item}</span>)}</div></div></section><section className="lesson-card explain-back-card"><div className="section-heading"><span className="section-icon icon-amber">H</span><div><span className="eyebrow">Explain it back</span><h3>Teach the idea in 2–3 lines</h3></div></div><p>{topic.deep.explainItBack.prompt}</p><textarea className="explain-textarea" rows={3} value={explainText} onChange={(event) => setExplainText(event.target.value)} placeholder="My explanation…" /><button className="button-secondary button-small" onClick={() => setShowModelAnswer((value) => !value)}>{showModelAnswer ? "Hide model answer" : "Compare with model answer"}<ChevronDown size={14} /></button>{showModelAnswer && <div className="model-answer-box"><b>Model answer</b><p>{topic.deep.explainItBack.modelAnswer}</p></div>}</section></div>
      </section>}

      <PracticePanel topicId={topic.id} questions={questions} results={results} onAnswer={onAnswer} />

      <section className="ladder-card"><div className="ladder-heading"><div><span className="eyebrow">Understanding ladder</span><h2>From intuition to implementation</h2><p>Correct practice earns levels: Easy → intuition, Medium → formal use, Hard → derivation, code check → application.</p></div><span className={`mastery-pill ${ladderLevel >= 4 && completedDeep ? "mastered" : ""}`}>{ladderLevel >= 4 && completedDeep ? <><Check size={13} /> Mastered</> : `${ladderLevel}/4 levels`}</span></div><div className="ladder-levels">{ladderLabels.map((label, index) => <div key={label} className={`ladder-level ${ladderLevel > index ? "level-earned" : ""}`}><span className="ladder-circle">{ladderLevel > index ? <Check size={14} /> : `0${index + 1}`}</span><span>{label}</span></div>)}</div><div className="ladder-footnote"><span>Mastered requires all four levels and a completed deep lesson.</span><span>{ladderLevel >= 4 && completedDeep ? "You have the full chain." : "Keep practicing to unlock the next level."}</span></div></section>

      <section className="notes-card"><div className="section-heading"><span className="section-icon icon-amber"><BookOpen size={14} /></span><div><span className="eyebrow">Private study notes</span><h3>What do you want to remember?</h3></div></div><textarea value={note} onChange={(event) => onNoteChange(event.target.value)} rows={3} placeholder="Write your own explanation, a question to revisit, or an ML connection…" /><span className="autosave-note">Saved on this device · localStorage</span></section>

      <footer className="lesson-footer"><button className="lesson-nav-button" disabled={!previous} onClick={() => previous && onOpenTopic(previous.id)}><ArrowLeft size={15} /><span><small>Previous</small><b>{previous?.shortTitle ?? "Start of module"}</b></span></button><button className={`button-primary mark-complete-button ${isComplete ? "button-completed" : ""}`} onClick={() => onComplete(mode)}>{isComplete ? <><Check size={15} />{mode === "revision" ? "Revision complete" : "Deep lesson complete"}</> : <><Check size={15} />Mark {mode === "revision" ? "revision" : "deep lesson"} complete</>}</button><button className="lesson-nav-button next-nav" disabled={!next} onClick={() => next && onOpenTopic(next.id)}><span><small>Next topic</small><b>{next?.shortTitle ?? "End of module"}</b></span><ArrowRight size={15} /></button></footer>
    </div>
  );
}

function ThinkFirstCard({ prompt, reveal, index }: { prompt: string; reveal: string; index: number }) {
  const [show, setShow] = useState(false);
  return <section className={`think-card ${show ? "think-card-open" : ""}`}><div className="think-card-top"><span>Pause & predict · 0{index + 1}</span><span>before you read on</span></div><p>{prompt}</p><button onClick={() => setShow((value) => !value)}>{show ? "Hide explanation" : "Reveal the reasoning"}<ChevronDown size={14} /></button>{show && <div className="think-reveal">{reveal}</div>}</section>;
}
