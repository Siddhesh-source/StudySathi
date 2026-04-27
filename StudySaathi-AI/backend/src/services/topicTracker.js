/**
 * Topic Tracker Service
 * Tracks topic progress and calculates strength based on:
 * - Time spent studying
 * - Notes saved
 * - User confidence rating
 * 
 * Now uses StudyMetrics class for OOP-based calculations
 */

const { db } = require('../config/firebase');
const { StudyMetrics } = require('../models/StudyMetrics');

// Re-export for backward compatibility
const STRENGTH_THRESHOLDS = StudyMetrics.STRENGTH_THRESHOLDS;

/**
 * Calculate topic strength score (0-100)
 * Now uses StudyMetrics class
 */
const calculateStrengthScore = (metrics) => {
  const studyMetrics = StudyMetrics.fromObject(metrics);
  return studyMetrics.calculateStrengthScore();
};

/**
 * Get strength label from score
 */
const getStrengthLabel = (score) => {
  if (score >= StudyMetrics.STRENGTH_THRESHOLDS.STRONG) return 'strong';
  if (score >= StudyMetrics.STRENGTH_THRESHOLDS.MEDIUM) return 'medium';
  return 'weak';
};

/**
 * Track time spent on a topic
 */
const trackTimeSpent = async (userId, subject, topic, minutes) => {
  if (!db) return { success: false, error: 'Database not configured' };

  try {
    const topicId = `${subject}_${topic}`.replace(/\s+/g, '_').toLowerCase();
    const docRef = db.collection('users').doc(userId)
      .collection('topicProgress').doc(topicId);

    const doc = await docRef.get();
    const currentData = doc.exists ? doc.data() : {};

    const newTimeSpent = (currentData.timeSpentMinutes || 0) + minutes;

    await docRef.set({
      subject,
      topic,
      timeSpentMinutes: newTimeSpent,
      lastStudied: new Date(),
      updatedAt: new Date(),
      ...(!doc.exists && { createdAt: new Date() }),
    }, { merge: true });

    // Recalculate strength using StudyMetrics class
    const updatedDoc = await docRef.get();
    const metricsData = updatedDoc.data();
    const studyMetrics = StudyMetrics.fromObject({
      timeSpentMinutes: metricsData.timeSpentMinutes || 0,
      notesCount: metricsData.notesCount || 0,
      confidence: metricsData.confidence || 3,
      quizAvgScore: metricsData.quizAvgScore || 0,
    });

    const score = studyMetrics.calculateStrengthScore();
    const breakdown = studyMetrics.getBreakdown();

    await docRef.update({
      strengthScore: score,
      strengthLabel: studyMetrics.getStrengthLabel(),
      metricsBreakdown: breakdown,
    });

    return { success: true, timeSpentMinutes: newTimeSpent, strengthScore: score, breakdown };
  } catch (error) {
    console.error('Track time error:', error);
    return { success: false, error: error.message };
  }
};


/**
 * Update notes count for a topic
 */
const trackNoteSaved = async (userId, subject, topic) => {
  if (!db) return { success: false, error: 'Database not configured' };

  try {
    const topicId = `${subject}_${topic}`.replace(/\s+/g, '_').toLowerCase();
    const docRef = db.collection('users').doc(userId)
      .collection('topicProgress').doc(topicId);

    const doc = await docRef.get();
    const currentData = doc.exists ? doc.data() : {};

    const newNotesCount = (currentData.notesCount || 0) + 1;

    await docRef.set({
      subject,
      topic,
      notesCount: newNotesCount,
      lastNoteSaved: new Date(),
      updatedAt: new Date(),
      ...(!doc.exists && { createdAt: new Date() }),
    }, { merge: true });

    // Recalculate strength using StudyMetrics class
    const updatedDoc = await docRef.get();
    const metricsData = updatedDoc.data();
    const studyMetrics = StudyMetrics.fromObject({
      timeSpentMinutes: metricsData.timeSpentMinutes || 0,
      notesCount: metricsData.notesCount || 0,
      confidence: metricsData.confidence || 3,
      quizAvgScore: metricsData.quizAvgScore || 0,
    });

    const score = studyMetrics.calculateStrengthScore();

    await docRef.update({
      strengthScore: score,
      strengthLabel: studyMetrics.getStrengthLabel(),
    });

    return { success: true, notesCount: newNotesCount, strengthScore: score };
  } catch (error) {
    console.error('Track note error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user confidence for a topic
 */
const updateConfidence = async (userId, subject, topic, confidence) => {
  if (!db) return { success: false, error: 'Database not configured' };

  try {
    const topicId = `${subject}_${topic}`.replace(/\s+/g, '_').toLowerCase();
    const docRef = db.collection('users').doc(userId)
      .collection('topicProgress').doc(topicId);

    const doc = await docRef.get();

    await docRef.set({
      subject,
      topic,
      confidence: Math.min(Math.max(confidence, 1), 5), // Clamp 1-5
      updatedAt: new Date(),
      ...(!doc.exists && { createdAt: new Date() }),
    }, { merge: true });

    // Recalculate strength using StudyMetrics class
    const updatedDoc = await docRef.get();
    const metricsData = updatedDoc.data();
    const studyMetrics = StudyMetrics.fromObject({
      timeSpentMinutes: metricsData.timeSpentMinutes || 0,
      notesCount: metricsData.notesCount || 0,
      confidence: metricsData.confidence || 3,
      quizAvgScore: metricsData.quizAvgScore || 0,
    });

    const score = studyMetrics.calculateStrengthScore();
    const suggestions = studyMetrics.getImprovementSuggestions();

    await docRef.update({
      strengthScore: score,
      strengthLabel: studyMetrics.getStrengthLabel(),
      improvementSuggestions: suggestions,
    });

    return { 
      success: true, 
      confidence, 
      strengthScore: score, 
      strengthLabel: studyMetrics.getStrengthLabel(),
      suggestions 
    };
  } catch (error) {
    console.error('Update confidence error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all topic progress for a user
 */
const getTopicProgress = async (userId, subject = null) => {
  if (!db) return { success: false, error: 'Database not configured' };

  try {
    let query = db.collection('users').doc(userId).collection('topicProgress');
    
    if (subject) {
      query = query.where('subject', '==', subject);
    }

    const snapshot = await query.get();
    const topics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Group by strength
    const grouped = {
      strong: topics.filter(t => t.strengthLabel === 'strong'),
      medium: topics.filter(t => t.strengthLabel === 'medium'),
      weak: topics.filter(t => t.strengthLabel === 'weak' || !t.strengthLabel),
    };

    return { success: true, topics, grouped };
  } catch (error) {
    console.error('Get progress error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get study recommendations based on topic strengths
 */
const getStudyRecommendations = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };

  try {
    const { topics, grouped } = await getTopicProgress(userId);

    if (!topics || topics.length === 0) {
      return { success: true, recommendations: [], message: 'No topics tracked yet' };
    }

    const recommendations = [];

    // Prioritize weak topics
    grouped.weak.forEach(topic => {
      recommendations.push({
        topic: topic.topic,
        subject: topic.subject,
        priority: 'high',
        reason: 'Needs more practice',
        suggestedTime: 45,
        strengthScore: topic.strengthScore || 0,
      });
    });

    // Medium topics need maintenance
    grouped.medium.forEach(topic => {
      recommendations.push({
        topic: topic.topic,
        subject: topic.subject,
        priority: 'medium',
        reason: 'Good progress, keep practicing',
        suggestedTime: 30,
        strengthScore: topic.strengthScore || 0,
      });
    });

    // Strong topics - light revision
    grouped.strong.forEach(topic => {
      recommendations.push({
        topic: topic.topic,
        subject: topic.subject,
        priority: 'low',
        reason: 'Quick revision recommended',
        suggestedTime: 15,
        strengthScore: topic.strengthScore || 0,
      });
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return { success: true, recommendations, summary: {
      total: topics.length,
      strong: grouped.strong.length,
      medium: grouped.medium.length,
      weak: grouped.weak.length,
    }};
  } catch (error) {
    console.error('Get recommendations error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  calculateStrengthScore,
  getStrengthLabel,
  trackTimeSpent,
  trackNoteSaved,
  updateConfidence,
  getTopicProgress,
  getStudyRecommendations,
  STRENGTH_THRESHOLDS,
};
