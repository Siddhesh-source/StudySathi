/**
 * CognitiveLoadMonitor
 * Detects burnout and cognitive overload from session patterns.
 *
 * Research basis:
 *   Sweller, J. (1988). Cognitive Load During Problem Solving: Effects on Learning.
 *   Cognitive Science, 12(2), 257-285.
 *   Maslach, C. (1982). Burnout: The Cost of Caring.
 *
 * Signals monitored:
 *   - Session duration trends (overload if rising fast)
 *   - Quiz score trends (burnout if declining)
 *   - Note-taking rate (drops under overload)
 *   - Confidence trend (drops under burnout)
 *   - Days without rest (no break > 1 day in 14 days)
 *
 * OOP: Encapsulation, Strategy Pattern (detection algorithms)
 */

class CognitiveLoadMonitor {
  // ── Thresholds ───────────────────────────────────────────────────
  static BURNOUT_THRESHOLDS = {
    minDecliningDays:      3,    // quiz score declines for N consecutive days
    scoreDropPercent:      15,   // score dropped by >= 15%
    maxDailyHours:         6,    // > 6h/day for 3+ days = risk
    noBreakDays:           10,   // studying every day for 10+ days without a rest
    confidenceDropPoints:  1.5,  // avg confidence dropped by 1.5 on 1-5 scale
  };

  static OVERLOAD_THRESHOLDS = {
    sessionLengthSpike:    1.5,  // current session > 1.5x rolling average
    noteRateDrop:          0.5,  // notes per hour dropped to < 50% of average
    multipleTopicsPerDay:  4,    // > 4 different topics in one session
    rapidConfidenceDrop:   1.0,  // confidence dropped by 1 point in single session
  };

  static ALERT_LEVELS = {
    NONE:     'none',
    LOW:      'low',
    MEDIUM:   'medium',
    HIGH:     'high',
    CRITICAL: 'critical',
  };

  // ── Private fields ───────────────────────────────────────────────
  #userId;
  #sessions;          // last 14 days of session summaries
  #streakHistory;
  #topicProgress;

  constructor(userId, { sessions = [], streakHistory = [], topicProgress = [] } = {}) {
    this.#userId        = userId;
    this.#sessions      = sessions;
    this.#streakHistory = streakHistory;
    this.#topicProgress = topicProgress;
  }

  // ── Detection Methods ─────────────────────────────────────────────

  /**
   * Burnout Detection — declining performance trend over time.
   * @returns {{ detected: boolean, level, signals, recommendation }}
   */
  detectBurnout() {
    const signals    = [];
    let severityScore = 0;

    // Signal 1: Declining quiz scores
    const quizTrend = this._getQuizScoreTrend();
    if (quizTrend.declining && quizTrend.dropPercent >= CognitiveLoadMonitor.BURNOUT_THRESHOLDS.scoreDropPercent) {
      signals.push({ type: 'quiz_decline', message: `Quiz scores dropped ${quizTrend.dropPercent}% over recent sessions`, severity: 'high' });
      severityScore += 30;
    }

    // Signal 2: Daily hours exceeding threshold
    const avgDailyHours = this._getAvgDailyStudyHours();
    if (avgDailyHours > CognitiveLoadMonitor.BURNOUT_THRESHOLDS.maxDailyHours) {
      signals.push({ type: 'excessive_hours', message: `Studying ${avgDailyHours.toFixed(1)}h/day on average — well above healthy limit`, severity: 'medium' });
      severityScore += 20;
    }

    // Signal 3: No rest days
    const consecutiveDays = this._getConsecutiveStudyDays();
    if (consecutiveDays >= CognitiveLoadMonitor.BURNOUT_THRESHOLDS.noBreakDays) {
      signals.push({ type: 'no_rest', message: `${consecutiveDays} consecutive study days without a break`, severity: 'high' });
      severityScore += 25;
    }

    // Signal 4: Confidence drop
    const confDrop = this._getConfidenceDrop();
    if (confDrop >= CognitiveLoadMonitor.BURNOUT_THRESHOLDS.confidenceDropPoints) {
      signals.push({ type: 'confidence_drop', message: `Average confidence dropped by ${confDrop.toFixed(1)} points`, severity: 'medium' });
      severityScore += 20;
    }

    // Signal 5: Note-taking declining
    const noteTrend = this._getNoteTakingTrend();
    if (noteTrend.declining) {
      signals.push({ type: 'note_decline', message: 'Note-taking rate declining — engagement may be dropping', severity: 'low' });
      severityScore += 10;
    }

    const level = this._scoreToLevel(severityScore);
    return {
      detected:       level !== CognitiveLoadMonitor.ALERT_LEVELS.NONE,
      level,
      severityScore,
      signals,
      recommendation: this._getBurnoutRecommendation(level, signals),
    };
  }

  /**
   * Cognitive Overload Detection — too much information at once.
   * @returns {{ detected: boolean, level, signals, recommendation }}
   */
  detectOverload() {
    const signals     = [];
    let severityScore  = 0;
    const recentSession = this.#sessions[this.#sessions.length - 1];

    // Signal 1: Session length spike
    const avgDuration = this._getRollingAvgSessionDuration();
    if (recentSession && avgDuration > 0) {
      const ratio = (recentSession.durationMinutes || 0) / avgDuration;
      if (ratio >= CognitiveLoadMonitor.OVERLOAD_THRESHOLDS.sessionLengthSpike) {
        signals.push({ type: 'session_spike', message: `Current session ${ratio.toFixed(1)}x longer than usual`, severity: 'medium' });
        severityScore += 25;
      }
    }

    // Signal 2: Too many topics in one session
    const recentTopics = this._getTopicsStudiedToday();
    if (recentTopics >= CognitiveLoadMonitor.OVERLOAD_THRESHOLDS.multipleTopicsPerDay) {
      signals.push({ type: 'topic_switching', message: `Studied ${recentTopics} different topics today — may cause interference`, severity: 'medium' });
      severityScore += 20;
    }

    // Signal 3: Note-taking rate dropped vs session duration
    const noteRate = this._getCurrentNoteRate();
    const avgNoteRate = this._getAvgNoteRate();
    if (avgNoteRate > 0 && noteRate < avgNoteRate * CognitiveLoadMonitor.OVERLOAD_THRESHOLDS.noteRateDrop) {
      signals.push({ type: 'low_note_rate', message: 'Note-taking rate is less than half your usual — possible information overload', severity: 'high' });
      severityScore += 30;
    }

    const level = this._scoreToLevel(severityScore);
    return {
      detected:       level !== CognitiveLoadMonitor.ALERT_LEVELS.NONE,
      level,
      severityScore,
      signals,
      recommendation: this._getOverloadRecommendation(level),
    };
  }

  /**
   * Combined assessment — run both detectors.
   */
  assess() {
    const burnout  = this.detectBurnout();
    const overload = this.detectOverload();
    const anyDetected = burnout.detected || overload.detected;

    return {
      userId:   this.#userId,
      assessedAt: new Date().toISOString(),
      overall: anyDetected ? Math.max(burnout.severityScore, overload.severityScore) : 0,
      wellbeing: anyDetected ? 'at_risk' : 'healthy',
      burnout,
      overload,
      studyPattern: {
        avgDailyHours:     this._getAvgDailyStudyHours(),
        consecutiveDays:   this._getConsecutiveStudyDays(),
        avgSessionMinutes: this._getRollingAvgSessionDuration(),
        topicsToday:       this._getTopicsStudiedToday(),
      },
    };
  }

  // ── Private Analysis Helpers ─────────────────────────────────────
  _getQuizScoreTrend() {
    const scores = this.#sessions
      .flatMap(s => (s.quizScores || []).map(q => q.score || q))
      .slice(-10);
    if (scores.length < 3) return { declining: false, dropPercent: 0 };
    const first = scores.slice(0, Math.ceil(scores.length / 2));
    const last  = scores.slice(Math.floor(scores.length / 2));
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgLast  = last.reduce((a, b) => a + b, 0)  / last.length;
    const dropPercent = Math.round(((avgFirst - avgLast) / Math.max(1, avgFirst)) * 100);
    return { declining: avgLast < avgFirst, dropPercent: Math.max(0, dropPercent) };
  }

  _getAvgDailyStudyHours() {
    const last7 = this.#sessions.slice(-14);
    if (last7.length === 0) return 0;
    const total = last7.reduce((s, sess) => s + (sess.durationMinutes || 0), 0);
    return Math.round((total / Math.max(1, last7.length) / 60) * 10) / 10;
  }

  _getConsecutiveStudyDays() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (this.#streakHistory.some(h => h.date === dateStr)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }

  _getConfidenceDrop() {
    const confidences = this.#topicProgress.map(t => t.confidence || 3);
    if (confidences.length === 0) return 0;
    const recentAvg = confidences.slice(-Math.ceil(confidences.length / 2))
                                  .reduce((a, b) => a + b, 0) / Math.ceil(confidences.length / 2);
    const olderAvg  = confidences.slice(0, Math.floor(confidences.length / 2))
                                  .reduce((a, b) => a + b, 0) / Math.max(1, Math.floor(confidences.length / 2));
    return Math.max(0, olderAvg - recentAvg);
  }

  _getNoteTakingTrend() {
    const notes = this.#sessions.map(s => s.noteCount || 0).slice(-6);
    if (notes.length < 3) return { declining: false };
    const first = notes.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const last  = notes.slice(-3).reduce((a, b) => a + b, 0)  / 3;
    return { declining: last < first * 0.7 };
  }

  _getRollingAvgSessionDuration() {
    const durations = this.#sessions.slice(-7).map(s => s.durationMinutes || 0);
    if (durations.length === 0) return 0;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  _getTopicsStudiedToday() {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.#sessions
      .filter(s => s.startTime && s.startTime.startsWith(todayStr))
      .length;
  }

  _getCurrentNoteRate() {
    const recent = this.#sessions.slice(-1)[0];
    if (!recent || !recent.durationMinutes || recent.durationMinutes === 0) return 0;
    return (recent.noteCount || 0) / (recent.durationMinutes / 60);
  }

  _getAvgNoteRate() {
    const sessions = this.#sessions.slice(-10);
    if (sessions.length === 0) return 0;
    const rates = sessions.map(s => (s.noteCount || 0) / Math.max(1, (s.durationMinutes || 1) / 60));
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }

  _scoreToLevel(score) {
    if (score === 0)  return CognitiveLoadMonitor.ALERT_LEVELS.NONE;
    if (score < 20)   return CognitiveLoadMonitor.ALERT_LEVELS.LOW;
    if (score < 40)   return CognitiveLoadMonitor.ALERT_LEVELS.MEDIUM;
    if (score < 60)   return CognitiveLoadMonitor.ALERT_LEVELS.HIGH;
    return                   CognitiveLoadMonitor.ALERT_LEVELS.CRITICAL;
  }

  _getBurnoutRecommendation(level, signals) {
    if (level === 'none')     return null;
    if (level === 'critical') return { type: 'rest_day', message: '🛑 Take a full rest day today. Your brain needs recovery time. Quality > Quantity!', action: 'rest' };
    if (level === 'high')     return { type: 'light_session', message: '⚠️ Try a lighter session today — only revision, no new topics. 30 minutes max.', action: 'lighten' };
    if (level === 'medium')   return { type: 'pomodoro', message: '💡 Switch to Pomodoro technique: 25 min study, 5 min break. Add a fun activity after studying.', action: 'pomodoro' };
    return                           { type: 'awareness', message: '📊 Slight burnout signals detected. Ensure 7-8 hours of sleep and daily exercise.', action: 'monitor' };
  }

  _getOverloadRecommendation(level) {
    if (level === 'none')   return null;
    if (level === 'high')   return { type: 'reduce_scope', message: '🧠 Focus on ONE topic at a time. End this session and revisit tomorrow with fresh eyes.', action: 'stop' };
    if (level === 'medium') return { type: 'break_now', message: '☕ Take a 15-minute break right now. Your working memory is saturated.', action: 'break' };
    return                         { type: 'awareness', message: '📝 Slow down and take more notes — this helps consolidate information.', action: 'notes' };
  }

  static fromData(userId, data) {
    return new CognitiveLoadMonitor(userId, data);
  }
}

module.exports = CognitiveLoadMonitor;
