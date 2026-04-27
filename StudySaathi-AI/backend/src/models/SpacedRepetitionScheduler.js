/**
 * SpacedRepetitionScheduler
 * Implements the SM-2 algorithm (SuperMemo 2) adapted for Indian competitive exams.
 *
 * Reference:
 *   Wozniak, P.A. (1990). Optimization of learning. Master's Thesis, University of Technology, Poznan.
 *   https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * OOP Principles: Encapsulation, Single Responsibility, Static Factory
 * Design Pattern: Strategy (exam-specific interval multipliers)
 */

class SpacedRepetitionScheduler {
  // ── SM-2 Constants ──────────────────────────────────────────────
  static MIN_EF        = 1.3;   // minimum easiness factor
  static DEFAULT_EF    = 2.5;   // starting easiness factor
  static MAX_EF        = 3.5;   // cap for very easy items
  static PASS_THRESHOLD = 3;    // quality >= 3 = correct response

  /**
   * Exam-specific interval multipliers.
   * JEE/NEET require tighter revision cycles than general study.
   */
  static EXAM_MULTIPLIERS = {
    JEE:    0.85,
    NEET:   0.85,
    UPSC:   1.0,
    CAT:    0.90,
    GATE:   0.90,
    SSC:    1.0,
    BOARDS: 1.1,
    OTHER:  1.0,
  };

  // ── Private fields ──────────────────────────────────────────────
  #topicId;
  #userId;
  #easinessFactor;
  #interval;          // days until next review
  #repetitions;       // consecutive correct responses
  #nextReviewDate;
  #lastQuality;       // 0-5: last response quality
  #reviewHistory;
  #examType;

  constructor(userId, topicId, data = {}, examType = 'OTHER') {
    this.#topicId        = topicId;
    this.#userId         = userId;
    this.#easinessFactor = data.easinessFactor ?? SpacedRepetitionScheduler.DEFAULT_EF;
    this.#interval       = data.interval       ?? 1;
    this.#repetitions    = data.repetitions    ?? 0;
    this.#nextReviewDate = data.nextReviewDate  ? new Date(data.nextReviewDate) : new Date();
    this.#lastQuality    = data.lastQuality    ?? null;
    this.#reviewHistory  = data.reviewHistory  ?? [];
    this.#examType       = examType;
  }

  // ── Getters ─────────────────────────────────────────────────────
  get topicId()        { return this.#topicId; }
  get userId()         { return this.#userId; }
  get interval()       { return this.#interval; }
  get repetitions()    { return this.#repetitions; }
  get easinessFactor() { return this.#easinessFactor; }
  get nextReviewDate() { return new Date(this.#nextReviewDate); }
  get isDue()          { return new Date() >= this.#nextReviewDate; }
  get reviewHistory()  { return [...this.#reviewHistory]; }
  get examType()       { return this.#examType; }

  /**
   * Days remaining until next review (negative = overdue).
   */
  get daysUntilReview() {
    const diff = this.#nextReviewDate - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ── Core SM-2 Algorithm ─────────────────────────────────────────
  /**
   * Process a review response and update scheduling parameters.
   *
   * @param {number} quality  0-5 quality of response:
   *   5 = perfect recall
   *   4 = correct with slight hesitation
   *   3 = correct with difficulty (threshold)
   *   2 = incorrect but easy to recall
   *   1 = incorrect, remembered after seeing answer
   *   0 = complete blackout
   * @returns {Object} update result with next review date and stats
   */
  review(quality) {
    if (quality < 0 || quality > 5) throw new Error('Quality must be 0–5');

    const prevInterval = this.#interval;
    const prevEF       = this.#easinessFactor;
    let   newInterval;

    if (quality >= SpacedRepetitionScheduler.PASS_THRESHOLD) {
      // Correct response — advance schedule
      if (this.#repetitions === 0) {
        newInterval = 1;
      } else if (this.#repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(prevInterval * this.#easinessFactor);
      }
      this.#repetitions += 1;
    } else {
      // Incorrect — reset
      this.#repetitions = 0;
      newInterval = 1;
    }

    // Update Easiness Factor (SM-2 formula)
    const newEF = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    this.#easinessFactor = Math.min(
      SpacedRepetitionScheduler.MAX_EF,
      Math.max(SpacedRepetitionScheduler.MIN_EF, newEF)
    );

    // Apply exam-specific multiplier
    const multiplier = SpacedRepetitionScheduler.EXAM_MULTIPLIERS[this.#examType] || 1.0;
    this.#interval = Math.max(1, Math.round(newInterval * multiplier));

    // Schedule next review
    const next = new Date();
    next.setDate(next.getDate() + this.#interval);
    next.setHours(8, 0, 0, 0); // always at 8 AM
    this.#nextReviewDate = next;
    this.#lastQuality    = quality;

    // Append to history
    this.#reviewHistory.push({
      date:            new Date().toISOString(),
      quality,
      prevInterval,
      newInterval:     this.#interval,
      easinessFactor:  this.#easinessFactor,
      repetitions:     this.#repetitions,
    });

    return {
      quality,
      prevInterval,
      newInterval:   this.#interval,
      easinessFactor: this.#easinessFactor,
      repetitions:   this.#repetitions,
      nextReviewDate: this.#nextReviewDate.toISOString(),
      passed:        quality >= SpacedRepetitionScheduler.PASS_THRESHOLD,
      masteryLevel:  this.getMasteryLevel(),
    };
  }

  /**
   * Map current state to a human-readable mastery level.
   */
  getMasteryLevel() {
    if (this.#repetitions === 0)  return { level: 0, label: 'New',        emoji: '🆕' };
    if (this.#repetitions <= 2)   return { level: 1, label: 'Learning',   emoji: '📖' };
    if (this.#repetitions <= 5)   return { level: 2, label: 'Reviewing',  emoji: '🔄' };
    if (this.#repetitions <= 10)  return { level: 3, label: 'Proficient', emoji: '📗' };
    return                               { level: 4, label: 'Mastered',   emoji: '🏆' };
  }

  /**
   * Convert quiz score (0-100) to SM-2 quality (0-5).
   * Utility for integration with QuizGenerator.
   */
  static quizScoreToQuality(score) {
    if (score >= 90) return 5;
    if (score >= 75) return 4;
    if (score >= 60) return 3;
    if (score >= 40) return 2;
    if (score >= 20) return 1;
    return 0;
  }

  /**
   * Retention probability estimate (simplified Ebbinghaus model).
   * R = e^(-t / S)  where S = stability (interval * EF proxy)
   * @returns {number} 0-1
   */
  getRetentionProbability() {
    const daysSinceLastReview = Math.max(0,
      (new Date() - this.#nextReviewDate + this.#interval * 86400000) / 86400000
    );
    const stability = this.#interval * (this.#easinessFactor / 2.5);
    return Math.max(0, Math.exp(-daysSinceLastReview / stability));
  }

  // ── Serialization ───────────────────────────────────────────────
  toObject() {
    return {
      topicId:        this.#topicId,
      userId:         this.#userId,
      easinessFactor: this.#easinessFactor,
      interval:       this.#interval,
      repetitions:    this.#repetitions,
      nextReviewDate: this.#nextReviewDate.toISOString(),
      lastQuality:    this.#lastQuality,
      reviewHistory:  this.#reviewHistory,
      examType:       this.#examType,
      isDue:          this.isDue,
      daysUntilReview: this.daysUntilReview,
      masteryLevel:   this.getMasteryLevel(),
      retentionProbability: this.getRetentionProbability(),
    };
  }

  toString() {
    return `SRS(${this.#topicId}) | rep:${this.#repetitions} | EF:${this.#easinessFactor.toFixed(2)} | next:${this.daysUntilReview}d`;
  }

  toJSON() { return this.toObject(); }

  // ── Static Factory ───────────────────────────────────────────────
  static fromFirestoreData(userId, topicId, data, examType) {
    return new SpacedRepetitionScheduler(userId, topicId, data, examType);
  }

  static fromObject(obj) {
    return new SpacedRepetitionScheduler(obj.userId, obj.topicId, obj, obj.examType);
  }

  /**
   * Sort a list of schedulers — due items first, then by retention probability ascending.
   */
  static prioritize(schedulers) {
    return [...schedulers].sort((a, b) => {
      if (a.isDue && !b.isDue) return -1;
      if (!a.isDue && b.isDue) return 1;
      return a.getRetentionProbability() - b.getRetentionProbability();
    });
  }
}

module.exports = SpacedRepetitionScheduler;
