"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip as RechartsTooltip, XAxis, YAxis,
} from "recharts";
import type { Derivation, WidgetId } from "@/content/schema";
import { MathBlock } from "./MathDisplay";

const chartStyle = { fontSize: 11, fill: "#7c8982" };
const tooltipStyle = { borderRadius: 12, border: "1px solid #e8ede8", boxShadow: "0 8px 22px rgba(30,53,43,.08)", fontSize: 12 };

function WidgetFrame({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="widget-card"><div className="widget-head"><div><span className="eyebrow">{eyebrow}</span><h3>{title}</h3></div><span className="widget-spark"><Sparkles size={16} /></span></div>{children}</section>;
}

function Slider({ label, value, min, max, step, onChange, suffix = "" }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; suffix?: string }) {
  return <label className="slider-control"><span>{label}<b>{value.toFixed(step < 0.1 ? 2 : 1)}{suffix}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function GradientDescent() {
  type Optimizer = "plain" | "momentum" | "adam";
  const [learningRate, setLearningRate] = useState(0.28);
  const [optimizer, setOptimizer] = useState<Optimizer>("plain");
  const [point, setPoint] = useState(-2.4);
  const [step, setStep] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [firstMoment, setFirstMoment] = useState(0);
  const [secondMoment, setSecondMoment] = useState(0);
  const [trail, setTrail] = useState<number[]>([-2.4]);
  const optimum = 1.4;
  const loss = (value: number) => (value - optimum) ** 2;
  const curve = useMemo(() => Array.from({ length: 81 }, (_, index) => {
    const x = -4 + (index / 80) * 8;
    return { x, loss: loss(x) };
  }), []);
  function nextStep() {
    const gradient = 2 * (point - optimum);
    const nextTime = step + 1;
    let update = gradient;
    if (optimizer === "momentum") {
      const v = 0.85 * velocity + gradient;
      setVelocity(v);
      update = v;
    } else if (optimizer === "adam") {
      const m = 0.9 * firstMoment + 0.1 * gradient;
      const v = 0.999 * secondMoment + 0.001 * gradient * gradient;
      setFirstMoment(m);
      setSecondMoment(v);
      update = (m / (1 - 0.9 ** nextTime)) / (Math.sqrt(v / (1 - 0.999 ** nextTime)) + 1e-8);
    }
    const updated = point - learningRate * update;
    setPoint(updated);
    setStep(nextTime);
    setTrail((old) => [...old, updated].slice(-30));
  }
  function reset() { setPoint(-2.4); setStep(0); setVelocity(0); setFirstMoment(0); setSecondMoment(0); setTrail([-2.4]); }
  return <WidgetFrame eyebrow="Interactive · optimization" title="Walk down a loss surface">
    <p className="widget-copy">The bowl is L(w) = (w − 1.4)². Change the step size or optimizer, then advance one update at a time.</p>
    <div className="chart-box"><ResponsiveContainer width="100%" height={205}><AreaChart data={curve} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
      <defs><linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#80a88f" stopOpacity={0.25} /><stop offset="100%" stopColor="#80a88f" stopOpacity={0.02} /></linearGradient></defs>
      <CartesianGrid strokeDasharray="3 4" stroke="#edf1ed" vertical={false} />
      <XAxis dataKey="x" type="number" domain={[-4, 4]} tick={{ ...chartStyle }} axisLine={false} tickLine={false} />
      <YAxis tick={{ ...chartStyle }} axisLine={false} tickLine={false} width={36} />
      <RechartsTooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toFixed(2), "loss"]} labelFormatter={(value) => `w = ${Number(value).toFixed(2)}`} />
      <Area type="monotone" dataKey="loss" stroke="#477d64" strokeWidth={2.5} fill="url(#lossFill)" />
      <ReferenceDot x={point} y={loss(point)} r={6} fill="#d58b56" stroke="#fff" strokeWidth={2} />
    </AreaChart></ResponsiveContainer></div>
    <div className="optimizer-row"><div className="segmented-mini" role="group" aria-label="Optimizer">
      {(["plain", "momentum", "adam"] as Optimizer[]).map((option) => <button className={optimizer === option ? "active" : ""} key={option} onClick={() => { setOptimizer(option); reset(); }}>{option === "plain" ? "SGD" : option === "momentum" ? "Momentum" : "Adam"}</button>)}
    </div><span className="widget-stat">step <b>{step}</b> · w <b>{point.toFixed(3)}</b></span></div>
    <Slider label="Learning rate" value={learningRate} min={0.01} max={1.05} step={0.01} suffix=" η" onChange={setLearningRate} />
    <div className="widget-actions"><button className="button-primary button-small" onClick={nextStep}>Take a step <ArrowRight size={14} /></button><button className="button-quiet" onClick={reset}><RotateCcw size={14} /> Reset</button><span className="tiny-note">loss {loss(point).toFixed(4)}</span></div>
    {trail.length > 1 && <p className="widget-footnote">Recent parameter path: {trail.map((item) => item.toFixed(2)).join(" → ")}</p>}
  </WidgetFrame>;
}

const initialPixels = [[0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]];
const kernels: Record<string, number[][]> = {
  edge: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
  blur: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]],
  sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
};

function ConvolutionPlayground() {
  const [image, setImage] = useState(initialPixels);
  const [kernel, setKernel] = useState(kernels.edge);
  const [selected, setSelected] = useState("edge");
  const output = useMemo(() => Array.from({ length: 2 }, (_, row) => Array.from({ length: 2 }, (_, col) => {
    let value = 0;
    for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) value += image[row + i][col + j] * kernel[i][j];
    return value;
  })), [image, kernel]);
  function editPixel(row: number, col: number) {
    setImage((old) => old.map((line, i) => line.map((value, j) => i === row && j === col ? (value >= 1 ? 0 : value + 0.5) : value)));
  }
  function chooseKernel(name: string) { setSelected(name); setKernel(kernels[name]); }
  return <WidgetFrame eyebrow="Interactive · vision" title="Slide a convolution kernel">
    <p className="widget-copy">Tap pixels to edit the 4×4 image. Each output cell is the dot product of one local 3×3 patch and the shared kernel.</p>
    <div className="conv-layout">
      <div className="conv-board-wrap"><span className="board-label">IMAGE · 4×4</span><div className="pixel-board">{image.flatMap((line, row) => line.map((value, col) => <button key={`${row}-${col}`} aria-label={`pixel ${row + 1}, ${col + 1}: ${value}`} onClick={() => editPixel(row, col)} className="pixel-cell" style={{ backgroundColor: `rgba(60, 116, 89, ${0.09 + value * 0.68})` }}>{value.toFixed(1)}</button>))}</div></div>
      <ArrowRight className="conv-arrow" size={17} />
      <div className="conv-board-wrap"><span className="board-label">OUTPUT · 2×2</span><div className="output-board">{output.flatMap((line, row) => line.map((value, col) => <div className="output-cell" key={`${row}-${col}`}><b>{value.toFixed(2)}</b><small>y{row + 1}{col + 1}</small></div>))}</div></div>
    </div>
    <div className="kernel-controls"><span className="board-label">KERNEL · 3×3</span><div className="kernel-grid">{kernel.flatMap((line, row) => line.map((value, col) => <input key={`${row}-${col}`} aria-label={`kernel row ${row + 1} column ${col + 1}`} type="number" step="0.25" value={Number(value.toFixed(2))} onChange={(event) => { const next = Number(event.target.value); setKernel((old) => old.map((r, i) => r.map((v, j) => i === row && j === col ? next : v))); setSelected("custom"); }} />))}</div>
      <div className="segmented-mini">{Object.keys(kernels).map((name) => <button key={name} className={selected === name ? "active" : ""} onClick={() => chooseKernel(name)}>{name}</button>)}</div></div>
    <p className="widget-footnote">Convention: this playground uses the cross-correlation convention common in deep-learning libraries (no kernel flip).</p>
  </WidgetFrame>;
}

const cloud = [{ u: -2.5, v: -0.15 }, { u: -2.1, v: 0.2 }, { u: -1.6, v: -0.3 }, { u: -1.1, v: 0.12 }, { u: -0.6, v: -0.16 }, { u: -0.1, v: 0.21 }, { u: 0.4, v: -0.12 }, { u: 0.9, v: 0.14 }, { u: 1.4, v: -0.18 }, { u: 1.9, v: 0.2 }, { u: 2.4, v: -0.1 }];

function PcaDemo() {
  const [noise, setNoise] = useState(0.65);
  const data = useMemo(() => cloud.map(({ u, v }) => ({ x: u * 0.85 - v * noise * 0.5, y: u * 0.52 + v * noise * 0.85 })), [noise]);
  const stats = useMemo(() => {
    const mx = data.reduce((sum, point) => sum + point.x, 0) / data.length;
    const my = data.reduce((sum, point) => sum + point.y, 0) / data.length;
    const xx = data.reduce((sum, p) => sum + (p.x - mx) ** 2, 0) / (data.length - 1);
    const yy = data.reduce((sum, p) => sum + (p.y - my) ** 2, 0) / (data.length - 1);
    const xy = data.reduce((sum, p) => sum + (p.x - mx) * (p.y - my), 0) / (data.length - 1);
    const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
    const trace = xx + yy;
    const root = Math.sqrt((xx - yy) ** 2 + 4 * xy ** 2);
    const eigen1 = (trace + root) / 2;
    const eigen2 = (trace - root) / 2;
    return { mx, my, angle, eigen1, eigen2, ratio: eigen1 / (eigen1 + eigen2) };
  }, [data]);
  const axis = useMemo(() => [-3, 3].map((radius) => ({ x: stats.mx + radius * Math.cos(stats.angle), y: stats.my + radius * Math.sin(stats.angle) })), [stats]);
  return <WidgetFrame eyebrow="Interactive · dimensionality" title="Find the principal direction">
    <p className="widget-copy">The long axis is the unit direction with maximum projected variance. Increase perpendicular spread to see explained variance fall.</p>
    <div className="chart-box"><ResponsiveContainer width="100%" height={220}><ScatterChart margin={{ top: 8, right: 12, left: -14, bottom: -2 }}>
      <CartesianGrid strokeDasharray="3 4" stroke="#edf1ed" /><XAxis type="number" dataKey="x" domain={[-3, 3]} tick={{ ...chartStyle }} axisLine={false} tickLine={false} /><YAxis type="number" dataKey="y" domain={[-3, 3]} tick={{ ...chartStyle }} axisLine={false} tickLine={false} width={28} /><RechartsTooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tooltipStyle} />
      <Scatter name="centered data" data={data} fill="#759b83" /><Scatter name="PC1" data={axis} line={{ stroke: "#ca8757", strokeWidth: 2 }} lineType="joint" shape="cross" fill="#ca8757" />
    </ScatterChart></ResponsiveContainer></div>
    <Slider label="Perpendicular spread" value={noise} min={0.15} max={1.8} step={0.05} onChange={setNoise} />
    <div className="metric-inline"><span>PC1 variance <b>{stats.eigen1.toFixed(2)}</b></span><span>PC2 variance <b>{stats.eigen2.toFixed(2)}</b></span><span>Explained by PC1 <b>{(stats.ratio * 100).toFixed(1)}%</b></span></div>
    <p className="widget-footnote">PC1 is an eigenvector of the centered sample covariance; PCA preserves input variance, not necessarily label information.</p>
  </WidgetFrame>;
}

function BayesUpdate() {
  const [observations, setObservations] = useState(4);
  const [observedMean, setObservedMean] = useState(1.2);
  const posteriorMean = (observations * observedMean) / (1 + observations);
  const posteriorSd = Math.sqrt(1 / (1 + observations));
  const curve = useMemo(() => Array.from({ length: 65 }, (_, index) => {
    const x = -4 + index * (8 / 64);
    const normal = (mean: number, sd: number) => Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
    return { x, prior: normal(0, 1), posterior: normal(posteriorMean, posteriorSd) };
  }), [posteriorMean, posteriorSd]);
  return <WidgetFrame eyebrow="Interactive · Bayesian update" title="Prior → posterior">
    <p className="widget-copy">Assume a N(0, 1) prior on an unknown mean and unit-variance observations. Add observations and move their sample mean.</p>
    <div className="chart-box"><ResponsiveContainer width="100%" height={205}><LineChart data={curve} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 4" stroke="#edf1ed" vertical={false} /><XAxis dataKey="x" tick={{ ...chartStyle }} axisLine={false} tickLine={false} /><YAxis tick={{ ...chartStyle }} width={34} axisLine={false} tickLine={false} /><RechartsTooltip contentStyle={tooltipStyle} labelFormatter={(value) => `mean = ${Number(value).toFixed(2)}`} /><Line type="monotone" dataKey="prior" stroke="#9ca9a0" strokeDasharray="5 4" dot={false} strokeWidth={2} /><Line type="monotone" dataKey="posterior" stroke="#497d64" dot={false} strokeWidth={2.5} /></LineChart></ResponsiveContainer></div>
    <Slider label="Observed data points" value={observations} min={0} max={20} step={1} onChange={setObservations} />
    <Slider label="Observed sample mean" value={observedMean} min={-2} max={2} step={0.05} onChange={setObservedMean} />
    <div className="metric-inline"><span>Posterior mean <b>{posteriorMean.toFixed(2)}</b></span><span>Posterior SD <b>{posteriorSd.toFixed(2)}</b></span></div>
    <p className="widget-footnote">More observations narrow the posterior. The displayed conjugate update assumes known unit observation variance.</p>
  </WidgetFrame>;
}

function InformationCalculator() {
  const p = [0.6, 0.3, 0.1];
  const [q0, setQ0] = useState(0.5);
  const [q1, setQ1] = useState(0.3);
  const raw = [q0, q1, 0.2];
  const qTotal = raw.reduce((sum, value) => sum + value, 0);
  const q = raw.map((value) => value / qTotal);
  const entropy = -p.reduce((sum, value) => sum + value * Math.log(value), 0);
  const crossEntropy = -p.reduce((sum, value, index) => sum + value * Math.log(q[index]), 0);
  const kl = p.reduce((sum, value, index) => sum + value * Math.log(value / q[index]), 0);
  return <WidgetFrame eyebrow="Interactive · information theory" title="Entropy, cross-entropy & KL">
    <p className="widget-copy">Keep the target distribution P fixed and change prediction Q. Logs use nats; cross-entropy should equal entropy plus KL.</p>
    <div className="distribution-display"><div><span>Target P</span>{p.map((value, index) => <div className="probability-row" key={`p-${index}`}><b>class {index + 1}</b><div className="probability-track"><i style={{ width: `${value * 100}%` }} /></div><small>{value.toFixed(2)}</small></div>)}</div><div><span>Prediction Q</span>{q.map((value, index) => <div className="probability-row" key={`q-${index}`}><b>class {index + 1}</b><div className="probability-track"><i className="q-bar" style={{ width: `${value * 100}%` }} /></div><small>{value.toFixed(2)}</small></div>)}</div></div>
    <Slider label="Raw Q class 1 weight" value={q0} min={0.05} max={0.95} step={0.01} onChange={setQ0} />
    <Slider label="Raw Q class 2 weight" value={q1} min={0.05} max={0.95} step={0.01} onChange={setQ1} />
    <div className="metric-inline"><span>H(P) <b>{entropy.toFixed(3)}</b></span><span>H(P,Q) <b>{crossEntropy.toFixed(3)}</b></span><span>Dₖₗ(P‖Q) <b>{kl.toFixed(3)}</b></span></div>
    <p className="widget-footnote">Check: H(P,Q) = H(P) + Dₖₗ(P‖Q), up to floating-point rounding.</p>
  </WidgetFrame>;
}

const confusionSamples = [
  { truth: 1, score: 0.96 }, { truth: 1, score: 0.88 }, { truth: 1, score: 0.71 }, { truth: 1, score: 0.63 }, { truth: 1, score: 0.42 }, { truth: 1, score: 0.31 },
  { truth: 0, score: 0.81 }, { truth: 0, score: 0.55 }, { truth: 0, score: 0.38 }, { truth: 0, score: 0.22 }, { truth: 0, score: 0.09 }, { truth: 0, score: 0.04 },
];

function ConfusionRoc() {
  const [threshold, setThreshold] = useState(0.5);
  const counts = confusionSamples.reduce((acc, item) => {
    const positive = item.score >= threshold;
    if (item.truth && positive) acc.tp += 1;
    else if (item.truth) acc.fn += 1;
    else if (positive) acc.fp += 1;
    else acc.tn += 1;
    return acc;
  }, { tp: 0, fp: 0, tn: 0, fn: 0 });
  const recall = counts.tp / (counts.tp + counts.fn) || 0;
  const precision = counts.tp / (counts.tp + counts.fp) || 0;
  const roc = useMemo(() => {
    const thresholds = [1.01, ...Array.from(new Set(confusionSamples.map((item) => item.score))).sort((a, b) => b - a), 0];
    return thresholds.map((t) => {
      const tp = confusionSamples.filter((item) => item.truth === 1 && item.score >= t).length;
      const fp = confusionSamples.filter((item) => item.truth === 0 && item.score >= t).length;
      return { fpr: fp / 6, tpr: tp / 6 };
    }).sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
  }, []);
  const auc = roc.slice(1).reduce((area, point, index) => area + ((point.fpr - roc[index].fpr) * (point.tpr + roc[index].tpr)) / 2, 0);
  return <WidgetFrame eyebrow="Interactive · evaluation" title="Move the decision threshold">
    <p className="widget-copy">Twelve fixed examples have scores from 0 to 1. Change the threshold and watch precision, recall, and the ROC operating point change.</p>
    <div className="chart-box"><ResponsiveContainer width="100%" height={190}><LineChart data={roc} margin={{ top: 10, right: 14, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 4" stroke="#edf1ed" /><XAxis type="number" dataKey="fpr" domain={[0, 1]} tick={{ ...chartStyle }} axisLine={false} tickLine={false} label={{ value: "false-positive rate", position: "insideBottom", offset: -1, fontSize: 10, fill: "#8a978f" }} /><YAxis type="number" dataKey="tpr" domain={[0, 1]} tick={{ ...chartStyle }} axisLine={false} tickLine={false} width={30} label={{ value: "true-positive rate", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8a978f" }} /><RechartsTooltip contentStyle={tooltipStyle} formatter={(value) => Number(value).toFixed(2)} /><Line type="linear" dataKey="tpr" stroke="#74977f" strokeWidth={2} dot={false} /><ReferenceDot x={counts.fp / 6} y={recall} r={6} fill="#d48555" stroke="#fff" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
    <Slider label="Classification threshold" value={threshold} min={0.05} max={0.95} step={0.01} onChange={setThreshold} />
    <div className="confusion-grid"><span></span><b>Predicted +</b><b>Predicted −</b><strong>Actual +</strong><span className="cm-cell cm-hit">TP <b>{counts.tp}</b></span><span className="cm-cell cm-miss">FN <b>{counts.fn}</b></span><strong>Actual −</strong><span className="cm-cell cm-miss">FP <b>{counts.fp}</b></span><span className="cm-cell cm-hit">TN <b>{counts.tn}</b></span></div>
    <div className="metric-inline"><span>Precision <b>{precision.toFixed(2)}</b></span><span>Recall <b>{recall.toFixed(2)}</b></span><span>ROC AUC <b>{auc.toFixed(2)}</b></span></div>
  </WidgetFrame>;
}

function normalCdf(x: number) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * z);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-z * z);
  return 0.5 * (1 + sign * erf);
}

function ABTestSimulator() {
  const [sampleSize, setSampleSize] = useState(600);
  const [lift, setLift] = useState(0.03);
  const [result, setResult] = useState<{ p: number; observed: number } | null>(null);
  const p0 = 0.1;
  const p1 = p0 + lift;
  const zExpected = lift / Math.sqrt((p0 * (1 - p0) + p1 * (1 - p1)) / sampleSize);
  const power = Math.max(0, Math.min(1, normalCdf(zExpected - 1.96) + normalCdf(-zExpected - 1.96)));
  function simulate() {
    let a = 0; let b = 0;
    for (let i = 0; i < sampleSize; i += 1) {
      if (Math.random() < p0) a += 1;
      if (Math.random() < p1) b += 1;
    }
    const rateA = a / sampleSize;
    const rateB = b / sampleSize;
    const pooled = (a + b) / (2 * sampleSize);
    const standardError = Math.sqrt(Math.max(1e-12, pooled * (1 - pooled) * (2 / sampleSize)));
    const z = (rateB - rateA) / standardError;
    const p = Math.min(1, 2 * (1 - normalCdf(Math.abs(z))));
    setResult({ p, observed: rateB - rateA });
  }
  return <WidgetFrame eyebrow="Interactive · experiment design" title="A/B sample-size sandbox">
    <p className="widget-copy">Simulate two randomized conversion groups. Expected power is an approximate two-sided normal calculation at α=0.05; the run shows one random experiment.</p>
    <Slider label="Users per group" value={sampleSize} min={100} max={5000} step={100} onChange={setSampleSize} />
    <Slider label="True absolute lift" value={lift} min={0.005} max={0.08} step={0.005} suffix=" pp" onChange={setLift} />
    <div className="ab-scenario"><span>Control conversion <b>{(p0 * 100).toFixed(1)}%</b></span><span>Treatment conversion <b>{(p1 * 100).toFixed(1)}%</b></span></div>
    <div className="power-meter"><div><span>Approx. power</span><b>{(power * 100).toFixed(0)}%</b></div><div className="power-track"><i style={{ width: `${power * 100}%` }} /></div></div>
    <button className="button-primary button-small" onClick={simulate}>Run one experiment <ArrowRight size={14} /></button>
    {result && <div className={`experiment-result ${result.p < 0.05 ? "result-significant" : ""}`}><b>{result.p < 0.05 ? "Below 0.05 this run" : "Not below 0.05 this run"}</b><span>Observed lift {(result.observed * 100).toFixed(2)} pp · p ≈ {result.p.toFixed(3)}</span></div>}
    <p className="widget-footnote">Power is the chance to reject the null under the selected effect and assumptions—not the probability this one result is correct.</p>
  </WidgetFrame>;
}

const backwardSteps = [
  { title: "Start at the scalar loss", equation: "L = 0.5(ŷ − y)² = 0.5", value: "L = 0.5" },
  { title: "Derivative at the output", equation: "∂L/∂ŷ = ŷ − y = 2 − 3", value: "δ₂ = −1" },
  { title: "Output-layer parameters", equation: "∂L/∂w₂ = δ₂h ;  ∂L/∂b₂ = δ₂", value: "dw₂ = −2,  db₂ = −1" },
  { title: "Send signal to the hidden unit", equation: "∂L/∂h = δ₂w₂ ;  ∂L/∂z₁ = (∂L/∂h)·ReLU′(z₁)", value: "δ₁ = −1" },
  { title: "First-layer parameters", equation: "∂L/∂w₁ = δ₁x ;  ∂L/∂b₁ = δ₁", value: "dw₁ = −1,  db₁ = −1" },
];

function BackpropStepper() {
  const [forwardStep, setForwardStep] = useState(0);
  const [backwardStep, setBackwardStep] = useState(-1);
  const forward = [
    { title: "Input and target", equation: "x = 1,  y = 3", value: "input loaded" },
    { title: "Hidden pre-activation", equation: "z₁ = w₁x + b₁ = 2·1 + 0", value: "z₁ = 2" },
    { title: "ReLU activation", equation: "h = max(0, z₁)", value: "h = 2" },
    { title: "Output prediction", equation: "ŷ = w₂h + b₂ = 1·2 + 0", value: "ŷ = 2" },
    { title: "Half squared error", equation: "L = ½(ŷ − y)² = ½(2 − 3)²", value: "L = 0.5" },
  ];
  const active = backwardStep >= 0 ? backwardSteps[backwardStep] : forward[forwardStep];
  function reset() { setForwardStep(0); setBackwardStep(-1); }
  return <WidgetFrame eyebrow="Interactive · computation graph" title="Forward pass, then backward pass">
    <p className="widget-copy">A scalar two-layer ReLU network uses x=1, target=3, w₁=2, w₂=1, and zero biases. Advance through each stored value, then backpropagate the loss.</p>
    <div className="graph-flow"><span className="graph-node">x = 1</span><ArrowRight size={14} /><span className={`graph-node ${forwardStep >= 1 ? "graph-lit" : ""}`}>z₁ = w₁x+b₁</span><ArrowRight size={14} /><span className={`graph-node ${forwardStep >= 2 ? "graph-lit" : ""}`}>ReLU → h</span><ArrowRight size={14} /><span className={`graph-node ${forwardStep >= 3 ? "graph-lit" : ""}`}>ŷ → L</span></div>
    <div className="step-result"><span className="step-number">{backwardStep >= 0 ? `B${backwardStep + 1}` : `F${forwardStep + 1}`}</span><div><b>{active.title}</b><code>{active.equation}</code></div><strong>{active.value}</strong></div>
    <div className="widget-actions">
      {backwardStep < 0 && forwardStep < forward.length - 1 && <button className="button-primary button-small" onClick={() => setForwardStep((value) => value + 1)}>Next forward step <ArrowRight size={14} /></button>}
      {backwardStep < 0 && forwardStep === forward.length - 1 && <button className="button-primary button-small" onClick={() => setBackwardStep(0)}>Begin backward pass <ArrowDown size={14} /></button>}
      {backwardStep >= 0 && backwardStep < backwardSteps.length - 1 && <button className="button-primary button-small" onClick={() => setBackwardStep((value) => value + 1)}>Propagate gradient <ArrowDown size={14} /></button>}
      {backwardStep === backwardSteps.length - 1 && <span className="success-inline"><Check size={14} /> All four parameter gradients found</span>}
      <button className="button-quiet" onClick={reset}><RotateCcw size={14} /> Restart</button>
    </div>
    <p className="widget-footnote">Final gradients: dw₁=−1, db₁=−1, dw₂=−2, db₂=−1. A descent step subtracts these values times η.</p>
  </WidgetFrame>;
}

export function DerivationStepper({ derivation }: { derivation: Derivation }) {
  const [revealed, setRevealed] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const visible = derivation.steps.slice(0, revealed);
  return <WidgetFrame eyebrow="Interactive · derivation" title={derivation.title}>
    <p className="widget-copy">{derivation.goal}</p>
    <div className="derivation-list">
      {visible.map((step, index) => <article className="derivation-step" key={`${step.label}-${index}`}><span className="derivation-index">{String(index + 1).padStart(2, "0")}</span><div className="derivation-body"><b>{step.label}</b><div className="derivation-equation"><MathBlock math={step.latex} /></div><p>{step.explanation}</p><button className="why-step-button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>Why this step? <span>{expanded ? "−" : "+"}</span></button>{expanded && <p className="why-step-answer">{step.why}</p>}</div></article>)}
      {revealed === derivation.steps.length && <div className="derivation-result"><span>Result</span><MathBlock math={derivation.result} /></div>}
    </div>
    <div className="widget-actions"><button className="button-primary button-small" disabled={revealed >= derivation.steps.length} onClick={() => setRevealed((value) => Math.min(derivation.steps.length, value + 1))}>{revealed >= derivation.steps.length ? "Derivation complete" : revealed === 0 ? "Reveal first step" : "Reveal next line"}<ArrowRight size={14} /></button>{revealed > 0 && <button className="button-quiet" onClick={() => setRevealed(0)}><RotateCcw size={14} /> Start again</button>}<span className="tiny-note">{revealed}/{derivation.steps.length} steps</span></div>
  </WidgetFrame>;
}

export function InteractiveWidget({ id, derivation }: { id: WidgetId; derivation?: Derivation }) {
  switch (id) {
    case "gradient-descent": return <GradientDescent />;
    case "convolution": return <ConvolutionPlayground />;
    case "pca-svd": return <PcaDemo />;
    case "bayes-update": return <BayesUpdate />;
    case "information-theory": return <InformationCalculator />;
    case "confusion-roc": return <ConfusionRoc />;
    case "ab-test": return <ABTestSimulator />;
    case "backprop-stepper": return <BackpropStepper />;
    case "derivation-stepper": return derivation ? <DerivationStepper derivation={derivation} /> : <DerivationFallback />;
  }
}

function DerivationFallback() {
  return <WidgetFrame eyebrow="Interactive · derivation" title="Work through the model equation"><p className="widget-copy">Open the deep derivation section to reveal each line and its motivation.</p></WidgetFrame>;
}
