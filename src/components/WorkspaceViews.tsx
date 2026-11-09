"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BookMarked, BookOpen, Check, Clock3, Compass, Download, FileText, Flame, GraduationCap, Layers3, Lightbulb, ListChecks, Search, Sparkles, Target, Trophy } from "lucide-react";
import { connectionClusters, glossary, modules, topics, topicsForModule } from "@/content";
import type { ModuleId, Question, Topic } from "@/content/schema";
import type { ProgressState, StudyMode } from "@/lib/progress";
import { currentStreak, isDue } from "@/lib/progress";
import { FormulaCard } from "./MathDisplay";
import { PracticePanel } from "./PracticePanel";

export type PageId = "overview" | "syllabus" | "map" | "formula-sheet" | "glossary" | "review" | "bookmarks" | "dashboard";

const capstoneInfo: Record<ModuleId, { title: string; description: string; deliverable: string; time: string; topics: string[] }> = {
  "linear-algebra": { title: "Build a tiny embedding search engine", description: "Create a small 2D/3D dataset, normalize vectors, compare dot and cosine retrieval, then compress it with a truncated SVD and report what changed.", deliverable: "A runnable notebook with a shape audit, cosine top-k output, and a reconstruction-error plot.", time: "45–60 min", topics: ["dot-cosine", "svd", "pca", "embeddings-vector-spaces"] },
  calculus: { title: "Logistic regression, from zero to gradient check", description: "Implement a binary linear classifier with stable sigmoid and binary cross-entropy. Derive the vector gradient, train with minibatches, and compare one coordinate against a centered finite difference.", deliverable: "A NumPy implementation whose analytic and numerical gradients agree on a tiny fixed batch.", time: "45–60 min", topics: ["chain-rule-backprop", "classification-losses", "gradient-descent-sgd", "gradient-checking"] },
  probability: { title: "Compare two likelihood stories", description: "Fit a small regression/classification example under Gaussian and categorical likelihoods. Track negative log likelihood, a prior penalty, and a posterior or probability calibration check.", deliverable: "A short note connecting the data assumption, loss, gradient, and one failure mode.", time: "40–55 min", topics: ["bayes-mle-loss", "probability-distributions", "information-theory", "uncertainty-quantification"] },
  statistics: { title: "Evaluate a model without fooling yourself", description: "Design a split that respects groups or time, pick metrics for the target prevalence, bootstrap the metric, and write an A/B plan with a minimum useful effect and guardrail.", deliverable: "A one-page evaluation protocol with leakage checks and a predeclared decision rule.", time: "45–60 min", topics: ["splits-cross-validation-leakage", "classification-metrics", "sampling-bootstrap-ci", "ab-testing"] },
};

const mapItems: Record<string, { label: string; topicId: string; detail: string }[]> = {
  Represent: [
    { label: "Data spaces", topicId: "vectors-matrices", detail: "examples × features" },
    { label: "Learned maps", topicId: "matrix-multiplication-linear-layer", detail: "affine layers" },
    { label: "Local filters", topicId: "convolution", detail: "CNNs / YOLO" },
    { label: "Token mixing", topicId: "attention-matrix-multiplication", detail: "QKᵀ → weights" },
  ],
  Differentiate: [
    { label: "Chain rule", topicId: "chain-rule-backprop", detail: "credit assignment" },
    { label: "Objectives", topicId: "classification-losses", detail: "error signals" },
    { label: "Update rule", topicId: "gradient-descent-sgd", detail: "learn parameters" },
    { label: "Optimizer state", topicId: "momentum-rmsprop-adam", detail: "smooth / scale" },
  ],
  "Model uncertainty": [
    { label: "Likelihoods", topicId: "bayes-mle-loss", detail: "data assumptions" },
    { label: "Evidence", topicId: "conditional-bayes", detail: "prior → posterior" },
    { label: "Information", topicId: "information-theory", detail: "surprise / mismatch" },
    { label: "Confidence", topicId: "uncertainty-quantification", detail: "calibration" },
  ],
  Validate: [
    { label: "Generalization", topicId: "bias-variance", detail: "fit vs stability" },
    { label: "Metrics", topicId: "classification-metrics", detail: "threshold trade-offs" },
    { label: "Splits", topicId: "splits-cross-validation-leakage", detail: "avoid leakage" },
    { label: "Experiments", topicId: "ab-testing", detail: "causal decisions" },
  ],
};

export function WorkspaceView({
  page,
  progress,
  mode,
  onSetMode,
  onOpenTopic,
  onAnswer,
}: {
  page: PageId;
  progress: ProgressState;
  mode: StudyMode;
  onSetMode: (mode: StudyMode) => void;
  onOpenTopic: (topicId: string) => void;
  onAnswer: (question: Question, correct: boolean) => void;
}) {
  switch (page) {
    case "overview": return <OverviewView progress={progress} mode={mode} onSetMode={onSetMode} onOpenTopic={onOpenTopic} />;
    case "syllabus": return <SyllabusView progress={progress} onOpenTopic={onOpenTopic} onAnswer={onAnswer} />;
    case "map": return <ConnectionMap onOpenTopic={onOpenTopic} />;
    case "formula-sheet": return <FormulaSheet onOpenTopic={onOpenTopic} />;
    case "glossary": return <GlossaryView onOpenTopic={onOpenTopic} />;
    case "review": return <ReviewQueue progress={progress} onOpenTopic={onOpenTopic} />;
    case "bookmarks": return <BookmarksView progress={progress} onOpenTopic={onOpenTopic} />;
    case "dashboard": return <DashboardView progress={progress} onOpenTopic={onOpenTopic} />;
  }
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function overallPercent(progress: ProgressState, mode: StudyMode) {
  const completed = mode === "revision" ? progress.completedRevision : progress.completedDeep;
  return Math.round((completed.length / topics.length) * 100);
}

function OverviewView({ progress, mode, onSetMode, onOpenTopic }: { progress: ProgressState; mode: StudyMode; onSetMode: (mode: StudyMode) => void; onOpenTopic: (topicId: string) => void }) {
  const firstOpen = topics.find((topic) => !(mode === "revision" ? progress.completedRevision : progress.completedDeep).includes(topic.id)) ?? topics[0];
  const totalCompleted = progress.completedRevision.length;
  const accuracyData = Object.values(progress.questionResults);
  const accuracy = accuracyData.length ? Math.round((accuracyData.filter((item) => item.correct).length / accuracyData.length) * 100) : 0;
  const streak = currentStreak(progress.activeDates);
  return <div className="workspace-view overview-view">
    <div className="overview-topline"><span className="eyebrow">Your study space · notation: column vectors; X is n × d (examples × features)</span><span className="streak-pill"><Flame size={15} />{streak} day{streak === 1 ? "" : "s"} streak</span></div>
    <section className="home-hero"><div className="hero-copy"><span className="hero-kicker"><Sparkles size={14} />MATHFORML · THE ML MATH ROADMAP</span><h1>Understand the math.<br /><em>See it inside the model.</em></h1><p>Focused mathematics for machine learning and deep learning—first the intuition, then the derivation, then the code that uses it.</p><div className="hero-buttons"><button className="button-light" onClick={() => onOpenTopic(firstOpen.id)}>{totalCompleted ? "Continue learning" : "Start your first topic"}<ArrowRight size={15} /></button><div className="mode-choice" role="group" aria-label="Learning mode"><button className={mode === "revision" ? "selected" : ""} onClick={() => onSetMode("revision")}>Revision <small>~10 min</small></button><button className={mode === "deep" ? "selected" : ""} onClick={() => onSetMode("deep")}>Deep <small>30–60 min</small></button></div></div></div><div className="hero-side"><div className="hero-orbit"><div className="orbit-ring ring-one"></div><div className="orbit-ring ring-two"></div><span className="orbit-core">∇</span><span className="orbit-chip chip-a">P(x)</span><span className="orbit-chip chip-b">W·x</span><span className="orbit-chip chip-c">p − y</span></div><div className="hero-side-caption"><b>Math → model</b><span>Follow the connection, not just the formula.</span></div></div></section>
    <div className="stat-strip"><div><span className="stat-icon stat-green"><Layers3 size={16} /></span><span><b>4</b><small>focused modules</small></span></div><div><span className="stat-icon stat-lilac"><BookOpen size={16} /></span><span><b>46</b><small>ML-relevant topics</small></span></div><div><span className="stat-icon stat-peach"><ListChecks size={16} /></span><span><b>{overallPercent(progress, mode)}%</b><small>{mode} path done</small></span></div><div><span className="stat-icon stat-blue"><Target size={16} /></span><span><b>{accuracyData.length ? `${accuracy}%` : "—"}</b><small>practice accuracy</small></span></div><div className="stat-strip-end"><span className="eyebrow">Study rhythm</span><b>{streak ? `${streak} day${streak === 1 ? "" : "s"}` : "Start today"}</b></div></div>
    <div className="section-head-row"><div><span className="eyebrow">A clear path through the math</span><h2>Your four-phase roadmap</h2></div><button className="text-link" onClick={() => onOpenTopic(firstOpen.id)}>Pick up where you left off <ArrowRight size={14} /></button></div>
    <div className="phase-grid">{modules.map((module, index) => {
      const moduleTopics = topicsForModule(module.id);
      const completed = mode === "revision" ? progress.completedRevision : progress.completedDeep;
      const count = moduleTopics.filter((topic) => completed.includes(topic.id)).length;
      const hours = mode === "revision" ? `${Math.round(moduleTopics.length * 10 / 60 * 10) / 10} h` : `${Math.round(moduleTopics.length * 0.75)}–${moduleTopics.length} h`;
      return <button className={`phase-card phase-${module.color}`} key={module.id} onClick={() => onOpenTopic(moduleTopics[0].id)}><div className="phase-card-top"><span>{module.phase}</span><span className="phase-arrow"><ArrowUpRight size={15} /></span></div><h3>{module.title}</h3><p>{module.subtitle}</p><div className="phase-progress"><span><b>{count}</b> / {moduleTopics.length} topics</span><span>{hours} · {mode}</span></div><div className="progress-track"><i style={{ width: `${moduleTopics.length ? count / moduleTopics.length * 100 : 0}%` }} /></div><div className="phase-tags">{moduleTopics.slice(0, 3).map((topic) => <span key={topic.id}>{topic.shortTitle}</span>)}</div></button>;
    })}</div>
    <div className="overview-lower-grid"><section className="continue-card"><div className="continue-card-copy"><span className="eyebrow">Suggested next</span><h3>{firstOpen.title}</h3><p>{firstOpen.revision.whyItMatters}</p><div className="continue-meta"><span><Clock3 size={13} />{mode === "revision" ? "10 min" : "30–60 min"}</span><span>{firstOpen.revision.questions.length} practice questions</span></div><button className="button-primary button-small" onClick={() => onOpenTopic(firstOpen.id)}>Open lesson <ArrowRight size={14} /></button></div><div className="continue-mark"><span>Next</span><b>0{topics.indexOf(firstOpen) + 1}</b><small>of 46</small></div></section><section className="convention-card"><div className="convention-top"><span className="eyebrow">One notation convention</span><span className="convention-symbol">x → X</span></div><h3>Make shapes part of the math.</h3><p>Bold lowercase vectors are columns. The stored data matrix X ∈ ℝⁿˣᵈ keeps examples in rows and features in columns.</p><div className="shape-equation"><span>X</span><b>n × d</b><span className="shape-caption">examples × features</span></div><button className="text-link" onClick={() => onOpenTopic("vectors-matrices")}>Review data shapes <ArrowRight size={14} /></button></section></div>
    <div className="bottom-note"><Lightbulb size={15} /><p>Every topic starts with <b>where it appears in ML and why it matters</b>. Switch to Deep mode any time to derive the result and test its assumptions.</p><button onClick={() => onSetMode(mode === "revision" ? "deep" : "revision")}>Try {mode === "revision" ? "Deep" : "Revision"} mode <ArrowRight size={13} /></button></div>
  </div>;
}

function SyllabusView({ progress, onOpenTopic, onAnswer }: { progress: ProgressState; onOpenTopic: (topicId: string) => void; onAnswer: (question: Question, correct: boolean) => void }) {
  const [selected, setSelected] = useState<ModuleId>("linear-algebra");
  const module = modules.find((item) => item.id === selected) ?? modules[0];
  const moduleTopics = topicsForModule(selected);
  const revisionDone = moduleTopics.filter((topic) => progress.completedRevision.includes(topic.id)).length;
  const deepDone = moduleTopics.filter((topic) => progress.completedDeep.includes(topic.id)).length;
  const capstone = capstoneInfo[selected];
  const capstoneQuestions = capstone.topics.map((id) => topics.find((topic) => topic.id === id)).filter((item): item is Topic => Boolean(item)).map((topic) => topic.revision.questions.find((question) => question.kind === "scenario") ?? topic.revision.questions[0]);
  return <div className="workspace-view">
    <PageHeading eyebrow="Syllabus · checklists & capstones" title="The math your models use." description="A focused path from representations to reliable decisions. Each module has separate revision completion, deep mastery, and an applied mini-project." />
    <div className="module-tabs" role="tablist" aria-label="Syllabus modules">{modules.map((item) => { const items = topicsForModule(item.id); return <button role="tab" aria-selected={selected === item.id} className={`module-tab ${selected === item.id ? "tab-active" : ""}`} key={item.id} onClick={() => setSelected(item.id)}><span className={`module-number number-${item.color}`}>{item.number}</span><span><b>{item.title}</b><small>{items.length} topics</small></span></button>; })}</div>
    <section className={`syllabus-module module-${module.id}`}><div className="syllabus-module-head"><div><span className="eyebrow">{module.phase}</span><h2>{module.title}</h2><p>{module.subtitle}</p></div><div className="module-completion"><span><b>{revisionDone}/{moduleTopics.length}</b><small>revision done</small></span><span><b>{deepDone}/{moduleTopics.length}</b><small>deep complete</small></span></div></div>
      <div className="module-progress-bars"><label>Revision path <span>{Math.round(revisionDone/moduleTopics.length*100)}%</span><i><b style={{ width: `${revisionDone/moduleTopics.length*100}%` }} /></i></label><label>Deep mastery <span>{Math.round(deepDone/moduleTopics.length*100)}%</span><i className="deep-progress"><b style={{ width: `${deepDone/moduleTopics.length*100}%` }} /></i></label></div>
      <div className="topic-checklist">{moduleTopics.map((topic, index) => <article className="syllabus-topic" key={topic.id}><button className="topic-index" onClick={() => onOpenTopic(topic.id)}>{String(index+1).padStart(2,"0")}</button><button className="syllabus-topic-main" onClick={() => onOpenTopic(topic.id)}><b>{topic.title}</b><span>{topic.subtitle}</span></button><div className="topic-hours"><span><Clock3 size={12} />10m</span><span><Sparkles size={12} />30–60m</span></div><div className="topic-checks"><span className={progress.completedRevision.includes(topic.id) ? "check-active" : ""} title="Revision status">{progress.completedRevision.includes(topic.id) ? <Check size={13} /> : "R"}</span><span className={progress.completedDeep.includes(topic.id) ? "check-deep-active" : ""} title="Deep status">{progress.completedDeep.includes(topic.id) ? <Check size={13} /> : "D"}</span></div></article>)}</div>
    </section>
    <section className="capstone-card"><div className="capstone-intro"><span className="capstone-mark"><GraduationCap size={21} /></span><div><span className="eyebrow">Module capstone · {capstone.time}</span><h2>{capstone.title}</h2><p>{capstone.description}</p><div className="capstone-deliverable"><b>Deliverable</b><span>{capstone.deliverable}</span></div></div></div><div className="capstone-practice"><span className="eyebrow">Mixed quiz · {capstoneQuestions.length} questions</span><p>Connect ideas across this module before you build.</p><PracticePanel topicId={`capstone-${selected}`} questions={capstoneQuestions} results={progress.questionResults} onAnswer={onAnswer} /></div></section>
  </div>;
}

function ConnectionMap({ onOpenTopic }: { onOpenTopic: (topicId: string) => void }) {
  return <div className="workspace-view">
    <PageHeading eyebrow="Math → ML connection map" title="Follow the mathematics into a model." description="The same mathematical objects reappear across architectures. Choose a node to open the lesson that explains the link." />
    <div className="map-legend"><span><i className="legend-dot legend-violet" />Represent the data</span><span><i className="legend-dot legend-blue" />Differentiate & learn</span><span><i className="legend-dot legend-amber" />Model uncertainty</span><span><i className="legend-dot legend-rose" />Validate the result</span></div>
    <div className="connection-map-board"><svg className="map-lines" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true"><path d="M145 115 C310 40 360 160 495 110" /><path d="M145 305 C315 390 375 245 495 305" /><path d="M505 110 C655 40 725 175 855 115" /><path d="M505 305 C660 390 730 250 855 305" /><path d="M145 115 C280 220 360 250 495 305" /><path d="M505 110 C650 210 710 220 855 305" /></svg><div className="map-columns">{connectionClusters.map((cluster) => <section className={`map-column map-${cluster.color}`} key={cluster.label}><div className="map-column-head"><span className="map-bubble">{cluster.label === "Represent" ? "01" : cluster.label === "Differentiate" ? "02" : cluster.label === "Model uncertainty" ? "03" : "04"}</span><div><b>{cluster.label}</b><small>{cluster.label === "Represent" ? "Linear algebra" : cluster.label === "Differentiate" ? "Calculus & optimization" : cluster.label === "Model uncertainty" ? "Probability" : "Statistics"}</small></div></div><div className="map-node-list">{mapItems[cluster.label].map((item) => <button key={item.topicId} className="map-node" onClick={() => onOpenTopic(item.topicId)}><span><b>{item.label}</b><small>{item.detail}</small></span><ArrowUpRight size={14} /></button>)}</div></section>)}</div><div className="map-center-caption"><span className="map-center-icon">ƒ</span><div><b>Machine learning model</b><span>data → representation → objective → decision</span></div></div></div>
    <div className="map-insight-row"><div><span className="insight-number">01</span><p>Linear algebra gives the model <b>coordinates and transformations.</b></p></div><div><span className="insight-number">02</span><p>Calculus turns prediction error into <b>parameter updates.</b></p></div><div><span className="insight-number">03</span><p>Probability and statistics say <b>what to trust—and when.</b></p></div></div>
  </div>;
}

function FormulaSheet({ onOpenTopic }: { onOpenTopic: (topicId: string) => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => topics.flatMap((topic) => topic.revision.formulas.map((formula) => ({ topic, formula }))).filter(({ topic, formula }) => `${topic.title} ${formula.label} ${formula.latex} ${Object.values(formula.variables).join(" ")}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <div className="workspace-view formula-sheet-view">
    <PageHeading eyebrow="Formula cheat sheet · printable" title="The working equations." description="Filter formulas by name, symbol, or meaning. Every equation links back to the ML topic where it earns its keep." action={<button className="button-secondary" onClick={() => window.print()}><Download size={15} />Print sheet</button>} />
    <label className="inline-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search formulas, symbols, or meanings…" /><span>{filtered.length} formulas</span></label>
    {modules.map((module) => {
      const rows = filtered.filter(({ topic }) => topic.moduleId === module.id);
      if (!rows.length) return null;
      return <section className="formula-module-group" key={module.id}><div className="formula-module-title"><span className={`module-number number-${module.color}`}>{module.number}</span><div><span className="eyebrow">Module</span><h2>{module.title}</h2></div><span>{rows.length} equations</span></div><div className="formula-sheet-grid">{rows.map(({ topic, formula }, index) => <button className="formula-sheet-item" key={formula.id} onClick={() => onOpenTopic(topic.id)}><FormulaCard formula={formula} index={index} /><span className="formula-source">{topic.shortTitle}<ArrowUpRight size={13} /></span></button>)}</div></section>;
    })}
    {!filtered.length && <div className="empty-state"><Search size={23} /><b>No formula matches that filter.</b><span>Try a symbol such as KL, ∇, IoU, or softmax.</span></div>}
  </div>;
}

function GlossaryView({ onOpenTopic }: { onOpenTopic: (topicId: string) => void }) {
  const [query, setQuery] = useState("");
  const results = glossary.filter((entry) => `${entry.term} ${entry.symbol} ${entry.definition}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="workspace-view"><PageHeading eyebrow="Glossary · notation & concepts" title="A quick translation layer." description="Search the symbols and terms used across MathForML. Each definition points to a lesson that derives it in context." /><label className="inline-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a term, symbol, or phrase…" /><span>{results.length} terms</span></label><div className="glossary-grid">{results.map((entry) => <button className="glossary-card" key={entry.term} onClick={() => onOpenTopic(entry.topicId)}><div><span className="glossary-term">{entry.term}</span><span className="glossary-symbol">{entry.symbol}</span></div><p>{entry.definition}</p><span className="glossary-link">Open lesson <ArrowRight size={13} /></span></button>)}</div>{!results.length && <div className="empty-state">No terms found. Try a shorter search.</div>}</div>;
}

function ReviewQueue({ progress, onOpenTopic }: { progress: ProgressState; onOpenTopic: (topicId: string) => void }) {
  const weak = Object.entries(progress.questionResults).filter(([, result]) => !result.correct || isDue(result)).map(([id, result]) => {
    const questionTopic = topics.find((topic) => id.startsWith(`${topic.id}-`));
    const question = questionTopic ? [...questionTopic.revision.questions, ...questionTopic.deep.extraQuestions].find((item) => item.id === id) : undefined;
    return { id, result, questionTopic, question };
  }).filter((item) => item.question && item.questionTopic).sort((a, b) => Number(a.result.correct) - Number(b.result.correct) || new Date(a.result.nextReview).getTime() - new Date(b.result.nextReview).getTime());
  return <div className="workspace-view"><PageHeading eyebrow="Spaced repetition · local review" title="Bring weak ideas back on time." description="Incorrect and due questions collect here. A correct retry schedules the idea for a later review; misses return sooner." action={<span className="queue-count"><Clock3 size={14} />{weak.length} due or weak</span>} />{weak.length ? <div className="review-list">{weak.map(({ id, questionTopic, question, result }) => questionTopic && question && <article className="review-card" key={id}><div className="review-card-head"><span className={`module-chip module-${questionTopic.moduleId}`}>{questionTopic.shortTitle}</span><span className={result.correct ? "review-due" : "review-weak"}>{result.correct ? "Due for a refresh" : "Needs another pass"}</span></div><h3>{question.prompt}</h3><p>{question.hint}</p><div className="review-card-footer"><span>{question.difficulty} · {result.attempts} attempt{result.attempts === 1 ? "" : "s"}</span><button className="button-secondary button-small" onClick={() => onOpenTopic(questionTopic.id)}>Open topic & retry <ArrowRight size={14} /></button></div></article>)}</div> : <div className="empty-state review-empty"><span className="empty-check"><Check size={24} /></span><h3>Your review queue is clear.</h3><p>Miss a practice question or let a correct answer become due, and it will return here.</p><button className="button-primary button-small" onClick={() => onOpenTopic(topics[0].id)}>Practice a topic <ArrowRight size={14} /></button></div>}</div>;
}

function BookmarksView({ progress, onOpenTopic }: { progress: ProgressState; onOpenTopic: (topicId: string) => void }) {
  const saved = progress.bookmarks.map((id) => topics.find((topic) => topic.id === id)).filter((item): item is Topic => Boolean(item));
  return <div className="workspace-view"><PageHeading eyebrow="Saved topics · your personal shelf" title="Keep the ideas worth revisiting close." description="Bookmarks are private to this browser and stay connected to each topic's formulas, notes, and practice." action={<span className="queue-count"><BookMarked size={14} />{saved.length} saved</span>} />{saved.length ? <div className="bookmark-grid">{saved.map((topic) => <button className="bookmark-card" onClick={() => onOpenTopic(topic.id)} key={topic.id}><span className={`module-chip module-${topic.moduleId}`}>{topic.moduleId.replace("-", " ")}</span><h3>{topic.title}</h3><p>{topic.subtitle}</p><span className="bookmark-card-foot">Open saved lesson <ArrowRight size={13} /></span></button>)}</div> : <div className="empty-state"><BookMarked size={24} /><h3>Your shelf is empty for now.</h3><p>Open a topic and tap the bookmark icon to save it here.</p><button className="button-primary button-small" onClick={() => onOpenTopic("chain-rule-backprop")}>Explore a topic <ArrowRight size={14} /></button></div>}</div>;
}

function DashboardView({ progress, onOpenTopic }: { progress: ProgressState; onOpenTopic: (topicId: string) => void }) {
  const attempted = Object.values(progress.questionResults);
  const accuracy = attempted.length ? Math.round(attempted.filter((item) => item.correct).length / attempted.length * 100) : 0;
  const weak = topics.map((topic) => {
    const rows = Object.entries(progress.questionResults).filter(([id]) => id.startsWith(`${topic.id}-`)).map(([, result]) => result);
    return { topic, rows, accuracy: rows.length ? rows.filter((item) => item.correct).length / rows.length : 1 };
  }).filter((item) => item.rows.length && item.accuracy < 0.75).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
  const cells = topics.map((topic) => ({ topic, level: progress.ladder[topic.id] ?? 0 }));
  return <div className="workspace-view"><PageHeading eyebrow="Dashboard · local study analytics" title="Your understanding, at a glance." description="Progress stays on this device. Use the heatmap and weak-topic list to choose a useful next study session." />
    <div className="dashboard-kpis"><div className="dashboard-kpi"><span className="kpi-icon kpi-flame"><Flame size={18} /></span><span><small>Current streak</small><b>{currentStreak(progress.activeDates)} days</b></span></div><div className="dashboard-kpi"><span className="kpi-icon kpi-sage"><ListChecks size={18} /></span><span><small>Revision completion</small><b>{overallPercent(progress, "revision")}%</b></span></div><div className="dashboard-kpi"><span className="kpi-icon kpi-blue"><Target size={18} /></span><span><small>Quiz accuracy</small><b>{attempted.length ? `${accuracy}%` : "No attempts yet"}</b></span></div><div className="dashboard-kpi"><span className="kpi-icon kpi-peach"><Clock3 size={18} /></span><span><small>Review queue</small><b>{Object.values(progress.questionResults).filter((result) => !result.correct || isDue(result)).length} items</b></span></div></div>
    <section className="heatmap-card"><div className="heatmap-heading"><div><span className="eyebrow">Understanding ladder · 46 topics</span><h2>Level heatmap</h2><p>Each square is a topic; deeper color means more levels earned.</p></div><div className="heatmap-legend"><span>Not started</span>{[1,2,3,4].map((level) => <i className={`heat-${level}`} key={level} title={`Level ${level}`} />)}</div></div><div className="heatmap-modules">{modules.map((module) => <div className="heatmap-module" key={module.id}><div><b>{module.number}</b><span>{module.title}</span></div><div className="heatmap-cells">{cells.filter((item) => item.topic.moduleId === module.id).map(({ topic, level }) => <button key={topic.id} className={`heat-cell heat-${level}`} title={`${topic.shortTitle}: level ${level}/4`} aria-label={`${topic.shortTitle}: level ${level} of 4`} onClick={() => onOpenTopic(topic.id)} />)}</div></div>)}</div></section>
    <div className="dashboard-lower"><section className="weak-topics-card"><div className="section-head-row"><div><span className="eyebrow">Practice signal</span><h2>Topics to revisit</h2></div><span className="queue-count">{weak.length} weak</span></div>{weak.length ? <div className="weak-topic-list">{weak.map(({ topic, accuracy: score, rows }) => <button key={topic.id} onClick={() => onOpenTopic(topic.id)}><span className="weak-topic-mark"><ArrowDownRight size={15} /></span><span><b>{topic.shortTitle}</b><small>{rows.length} attempts · {Math.round(score*100)}% correct</small></span><div className="weak-progress"><i style={{ width: `${score*100}%` }} /></div><ArrowRight size={14} /></button>)}</div> : <div className="empty-inline"><Check size={16} />No weak topic signal yet. Practice questions will surface patterns here.</div>}</section><section className="module-dashboard-card"><div className="section-head-row"><div><span className="eyebrow">Progress by module</span><h2>Revision vs deep</h2></div></div>{modules.map((module) => { const items = topicsForModule(module.id); const revision = items.filter((topic) => progress.completedRevision.includes(topic.id)).length; const deep = items.filter((topic) => progress.completedDeep.includes(topic.id)).length; return <div className="module-dashboard-row" key={module.id}><span>{module.number}</span><b>{module.title}</b><div className="dual-bars"><i><b style={{ width: `${revision/items.length*100}%` }} /></i><i className="dual-deep"><b style={{ width: `${deep/items.length*100}%` }} /></i></div><small>{revision}/{items.length}</small></div>; })}<div className="dual-legend"><span><i />Revision</span><span><i />Deep</span></div></section></div>
    <section className="activity-card"><div><span className="eyebrow">Study consistency</span><h2>Recent activity</h2><p>One active day is recorded when you answer a practice question or mark a lesson complete.</p></div><div className="activity-grid">{Array.from({ length: 28 }, (_, index) => { const day = new Date(); day.setDate(day.getDate() - (27-index)); const stamp = day.toISOString().slice(0,10); const active = progress.activeDates.includes(stamp); return <span title={`${stamp}${active ? " · studied" : ""}`} className={active ? "activity-on" : ""} key={stamp} />; })}</div></section>
  </div>;
}
