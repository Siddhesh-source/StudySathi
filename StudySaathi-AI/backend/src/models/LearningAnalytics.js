/**
 * LearningAnalytics
 * Computes learning metrics and predicts exam score via weighted linear regression.
 *
 * Research basis:
 *   Siemens, G. & Long, P. (2011). Penetrating the Fog: Analytics in Learning and Education.
 *   Educause Review, 46(5), 30-32.
 *
 * Metrics:
 *   - Time-on-Task
 *   - Learning Velocity (topics/week)
 *   - Knowledge Retention Rate
 *   - Engagement Score
 *   - Predicted Exam Score (weighted regression)
 *
 * OOP: Encapsulation, Single Responsibility, Static methods
 */

class LearningAnalytics {
  // ── Regression weights (calibrated for competitive exams) ───────
  // These can be updated from A/B test outcomes (ExperimentManager)
  static SCORE_WEIGHTS = {
    avgQuizScore:        0.35,
    consistencyIndex:    0.20,
    topicCoverage:       0.20,
    avgConfidence:       0.15,
    revisionCompliance:  0.10,
  };

  // ── Private fields ──────────────────────────────────────────────
  #userId;
  #sessions;        // StudySession summaries
  #topicProgress;   // array of topic records from Firestore
  #streakData;
  #srsData;         // spaced repetition records
  #computedAt;

  constructor(userId, { sessions = [], topicProgress = [], streakData = {}, srsData = [] } = {}) {
    this.#userId        = userId;
    this.#sessions      = sessions;
    this.#topicProgress = topicProgress;
    this.#streakData    = streakData;
    this.#srsData       = srsData;
    this.#computedAt    = new Date();
  }

  // ── Core Metrics ─────────────────────────────────────────────────

  /** Total study time in minutes */
  getTotalTimeOnTask() {
    return this.#sessions.reduce((s, sess) => s + (sess.durationMinutes || 0), 0);
  }

  /** Average session duration in minutes */
  getAvgSessionDuration() {
    if (this.#sessions.length === 0) return 0;
    return Math.round(this.getTotalTimeOnTask() / this.#sessions.length);
  }

  /**
   * Learning Velocity — topics reaching "strong" per week.
   * Requires sessions with startTime.
   */
  getLearningVelocity() {
    const strong = this.#topicProgress.filter(t => t.strengthLabel === 'strong').length;
    const firstSession = this.#sessions
      .map(s => new Date(s.startTime))
      .filter(d => !isNaN(d))
      .sort((a, b) => a - b)[0];
    if (!firstSession) return 0;
    const weeksElapsed = Math.max(1, (Date.now() - firstSession) / (7 * 86400000));
    return Math.round((strong / weeksElapsed) * 10) / 10;
  }

  /**
   * Knowledge Retention Rate — % of topics that were "strong" and still are.
   * Uses SRS retention probability as proxy.
   */
  getKnowledgeRetentionRate() {
    if (this.#srsData.length === 0) return null;
    const avg = this.#srsData.reduce((s, r) => s + (r.retentionProbability || 0), 0) / this.#srsData.length;
    return Math.round(avg * 100);
  }

  /**
   * Engagement Score (0-100) — composite of daily activity signals.
   */
  getEngagementScore() {
    const sessionScore  = Math.min(100, this.#sessions.length * 2);
    const noteScore     = Math.min(100, this.#topicProgress.reduce((s, t) => s + (t.notesCount || 0), 0) * 5);
    const quizScore     = Math.min(100, this.#sessions.reduce((s, sess) => s + (sess.quizCount || 0), 0) * 10);
    const streakScore   = Math.min(100, (this.#streakData.currentStreak || 0) * 3);
    return Math.round(sessionScore * 0.25 + noteScore * 0.25 + quizScore * 0.25 + streakScore * 0.25);
  }

  /**
   * Consistency Index — streak / days since first study (0-1).
   */
  getConsistencyIndex() {
    const streak    = this.#streakData.currentStreak || 0;
    const longest   = this.#streakData.longestStreak || 1;
    return Math.min(1, streak / Math.max(1, longest));
  }

  /** Average quiz score across all sessions */
  getAvgQuizScore() {
    const allScores = this.#sessions.flatMap(s => (s.quizScores || []).map(q => q.score || q));
    if (allScores.length === 0) return 0;
    return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  }

  /** Topic coverage — % of planned topics that have been studied */
  getTopicCoverage(totalPlannedTopics = null) {
    const studied = this.#topicProgress.length;
    const total   = totalPlannedTopics || Math.max(studied, 1);
    return Math.min(100, Math.round((studied / total) * 100));
  }

  /**
   * Spaced repetition compliance — % of due reviews completed on time.
   */
  getRevisionCompliance() {
    if (this.#srsData.length === 0) return 0;
    const onTime = this.#srsData.filter(r => (r.reviewHistory || []).some(h => {
      if (!h.date || !r.nextReviewDate) return false;
      const reviewedAt = new Date(h.date);
      const scheduledAt = new Date(r.nextReviewDate);
      return reviewedAt <= new Date(scheduledAt.getTime() + 86400000); // within 1 day
    })).length;
    return Math.round((onTime / this.#srsData.length) * 100);
  }

  /**
   * PREDICTED EXAM SCORE — weighted linear regression.
   *
   * score = Σ w_i * x_i  (all features normalized to 0-100)
   *
   * Returns predicted score and feature contributions (for explainability).
   */
  predictExamScore(totalPlannedTopics = null) {
    const features = {
      avgQuizScore:       this.getAvgQuizScore(),
      consistencyIndex:   this.getConsistencyIndex() * 100,
      topicCoverage:      this.getTopicCoverage(totalPlannedTopics),
      avgConfidence:      this._getAvgConfidence() * 20, // 1-5 → 20-100
      revisionCompliance: this.getRevisionCompliance(),
    };

    const weights   = LearningAnalytics.SCORE_WEIGHTS;
    let predicted   = 0;
    const contributions = {};

    for (const [key, weight] of Object.entries(weights)) {
      const val  = features[key] || 0;
      const contrib = val * weight;
      predicted     += contrib;
      contributions[key] = { value: Math.round(val), weight, contribution: Math.round(contrib) };
    }

    return {
      predictedScore:  Math.round(Math.min(100, Math.max(0, predicted))),
      features,
      contributions,
      confidence:      this._getPredictionConfidence(),
      computedAt:      this.#computedAt.toISOString(),
    };
  }

  // ── Full Report ─────────────────────────────────────────────────
  getFullReport(totalPlannedTopics = null) {
    const prediction = this.predictExamScore(totalPlannedTopics);
    return {
      userId:                 this.#userId,
      computedAt:             this.#computedAt.toISOString(),
      totalTimeOnTask:        this.getTotalTimeOnTask(),
      avgSessionDuration:     this.getAvgSessionDuration(),
      totalSessions:          this.#sessions.length,
      learningVelocity:       this.getLearningVelocity(),
      knowledgeRetentionRate: this.getKnowledgeRetentionRate(),
      engagementScore:        this.getEngagementScore(),
      consistencyIndex:       Math.round(this.getConsistencyIndex() * 100),
      avgQuizScore:           this.getAvgQuizScore(),
      topicCoverage:          this.getTopicCoverage(totalPlannedTopics),
      revisionCompliance:     this.getRevisionCompliance(),
      prediction,
      topicBreakdown: {
        strong: this.#topicProgress.filter(t => t.strengthLabel === 'strong').length,
        medium: this.#topicProgress.filter(t => t.strengthLabel === 'medium').length,
        weak:   this.#topicProgress.filter(t => t.strengthLabel === 'weak' || !t.strengthLabel).length,
      },
    };
  }

  // ── Static: Update weights from experiment results ───────────────
  /**
   * Update regression weights based on A/B experiment outcomes.
   * In a real deployment, this would use gradient descent on historical data.
   */
  static updateWeightsFromExperiment(experimentResult) {
    // Simple placeholder — in production, use online learning (e.g., SGD)
    const { featureImportances } = experimentResult;
    if (!featureImportances) return;
    const total = Object.values(featureImportances).reduce((a, b) => a + b, 0);
    if (total === 0) return;
    for (const [key, val] of Object.entries(featureImportances)) {
      if (LearningAnalytics.SCORE_WEIGHTS[key] !== undefined) {
        LearningAnalytics.SCORE_WEIGHTS[key] = val / total;
      }
    }
  }

  // ── Private helpers ─────────────────────────────────────────────
  _getAvgConfidence() {
    if (this.#topicProgress.length === 0) return 3;
    return this.#topicProgress.reduce((s, t) => s + (t.confidence || 3), 0) / this.#topicProgress.length;
  }

  _getPredictionConfidence() {
    // More data → more confident prediction
    const sessionCount = this.#sessions.length;
    const topicCount   = this.#topicProgress.length;
    if (sessionCount >= 20 && topicCount >= 10) return 'high';
    if (sessionCount >= 5  || topicCount >= 3)  return 'medium';
    return 'low';
  }

  toJSON() { return this.getFullReport(); }

  static fromData(userId, data) {
    return new LearningAnalytics(userId, data);
  }
}

module.exports = LearningAnalytics;
