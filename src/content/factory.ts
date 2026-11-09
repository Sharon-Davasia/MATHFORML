import type { DeepLayer, Derivation, DerivationStep, Formula, LessonCore, Question, Topic, WidgetId } from "./schema";

export interface TopicSeed {
  id: string;
  moduleId: Topic["moduleId"];
  title: string;
  shortTitle: string;
  subtitle: string;
  tags: string[];
  prerequisites: string[];
  downstream: string[];
  widget: WidgetId;
  why: string;
  intuition: string;
  formulas: Formula[];
  walkthrough: string[];
  example: { prompt: string; solution: string[]; answer: string };
  prompt: string;
  definition: string;
  scenario: string;
  scenarioAnswer: string;
  derive: string;
  deriveAnswer: string;
  interpret: string;
  interpretAnswer: string;
  codeQuestion: string;
  codeAnswer: string;
  belief: string;
  correction: string;
  failure: string;
  failureAnswer: string;
  proofQuestion: string;
  proofAnswer: string;
  connectionQuestion: string;
  connectionAnswer: string;
  snippet: string;
  torchSnippet?: string;
  fromScratchSnippet?: string;
  deepSteps: DerivationStep[];
  deepDerivations?: Derivation[];
  deepStory: string;
  geometry: string;
  proof: string;
  assumptions: string[];
  alternative: { name: string; why: string };
  edgeCases: string[];
  prerequisitesText: string[];
  downstreamText: string[];
  models: string[];
  mistakes: string[];
  takeaways: string[];
  extraMisconceptions?: string[];
}

function stableIndex(text: string, length: number) {
  return [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0) % length;
}

function rotate<T>(items: T[], start: number) {
  return items.map((_, index) => items[(index + start) % items.length]);
}

function buildQuestions(seed: TopicSeed): Question[] {
  const distractors = [
    "It is a bookkeeping rule with no effect on model behavior.",
    "It only matters after a model has already converged.",
    "It replaces the need to define a data-generating or optimization objective.",
  ];
  const choices = rotate([seed.definition, ...distractors], stableIndex(seed.id, 4));
  return [
    {
      id: `${seed.id}-concept`, kind: "mcq", difficulty: "Easy",
      prompt: seed.prompt, options: choices, answer: seed.definition,
      explanation: seed.why, hint: "Trace the quantity this idea changes inside a model.", misconception: seed.belief,
    },
    {
      id: `${seed.id}-numbers`, kind: "numeric", difficulty: "Easy",
      prompt: seed.example.prompt, answer: seed.example.answer,
      explanation: seed.example.solution.join(" "), hint: "Write the given values before substituting.", misconception: "A formula is not useful until its symbols are tied to the example's quantities.",
    },
    {
      id: `${seed.id}-scenario`, kind: "scenario", difficulty: "Medium",
      prompt: seed.scenario, answer: seed.scenarioAnswer,
      explanation: seed.scenarioAnswer, hint: "Name the changed assumption, then predict its effect on the model.", misconception: seed.belief,
    },
    {
      id: `${seed.id}-derive`, kind: "derive", difficulty: "Medium",
      prompt: seed.derive, answer: seed.deriveAnswer,
      explanation: seed.deriveAnswer, hint: "Start from the likelihood, objective, or definition—not the memorized endpoint.", misconception: "Remembering the endpoint is different from explaining why it follows.",
    },
    {
      id: `${seed.id}-interpret`, kind: "interpret", difficulty: "Medium",
      prompt: seed.interpret, answer: seed.interpretAnswer,
      explanation: seed.interpretAnswer, hint: "Interpret the sign, scale, and assumptions before naming a result.", misconception: "A numerical output has meaning only relative to its convention and data.",
    },
    {
      id: `${seed.id}-code`, kind: "code", difficulty: "Medium",
      prompt: seed.codeQuestion, answer: seed.codeAnswer,
      explanation: seed.codeAnswer, hint: "Check shapes, normalization, and whether the code matches the mathematical definition.", misconception: "Vectorized code can run successfully while implementing the wrong math.",
    },
    {
      id: `${seed.id}-belief`, kind: "scenario", difficulty: "Medium",
      prompt: `A classmate says: “${seed.belief}” How would you correct this for an ML practitioner?`,
      answer: seed.correction, explanation: seed.correction, hint: "State what is true, then give the condition or counterexample.", misconception: seed.belief,
    },
    {
      id: `${seed.id}-failure`, kind: "interpret", difficulty: "Hard",
      prompt: seed.failure, answer: seed.failureAnswer,
      explanation: seed.failureAnswer, hint: "Look for conditioning, sample size, distributional, or optimization assumptions.", misconception: "A mathematically valid result can still be a poor modeling choice when its assumptions fail.",
    },
    {
      id: `${seed.id}-proof`, kind: "proof", difficulty: "Hard",
      prompt: seed.proofQuestion, answer: seed.proofAnswer,
      explanation: seed.proofAnswer, hint: "Identify the defining quantity and compare it with a known nonnegative or extremal quantity.", misconception: "An intuitive picture suggests a result; a proof names the condition that makes it true.",
    },
    {
      id: `${seed.id}-connect`, kind: "derive", difficulty: "Hard",
      prompt: seed.connectionQuestion, answer: seed.connectionAnswer,
      explanation: seed.connectionAnswer, hint: "Follow the dependency from data representation through objective to model behavior.", misconception: "ML concepts are connected by shared mathematical objects, not just vocabulary.",
    },
  ];
}

function defaultCode(seed: TopicSeed) {
  return {
    language: "python" as const,
    title: `${seed.shortTitle}: a small NumPy check`,
    code: seed.snippet,
    explanation: [
      "Make the mathematical objects explicit before optimizing or calling a library.",
      "Keep axes and shapes visible; many silent ML bugs are convention mismatches.",
      "Compare one small hand-computable case with the program output.",
    ],
    numericalCheck: seed.codeAnswer,
  };
}

function torchEquivalent(seed: TopicSeed) {
  if (seed.torchSnippet) return seed.torchSnippet;
  return seed.snippet
    .replace("import numpy as np", "import torch")
    .replaceAll("np.array(", "torch.tensor(")
    .replaceAll("np.linalg.norm(", "torch.linalg.vector_norm(")
    .replaceAll("np.linalg.eigh(", "torch.linalg.eigh(")
    .replaceAll("np.linalg.svd(", "torch.linalg.svd(")
    .replaceAll("np.linalg.matrix_rank(", "torch.linalg.matrix_rank(")
    .replaceAll("np.linalg.cond(", "torch.linalg.cond(")
    .replaceAll("np.linalg.inv(", "torch.linalg.inv(")
    .replaceAll("np.linalg.eigvalsh(", "torch.linalg.eigvalsh(")
    .replaceAll("np.eye(", "torch.eye(")
    .replaceAll("np.arange(", "torch.arange(")
    .replaceAll("np.abs(", "torch.abs(")
    .replaceAll("np.diag(", "torch.diag(")
    .replaceAll("np.ones(", "torch.ones(")
    .replaceAll("np.zeros(", "torch.zeros(")
    .replaceAll("np.sum(", "torch.sum(")
    .replaceAll("np.exp(", "torch.exp(")
    .replaceAll("np.log(", "torch.log(")
    .replaceAll("np.max(", "torch.max(")
    .replaceAll("np.mean(", "torch.mean(")
    .replaceAll("np.abs(", "torch.abs(")
    .replace(/np\.sqrt\(([^()]*)\)/g, "torch.sqrt(torch.tensor($1, dtype=torch.float32))")
    .replace(/np\.quantile\(([^,]+),\s*(\[[^\]]+\])\)/g, "torch.quantile(torch.tensor($1), torch.tensor($2))")
    .replace(/np\.sort\(([^()]*)\)/g, "torch.sort($1).values")
    .replace(/\.var\(\)/g, ".var(unbiased=false)")
    .replace(/\.mean\(axis=/g, ".mean(dim=")
    .replace(/\.sum\(axis=/g, ".sum(dim=")
    .replace(/\.max\(axis=([^,]+), keepdims=True\)/g, ".max(dim=$1, keepdim=True).values")
    .replace(/keepdims=True/g, "keepdim=True")
    .replace(/axis=/g, "dim=");
}

export function makeTopic(seed: TopicSeed): Topic {
  const derivation: Derivation = {
    title: `From the definition to ${seed.shortTitle}`,
    goal: seed.derive,
    steps: seed.deepSteps,
    result: seed.deepSteps.at(-1)?.latex ?? seed.formulas[0]?.latex ?? "",
  };
  const revision: LessonCore = {
    duration: "10 min",
    whyItMatters: seed.why,
    intuition: seed.intuition,
    formulas: seed.formulas,
    mlWalkthrough: seed.walkthrough,
    workedExample: seed.example,
    visualizationPrompt: "Pause and predict: if one input changes while everything else stays fixed, what should move in the model output—and why? Make a prediction before opening the interactive widget.",
    code: defaultCode(seed),
    mistakes: seed.mistakes,
    modelAppearances: seed.models,
    quickTakeaways: seed.takeaways,
    questions: buildQuestions(seed),
  };
  const deep: DeepLayer = {
    firstPrinciples: seed.deepStory,
    derivations: seed.deepDerivations ?? [derivation],
    geometry: seed.geometry,
    proofSketch: seed.proof,
    assumptions: seed.assumptions,
    alternatives: [seed.alternative],
    fromScratch: {
      language: "python", title: "From scratch: expose the math first", code: seed.fromScratchSnippet ?? seed.snippet,
      explanation: ["Each line maps to an object in the displayed definition.", "For a production implementation, add shape checks and stable numerics before batching."],
      numericalCheck: seed.codeAnswer,
    },
    frameworkEquivalent: {
      language: seed.snippet.includes("from sklearn") ? "sklearn" : seed.snippet.includes("from scipy") ? "python" : "pytorch",
      title: seed.snippet.includes("from sklearn") ? "scikit-learn pipeline equivalent" : seed.snippet.includes("from scipy") ? "SciPy hypothesis-test equivalent" : "PyTorch equivalent",
      code: seed.snippet.includes("from sklearn") || seed.snippet.includes("from scipy") ? seed.snippet : torchEquivalent(seed),
      explanation: ["The tensor operation matches the displayed NumPy calculation; PyTorch autograd can differentiate it when inputs require gradients.", "Use a tiny deterministic example to validate shapes and values before training."],
      numericalCheck: seed.codeAnswer,
    },
    edgeCases: seed.edgeCases,
    misconceptions: seed.extraMisconceptions ?? [seed.belief, "A correct formula guarantees a good model; data scale, assumptions, and numerical precision still matter."],
    thinkFirst: [
      { prompt: `Before revealing: what would you expect to happen if ${seed.failure.toLowerCase()}`, reveal: seed.failureAnswer },
      { prompt: `Predict one downstream model behavior controlled by ${seed.shortTitle}.`, reveal: seed.connectionAnswer },
    ],
    prerequisites: seed.prerequisitesText,
    downstream: seed.downstreamText,
    explainItBack: {
      prompt: `In 2–3 lines, explain ${seed.shortTitle} to a peer building a model. Include what it computes and one condition that matters.`,
      modelAnswer: `${seed.definition} ${seed.correction}`,
    },
    extraQuestions: [
      {
        id: `${seed.id}-deep-why`, kind: "proof", difficulty: "Hard", prompt: seed.proofQuestion,
        answer: seed.proofAnswer, explanation: seed.proofAnswer, hint: "Reduce the claim to its definition and make every assumption explicit.", misconception: "An analogy alone does not establish the mathematical claim.",
      },
      {
        id: `${seed.id}-deep-edge`, kind: "scenario", difficulty: "Hard", prompt: `Construct a case where ${seed.shortTitle} gives a misleading or unstable result. What assumption fails?`,
        answer: seed.failureAnswer, explanation: seed.failureAnswer, hint: "Use the edge case named in the failure analysis, not an unrelated exception.", misconception: seed.belief,
      },
      {
        id: `${seed.id}-deep-transfer`, kind: "derive", difficulty: "Hard", prompt: seed.connectionQuestion,
        answer: seed.connectionAnswer, explanation: seed.connectionAnswer, hint: "Connect the math to a concrete model computation.", misconception: "A model name is not an explanation of its mathematical dependency.",
      },
    ],
  };
  return {
    id: seed.id, moduleId: seed.moduleId, title: seed.title, shortTitle: seed.shortTitle,
    subtitle: seed.subtitle, tags: seed.tags, prerequisites: seed.prerequisites,
    downstream: seed.downstream, widget: seed.widget, revision, deep,
  };
}

export function genericSteps(start: string, middle: string, result: string): DerivationStep[] {
  return [
    { label: "Start with the object", latex: start, explanation: "Name the mathematical object that the model computes or estimates.", why: "A derivation needs a precise starting point; otherwise assumptions stay hidden." },
    { label: "Expose the ML operation", latex: middle, explanation: "Substitute the model's data, parameters, or objective into that definition.", why: "This is where abstract notation becomes a concrete model computation." },
    { label: "Read the result", latex: result, explanation: "Interpret the final quantity and its effect on a prediction, update, or evaluation.", why: "An equation is useful only when its units, geometry, and modeling role are clear." },
  ];
}
