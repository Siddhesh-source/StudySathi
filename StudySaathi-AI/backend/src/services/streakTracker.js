/**
 * Streak Tracker Service
 * Tracks daily study streaks and generates motivational messages
 */

const { db } = require('../config/firebase');
const { sendPrompt } = require('./gemini');

/**
 * Generate motivational message based on streak and user context
 */
const generateMotivationalMessage = async (streakData) => {
  const { currentStreak, longestStreak, examName, daysToExam, userName } = streakData;

  let context = '';
  if (currentStreak === 0) {
    context = 'Student missed yesterday. Encourage them to start fresh today.';
  } else if (currentStreak === 1) {
    context = 'Student just started their streak. Motivate them to keep going.';
  } else if (currentStreak < 7) {
    context = `Student has a ${currentStreak}-day streak. Encourage consistency.`;
  } else if (currentStreak < 30) {
    context = `Amazing ${currentStreak}-day streak! Celebrate their dedication.`;
  } else {
    context = `Incredible ${currentStreak}-day streak! They are a champion.`;
  }

  if (daysToExam && daysToExam < 30) {
    context += ` Exam is in ${daysToExam} days - add urgency but stay positive.`;
  }

  const prompt = `Generate a short, motivational message (2-3 sentences max) for an Indian student preparing for ${examName || 'competitive exams'}.

Context: ${context}
${userName ? `Student name: ${userName}` : ''}
Current streak: ${currentStreak} days
Longest streak: ${longestStreak} days

Guidelines:
- Use simple Indian English
- Be warm and encouraging like a supportive elder sibling
- Include a relevant emoji
- If streak is broken, be understanding not harsh
- Reference their progress or exam if relevant
- Keep it SHORT and impactful

Return ONLY the message, nothing else.`;

  const result = await sendPrompt(prompt, { temperature: 0.8, maxTokens: 150 });
  
  if (result.success) {
    return result.text.trim();
  }
  
  // Fallback messages
  const fallbacks = [
    "🌟 Every day you study brings you closer to your dreams. Keep going!",
    "💪 Consistency is key! Your dedication will pay off.",
    "🎯 Focus on progress, not perfection. You're doing great!",
    "📚 Small steps daily lead to big achievements. Keep it up!",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

/**
 * Check and update user's streak
 */
const updateStreak = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };

  try {
    const userRef = db.collection('users').doc(userId);
    const streakRef = userRef.collection('streaks').doc('current');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const streakDoc = await streakRef.get();
    const streakData = streakDoc.exists ? streakDoc.data() : null;

    let currentStreak = 1;
    let longestStreak = 1;
    let lastActiveDate = todayStr;
    let streakBroken = false;

    if (streakData) {
      const lastActive = new Date(streakData.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already logged today
        return {
          success: true,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          lastActiveDate: streakData.lastActiveDate,
          message: streakData.todayMessage,
          alreadyLogged: true,
        };
      } else if (diffDays === 1) {
        // Consecutive day - extend streak
        currentStreak = streakData.currentStreak + 1;
        longestStreak = Math.max(currentStreak, streakData.longestStreak);
      } else {
        // Streak broken
        currentStreak = 1;
        longestStreak = streakData.longestStreak;
        streakBroken = true;
      }
    }

    // Get user info for personalized message
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    let daysToExam = null;
    if (userData.examDate) {
      const examDate = new Date(userData.examDate);
      daysToExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    }

    // Generate motivational message
    const message = await generateMotivationalMessage({
      currentStreak,
      longestStreak,
      examName: userData.examName,
      daysToExam,
      userName: userData.displayName,
    });

    // Update streak data
    await streakRef.set({
      currentStreak,
      longestStreak,
      lastActiveDate: todayStr,
      todayMessage: message,
      streakHistory: streakData?.streakHistory 
        ? [...streakData.streakHistory.slice(-29), { date: todayStr, streak: currentStreak }]
        : [{ date: todayStr, streak: currentStreak }],
      updatedAt: new Date(),
    });

    // Update user's streak summary
    await userRef.set({
      currentStreak,
      longestStreak,
      lastStudyDate: todayStr,
    }, { merge: true });

    return {
      success: true,
      currentStreak,
      longestStreak,
      lastActiveDate: todayStr,
      message,
      streakBroken,
      isNewStreak: currentStreak === 1 && !streakBroken,
    };
  } catch (error) {
    console.error('Update streak error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's current streak data
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
    
    // Check if streak is still valid (not broken)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = new Date(data.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      // Streak is broken but not yet updated
      return {
        success: true,
        currentStreak: 0,
        longestStreak: data.longestStreak,
        message: "😊 Your streak reset, but that's okay! Start fresh today.",
        streakHistory: data.streakHistory || [],
        streakBroken: true,
      };
    }

    return {
      success: true,
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      lastActiveDate: data.lastActiveDate,
      message: data.todayMessage,
      streakHistory: data.streakHistory || [],
      studiedToday: diffDays === 0,
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
