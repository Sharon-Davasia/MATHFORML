# MathForML

A local-first study platform for the mathematics used in machine learning and deep learning. It supports a compact ~10-minute revision pass and a deeper 30–60-minute mastery pass. Lessons lead with the ML connection, then make the notation, assumptions, implementation, and failure cases explicit.

## Folder structure

```text
.
├── README.md
├── src
│   ├── app
│   │   ├── api/health/route.ts        # managed preview health endpoint
│   │   ├── globals.css                # peaceful light/dark theme, responsive UI, print rules
│   │   ├── layout.tsx                 # document metadata and root layout
│   │   └── page.tsx                   # app entry point
│   ├── components
│   │   ├── CodeBlock.tsx              # copyable, highlighted code
│   │   ├── LessonView.tsx             # reusable topic template and mastery ladder
│   │   ├── MathDisplay.tsx            # KaTeX formula renderer
│   │   ├── MathForMLApp.tsx            # navigation, search, local persistence, theme/mode
│   │   ├── PracticePanel.tsx           # tiered questions, feedback, retries
│   │   ├── Widgets.tsx                 # interactive math visualizations
│   │   └── WorkspaceViews.tsx          # roadmap, syllabus, glossary, map, dashboard, etc.
│   ├── content
│   │   ├── schema.ts                   # shared TypeScript content schema
│   │   ├── factory.ts                  # lesson defaults and original tiered question builder
│   │   ├── define.ts                   # compact data authoring helper
│   │   ├── index.ts                    # module catalog, glossary, connection clusters
│   │   ├── linear-algebra.ts           # 12 topics
│   │   ├── calculus.ts                 # 13 topics
│   │   ├── probability.ts              # 10 topics
│   │   └── statistics.ts               # 11 topics
│   ├── lib
│   │   └── progress.ts                 # localStorage types, scoring, streak, review timing
│   └── types
│       └── react-katex.d.ts            # narrow type declaration for react-katex
└── package.json
```

## Content schema

All content is typed in `src/content/schema.ts`. A `Topic` has separate `revision` and `deep` fields: the deep lesson extends the fast lesson rather than replacing it.

```ts
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

export interface Formula {
  id: string;
  label: string;
  latex: string;
  variables: Record<string, string>;
  mlNote?: string;
}

export interface Derivation {
  title: string;
  goal: string;
  steps: DerivationStep[]; // each line has LaTeX, an explanation, and a "why" annotation
  result: string;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  difficulty: "Easy" | "Medium" | "Hard";
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
  hint: string;
  misconception: string;
}

export interface Widget {
  id: WidgetId;
  title: string;
  purpose: string;
  requiresPrediction: boolean;
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
```

`DeepLayer` adds first-principles motivation, stepwise derivations/proofs, geometric intuition, assumptions and edge cases, alternatives, NumPy/PyTorch-or-scikit-learn code, numerical checks, misconception busters, think-first prompts, prerequisites/downstream links, explain-it-back, and hard questions.

## Notation convention

Bold lowercase symbols are column vectors; bold uppercase symbols are matrices. The stored design matrix is row-major, `X ∈ ℝ^(n×d)`: examples are rows and features are columns. A single example `x` is written as a column vector when used alone. Gradients are column vectors unless a shape is shown otherwise. Batch objectives are means unless stated otherwise.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. The managed project runtime is Next.js App Router with React and TypeScript; study progress itself does not need a server or database. A production build can be checked with `npm run build`.

## Add a topic without editing a component

1. Add a `topic({...})` entry to the appropriate module file under `src/content/` (or create another module data file).
2. Give it a stable kebab-case `id`, module, title/subtitle, topic-specific ML motivation, plain-language intuition, KaTeX formulas with a symbol glossary, one small worked example, a model connection, and a runnable NumPy snippet.
3. Add topic-specific scenarios, derivation/interpretation/code checks, a misconception, a failure mode, a proof sketch, assumptions, alternatives, model appearances, and five revision takeaways. The typed authoring helper supplies a consistent 10-question Easy/Medium/Hard set from these authored prompts and explanations; the two reference topics also provide their own multi-line deep derivations and extra mastery questions.
4. Fill `deepSteps` or `deepDerivations` with `DerivationStep` records when a result benefits from a custom line-by-line derivation. Each step should say both what algebra happened and why it is allowed. Add `torchSnippet` when an automatic tensor translation would not be the clearest equivalent; use a `fromScratchSnippet` for a more complete NumPy implementation.
5. Choose an existing `WidgetId`, then connect prerequisites and downstream topics by their IDs. Add the topic to the exported topic array in `src/content/index.ts` if it lives in a new module file.
6. If a genuinely new widget is needed, add its ID to `WidgetId` in `schema.ts`, implement its client component in `Widgets.tsx`, and add one switch case. Existing topic pages, search, formula sheet, roadmap, glossary links, practice, and progress then consume the new topic data automatically.

## Included syllabus

- **Linear algebra (12):** vectors/matrices, dot/cosine, norms/regularization, affine layers, transformations/projection, rank/inverse/conditioning, eigenpairs, SVD, PCA, embeddings, convolution, attention.
- **Calculus & optimization (13):** derivatives, gradient/Jacobian/Hessian, chain rule/backpropagation, vectorized gradients, MSE, classification losses, SGD, momentum/RMSProp/Adam, learning-rate schedules, convexity/saddles, gradient pathologies, activations/softmax, gradient checking.
- **Probability & information (10):** random variables/moments, ML distributions, conditional probability/Bayes, independence/Naive Bayes, Bayes/MLE/MAP→loss derivations, Bayesian updates, GMM/EM, uncertainty/calibration, information theory, LLN/CLT.
- **Statistics for ML (11):** bias–variance, regularization priors, splits/leakage/CV, classification metrics, regression metrics, IoU/mAP, bootstrap/intervals, tests/power, multiple testing, A/B design, correlation/causation.

## Progress and privacy

Mode, per-topic overrides, completion, ladder level, question attempts, review dates, bookmarks, notes, and active study dates are stored in `localStorage` under `mathforml.progress.v1`. Clearing site storage resets the local study space. No account or API key is needed.
