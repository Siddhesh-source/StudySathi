/**
 * IRTCalibrator — Item Response Theory (3PL Model)
 *
 * Research basis:
 *   Lord, F.M. (1980). Applications of Item Response Theory to Practical Testing Problems.
 *   Rasch, G. (1960). Probabilistic Models for Some Intelligence and Attainment Tests.
 *
 * 3-Parameter Logistic (3PL) Model:
 *   P(correct | θ) = c + (1-c) / (1 + exp(-1.7a(θ - b)))
 *   θ = student ability (latent trait), range typically [-3, 3]
 *   a = discrimination (how well item separates students)
 *   b = difficulty (θ where P = 0.5, excluding guessing)
 *   c = pseudo-guessing (lower asymptote)
 *
 * OOP: Encapsulation, Strategy, Static Factory
 */

class IRTItem {
  constructor(itemId, { a = 1.0, b = 0.0, c = 0.25, subject, topic, bloomsLevel = 1 } = {}) {
    this.itemId      = itemId;
    this.a           = Math.max(0.1, Math.min(3.0, a));  // discrimination: 0.1-3.0
    this.b           = Math.max(-4,  Math.min(4, b));    // difficulty: -4 to 4
    this.c           = Math.max(0,   Math.min(0.5, c));  // guessing: 0-0.5
    this.subject     = subject   || '';
    this.topic       = topic     || '';
    this.bloomsLevel = bloomsLevel;
    this.responseCnt = 0;
    this.correctCnt  = 0;
  }

  /** P(correct | θ) — 3PL formula */
  probability(theta) {
    return this.c + (1 - this.c) / (1 + Math.exp(-1.7 * this.a * (theta - this.b)));
  }

  /** Fisher Information I(θ) — how much info this item gives about θ */
  information(theta) {
    const p = this.probability(theta);
    const q = 1 - p;
    return (1.7 * this.a) ** 2 * ((p - this.c) ** 2 / ((1 - this.c) ** 2)) * (q / p);
  }

  recordResponse(correct) {
    this.responseCnt++;
    if (correct) this.correctCnt++;
  }

  get empiricalDifficulty() {
    if (this.responseCnt === 0) return null;
    return 1 - (this.correctCnt / this.responseCnt); // higher = harder
  }

  toObject() {
    return { itemId: this.itemId, a: this.a, b: this.b, c: this.c, subject: this.subject, topic: this.topic, bloomsLevel: this.bloomsLevel, responseCnt: this.responseCnt, correctCnt: this.correctCnt };
  }
}

class IRTCalibrator {
  // ── Private fields ─────────────────────────────────────────────
  #userId;
  #theta;           // current ability estimate
  #thetaSE;         // standard error of θ estimate
  #responses;       // array of { itemId, correct, timestamp }
  #items;           // Map<itemId, IRTItem>

  static THETA_MIN   = -4;
  static THETA_MAX   =  4;
  static THETA_STEP  =  0.01;  // Newton-Raphson step size
  static CONVERGENCE =  0.001;
  static MAX_ITER    =  50;

  constructor(userId, data = {}) {
    this.#userId    = userId;
    this.#theta     = data.theta    ?? 0.0;   // start at average ability
    this.#thetaSE   = data.thetaSE  ?? 1.0;
    this.#responses = data.responses ?? [];
    this.#items     = new Map();

    // Restore items
    (data.items || []).forEach(i => this.#items.set(i.itemId, new IRTItem(i.itemId, i)));
  }

  // ── Getters ─────────────────────────────────────────────────────
  get theta()   { return this.#theta; }
  get thetaSE() { return this.#thetaSE; }
  get userId()  { return this.#userId; }

  /** Convert θ to percentile-like 0-100 score for display */
  get abilityScore() {
    // θ in [-4,4] → [0,100] via logistic mapping
    return Math.round(100 / (1 + Math.exp(-this.#theta)));
  }

  get abilityLabel() {
    if (this.#theta >= 2)  return { label: 'Expert',      emoji: '🏆' };
    if (this.#theta >= 1)  return { label: 'Advanced',    emoji: '📗' };
    if (this.#theta >= 0)  return { label: 'Intermediate',emoji: '📘' };
    if (this.#theta >= -1) return { label: 'Developing',  emoji: '📙' };
    return                        { label: 'Beginner',    emoji: '📕' };
  }

  // ── Item Management ─────────────────────────────────────────────
  addItem(itemId, params = {}) {
    if (!this.#items.has(itemId)) {
      this.#items.set(itemId, new IRTItem(itemId, params));
    }
    return this;
  }

  getItem(itemId) { return this.#items.get(itemId) || null; }

  // ── Core: Record response & update θ via MLE ────────────────────
  /**
   * Record a student response and update ability estimate (θ).
   * Uses Newton-Raphson Maximum Likelihood Estimation.
   *
   * @param {string}  itemId
   * @param {boolean} correct
   * @param {Object}  itemParams  — a, b, c params if item not yet registered
   */
  recordResponse(itemId, correct, itemParams = {}) {
    if (!this.#items.has(itemId)) this.addItem(itemId, itemParams);
    const item = this.#items.get(itemId);
    item.recordResponse(correct);

    this.#responses.push({
      itemId,
      correct,
      theta:     this.#theta,
      timestamp: new Date().toISOString(),
    });

    // Re-estimate θ using all responses
    this.#estimateTheta();

    return {
      theta:        this.#theta,
      thetaSE:      this.#thetaSE,
      abilityScore: this.abilityScore,
      abilityLabel: this.abilityLabel,
      nextDifficulty: this.getNextItemDifficulty(),
    };
  }

  /**
   * Maximum Likelihood Estimation of θ via Newton-Raphson.
   * L'(θ) = Σ a_i * (u_i - P_i) * (P_i - c_i) / (P_i * (1 - c_i))
   * L''(θ) = -Σ I_i(θ)
   */
  #estimateTheta() {
    let theta = this.#theta;

    for (let iter = 0; iter < IRTCalibrator.MAX_ITER; iter++) {
      let L1 = 0;  // first derivative of log-likelihood
      let L2 = 0;  // second derivative (negative Fisher information)

      for (const resp of this.#responses) {
        const item = this.#items.get(resp.itemId);
        if (!item) continue;
        const P = item.probability(theta);
        const u = resp.correct ? 1 : 0;
        const Q = 1 - P;
        // Numerically stable first derivative
        const num = 1.7 * item.a * (u - P) * (P - item.c);
        const den = P * (1 - item.c);
        if (den !== 0) L1 += num / den;
        L2 -= item.information(theta);
      }

      if (L2 === 0) break;
      const delta = -L1 / L2;
      theta += delta;
      theta = Math.max(IRTCalibrator.THETA_MIN, Math.min(IRTCalibrator.THETA_MAX, theta));
      if (Math.abs(delta) < IRTCalibrator.CONVERGENCE) break;
    }

    // Standard error = 1/sqrt(Fisher Information)
    let totalInfo = 0;
    for (const resp of this.#responses) {
      const item = this.#items.get(resp.itemId);
      if (item) totalInfo += item.information(theta);
    }
    this.#theta   = theta;
    this.#thetaSE = totalInfo > 0 ? 1 / Math.sqrt(totalInfo) : 1.0;
  }

  /**
   * Optimal next item difficulty = current θ + 0.3 (slightly above ability).
   * This maximises Fisher information at current θ.
   */
  getNextItemDifficulty() {
    return Math.max(IRTCalibrator.THETA_MIN,
           Math.min(IRTCalibrator.THETA_MAX, this.#theta + 0.3));
  }

  /**
   * Get all item difficulties and information at current θ.
   */
  getItemStats() {
    return [...this.#items.values()].map(item => ({
      ...item.toObject(),
      probabilityAtTheta: item.probability(this.#theta),
      informationAtTheta: item.information(this.#theta),
    }));
  }

  // ── Serialization ───────────────────────────────────────────────
  toObject() {
    return {
      userId:       this.#userId,
      theta:        this.#theta,
      thetaSE:      this.#thetaSE,
      abilityScore: this.abilityScore,
      abilityLabel: this.abilityLabel,
      responses:    this.#responses,
      items:        [...this.#items.values()].map(i => i.toObject()),
    };
  }

  toString() {
    return `IRT(${this.#userId}) | θ=${this.#theta.toFixed(3)} ±${this.#thetaSE.toFixed(3)} | ${this.abilityLabel.label}`;
  }

  toJSON() { return this.toObject(); }

  static fromFirestoreData(userId, data) {
    return new IRTCalibrator(userId, data);
  }
}

module.exports = { IRTCalibrator, IRTItem };
