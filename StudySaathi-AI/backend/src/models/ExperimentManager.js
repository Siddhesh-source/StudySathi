/**
 * ExperimentManager — A/B Testing Framework for Pedagogy
 *
 * Research basis:
 *   Kohavi, R., Tang, D., & Xu, Y. (2020). Trustworthy Online Controlled Experiments.
 *   Cambridge University Press.
 *   Testing Effect: Roediger & Karpicke (2006). Science, 319(5865).
 *
 * Variants:
 *   A: Standard explanations (control)
 *   B: Analogy-first explanations
 *   C: Quiz-before-explanation (Testing Effect)
 *   D: Spaced micro-learning (5-min chunks)
 *
 * Metrics tracked: quiz score after 7 days, retention rate, engagement
 *
 * OOP: Encapsulation, Strategy Pattern (variant strategies), Observer (outcome recording)
 */

class Experiment {
  #id;
  #name;
  #variants;         // { variantId: { name, description, weight } }
  #metrics;          // string[]
  #startDate;
  #endDate;
  #status;

  static STATUS = { DRAFT: 'draft', RUNNING: 'running', PAUSED: 'paused', CONCLUDED: 'concluded' };

  constructor({ id, name, variants, metrics = ['quiz_score_7d', 'retention', 'engagement'], startDate = null, endDate = null, status = 'running' }) {
    this.#id       = id;
    this.#name     = name;
    this.#variants = variants;  // { A: { name, description, weight: 0.25 }, ... }
    this.#metrics  = metrics;
    this.#startDate = startDate ? new Date(startDate) : new Date();
    this.#endDate   = endDate   ? new Date(endDate)   : null;
    this.#status    = status;
  }

  get id()       { return this.#id; }
  get name()     { return this.#name; }
  get variants() { return { ...this.#variants }; }
  get metrics()  { return [...this.#metrics]; }
  get status()   { return this.#status; }
  get isActive() { return this.#status === Experiment.STATUS.RUNNING; }

  toObject() {
    return { id: this.#id, name: this.#name, variants: this.#variants, metrics: this.#metrics, startDate: this.#startDate?.toISOString(), endDate: this.#endDate?.toISOString(), status: this.#status };
  }
}

class ExperimentManager {
  // ── Active experiments registry ──────────────────────────────────
  static EXPERIMENTS = {
    EXPLANATION_STYLE: new Experiment({
      id: 'explanation_style',
      name: 'Explanation Style A/B/C Test',
      variants: {
        A: { name: 'Standard',       description: 'Direct concept explanation',             weight: 0.34 },
        B: { name: 'Analogy-First',  description: 'Real-life analogy before explanation',   weight: 0.33 },
        C: { name: 'Testing Effect', description: 'Quiz before explanation (desirable difficulty)', weight: 0.33 },
      },
      metrics: ['quiz_score_7d', 'retention_rate', 'session_engagement'],
    }),
    QUIZ_DIFFICULTY: new Experiment({
      id: 'quiz_difficulty',
      name: 'Adaptive vs Fixed Difficulty',
      variants: {
        A: { name: 'Fixed-Mixed',    description: 'Fixed mix: 30% easy, 40% medium, 30% hard', weight: 0.5 },
        B: { name: 'IRT-Adaptive',   description: 'Difficulty calibrated to student θ via IRT', weight: 0.5 },
      },
      metrics: ['quiz_score', 'time_per_question', 'completion_rate'],
    }),
    REVISION_SCHEDULE: new Experiment({
      id: 'revision_schedule',
      name: 'Spaced Repetition vs Massed Practice',
      variants: {
        A: { name: 'Massed',  description: 'Review all topics daily',                          weight: 0.5 },
        B: { name: 'Spaced',  description: 'SM-2 spaced repetition schedule',                  weight: 0.5 },
      },
      metrics: ['retention_rate_7d', 'retention_rate_30d'],
    }),
  };

  // ── Private fields ───────────────────────────────────────────────
  #userId;
  #assignments;   // { experimentId: variantId }
  #outcomes;      // array of { experimentId, variantId, metric, value, timestamp }

  constructor(userId, data = {}) {
    this.#userId      = userId;
    this.#assignments = data.assignments || {};
    this.#outcomes    = data.outcomes    || [];
  }

  get userId() { return this.#userId; }

  // ── Assignment ───────────────────────────────────────────────────
  /**
   * Deterministically assign user to a variant using hash bucketing.
   * Same user always gets same variant (stable assignment).
   */
  assignVariant(experimentId) {
    if (this.#assignments[experimentId]) return this.#assignments[experimentId];

    const experiment = ExperimentManager.EXPERIMENTS[experimentId];
    if (!experiment || !experiment.isActive) return null;

    // Hash userId + experimentId to a bucket
    const hash    = this._hashString(`${this.#userId}:${experimentId}`);
    const bucket  = (hash % 1000) / 1000;  // 0-1

    let cumWeight = 0;
    for (const [variantId, variant] of Object.entries(experiment.variants)) {
      cumWeight += variant.weight;
      if (bucket < cumWeight) {
        this.#assignments[experimentId] = variantId;
        return variantId;
      }
    }
    // Fallback to first variant
    const fallback = Object.keys(experiment.variants)[0];
    this.#assignments[experimentId] = fallback;
    return fallback;
  }

  /**
   * Get the content variant for a specific context.
   * Returns variant metadata including how to modify content generation.
   */
  getVariantConfig(experimentId) {
    const variantId = this.assignVariant(experimentId);
    if (!variantId) return null;
    const experiment = ExperimentManager.EXPERIMENTS[experimentId];
    return {
      experimentId,
      variantId,
      variantName: experiment.variants[variantId]?.name,
      description: experiment.variants[variantId]?.description,
    };
  }

  /**
   * Get all active experiment assignments for this user.
   */
  getAllAssignments() {
    const result = {};
    for (const expId of Object.keys(ExperimentManager.EXPERIMENTS)) {
      result[expId] = this.getVariantConfig(expId);
    }
    return result;
  }

  // ── Outcome Recording ────────────────────────────────────────────
  /**
   * Record an outcome metric for a user's experiment assignment.
   */
  recordOutcome(experimentId, metric, value) {
    const variantId = this.#assignments[experimentId];
    if (!variantId) return false;

    this.#outcomes.push({
      experimentId,
      variantId,
      metric,
      value,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // ── Analysis ─────────────────────────────────────────────────────
  /**
   * Get aggregated outcomes per variant for a specific experiment.
   * Returns mean ± std for each metric per variant.
   */
  static analyzeExperiment(allOutcomes, experimentId, metric) {
    const byVariant = {};
    for (const outcome of allOutcomes) {
      if (outcome.experimentId !== experimentId || outcome.metric !== metric) continue;
      if (!byVariant[outcome.variantId]) byVariant[outcome.variantId] = [];
      byVariant[outcome.variantId].push(outcome.value);
    }

    const stats = {};
    for (const [variantId, values] of Object.entries(byVariant)) {
      const n    = values.length;
      const mean = values.reduce((a, b) => a + b, 0) / n;
      const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, n - 1);
      stats[variantId] = {
        n,
        mean:   Math.round(mean * 100) / 100,
        std:    Math.round(Math.sqrt(variance) * 100) / 100,
        stderr: Math.round((Math.sqrt(variance) / Math.sqrt(n)) * 100) / 100,
      };
    }

    // Simple t-test significance between first two variants
    const variants  = Object.keys(stats);
    let significant = false;
    let pValueApprox = null;
    if (variants.length >= 2) {
      const a = stats[variants[0]];
      const b = stats[variants[1]];
      if (a.n > 1 && b.n > 1) {
        const se = Math.sqrt((a.std ** 2 / a.n) + (b.std ** 2 / b.n));
        const t  = Math.abs((a.mean - b.mean) / Math.max(0.001, se));
        pValueApprox  = this._tToP(t, a.n + b.n - 2);
        significant   = pValueApprox < 0.05;
      }
    }

    return { experimentId, metric, stats, significant, pValueApprox };
  }

  // ── Serialization ─────────────────────────────────────────────────
  toObject() {
    return { userId: this.#userId, assignments: this.#assignments, outcomes: this.#outcomes };
  }

  toJSON() { return this.toObject(); }

  static fromFirestoreData(userId, data) {
    return new ExperimentManager(userId, data);
  }

  // ── Private helpers ───────────────────────────────────────────────
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Approximate two-tailed p-value from t-statistic using Abramowitz & Stegun.
   * Good enough for p < 0.05 / p < 0.01 thresholds.
   */
  static _tToP(t, df) {
    // Approximation via incomplete beta function substitute
    const x = df / (df + t * t);
    const a = df / 2;
    const b = 0.5;
    // Regularised incomplete beta approximation (Horner's method)
    const bt = Math.exp(a * Math.log(x) + b * Math.log(1 - x));
    const p  = bt / (a * (1 + (1 - x) * (a + b) / (a + 1)));
    return Math.min(1, Math.max(0, p));
  }
}

module.exports = { ExperimentManager, Experiment };
