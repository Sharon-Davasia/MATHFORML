import type { Module, ModuleId, Topic } from "./schema";
import { linearAlgebraTopics } from "./linear-algebra";
import { calculusTopics } from "./calculus";
import { probabilityTopics } from "./probability";
import { statisticsTopics } from "./statistics";

export const modules: Module[] = [
  { id: "linear-algebra", number: "01", title: "Linear algebra", subtitle: "Represent data, layers, and learned spaces.", color: "violet", phase: "Phase 1 · Represent" },
  { id: "calculus", number: "02", title: "Calculus & optimization", subtitle: "Understand gradients, losses, and learning dynamics.", color: "blue", phase: "Phase 2 · Learn" },
  { id: "probability", number: "03", title: "Probability & information", subtitle: "Model uncertainty, evidence, and likelihoods.", color: "amber", phase: "Phase 3 · Model uncertainty" },
  { id: "statistics", number: "04", title: "Statistics for ML", subtitle: "Evaluate models and make reliable decisions.", color: "rose", phase: "Phase 4 · Trust the result" },
];

export const topics: Topic[] = [
  ...linearAlgebraTopics,
  ...calculusTopics,
  ...probabilityTopics,
  ...statisticsTopics,
];

export const topicById: Record<string, Topic> = Object.fromEntries(topics.map((topic) => [topic.id, topic]));
export const moduleById: Record<ModuleId, Module> = Object.fromEntries(modules.map((module) => [module.id, module])) as Record<ModuleId, Module>;

export function topicsForModule(moduleId: ModuleId) {
  return topics.filter((topic) => topic.moduleId === moduleId);
}

export const keyConvention = "Vectors are bold columns; matrices are bold uppercase. The stored data matrix X ∈ ℝⁿˣᵈ is row-major (examples × features). A single example x is treated as a column when written alone. Unless a formula says otherwise, gradients are column vectors and batch losses are means.";

export const connectionClusters = [
  { label: "Represent", color: "violet", nodes: ["Vectors & matrices", "Linear layers", "Convolution", "Embeddings", "Attention"] },
  { label: "Differentiate", color: "blue", nodes: ["Chain rule → backprop", "Loss functions", "Gradient descent", "Optimizers"] },
  { label: "Model uncertainty", color: "amber", nodes: ["Bayes & likelihood", "Distributions", "Information theory", "Uncertainty"] },
  { label: "Validate", color: "rose", nodes: ["Bias–variance", "Metrics", "Data leakage", "A/B tests"] },
];

export const glossary = [
  { term: "Activation", symbol: "φ(z)", definition: "A nonlinear function applied to a layer's pre-activation; it enables compositions to represent nonlinear maps.", topicId: "activations" },
  { term: "Bayes factor", symbol: "p(D|H₁)/p(D|H₀)", definition: "The likelihood ratio that updates prior odds between two hypotheses.", topicId: "conditional-bayes" },
  { term: "Bias (estimator)", symbol: "E[θ̂]−θ", definition: "Systematic average difference between an estimator and the target quantity.", topicId: "bias-variance" },
  { term: "Condition number", symbol: "κ(A)", definition: "A relative sensitivity measure describing how much perturbations can be amplified by a matrix operation.", topicId: "rank-inverse-conditioning" },
  { term: "Covariance", symbol: "Cov(X,Y)", definition: "Expected product of centered variables; positive values indicate joint movement around their means.", topicId: "random-variables-moments" },
  { term: "Cross-entropy", symbol: "H(P,Q)", definition: "Expected negative log probability assigned by Q to outcomes drawn from P.", topicId: "information-theory" },
  { term: "Eigenvector", symbol: "Av=λv", definition: "A nonzero direction that a square transformation preserves up to a scalar factor.", topicId: "eigenvalues-eigenvectors" },
  { term: "Entropy", symbol: "H(P)", definition: "Expected self-surprise under a probability distribution, measured in bits or nats.", topicId: "information-theory" },
  { term: "Gradient", symbol: "∇L", definition: "A column vector of partial derivatives; it points toward locally steepest increase in a scalar function.", topicId: "gradient-jacobian-hessian" },
  { term: "Jacobian", symbol: "Jᵢⱼ=∂fᵢ/∂xⱼ", definition: "A matrix of first partial derivatives for a vector-valued function.", topicId: "gradient-jacobian-hessian" },
  { term: "KL divergence", symbol: "Dₖₗ(P‖Q)", definition: "The expected extra log loss from using Q to encode outcomes distributed as P; nonnegative but asymmetric.", topicId: "information-theory" },
  { term: "Likelihood", symbol: "p(D|θ)", definition: "The probability/density of observed data viewed as a function of model parameters.", topicId: "bayes-mle-loss" },
  { term: "Logit", symbol: "zₖ", definition: "An unnormalized class score, typically passed through softmax to produce probabilities.", topicId: "activations" },
  { term: "MAP", symbol: "arg max p(θ|D)", definition: "Maximum a posteriori estimate; maximizes likelihood times prior density.", topicId: "bayes-mle-loss" },
  { term: "MLE", symbol: "arg max p(D|θ)", definition: "Maximum likelihood estimate; selects parameters that make observed data most likely.", topicId: "bayes-mle-loss" },
  { term: "Norm", symbol: "‖w‖ₚ", definition: "A measure of vector magnitude; norm choice changes regularization geometry.", topicId: "norms-regularization" },
  { term: "P-value", symbol: "P(T≥t_obs|H₀)", definition: "Under the null model, the probability of a test statistic at least as extreme as observed.", topicId: "hypothesis-testing" },
  { term: "Rank", symbol: "rank(A)", definition: "The number of independent directions represented by a matrix.", topicId: "rank-inverse-conditioning" },
  { term: "Singular value", symbol: "σᵢ", definition: "A nonnegative stretch factor in an SVD; its square is an eigenvalue of AᵀA.", topicId: "svd" },
  { term: "Variance", symbol: "Var(X)", definition: "The expected squared deviation from a variable's mean.", topicId: "random-variables-moments" },
];
