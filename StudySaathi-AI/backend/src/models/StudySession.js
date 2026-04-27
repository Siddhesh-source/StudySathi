/**
 * StudySession Class
 * Represents a single study session with full lifecycle management.
 * Demonstrates: Encapsulation, Single Responsibility, Command-like accumulation
 */

const { StudyMetrics } = require('./StudyMetrics');

class StudySession {
  #sessionId;
  #userId;
  #subject;
  #topic;
  #startTime;
  #endTime;
  #notes;
  #quizScores;
  #confidence;
  #isActive;
  #events; // audit log of session events

  static STATUS = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned',
  };

  constructor(userId, subject, topic, sessionId = null) {
    if (!userId || !subject || !topic) {
      throw new Error('userId, subject, and topic are required to create a StudySession');
    }
    this.#sessionId = sessionId || `session_${userId}_${Date.now()}`;
    this.#userId = userId;
    this.#subject = subject;
    this.#topic = topic;
    this.#startTime = null;
    this.#endTime = null;
    this.#notes = [];
    this.#quizScores = [];
    this.#confidence = 3; // default mid-confidence
    this.#isActive = false;
    this.#events = [];
  }

  // ─── Getters ────────────────────────────────────────────────────
  get sessionId() { return this.#sessionId; }
  get userId() { return this.#userId; }
  get subject() { return this.#subject; }
  get topic() { return this.#topic; }
  get startTime() { return this.#startTime; }
  get endTime() { return this.#endTime; }
  get notes() { return [...this.#notes]; }
  get quizScores() { return [...this.#quizScores]; }
  get confidence() { return this.#confidence; }
  get isActive() { return this.#isActive; }
  get status() {
    if (!this.#startTime) return StudySession.STATUS.ACTIVE; // not started yet
    if (this.#endTime) return StudySession.STATUS.COMPLETED;
    if (this.#isActive) return StudySession.STATUS.ACTIVE;
    return StudySession.STATUS.PAUSED;
  }

  // ─── Lifecycle Methods ───────────────────────────────────────────
  start() {
    if (this.#startTime) throw new Error('Session already started');
    this.#startTime = new Date();
    this.#isActive = true;
    this._logEvent('SESSION_STARTED');
    return this;
  }

  pause() {
    if (!this.#isActive) throw new Error('Session is not active');
    this.#isActive = false;
    this._logEvent('SESSION_PAUSED');
    return this;
  }

  resume() {
    if (this.#isActive) throw new Error('Session is already active');
    if (this.#endTime) throw new Error('Session already ended');
    this.#isActive = true;
    this._logEvent('SESSION_RESUMED');
    return this;
  }

  end() {
    if (!this.#startTime) throw new Error('Session was never started');
    if (this.#endTime) throw new Error('Session already ended');
    this.#endTime = new Date();
    this.#isActive = false;
    this._logEvent('SESSION_ENDED');
    return this;
  }

  abandon() {
    this.#endTime = new Date();
    this.#isActive = false;
    this._logEvent('SESSION_ABANDONED');
    return this;
  }

  // ─── Data Accumulation Methods ───────────────────────────────────
  addNote(content) {
    if (!content || typeof content !== 'string') throw new Error('Note content must be a non-empty string');
    const note = { id: this.#notes.length + 1, content, timestamp: new Date() };
    this.#notes.push(note);
    this._logEvent('NOTE_ADDED', { noteId: note.id });
    return this;
  }

  addQuizScore(score) {
    if (score < 0 || score > 100) throw new Error('Quiz score must be between 0 and 100');
    this.#quizScores.push({ score, timestamp: new Date() });
    this._logEvent('QUIZ_COMPLETED', { score });
    return this;
  }

  setConfidence(level) {
    if (level < 1 || level > 5) throw new Error('Confidence must be between 1 and 5');
    this.#confidence = level;
    this._logEvent('CONFIDENCE_UPDATED', { level });
    return this;
  }

  // ─── Computed Properties ─────────────────────────────────────────
  getDurationMinutes() {
    const end = this.#endTime || new Date();
    const start = this.#startTime || new Date();
    return Math.floor((end - start) / 60000);
  }

  getAverageQuizScore() {
    if (this.#quizScores.length === 0) return 0;
    const total = this.#quizScores.reduce((sum, q) => sum + q.score, 0);
    return Math.round(total / this.#quizScores.length);
  }

  getNoteCount() {
    return this.#notes.length;
  }

  /**
   * Converts this session into a StudyMetrics instance.
   * Bridge between StudySession and StudyMetrics — OOP composition.
   */
  toMetrics() {
    return new StudyMetrics(
      this.getDurationMinutes(),
      this.getNoteCount(),
      this.#confidence,
      this.getAverageQuizScore()
    );
  }

  /**
   * Get a summary of the session.
   */
  getSummary() {
    const metrics = this.toMetrics();
    const breakdown = metrics.getBreakdown();
    return {
      sessionId: this.#sessionId,
      subject: this.#subject,
      topic: this.#topic,
      durationMinutes: this.getDurationMinutes(),
      noteCount: this.getNoteCount(),
      quizCount: this.#quizScores.length,
      averageQuizScore: this.getAverageQuizScore(),
      confidence: this.#confidence,
      status: this.status,
      strengthScore: breakdown.overallScore,
      strengthLabel: breakdown.strengthLabel,
      suggestions: metrics.getImprovementSuggestions(),
    };
  }

  // ─── Serialization ───────────────────────────────────────────────
  toObject() {
    return {
      sessionId: this.#sessionId,
      userId: this.#userId,
      subject: this.#subject,
      topic: this.#topic,
      startTime: this.#startTime?.toISOString() || null,
      endTime: this.#endTime?.toISOString() || null,
      durationMinutes: this.getDurationMinutes(),
      notes: this.#notes.map(n => ({ ...n, timestamp: n.timestamp.toISOString() })),
      quizScores: this.#quizScores.map(q => ({ ...q, timestamp: q.timestamp.toISOString() })),
      confidence: this.#confidence,
      averageQuizScore: this.getAverageQuizScore(),
      status: this.status,
      events: this.#events,
    };
  }

  toString() {
    return `StudySession(${this.#sessionId}) | ${this.#subject}/${this.#topic} | ${this.getDurationMinutes()} min | ${this.status}`;
  }

  toJSON() {
    return this.toObject();
  }

  // ─── Static Factory Methods ──────────────────────────────────────
  static fromObject(obj) {
    const session = new StudySession(obj.userId, obj.subject, obj.topic, obj.sessionId);
    if (obj.startTime) session.#startTime = new Date(obj.startTime);
    if (obj.endTime) session.#endTime = new Date(obj.endTime);
    session.#notes = obj.notes || [];
    session.#quizScores = obj.quizScores || [];
    session.#confidence = obj.confidence || 3;
    session.#events = obj.events || [];
    return session;
  }

  static fromFirestoreData(data) {
    return StudySession.fromObject(data);
  }

  /**
   * Sort sessions by duration (descending)
   */
  static sortByDuration(sessions) {
    return [...sessions].sort((a, b) => b.getDurationMinutes() - a.getDurationMinutes());
  }

  /**
   * Aggregate metrics across multiple sessions (same topic)
   */
  static aggregateMetrics(sessions) {
    if (!sessions || sessions.length === 0) return null;
    const totalTime = sessions.reduce((sum, s) => sum + s.getDurationMinutes(), 0);
    const totalNotes = sessions.reduce((sum, s) => sum + s.getNoteCount(), 0);
    const avgConfidence = sessions.reduce((sum, s) => sum + s.confidence, 0) / sessions.length;
    const allScores = sessions.flatMap(s => s.quizScores.map(q => q.score));
    const avgQuiz = allScores.length > 0
      ? allScores.reduce((s, v) => s + v, 0) / allScores.length
      : 0;
    return new StudyMetrics(totalTime, totalNotes, Math.round(avgConfidence), Math.round(avgQuiz));
  }

  // ─── Private Helpers ─────────────────────────────────────────────
  _logEvent(type, meta = {}) {
    this.#events.push({ type, timestamp: new Date().toISOString(), ...meta });
  }
}

module.exports = StudySession;
