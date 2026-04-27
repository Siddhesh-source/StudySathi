/**
 * Streak Manager Class
 * Manages daily study streaks with proper encapsulation and business logic
 * Demonstrates: Encapsulation, State Management, Observer Pattern, Business Logic
 */

const { sendPrompt } = require('../services/gemini');

class StreakManager {
  #currentStreak;
  #longestStreak;
  #lastActiveDate;
  #streakHistory;
  #userId;
  #userContext;
  // ── Observer Pattern ──────────────────────────────────────────
  #listeners; // { [event]: Function[] }

  constructor(userId, streakData = {}) {
    this.#userId = userId;
    this.#currentStreak = streakData.currentStreak || 0;
    this.#longestStreak = streakData.longestStreak || 0;
    this.#lastActiveDate = streakData.lastActiveDate || null;
    this.#streakHistory = streakData.streakHistory || [];
    this.#userContext = streakData.userContext || {};
    this.#listeners = {};
  }

  // ── Observer: pub/sub ─────────────────────────────────────────
  on(event, callback) {
    if (!this.#listeners[event]) this.#listeners[event] = [];
    this.#listeners[event].push(callback);
    return this;
  }

  #emit(event, data) {
    (this.#listeners[event] || []).forEach(fn => fn(data));
  }

  // Getters
  get currentStreak() { return this.#currentStreak; }
  get longestStreak() { return this.#longestStreak; }
  get lastActiveDate() { return this.#lastActiveDate; }
  get streakHistory() { return [...this.#streakHistory]; } // Return copy
  get userId() { return this.#userId; }

  // Check if user studied today
  hasStudiedToday() {
    if (!this.#lastActiveDate) return false;
    
    const today = this._getTodayDate();
    return this.#lastActiveDate === today;
  }

  // Check if streak is broken
  isStreakBroken() {
    if (!this.#lastActiveDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = new Date(this.#lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    return diffDays > 1;
  }

  // Update streak for today
  updateForToday() {
    if (this.hasStudiedToday()) {
      return {
        updated: false,
        message: 'Already logged today',
        currentStreak: this.#currentStreak
      };
    }

    const today = this._getTodayDate();
    let streakBroken = false;

    if (this.isStreakBroken()) {
      // Reset streak
      this.#currentStreak = 1;
      streakBroken = true;
    } else if (this.#lastActiveDate) {
      // Continue streak
      this.#currentStreak += 1;
    } else {
      // First time
      this.#currentStreak = 1;
    }

    // Update longest streak
    if (this.#currentStreak > this.#longestStreak) {
      this.#longestStreak = this.#currentStreak;
    }

    // Update last active date
    this.#lastActiveDate = today;

    // Add to history
    this._addToHistory(today, this.#currentStreak);

    // ── Observer: emit events ────────────────────────────────────
    this.#emit('streakUpdated', {
      currentStreak: this.#currentStreak,
      longestStreak: this.#longestStreak,
      streakBroken,
    });

    const milestone = this.getMilestone();
    if (milestone.current && this.#currentStreak === milestone.current.days) {
      this.#emit('milestoneReached', milestone.current);
    }

    const isNewRecord = this.#currentStreak === this.#longestStreak && this.#currentStreak > 1;
    if (isNewRecord) {
      this.#emit('newRecord', { streak: this.#currentStreak });
    }

    return {
      updated: true,
      currentStreak: this.#currentStreak,
      longestStreak: this.#longestStreak,
      streakBroken,
      isNewRecord,
    };
  }

  // Set user context for personalized messages
  setUserContext(context) {
    this.#userContext = { ...this.#userContext, ...context };
  }

  // Generate motivational message
  async generateMotivationalMessage() {
    const context = this._buildMessageContext();
    
    const prompt = `Generate a short motivational message (2-3 sentences max) for an Indian student.

Context: ${context}
Current streak: ${this.#currentStreak} days
Longest streak: ${this.#longestStreak} days
${this.#userContext.userName ? `Student name: ${this.#userContext.userName}` : ''}

Guidelines:
- Use simple Indian English
- Be warm and encouraging
- Include a relevant emoji
- Keep it SHORT and impactful

Return ONLY the message.`;

    const result = await sendPrompt(prompt, { temperature: 0.8, maxTokens: 150 });
    
    if (result.success) {
      return result.text.trim();
    }
    
    return this._getFallbackMessage();
  }

  // Get streak statistics
  getStatistics() {
    return {
      currentStreak: this.#currentStreak,
      longestStreak: this.#longestStreak,
      lastActiveDate: this.#lastActiveDate,
      totalDaysTracked: this.#streakHistory.length,
      hasStudiedToday: this.hasStudiedToday(),
      isStreakBroken: this.isStreakBroken(),
      streakPercentage: this._calculateStreakPercentage()
    };
  }

  // Get milestone info
  getMilestone() {
    const milestones = [
      { days: 7, title: 'Week Warrior', emoji: '🔥' },
      { days: 14, title: 'Two Week Champion', emoji: '💪' },
      { days: 30, title: 'Month Master', emoji: '🏆' },
      { days: 60, title: 'Consistency King', emoji: '👑' },
      { days: 100, title: 'Century Achiever', emoji: '🎯' },
      { days: 365, title: 'Year Legend', emoji: '⭐' }
    ];

    const current = milestones.find(m => this.#currentStreak >= m.days);
    const next = milestones.find(m => this.#currentStreak < m.days);

    return {
      current: current || null,
      next: next || null,
      daysToNext: next ? next.days - this.#currentStreak : 0
    };
  }

  // Export to plain object
  toObject() {
    return {
      userId: this.#userId,
      currentStreak: this.#currentStreak,
      longestStreak: this.#longestStreak,
      lastActiveDate: this.#lastActiveDate,
      streakHistory: this.#streakHistory,
      userContext: this.#userContext
    };
  }

  // Private helper methods
  _getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  }

  _addToHistory(date, streak) {
    this.#streakHistory.push({ date, streak });
    // Keep only last 30 days
    if (this.#streakHistory.length > 30) {
      this.#streakHistory = this.#streakHistory.slice(-30);
    }
  }

  _buildMessageContext() {
    if (this.#currentStreak === 0) {
      return 'Student missed yesterday. Encourage them to start fresh today.';
    } else if (this.#currentStreak === 1) {
      return 'Student just started their streak. Motivate them to keep going.';
    } else if (this.#currentStreak < 7) {
      return `Student has a ${this.#currentStreak}-day streak. Encourage consistency.`;
    } else if (this.#currentStreak < 30) {
      return `Amazing ${this.#currentStreak}-day streak! Celebrate their dedication.`;
    } else {
      return `Incredible ${this.#currentStreak}-day streak! They are a champion.`;
    }
  }

  _calculateStreakPercentage() {
    if (this.#streakHistory.length === 0) return 0;
    const daysWithStreak = this.#streakHistory.filter(h => h.streak > 0).length;
    return Math.round((daysWithStreak / this.#streakHistory.length) * 100);
  }

  _getFallbackMessage() {
    const messages = [
      "🌟 Every day you study brings you closer to your dreams. Keep going!",
      "💪 Consistency is key! Your dedication will pay off.",
      "🎯 Focus on progress, not perfection. You're doing great!",
      "📚 Small steps daily lead to big achievements. Keep it up!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Compare streaks — used for leaderboard sorting
  compareTo(other) {
    return this.#currentStreak - other.currentStreak;
  }

  toString() {
    return `StreakManager(${this.#userId}) | streak:${this.#currentStreak} | best:${this.#longestStreak}`;
  }

  toJSON() { return this.toObject(); }

  // Static factory method
  static fromFirestoreData(userId, data) {
    return new StreakManager(userId, {
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
      lastActiveDate: data.lastActiveDate || null,
      streakHistory: data.streakHistory || [],
      userContext: {
        examName: data.examName,
        userName: data.userName,
        examDate: data.examDate
      }
    });
  }

  // Sort an array of StreakManager instances by streak (desc) — for leaderboards
  static sortByStreak(managers) {
    return [...managers].sort((a, b) => b.compareTo(a));
  }
}

module.exports = StreakManager;
