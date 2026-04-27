/**
 * Session Tracker Service
 * Manages StudySession lifecycle in Firestore using the StudySession OOP model.
 */

const { db } = require('../config/firebase');
const StudySession = require('../models/StudySession');

const COLLECTION = 'studySessions';

/**
 * Start a new study session
 */
const startSession = async (userId, subject, topic) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const session = new StudySession(userId, subject, topic);
    session.start();
    const data = session.toObject();
    const docRef = await db.collection(COLLECTION).add({ ...data, createdAt: new Date() });
    return { success: true, sessionId: docRef.id, session: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * End an existing session and persist summary
 */
const endSession = async (sessionId, { confidence, quizScore } = {}) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const ref = db.collection(COLLECTION).doc(sessionId);
    const doc = await ref.get();
    if (!doc.exists) return { success: false, error: 'Session not found' };

    const session = StudySession.fromFirestoreData(doc.data());
    if (confidence !== undefined) session.setConfidence(confidence);
    if (quizScore !== undefined) session.addQuizScore(quizScore);
    session.end();

    const summary = session.getSummary();
    await ref.update({ ...session.toObject(), updatedAt: new Date() });
    return { success: true, summary };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Add a note to an active session
 */
const addNoteToSession = async (sessionId, noteContent) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const ref = db.collection(COLLECTION).doc(sessionId);
    const doc = await ref.get();
    if (!doc.exists) return { success: false, error: 'Session not found' };

    const session = StudySession.fromFirestoreData(doc.data());
    session.addNote(noteContent);
    await ref.update({ notes: session.notes, updatedAt: new Date() });
    return { success: true, noteCount: session.getNoteCount() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get all sessions for a user, with optional subject filter
 */
const getUserSessions = async (userId, subject = null) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    let query = db.collection(COLLECTION).where('userId', '==', userId);
    if (subject) query = query.where('subject', '==', subject);
    const snap = await query.get();

    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort newest first in memory
    sessions.sort((a, b) => {
      const dA = a.startTime ? new Date(a.startTime) : new Date(0);
      const dB = b.startTime ? new Date(b.startTime) : new Date(0);
      return dB - dA;
    });

    return { success: true, sessions, total: sessions.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get aggregated stats across all sessions for a user
 */
const getUserSessionStats = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const snap = await db.collection(COLLECTION)
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .get();

    const sessions = snap.docs.map(d => StudySession.fromFirestoreData(d.data()));
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((s, sess) => s + sess.getDurationMinutes(), 0);
    const totalNotes = sessions.reduce((s, sess) => s + sess.getNoteCount(), 0);
    const totalQuizzes = sessions.reduce((s, sess) => s + sess.quizScores.length, 0);
    const highScoreQuizzes = sessions.reduce((s, sess) =>
      s + sess.quizScores.filter(q => q.score >= 90).length, 0);
    const quizPerfectScores = sessions.reduce((s, sess) =>
      s + sess.quizScores.filter(q => q.score === 100).length, 0);

    return {
      success: true,
      stats: { totalSessions, totalMinutes, totalNotes, totalQuizzes, highScoreQuizzes, quizPerfectScores },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { startSession, endSession, addNoteToSession, getUserSessions, getUserSessionStats };
