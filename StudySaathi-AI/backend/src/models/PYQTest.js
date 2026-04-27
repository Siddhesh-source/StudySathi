/**
 * PYQTest - Previous Year Question Test Model
 * Manages test lifecycle, user responses, scoring, and analytics.
 * 
 * OOP: Encapsulation, State Machine, Observer pattern
 * Design Pattern: Command (for undo/redo responses)
 */

const PYQQuestion = require('./PYQQuestion');

class PYQTest {
  #testId;
  #userId;
  #examName;
  #year;
  #subject;
  #questions;        // PYQQuestion[]
  #responses;        // Map<questionId, { answer, timeTaken, timestamp }>
  #startTime;
  #endTime;
  #status;           // 'not_started', 'in_progress', 'completed', 'evaluated'
  #totalMarks;
  #scoredMarks;
  #evaluation;       // detailed evaluation result
  #listeners;

  static STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    EVALUATED: 'evaluated',
  };

  constructor(userId, examName, year, subject, questions = [], testId = null) {
    this.#testId = testId || `pyq_${userId}_${Date.now()}`;
    this.#userId = userId;
    this.#examName = examName;
    this.#year = year;
    this.#subject = subject;
    this.#questions = questions.map(q => q instanceof PYQQuestion ? q : PYQQuestion.fromObject(q));
    this.#responses = new Map();
    this.#startTime = null;
    this.#endTime = null;
    this.#status = PYQTest.STATUS.NOT_STARTED;
    this.#totalMarks = this.#questions.reduce((s, q) => s + q.marks, 0);
    this.#scoredMarks = 0;
    this.#evaluation = null;
    this.#listeners = {};
  }

  get testId() { return this.#testId; }
  get userId() { return this.#userId; }
  get examName() { return this.#examName; }
  get year() { return this.#year; }
  get subject() { return this.#subject; }
  get questions() { return this.#questions.map(q => q.toObject()); }
  get status() { return this.#status; }
  get totalMarks() { return this.#totalMarks; }
  get scoredMarks() { return this.#scoredMarks; }
  get evaluation() { return this.#evaluation; }

  on(event, callback) {
    if (!this.#listeners[event]) this.#listeners[event] = [];
    this.#listeners[event].push(callback);
    return this;
  }

  #emit(event, data) {
    (this.#listeners[event] || []).forEach(fn => fn(data));
  }

  start() {
    if (this.#status !== PYQTest.STATUS.NOT_STARTED) {
      throw new Error('Test already started');
    }
    this.#startTime = new Date();
    this.#status = PYQTest.STATUS.IN_PROGRESS;
    this.#emit('testStarted', { testId: this.#testId, startTime: this.#startTime });
    return this;
  }

  recordResponse(questionId, answer, timeTaken = 0) {
    if (this.#status !== PYQTest.STATUS.IN_PROGRESS) {
      throw new Error('Test not in progress');
    }
    this.#responses.set(questionId, {
      answer: answer?.toLowerCase(),
      timeTaken,
      timestamp: new Date().toISOString(),
    });
    this.#emit('responseRecorded', { questionId, answer });
    return this;
  }

  submit() {
    if (this.#status !== PYQTest.STATUS.IN_PROGRESS) {
      throw new Error('Test not in progress');
    }
    this.#endTime = new Date();
    this.#status = PYQTest.STATUS.COMPLETED;
    this.#emit('testSubmitted', { testId: this.#testId, endTime: this.#endTime });
    return this;
  }

  evaluate() {
    if (this.#status !== PYQTest.STATUS.COMPLETED) {
      throw new Error('Test not completed yet');
    }

    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let scoredMarks = 0;
    const questionAnalysis = [];

    for (const question of this.#questions) {
      const response = this.#responses.get(question.id);
      const isCorrect = response && question.isCorrect(response.answer);
      
      if (!response || !response.answer) {
        unattempted++;
      } else if (isCorrect) {
        correct++;
        scoredMarks += question.marks;
      } else {
        incorrect++;
      }

      questionAnalysis.push({
        questionId: question.id,
        question: question.questionText,
        subject: question.subject,
        topic: question.topic,
        difficulty: question.getDifficultyLabel(),
        bloomsLevel: question.bloomsLevel,
        marks: question.marks,
        userAnswer: response?.answer || null,
        correctAnswer: question.correctAnswer,
        isCorrect,
        timeTaken: response?.timeTaken || 0,
        explanation: question.explanation,
      });
    }

    this.#scoredMarks = scoredMarks;
    const percentage = Math.round((scoredMarks / this.#totalMarks) * 100);
    const accuracy = this.#questions.length > 0 
      ? Math.round((correct / this.#questions.length) * 100) 
      : 0;

    this.#evaluation = {
      totalQuestions: this.#questions.length,
      correct,
      incorrect,
      unattempted,
      totalMarks: this.#totalMarks,
      scoredMarks,
      percentage,
      accuracy,
      timeTaken: this.#endTime - this.#startTime,
      avgTimePerQuestion: Math.round((this.#endTime - this.#startTime) / this.#questions.length / 1000),
      questionAnalysis,
      strengthByTopic: this.#analyzeByTopic(questionAnalysis),
      strengthByDifficulty: this.#analyzeByDifficulty(questionAnalysis),
      bloomsDistribution: this.#analyzeByBlooms(questionAnalysis),
    };

    this.#status = PYQTest.STATUS.EVALUATED;
    this.#emit('testEvaluated', this.#evaluation);
    return this.#evaluation;
  }

  #analyzeByTopic(analysis) {
    const byTopic = {};
    for (const q of analysis) {
      if (!byTopic[q.topic]) {
        byTopic[q.topic] = { total: 0, correct: 0, marks: 0, scoredMarks: 0 };
      }
      byTopic[q.topic].total++;
      if (q.isCorrect) {
        byTopic[q.topic].correct++;
        byTopic[q.topic].scoredMarks += q.marks;
      }
      byTopic[q.topic].marks += q.marks;
    }
    return Object.entries(byTopic).map(([topic, stats]) => ({
      topic,
      ...stats,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }));
  }

  #analyzeByDifficulty(analysis) {
    const byDiff = { Easy: { total: 0, correct: 0 }, Medium: { total: 0, correct: 0 }, Hard: { total: 0, correct: 0 } };
    for (const q of analysis) {
      byDiff[q.difficulty].total++;
      if (q.isCorrect) byDiff[q.difficulty].correct++;
    }
    return Object.entries(byDiff).map(([level, stats]) => ({
      level,
      ...stats,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));
  }

  #analyzeByBlooms(analysis) {
    const byBlooms = {};
    for (const q of analysis) {
      const level = q.bloomsLevel;
      if (!byBlooms[level]) byBlooms[level] = { total: 0, correct: 0 };
      byBlooms[level].total++;
      if (q.isCorrect) byBlooms[level].correct++;
    }
    return Object.entries(byBlooms).map(([level, stats]) => ({
      level: parseInt(level),
      ...stats,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }));
  }

  getProgress() {
    const attempted = this.#responses.size;
    const total = this.#questions.length;
    return {
      attempted,
      total,
      percentage: Math.round((attempted / total) * 100),
      remaining: total - attempted,
    };
  }

  toObject() {
    return {
      testId: this.#testId,
      userId: this.#userId,
      examName: this.#examName,
      year: this.#year,
      subject: this.#subject,
      questions: this.#questions.map(q => q.toObject()),
      responses: Array.from(this.#responses.entries()).map(([id, resp]) => ({ questionId: id, ...resp })),
      startTime: this.#startTime ? this.#startTime.toISOString() : null,
      endTime: this.#endTime ? this.#endTime.toISOString() : null,
      status: this.#status,
      totalMarks: this.#totalMarks,
      scoredMarks: this.#scoredMarks,
      evaluation: this.#evaluation || null,
    };
  }

  static fromObject(obj) {
    const test = new PYQTest(obj.userId, obj.examName, obj.year, obj.subject, obj.questions, obj.testId);
    test.#startTime = obj.startTime ? new Date(obj.startTime) : null;
    test.#endTime = obj.endTime ? new Date(obj.endTime) : null;
    test.#status = obj.status;
    test.#scoredMarks = obj.scoredMarks || 0;
    test.#evaluation = obj.evaluation;
    if (obj.responses) {
      obj.responses.forEach(r => test.#responses.set(r.questionId, r));
    }
    return test;
  }
}

module.exports = PYQTest;
