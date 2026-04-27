/**
 * Scoring Strategy classes — Strategy Pattern
 * Swap scoring algorithms without changing StudyMetrics.
 * Each exam type can have its own weights.
 */
class ScoringStrategy {
  /**
   * @param {StudyMetrics} metrics
   * @returns {number} 0-100
   */
  // eslint-disable-next-line no-unused-vars
  calculate(metrics) {
    throw new Error('calculate() must be implemented by subclass');
  }
}

class DefaultScoringStrategy extends ScoringStrategy {
  calculate(metrics) {
    const w = StudyMetrics.WEIGHTS;
    return Math.round(
      metrics.getTimeScore()       * w.timeSpent +
      metrics.getNotesScore()      * w.notesSaved +
      metrics.getConfidenceScore() * w.confidence +
      metrics.quizAvgScore         * w.quizScore
    );
  }
}

class JEEScoringStrategy extends ScoringStrategy {
  // JEE emphasises quiz performance and time more heavily
  calculate(metrics) {
    return Math.round(
      metrics.getTimeScore()       * 0.25 +
      metrics.getNotesScore()      * 0.10 +
      metrics.getConfidenceScore() * 0.25 +
      metrics.quizAvgScore         * 0.40
    );
  }
}

class NEETScoringStrategy extends ScoringStrategy {
  // NEET emphasises confidence and notes (concept clarity)
  calculate(metrics) {
    return Math.round(
      metrics.getTimeScore()       * 0.20 +
      metrics.getNotesScore()      * 0.30 +
      metrics.getConfidenceScore() * 0.40 +
      metrics.quizAvgScore         * 0.10
    );
  }
}

// Registry for easy extensibility
const SCORING_STRATEGIES = {
  default: new DefaultScoringStrategy(),
  JEE: new JEEScoringStrategy(),
  NEET: new NEETScoringStrategy(),
};

/**
 * Study Metrics Class
 * Encapsulates all metric calculations and strength analysis
 * Demonstrates: Encapsulation, Single Responsibility, Strategy Pattern
 */
class StudyMetrics {
  // Private fields (using convention)
  #timeSpentMinutes;
  #notesCount;
  #confidence;
  #quizAvgScore;
  #scoringStrategy;
  
  // Static constants
  static STRENGTH_THRESHOLDS = {
    STRONG: 70,
    MEDIUM: 40,
    WEAK: 0
  };

  static WEIGHTS = {
    timeSpent: 0.3,
    notesSaved: 0.25,
    confidence: 0.35,
    quizScore: 0.10
  };

  static MAX_TIME_FOR_FULL_SCORE = 120; // minutes
  static MAX_NOTES_FOR_FULL_SCORE = 5;

  constructor(timeSpentMinutes = 0, notesCount = 0, confidence = 3, quizAvgScore = 0, examType = 'default') {
    this.#timeSpentMinutes = timeSpentMinutes;
    this.#notesCount = notesCount;
    this.#confidence = this._clampConfidence(confidence);
    this.#quizAvgScore = quizAvgScore;
    this.#scoringStrategy = SCORING_STRATEGIES[examType] || SCORING_STRATEGIES.default;
  }

  // Strategy Pattern — swap scoring algorithm at runtime
  setScoringStrategy(strategyOrExamType) {
    if (typeof strategyOrExamType === 'string') {
      const s = SCORING_STRATEGIES[strategyOrExamType];
      if (!s) throw new Error(`Unknown exam type strategy: ${strategyOrExamType}`);
      this.#scoringStrategy = s;
    } else if (strategyOrExamType instanceof ScoringStrategy) {
      this.#scoringStrategy = strategyOrExamType;
    } else {
      throw new Error('Must pass an exam type string or ScoringStrategy instance');
    }
    return this;
  }

  // Getters (Encapsulation)
  get timeSpentMinutes() { return this.#timeSpentMinutes; }
  get notesCount() { return this.#notesCount; }
  get confidence() { return this.#confidence; }
  get quizAvgScore() { return this.#quizAvgScore; }

  // Setters with validation
  set timeSpentMinutes(value) {
    if (value < 0) throw new Error('Time spent cannot be negative');
    this.#timeSpentMinutes = value;
  }

  set notesCount(value) {
    if (value < 0) throw new Error('Notes count cannot be negative');
    this.#notesCount = value;
  }

  set confidence(value) {
    this.#confidence = this._clampConfidence(value);
  }

  set quizAvgScore(value) {
    if (value < 0 || value > 100) throw new Error('Quiz score must be between 0 and 100');
    this.#quizAvgScore = value;
  }

  // Private helper method
  _clampConfidence(value) {
    return Math.min(Math.max(value, 1), 5);
  }

  // Calculate normalized scores
  getTimeScore() {
    return Math.min((this.#timeSpentMinutes / StudyMetrics.MAX_TIME_FOR_FULL_SCORE) * 100, 100);
  }

  getNotesScore() {
    return Math.min((this.#notesCount / StudyMetrics.MAX_NOTES_FOR_FULL_SCORE) * 100, 100);
  }

  getConfidenceScore() {
    return ((this.#confidence - 1) / 4) * 100;
  }

  // Calculate overall strength score — delegates to Strategy
  calculateStrengthScore() {
    return this.#scoringStrategy.calculate(this);
  }

  // Get strength label
  getStrengthLabel() {
    const score = this.calculateStrengthScore();
    if (score >= StudyMetrics.STRENGTH_THRESHOLDS.STRONG) return 'strong';
    if (score >= StudyMetrics.STRENGTH_THRESHOLDS.MEDIUM) return 'medium';
    return 'weak';
  }

  // Get detailed breakdown
  getBreakdown() {
    return {
      timeScore: Math.round(this.getTimeScore()),
      notesScore: Math.round(this.getNotesScore()),
      confidenceScore: Math.round(this.getConfidenceScore()),
      quizScore: this.#quizAvgScore,
      overallScore: this.calculateStrengthScore(),
      strengthLabel: this.getStrengthLabel()
    };
  }

  // Update methods
  addTimeSpent(minutes) {
    this.#timeSpentMinutes += minutes;
    return this;
  }

  addNote() {
    this.#notesCount += 1;
    return this;
  }

  updateConfidence(newConfidence) {
    this.#confidence = this._clampConfidence(newConfidence);
    return this;
  }

  updateQuizScore(score) {
    if (score < 0 || score > 100) throw new Error('Quiz score must be between 0 and 100');
    this.#quizAvgScore = score;
    return this;
  }

  // Static factory method
  static fromObject(obj) {
    return new StudyMetrics(
      obj.timeSpentMinutes || 0,
      obj.notesCount || 0,
      obj.confidence || 3,
      obj.quizAvgScore || 0
    );
  }

  // Convert to plain object
  toObject() {
    return {
      timeSpentMinutes: this.#timeSpentMinutes,
      notesCount: this.#notesCount,
      confidence: this.#confidence,
      quizAvgScore: this.#quizAvgScore,
      strengthScore: this.calculateStrengthScore(),
      strengthLabel: this.getStrengthLabel()
    };
  }

  // Compare with another StudyMetrics instance
  compareTo(other) {
    const thisScore = this.calculateStrengthScore();
    const otherScore = other.calculateStrengthScore();
    return thisScore - otherScore;
  }

  // Check if meets minimum requirements
  meetsMinimumRequirements() {
    return this.#timeSpentMinutes >= 30 && this.#confidence >= 3;
  }

  // Get improvement suggestions
  getImprovementSuggestions() {
    const suggestions = [];
    const breakdown = this.getBreakdown();

    if (breakdown.timeScore < 50) {
      suggestions.push({
        area: 'Study Time',
        message: 'Spend more time on this topic',
        priority: 'high'
      });
    }

    if (breakdown.notesScore < 50) {
      suggestions.push({
        area: 'Notes',
        message: 'Take more notes to reinforce learning',
        priority: 'medium'
      });
    }

    if (breakdown.confidenceScore < 50) {
      suggestions.push({
        area: 'Confidence',
        message: 'Practice more to build confidence',
        priority: 'high'
      });
    }

    if (breakdown.quizScore < 60) {
      suggestions.push({
        area: 'Quiz Performance',
        message: 'Take more quizzes to test understanding',
        priority: 'medium'
      });
    }

    return suggestions;
  }
  toString() {
    return `StudyMetrics | score:${this.calculateStrengthScore()} | ${this.getStrengthLabel()} | ${this.#timeSpentMinutes}min`;
  }

  toJSON() { return this.toObject(); }
}

module.exports = {
  StudyMetrics,
  ScoringStrategy,
  DefaultScoringStrategy,
  JEEScoringStrategy,
  NEETScoringStrategy,
  SCORING_STRATEGIES,
};
