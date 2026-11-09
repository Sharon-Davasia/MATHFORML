"use client";

import { useState } from "react";
import { Check, ChevronDown, Lightbulb, RotateCcw, X } from "lucide-react";
import type { Question } from "@/content/schema";
import type { QuestionResult } from "@/lib/progress";

type ResponseState = { selected?: string; hint?: boolean; reveal?: boolean; response?: string; submitted?: boolean };

export function PracticePanel({
  topicId,
  questions,
  results,
  onAnswer,
}: {
  topicId: string;
  questions: Question[];
  results: Record<string, QuestionResult>;
  onAnswer: (question: Question, correct: boolean) => void;
}) {
  const [responses, setResponses] = useState<Record<string, ResponseState>>({});
  const score = questions.reduce((count, question) => count + (results[question.id]?.correct ? 1 : 0), 0);
  const attempted = questions.filter((question) => results[question.id]).length;
  function update(id: string, patch: Partial<ResponseState>) {
    setResponses((old) => ({ ...old, [id]: { ...old[id], ...patch } }));
  }
  function answerMcq(question: Question, answer: string) {
    update(question.id, { selected: answer, submitted: true });
    onAnswer(question, answer === question.answer);
  }
  function retry(question: Question) {
    update(question.id, { selected: undefined, submitted: false, reveal: false, response: "" });
  }
  return (
    <section className="practice-panel" id={`${topicId}-practice`}>
      <div className="practice-header">
        <div><span className="eyebrow">Practice · {questions.length} original questions</span><h3>Make the connection stick</h3><p>Work from concept to derivation to implementation. Hard-tier questions ask you to name assumptions, not just recall a formula.</p></div>
        <div className="quiz-score"><strong>{score}<span>/{questions.length}</span></strong><small>{attempted} attempted</small></div>
      </div>
      <div className="question-list">
        {questions.map((question, index) => {
          const response = responses[question.id] ?? {};
          const saved = results[question.id];
          const selectedCorrect = response.selected === question.answer;
          return (
            <article className={`question-card ${saved ? (saved.correct ? "question-correct" : "question-review") : ""}`} key={question.id}>
              <div className="question-top"><span className="question-number">{String(index + 1).padStart(2, "0")}</span><span className={`difficulty-tag difficulty-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span><span className="question-kind">{question.kind}</span>{saved && <span className={`question-status ${saved.correct ? "status-good" : "status-review"}`}>{saved.correct ? <><Check size={12} /> logged</> : <><RotateCcw size={12} /> review</>}</span>}</div>
              <h4>{question.prompt}</h4>
              {question.options ? (
                <div className="answer-options" role="group" aria-label={`Answer question ${index + 1}`}>
                  {question.options.map((option, choiceIndex) => {
                    const chosen = response.selected === option;
                    const right = option === question.answer;
                    return <button type="button" key={option} disabled={response.submitted} onClick={() => answerMcq(question, option)} className={`answer-option ${chosen ? (right ? "option-correct" : "option-wrong") : response.submitted && right ? "option-correct-reveal" : ""}`}><span>{String.fromCharCode(65 + choiceIndex)}</span>{option}{chosen && (right ? <Check size={15} /> : <X size={15} />)}</button>;
                  })}
                </div>
              ) : (
                <div className="free-response">
                  <textarea aria-label="Your response" value={response.response ?? ""} onChange={(event) => update(question.id, { response: event.target.value })} placeholder="Write a short explanation, derivation, interpretation, or code check…" rows={3} />
                  {response.reveal ? <div className="model-answer"><span>Model answer</span><p>{question.answer}</p><div className="self-grade"><button type="button" className="self-grade-good" onClick={() => { update(question.id, { submitted: true }); onAnswer(question, true); }}><Check size={14} /> I could explain this</button><button type="button" className="self-grade-review" onClick={() => { update(question.id, { submitted: true }); onAnswer(question, false); }}><RotateCcw size={14} /> Add to review</button></div></div> : <button type="button" className="reveal-answer" onClick={() => update(question.id, { reveal: true })}>Compare with model answer <ChevronDown size={14} /></button>}
                </div>
              )}
              {response.hint && <p className="question-hint"><Lightbulb size={14} />{question.hint}</p>}
              {response.submitted && <div className={`feedback-panel ${selectedCorrect || (!question.options && saved?.correct) ? "feedback-good" : "feedback-review"}`}><strong>{selectedCorrect || (!question.options && saved?.correct) ? "Good reasoning" : "Keep this in your review queue"}</strong><p>{question.explanation}</p><span className="misconception-line"><b>Watch for:</b> {question.misconception}</span></div>}
              <div className="question-actions"><button type="button" className="hint-button" onClick={() => update(question.id, { hint: !response.hint })}><Lightbulb size={13} />{response.hint ? "Hide hint" : "Show hint"}</button>{(response.submitted || saved) && <button type="button" className="hint-button" onClick={() => retry(question)}><RotateCcw size={13} />Retry</button>}{saved && <span className="attempt-count">{saved.attempts} attempt{saved.attempts === 1 ? "" : "s"}</span>}</div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
