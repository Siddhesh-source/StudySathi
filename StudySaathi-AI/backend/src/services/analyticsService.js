const { db } = require('../config/firebase');
const LearningAnalytics = require('../models/LearningAnalytics');
const CognitiveLoadMonitor = require('../models/CognitiveLoadMonitor');
const { getUserSessionStats } = require('./sessionTracker');
const { getTopicProgress } = require('./topicTracker');
const { getStreakData } = require('./streakTracker');
const { getAllSchedules } = require('./spacedRepetitionService');

const getAnalyticsReport = async (userId, totalPlannedTopics = null) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const [sessionsRes, topicsRes, streakRes, srsRes] = await Promise.allSettled([
      getUserSessionStats(userId),
      getTopicProgress(userId),
      getStreakData(userId),
      getAllSchedules(userId),
    ]);

    const sessions = sessionsRes.status === 'fulfilled' && sessionsRes.value.success 
      ? (await db.collection('studySessions').where('userId', '==', userId).get()).docs.map(d => d.data())
      : [];
    const topicProgress = topicsRes.status === 'fulfilled' && topicsRes.value.success ? topicsRes.value.topics : [];
    const streakData = streakRes.status === 'fulfilled' && streakRes.value.success ? streakRes.value : {};
    const srsData = srsRes.status === 'fulfilled' && srsRes.value.success ? srsRes.value.schedules : [];

    const analytics = LearningAnalytics.fromData(userId, { sessions, topicProgress, streakData, srsData });
    const report = analytics.getFullReport(totalPlannedTopics);

    return { success: true, report };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getCognitiveLoadAssessment = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const sessionsSnap = await db.collection('studySessions')
      .where('userId', '==', userId)
      .orderBy('startTime', 'desc')
      .limit(14)
      .get();
    const sessions = sessionsSnap.docs.map(d => d.data());

    const streakRes = await getStreakData(userId);
    const streakHistory = streakRes.success ? (streakRes.streakHistory || []) : [];

    const topicsRes = await getTopicProgress(userId);
    const topicProgress = topicsRes.success ? topicsRes.topics : [];

    const monitor = CognitiveLoadMonitor.fromData(userId, { sessions, streakHistory, topicProgress });
    const assessment = monitor.assess();

    return { success: true, assessment };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { getAnalyticsReport, getCognitiveLoadAssessment };
