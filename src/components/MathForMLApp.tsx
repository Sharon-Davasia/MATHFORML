"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowRight, BookMarked, BookOpen, Check, ChevronDown, CircleHelp, Command, FileText, Flame, GraduationCap, Home, Layers3, ListChecks, Menu, Moon, PanelLeftClose, Search, Share2, Sun, Target, X } from "lucide-react";
import { glossary, modules, topics, topicById, topicsForModule } from "@/content";
import type { Question } from "@/content/schema";
import { currentStreak, defaultProgress, loadProgress, recordActivity, recordQuestion, saveProgress, type ProgressState, type StudyMode } from "@/lib/progress";
import { LessonView } from "./LessonView";
import { WorkspaceView, type PageId } from "./WorkspaceViews";

const primaryLinks: { id: PageId; label: string; icon: typeof Home; group: string }[] = [
  { id: "overview", label: "Overview", icon: Home, group: "LEARN" },
  { id: "syllabus", label: "Syllabus", icon: ListChecks, group: "LEARN" },
  { id: "map", label: "Math → ML map", icon: Share2, group: "LEARN" },
  { id: "formula-sheet", label: "Formula sheet", icon: FileText, group: "REFERENCE" },
  { id: "glossary", label: "Glossary", icon: CircleHelp, group: "REFERENCE" },
  { id: "review", label: "Review queue", icon: Activity, group: "YOUR STUDY" },
  { id: "bookmarks", label: "Bookmarks", icon: BookMarked, group: "YOUR STUDY" },
  { id: "dashboard", label: "Dashboard", icon: Target, group: "YOUR STUDY" },
];

interface SearchHit { id: string; title: string; detail: string; type: string; topicId: string }

export function MathForMLApp() {
  const [progress, setProgress] = useState<ProgressState>(defaultProgress);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState<PageId>("overview");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProgress(loadProgress());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) saveProgress(progress);
  }, [progress, ready]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSearchFocused(false);
        setQuery("");
        setMobileNavOpen(false);
        searchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const mode = progress.mode;
  const activeTopic = selectedTopic ? topicById[selectedTopic] : undefined;
  const hits = useMemo<SearchHit[]>(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    const topicHits = topics.filter((topic) => {
      const content = [topic.title, topic.shortTitle, topic.subtitle, topic.revision.whyItMatters, ...topic.tags, ...topic.revision.formulas.flatMap((formula) => [formula.label, formula.latex, ...Object.entries(formula.variables).flat()]), ...topic.deep.derivations.flatMap((derivation) => [derivation.title, derivation.goal])].join(" ").toLowerCase();
      return content.includes(needle);
    }).slice(0, 8).map((topic) => ({ id: topic.id, title: topic.title, detail: topic.subtitle, type: topic.moduleId.replace("-", " "), topicId: topic.id }));
    const termHits = glossary.filter((entry) => `${entry.term} ${entry.symbol} ${entry.definition}`.toLowerCase().includes(needle)).slice(0, 4).map((entry) => ({ id: `term-${entry.term}`, title: entry.term, detail: `${entry.symbol} · ${entry.definition}`, type: "glossary", topicId: entry.topicId }));
    return [...topicHits, ...termHits].slice(0, 10);
  }, [query]);
  const dueCount = Object.values(progress.questionResults).filter((result) => !result.correct || new Date(result.nextReview).getTime() <= Date.now()).length;
  const revisionPercent = Math.round((progress.completedRevision.length / topics.length) * 100);
  const streak = currentStreak(progress.activeDates);

  function openTopic(topicId: string) {
    if (!topicId) {
      setSelectedTopic(null);
      setPage("overview");
      return;
    }
    setSelectedTopic(topicId);
    setPage("syllabus");
    setQuery("");
    setSearchFocused(false);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openPage(id: PageId) {
    setPage(id);
    setSelectedTopic(null);
    setMobileNavOpen(false);
    setSearchFocused(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function setGlobalMode(next: StudyMode) {
    setProgress((previous) => recordActivity({ ...previous, mode: next }));
  }
  function handleAnswer(question: Question, correct: boolean) {
    const owner = topics.find((topic) => question.id.startsWith(`${topic.id}-`));
    if (!owner) return;
    setProgress((previous) => recordQuestion(previous, question.id, owner.id, correct, question.kind, question.difficulty));
  }
  function markComplete(topicId: string, selectedMode: StudyMode) {
    setProgress((previous) => {
      const key = selectedMode === "revision" ? "completedRevision" : "completedDeep";
      const collection = previous[key];
      return recordActivity({ ...previous, [key]: collection.includes(topicId) ? collection : [...collection, topicId] });
    });
  }
  function toggleBookmark(topicId: string) {
    setProgress((previous) => {
      const bookmarks = previous.bookmarks.includes(topicId) ? previous.bookmarks.filter((item) => item !== topicId) : [...previous.bookmarks, topicId];
      return recordActivity({ ...previous, bookmarks });
    });
  }
  function setTopicMode(topicId: string, nextMode: StudyMode) {
    setProgress((previous) => recordActivity({ ...previous, topicModes: { ...previous.topicModes, [topicId]: nextMode } }));
  }
  function useGlobalMode(topicId: string) {
    setProgress((previous) => {
      const topicModes = { ...previous.topicModes };
      delete topicModes[topicId];
      return { ...previous, topicModes };
    });
  }
  function updateNote(topicId: string, note: string) {
    setProgress((previous) => ({ ...previous, notes: { ...previous.notes, [topicId]: note } }));
  }
  function selectSearchHit(hit: SearchHit) {
    openTopic(hit.topicId);
  }

  return (
    <div className="app-shell" data-theme={progress.theme}>
      {mobileNavOpen && <button aria-label="Close navigation" className="mobile-nav-scrim" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`app-sidebar ${mobileNavOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="brand-row"><button className="brand-lockup" onClick={() => openPage("overview")} aria-label="MathForML home"><span className="brand-mark"><span>∇</span><i /></span><span className="brand-text">math<span>for</span>ml<small>THE STUDY STUDIO</small></span></button><button className="sidebar-close" onClick={() => setMobileNavOpen(false)} aria-label="Close sidebar"><X size={18} /></button></div>
        <div className="sidebar-note"><span className="sidebar-note-icon"><SparkleMark /></span><span><b>Math with a reason.</b><small>Only what ML actually uses.</small></span></div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {(["LEARN", "REFERENCE", "YOUR STUDY"] as const).map((group) => <div className="nav-group" key={group}><span className="nav-group-label">{group}</span>{primaryLinks.filter((link) => link.group === group).map((link) => {
            const Icon = link.icon;
            const active = page === link.id && !activeTopic;
            return <button key={link.id} className={`nav-link ${active ? "nav-link-active" : ""}`} onClick={() => openPage(link.id)}><Icon size={17} strokeWidth={active ? 2.2 : 1.8} /><span>{link.label}</span>{link.id === "review" && dueCount > 0 && <em>{dueCount}</em>}</button>;
          })}</div>)}
        </nav>
        <div className="sidebar-modules"><div className="sidebar-module-head"><span className="nav-group-label">THE ROADMAP</span><button title="Open syllabus" onClick={() => openPage("syllabus")}><ArrowRight size={13} /></button></div>{modules.map((module) => <button className="module-quick-link" key={module.id} onClick={() => openPage("syllabus")}><span className={`module-dot dot-${module.color}`} /><span>{module.title}</span><small>{topicsForModule(module.id).length}</small></button>)}</div>
        <div className="sidebar-bottom"><div className="sidebar-progress-head"><span>Your revision path</span><b>{revisionPercent}%</b></div><div className="sidebar-progress-track"><i style={{ width: `${revisionPercent}%` }} /></div><div className="sidebar-profile"><span className="profile-avatar">M</span><span><b>My study space</b><small>Saved on this device</small></span><span className="profile-streak"><Flame size={13} />{streak}</span></div></div>
      </aside>

      <div className="app-main">
        <header className="topbar"><div className="topbar-left"><button className="mobile-menu-button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumb-top"><span>STUDY SPACE</span><span>·</span><b>{activeTopic ? activeTopic.shortTitle : primaryLinks.find((link) => link.id === page)?.label}</b></div></div>
          <div className="topbar-actions"><div className={`global-search ${searchFocused ? "search-focused" : ""}`}><Search size={16} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 160)} placeholder="Search topics, formulas, symbols…" aria-label="Search topics, formulas, glossary" /><kbd><Command size={10} /> K</kbd>{searchFocused && query.trim().length >= 2 && <div className="search-results" role="listbox">{hits.length ? hits.map((hit) => <button key={hit.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectSearchHit(hit)} role="option"><span className="search-hit-icon"><Search size={14} /></span><span><b>{hit.title}</b><small>{hit.detail}</small></span><em>{hit.type}</em></button>) : <div className="search-no-results">No matches. Try a topic name or a formula symbol.</div>}</div>}</div>
            <div className="global-mode-control" role="group" aria-label="Global learning mode"><button className={mode === "revision" ? "mode-active" : ""} onClick={() => setGlobalMode("revision")}>Revision</button><button className={mode === "deep" ? "mode-active" : ""} onClick={() => setGlobalMode("deep")}>Deep</button></div>
            <button className="theme-toggle" onClick={() => setProgress((previous) => ({ ...previous, theme: previous.theme === "light" ? "dark" : "light" }))} aria-label={`Switch to ${progress.theme === "light" ? "dark" : "light"} mode`}>{progress.theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</button>
          </div>
        </header>
        <main className="app-content" id="main-content">
          {activeTopic ? <LessonView topic={activeTopic} mode={progress.topicModes[activeTopic.id] ?? progress.mode} globalMode={progress.mode} hasOverride={Boolean(progress.topicModes[activeTopic.id])} onSetMode={(nextMode) => setTopicMode(activeTopic.id, nextMode)} onUseGlobal={() => useGlobalMode(activeTopic.id)} bookmarked={progress.bookmarks.includes(activeTopic.id)} onToggleBookmark={() => toggleBookmark(activeTopic.id)} note={progress.notes[activeTopic.id] ?? ""} onNoteChange={(note) => updateNote(activeTopic.id, note)} completedRevision={progress.completedRevision.includes(activeTopic.id)} completedDeep={progress.completedDeep.includes(activeTopic.id)} ladderLevel={progress.ladder[activeTopic.id] ?? 0} results={progress.questionResults} onAnswer={handleAnswer} onComplete={(selectedMode) => markComplete(activeTopic.id, selectedMode)} onOpenTopic={openTopic} previous={getAdjacentTopic(activeTopic.id, -1)} next={getAdjacentTopic(activeTopic.id, 1)} /> : <WorkspaceView page={page} progress={progress} mode={progress.mode} onSetMode={setGlobalMode} onOpenTopic={openTopic} onAnswer={handleAnswer} />}
        </main>
        <footer className="global-footer"><span>MathForML <i>·</i> original, ML-oriented mathematics</span><span>Private by default · your progress stays in this browser</span></footer>
      </div>
    </div>
  );
}

function getAdjacentTopic(topicId: string, direction: -1 | 1) {
  const current = topicById[topicId];
  if (!current) return undefined;
  const moduleTopics = topicsForModule(current.moduleId);
  const index = moduleTopics.findIndex((topic) => topic.id === topicId);
  return moduleTopics[index + direction];
}

function SparkleMark() {
  return <span className="sparkle-mark">✳</span>;
}
