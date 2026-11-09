import type { DerivationStep, Formula, Topic, WidgetId } from "./schema";
import type { TopicSeed } from "./factory";

export type TopicDraft = Pick<TopicSeed,
  "id" | "moduleId" | "title" | "shortTitle" | "subtitle" | "why" | "intuition" | "formulas" | "example" | "definition" | "connectionAnswer" | "snippet"
> & Partial<Omit<TopicSeed,
  "id" | "moduleId" | "title" | "shortTitle" | "subtitle" | "why" | "intuition" | "formulas" | "example" | "definition" | "connectionAnswer" | "snippet"
>>;

export function defineTopic(draft: TopicDraft): TopicSeed {
  const basis = draft.formulas[0]?.latex ?? "f(x)";
  const short = draft.shortTitle;
  const mathText = (value: string) => `\\text{${value.replace(/[{}\\%$#&_]/g, " ").replace(/\\s+/g, " ").slice(0, 115)}}`;
  const bridge = draft.formulas[1]?.latex ?? mathText(draft.example.solution[0] ?? draft.example.prompt);
  const result = draft.formulas.at(-1)?.latex ?? basis;
  const derivationExplanation = draft.deriveAnswer ?? `${draft.definition} ${draft.connectionAnswer}`;
  const commonSteps: DerivationStep[] = [
    { label: "Start from the model quantity", latex: basis, explanation: draft.definition, why: `The definition tells us exactly what ${short} measures or computes. ${draft.why}` },
    { label: "Substitute a concrete ML case", latex: bridge, explanation: derivationExplanation, why: `The worked values make the symbols operational: ${draft.example.solution.join(" ")}` },
    { label: "Interpret the result in the pipeline", latex: result, explanation: draft.connectionAnswer, why: `This conclusion is useful only under its assumptions. ${draft.failureAnswer ?? "Check the data scale and modeling conditions before using it."}` },
  ];
  const defaultFormula: Formula = {
    id: `${draft.id}-definition`, label: "Working definition", latex: basis,
    variables: {}, mlNote: draft.why,
  };
  const enriched: TopicSeed = {
    id: draft.id,
    moduleId: draft.moduleId,
    title: draft.title,
    shortTitle: draft.shortTitle,
    subtitle: draft.subtitle,
    tags: draft.tags ?? [draft.moduleId.replace("-", " "), "machine learning"],
    prerequisites: draft.prerequisites ?? [],
    downstream: draft.downstream ?? [],
    widget: (draft.widget ?? "derivation-stepper") as WidgetId,
    why: draft.why,
    intuition: draft.intuition,
    formulas: draft.formulas.length ? draft.formulas : [defaultFormula],
    walkthrough: draft.walkthrough ?? [
      `Represent the model quantities using ${short}.`,
      "Substitute the current batch, parameter values, and objective explicitly.",
      `Use the resulting quantity to decide how the model predicts, learns, or is evaluated: ${draft.connectionAnswer}`,
    ],
    example: draft.example,
    prompt: draft.prompt ?? `Which statement best describes ${short} in a machine-learning system?`,
    definition: draft.definition,
    scenario: draft.scenario ?? `During training, a team changes the inputs to ${short}. What should they inspect before trusting the new model behavior?`,
    scenarioAnswer: draft.scenarioAnswer ?? draft.connectionAnswer,
    derive: draft.derive ?? `Starting from the displayed definition of ${short}, explain how it becomes the computation used in an ML model.`,
    deriveAnswer: draft.deriveAnswer ?? `${draft.formulas.map((formula) => `${formula.label}: ${formula.latex}`).join("; ")} ${draft.connectionAnswer}`,
    interpret: draft.interpret ?? `A training run reports a value associated with ${short}. What does that value say about the model, and what context is still needed?`,
    interpretAnswer: draft.interpretAnswer ?? `${draft.why} Interpret the value together with the data scale, units, assumptions, and the objective it belongs to.`,
    codeQuestion: draft.codeQuestion ?? `In the snippet below, identify the line that implements ${short} and name one shape or numerical check you would add.`,
    codeAnswer: draft.codeAnswer ?? `${draft.snippet.split("\n").at(-1) ?? ""} Check that the implementation matches the convention in the formula and compare it against the small worked example.`,
    belief: draft.belief ?? `${short} works equally well regardless of feature scale, data assumptions, or numerical precision.`,
    correction: draft.correction ?? `${draft.why} Its useful behavior depends on explicit assumptions and a consistent data/parameter convention; inspect the edge cases before applying it blindly.`,
    failure: draft.failure ?? `What can go wrong when ${short} is used with poorly scaled, scarce, or assumption-violating data?`,
    failureAnswer: draft.failureAnswer ?? `${draft.edgeCases?.[0] ?? "Poor conditioning or violated assumptions"} can make the result unstable or misleading. Diagnose the data and the mathematical condition before changing the model.`,
    proofQuestion: draft.proofQuestion ?? `Give a short proof or derivation for the key ${short} result shown above.`,
    proofAnswer: draft.proofAnswer ?? `${draft.proof ?? "Start from the definition, substitute the model quantities, and simplify without changing the assumptions."} The result is useful in ML because ${draft.why}`,
    connectionQuestion: draft.connectionQuestion ?? `Trace how ${short} changes a concrete model prediction, parameter update, or evaluation.`,
    connectionAnswer: draft.connectionAnswer,
    snippet: draft.snippet,
    deepSteps: draft.deepSteps ?? commonSteps,
    deepDerivations: draft.deepDerivations,
    deepStory: draft.deepStory ?? `A practical ML need motivates ${short}: ${draft.why} The mathematical definition makes that need measurable, differentiable, or testable rather than relying on a verbal heuristic.`,
    geometry: draft.geometry ?? `${draft.intuition} In a low-dimensional picture, track how the relevant point, direction, surface, or distribution moves when one input changes. The higher-dimensional formula preserves that same relationship.`,
    proof: draft.proof ?? `The argument begins with the definition ${basis}. Substitute the model's data and parameters, then use the stated assumptions to obtain the displayed ML quantity. If an assumption is removed, the conclusion need not hold.`,
    assumptions: draft.assumptions ?? ["The data and symbols follow the stated shape/parameter convention.", "The numerical calculation is performed in a stable range and the modeling assumptions fit the observed data."],
    alternative: draft.alternative ?? { name: "A simpler heuristic", why: `It may be cheaper, but it hides the structure captured by ${short}. Use it only when its assumptions and failure cost are acceptable.` },
    edgeCases: draft.edgeCases ?? ["Very small or very large inputs can expose floating-point or finite-sample errors.", "Correlated, badly scaled, or out-of-distribution data can invalidate the interpretation."],
    prerequisitesText: draft.prerequisitesText ?? draft.prerequisites ?? ["Basic algebra and vector notation"],
    downstreamText: draft.downstreamText ?? draft.downstream ?? ["Model objectives and evaluation"],
    models: draft.models ?? [`${short} appears in parameterized prediction pipelines`, "Training objectives and representation learning", "Diagnostics when model assumptions or data scale change"],
    mistakes: draft.mistakes ?? [`Confusing the definition of ${short} with the modeling assumptions that make it useful.`, "Ignoring units, tensor shapes, or data scaling.", "Treating a numerical result as causal or guaranteed to generalize."],
    takeaways: draft.takeaways ?? [draft.definition, draft.why, "Check assumptions and shapes before computing.", "Test a tiny example before scaling up.", "Use the result to reason about an actual model decision."],
    extraMisconceptions: draft.extraMisconceptions,
    torchSnippet: draft.torchSnippet,
    fromScratchSnippet: draft.fromScratchSnippet,
  };
  return enriched;
}

export function topic(draft: TopicDraft): Topic {
  return requireTopic(defineTopic(draft));
}

function requireTopic(seed: TopicSeed): Topic {
  // Kept as a function so module files only author data, never page components.
  // The dynamic import would make the content asynchronous, so use the static builder.
  return buildTopic(seed);
}

import { makeTopic as buildTopic } from "./factory";
