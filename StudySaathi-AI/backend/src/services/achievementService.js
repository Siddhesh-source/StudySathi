/**
 * Achievement Service
 * Manages achievement unlocks in Firestore using AchievementManager (Observer Pattern).
 */

const { db } = require('../config/firebase');
const { AchievementManager } = require('../models/Achievement');
const { getUserSessionStats } = require('./sessionTracker');

const COLLECTION = 'achievements';

/**
 * Build userStats object for achievement checking by aggregating all sources.
 */
const buildUserStats = async (userId) => {
  // Session stats
  const sessionResult = await getUserSessionStats(userId);
  const sessionStats = sessionResult.success ? sessionResult.stats : {};

  // Streak data from users collection
  let currentStreak = 0;
  let dailyChallengesCompleted = 0;
  if (db) {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const d = userDoc.data();
      currentStreak = d.currentStreak || 0;
      dailyChallengesCompleted = d.dailyChallengesCompleted || 0;
    }
    // Notes count
    const notesSnap = await db.collection('notes').where('userId', '==', userId).get();
    sessionStats.totalNotes = (sessionStats.totalNotes || 0) + notesSnap.size;
  }

  return {
    currentStreak,
    dailyChallengesCompleted,
    ...sessionStats,
  };
};

/**
 * Check and unlock new achievements for a user.
 * Returns newly unlocked achievements (if any).
 */
const checkAndUnlockAchievements = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    // Load existing unlocked achievements
    const achievRef = db.collection(COLLECTION).doc(userId);
    const achievDoc = await achievRef.get();
    const existingData = achievDoc.exists ? achievDoc.data() : {};

    const manager = AchievementManager.fromFirestoreData(userId, existingData);

    // Wire up observer: log events
    const newlyUnlocked = [];
    manager.on('achieved', (a) => newlyUnlocked.push(a));

    // Build stats and check
    const userStats = await buildUserStats(userId);
    manager.checkAll(userStats);

    // Persist if anything changed
    if (newlyUnlocked.length > 0) {
      await achievRef.set({
        unlockedIds: manager.unlockedIds,
        unlockedAchievements: [
          ...(existingData.unlockedAchievements || []),
          ...newlyUnlocked,
        ],
        updatedAt: new Date(),
      }, { merge: true });
    }

    return {
      success: true,
      newlyUnlocked,
      stats: manager.getStats(),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get all achievements for a user with unlock status.
 */
const getUserAchievements = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const achievRef = db.collection(COLLECTION).doc(userId);
    const achievDoc = await achievRef.get();
    const existingData = achievDoc.exists ? achievDoc.data() : {};

    const manager = AchievementManager.fromFirestoreData(userId, existingData);
    const userStats = await buildUserStats(userId);

    return {
      success: true,
      achievements: manager.getAllWithStatus(userStats),
      stats: manager.getStats(),
      unlockedIds: manager.unlockedIds,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get leaderboard (top users by streak).
 */
const getLeaderboard = async (limit = 10) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const snap = await db.collection('users')
      .orderBy('currentStreak', 'desc')
      .limit(limit)
      .get();

    const leaders = snap.docs.map((doc, index) => {
      const d = doc.data();
      return {
        rank: index + 1,
        userId: doc.id,
        displayName: d.displayName || 'Anonymous',
        examName: d.examName || '',
        currentStreak: d.currentStreak || 0,
        longestStreak: d.longestStreak || 0,
      };
    });

    return { success: true, leaderboard: leaders };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { checkAndUnlockAchievements, getUserAchievements, getLeaderboard, buildUserStats };
