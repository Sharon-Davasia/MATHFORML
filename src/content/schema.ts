export type ModuleId = "linear-algebra" | "calculus" | "probability" | "statistics";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type QuestionKind = "mcq" | "scenario" | "derive" | "interpret" | "code" | "numeric" | "proof";
export type WidgetId =
  | "gradient-descent"
  | "convolution"
  | "pca-svd"
  | "bayes-update"
  | "information-theory"
  | "confusion-roc"
  | "ab-test"
  | "backprop-stepper"
  | "derivation-stepper";

export interface Widget {
  id: WidgetId;
  title: string;
  purpose: string;
  requiresPrediction: boolean;
}

export interface Formula {
  id: string;
  label: string;
  latex: string;
  variables: Record<string, string>;
  mlNote?: string;
}

export interface DerivationStep {
  label: string;
  latex: string;
  explanation: string;
  why: string;
}

export interface Derivation {
  title: string;
  goal: string;
  steps: DerivationStep[];
  result: string;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  difficulty: Difficulty;
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
  hint: string;
  misconception: string;
}

export interface CodeExample {
  language: "python" | "pytorch" | "sklearn" | "text";
  title: string;
  code: string;
  explanation: string[];
  numericalCheck?: string;
}

export interface LessonCore {
  duration: string;
  whyItMatters: string;
  intuition: string;
  formulas: Formula[];
  mlWalkthrough: string[];
  workedExample: { prompt: string; solution: string[]; answer: string };
  visualizationPrompt: string;
  code: CodeExample;
  mistakes: string[];
  modelAppearances: string[];
  quickTakeaways: string[];
  questions: Question[];
}

export interface DeepLayer {
  firstPrinciples: string;
  derivations: Derivation[];
  geometry: string;
  proofSketch: string;
  assumptions: string[];
  alternatives: { name: string; why: string }[];
  fromScratch: CodeExample;
  frameworkEquivalent: CodeExample;
  edgeCases: string[];
  misconceptions: string[];
  thinkFirst: { prompt: string; reveal: string }[];
  prerequisites: string[];
  downstream: string[];
  explainItBack: { prompt: string; modelAnswer: string };
  extraQuestions: Question[];
}

export interface Topic {
  id: string;
  moduleId: ModuleId;
  title: string;
  shortTitle: string;
  subtitle: string;
  tags: string[];
  prerequisites: string[];
  downstream: string[];
  widget: WidgetId;
  revision: LessonCore;
  deep: DeepLayer;
}

export interface Module {
  id: ModuleId;
  number: string;
  title: string;
  subtitle: string;
  color: "violet" | "blue" | "amber" | "rose";
  phase: string;
}
