/**
 * Streak Tracker Service
 * Tracks daily study streaks and generates motivational messages
 * Now uses StreakManager class for OOP-based streak management
 */

const { db } = require('../config/firebase');
const StreakManager = require('../models/StreakManager');

/**
 * Generate motivational message based on streak and user context
 * Wrapper function for backward compatibility
 */
const generateMotivationalMessage = async (streakData) => {
  const streakManager = new StreakManager('temp', {
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    userContext: {
      examName: streakData.examName,
      userName: streakData.userName,
      examDate: streakData.daysToExam ? new Date(Date.now() + streakData.daysToExam * 24 * 60 * 60 * 1000) : null
    }
  });
  
  return await streakManager.generateMotivationalMessage();
};

/**
 * Check and update user's streak
 * Now uses StreakManager class for OOP-based management
 */
const updateStreak = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };

  try {
    const userRef = db.collection('users').doc(userId);
    const streakRef = userRef.collection('streaks').doc('current');
    
    // Get existing streak data
    const streakDoc = await streakRef.get();
    const streakData = streakDoc.exists ? streakDoc.data() : {};

    // Get user info for context
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Create StreakManager instance
    const streakManager = StreakManager.fromFirestoreData(userId, {
      ...streakData,
      examName: userData.examName,
      userName: userData.displayName,
      examDate: userData.examDate
    });

    // Check if already logged today
    if (streakManager.hasStudiedToday()) {
      const stats = streakManager.getStatistics();
      return {
        success: true,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        lastActiveDate: stats.lastActiveDate,
        message: streakData.todayMessage,
        alreadyLogged: true,
      };
    }

    // Update streak
    const updateResult = streakManager.updateForToday();

    // Generate motivational message
    const message = await streakManager.generateMotivationalMessage();

    // Get milestone info
    const milestone = streakManager.getMilestone();

    // Save to Firestore
    const dataToSave = streakManager.toObject();
    await streakRef.set({
      currentStreak: dataToSave.currentStreak,
      longestStreak: dataToSave.longestStreak,
      lastActiveDate: dataToSave.lastActiveDate,
      todayMessage: message,
      streakHistory: dataToSave.streakHistory,
      milestone: milestone.current,
      nextMilestone: milestone.next,
      updatedAt: new Date(),
    });

    // Update user's streak summary
    await userRef.set({
      currentStreak: dataToSave.currentStreak,
      longestStreak: dataToSave.longestStreak,
      lastStudyDate: dataToSave.lastActiveDate,
    }, { merge: true });

    return {
      success: true,
      currentStreak: dataToSave.currentStreak,
      longestStreak: dataToSave.longestStreak,
      lastActiveDate: dataToSave.lastActiveDate,
      message,
      streakBroken: updateResult.streakBroken,
      isNewRecord: updateResult.isNewRecord,
      milestone: milestone.current,
      nextMilestone: milestone.next,
    };
  } catch (error) {
    console.error('Update streak error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's current streak data
 * Now uses StreakManager class
 */
const getStreakData = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };

  try {
    const streakRef = db.collection('users').doc(userId).collection('streaks').doc('current');
    const streakDoc = await streakRef.get();

    if (!streakDoc.exists) {
      return {
        success: true,
        currentStreak: 0,
        longestStreak: 0,
        message: "🌟 Start your study streak today! Every journey begins with a single step.",
        streakHistory: [],
      };
    }

    const data = streakDoc.data();
    
    // Create StreakManager instance
    const streakManager = StreakManager.fromFirestoreData(userId, data);
    
    // Get statistics
    const stats = streakManager.getStatistics();
    const milestone = streakManager.getMilestone();

    if (streakManager.isStreakBroken()) {
      return {
        success: true,
        currentStreak: 0,
        longestStreak: stats.longestStreak,
        message: "😊 Your streak reset, but that's okay! Start fresh today.",
        streakHistory: stats.totalDaysTracked,
        streakBroken: true,
        milestone: milestone.next,
      };
    }

    return {
      success: true,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastActiveDate: stats.lastActiveDate,
      message: data.todayMessage,
      streakHistory: data.streakHistory || [],
      studiedToday: stats.hasStudiedToday,
      streakPercentage: stats.streakPercentage,
      milestone: milestone.current,
      nextMilestone: milestone.next,
      daysToNextMilestone: milestone.daysToNext,
    };
  } catch (error) {
    console.error('Get streak error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateMotivationalMessage,
  updateStreak,
  getStreakData,
};
