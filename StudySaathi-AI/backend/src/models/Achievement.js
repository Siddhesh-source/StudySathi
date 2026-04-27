/**
 * Achievement & AchievementManager Classes
 *
 * Demonstrates:
 *  - Observer Pattern (AchievementManager listens to events emitted by StreakManager / StudySession)
 *  - Strategy Pattern (each Achievement has a custom condition function)
 *  - Encapsulation
 *  - Open/Closed Principle (add new achievements without modifying AchievementManager)
 */

// ─────────────────────────────────────────────────────────────
// Achievement Class
// ─────────────────────────────────────────────────────────────
class Achievement {
  #id;
  #title;
  #description;
  #emoji;
  #category;
  #condition; // (userStats) => boolean

  static CATEGORIES = {
    STREAK: 'streak',
    STUDY_TIME: 'study_time',
    QUIZ: 'quiz',
    NOTES: 'notes',
    SOCIAL: 'social',
    MILESTONE: 'milestone',
  };

  constructor({ id, title, description, emoji, category, condition }) {
    if (!id || !title || !condition) throw new Error('Achievement requires id, title, and condition');
    this.#id = id;
    this.#title = title;
    this.#description = description || '';
    this.#emoji = emoji || '🏅';
    this.#category = category || Achievement.CATEGORIES.MILESTONE;
    this.#condition = condition;
  }

  get id() { return this.#id; }
  get title() { return this.#title; }
  get description() { return this.#description; }
  get emoji() { return this.#emoji; }
  get category() { return this.#category; }

  /**
   * Check if this achievement is unlocked for given user stats.
   * @param {Object} userStats - { currentStreak, totalMinutes, totalNotes, quizAvg, totalSessions, level }
   */
  isUnlocked(userStats) {
    try {
      return this.#condition(userStats);
    } catch {
      return false;
    }
  }

  toObject() {
    return {
      id: this.#id,
      title: this.#title,
      description: this.#description,
      emoji: this.#emoji,
      category: this.#category,
    };
  }

  toString() {
    return `Achievement(${this.#id}) — ${this.#emoji} ${this.#title}`;
  }
}

// ─────────────────────────────────────────────────────────────
// Built-in Achievement Definitions
// ─────────────────────────────────────────────────────────────
const BUILT_IN_ACHIEVEMENTS = [
  // Streak achievements
  new Achievement({
    id: 'first_day',
    title: 'First Step',
    description: 'Study for the very first time',
    emoji: '👣',
    category: Achievement.CATEGORIES.STREAK,
    condition: (s) => s.currentStreak >= 1,
  }),
  new Achievement({
    id: 'week_warrior',
    title: 'Week Warrior',
    description: '7-day study streak',
    emoji: '🔥',
    category: Achievement.CATEGORIES.STREAK,
    condition: (s) => s.currentStreak >= 7,
  }),
  new Achievement({
    id: 'month_master',
    title: 'Month Master',
    description: '30-day study streak',
    emoji: '🏆',
    category: Achievement.CATEGORIES.STREAK,
    condition: (s) => s.currentStreak >= 30,
  }),
  new Achievement({
    id: 'century_achiever',
    title: 'Century Achiever',
    description: '100-day study streak',
    emoji: '🎯',
    category: Achievement.CATEGORIES.STREAK,
    condition: (s) => s.currentStreak >= 100,
  }),

  // Study time achievements
  new Achievement({
    id: 'hour_hustler',
    title: 'Hour Hustler',
    description: 'Study for 60 minutes total',
    emoji: '⏱️',
    category: Achievement.CATEGORIES.STUDY_TIME,
    condition: (s) => s.totalMinutes >= 60,
  }),
  new Achievement({
    id: 'ten_hour_titan',
    title: '10-Hour Titan',
    description: 'Accumulate 10 hours of study',
    emoji: '💪',
    category: Achievement.CATEGORIES.STUDY_TIME,
    condition: (s) => s.totalMinutes >= 600,
  }),
  new Achievement({
    id: 'hundred_hour_hero',
    title: '100-Hour Hero',
    description: 'Accumulate 100 hours of study',
    emoji: '🦸',
    category: Achievement.CATEGORIES.STUDY_TIME,
    condition: (s) => s.totalMinutes >= 6000,
  }),

  // Quiz achievements
  new Achievement({
    id: 'quiz_starter',
    title: 'Quiz Starter',
    description: 'Complete your first quiz',
    emoji: '📝',
    category: Achievement.CATEGORIES.QUIZ,
    condition: (s) => s.totalQuizzes >= 1,
  }),
  new Achievement({
    id: 'quiz_master',
    title: 'Quiz Master',
    description: 'Score 90%+ on 5 quizzes',
    emoji: '🥇',
    category: Achievement.CATEGORIES.QUIZ,
    condition: (s) => s.highScoreQuizzes >= 5,
  }),
  new Achievement({
    id: 'perfect_score',
    title: 'Perfectionist',
    description: 'Score 100% on a quiz',
    emoji: '💯',
    category: Achievement.CATEGORIES.QUIZ,
    condition: (s) => s.quizPerfectScores >= 1,
  }),

  // Notes achievements
  new Achievement({
    id: 'note_taker',
    title: 'Note Taker',
    description: 'Save your first study note',
    emoji: '📓',
    category: Achievement.CATEGORIES.NOTES,
    condition: (s) => s.totalNotes >= 1,
  }),
  new Achievement({
    id: 'knowledge_keeper',
    title: 'Knowledge Keeper',
    description: 'Save 25 study notes',
    emoji: '📚',
    category: Achievement.CATEGORIES.NOTES,
    condition: (s) => s.totalNotes >= 25,
  }),

  // Session/milestone achievements
  new Achievement({
    id: 'session_starter',
    title: 'Getting Started',
    description: 'Complete your first study session',
    emoji: '🌱',
    category: Achievement.CATEGORIES.MILESTONE,
    condition: (s) => s.totalSessions >= 1,
  }),
  new Achievement({
    id: 'fifty_sessions',
    title: 'Dedicated Scholar',
    description: 'Complete 50 study sessions',
    emoji: '🎓',
    category: Achievement.CATEGORIES.MILESTONE,
    condition: (s) => s.totalSessions >= 50,
  }),
  new Achievement({
    id: 'daily_challenger',
    title: 'Daily Challenger',
    description: 'Complete 7 daily challenges',
    emoji: '⚡',
    category: Achievement.CATEGORIES.MILESTONE,
    condition: (s) => s.dailyChallengesCompleted >= 7,
  }),
];

// ─────────────────────────────────────────────────────────────
// AchievementManager Class — Observer Pattern
// ─────────────────────────────────────────────────────────────
class AchievementManager {
  #userId;
  #achievements;       // All Achievement instances (registry)
  #unlockedIds;        // Set<string> of unlocked achievement IDs
  #listeners;          // Observer callbacks: { event: fn[] }

  constructor(userId, unlockedIds = []) {
    this.#userId = userId;
    this.#achievements = [...BUILT_IN_ACHIEVEMENTS];
    this.#unlockedIds = new Set(unlockedIds);
    this.#listeners = {};
  }

  get userId() { return this.#userId; }
  get unlockedIds() { return [...this.#unlockedIds]; }

  // ─── Observer: subscribe to events ────────────────────────────
  on(event, callback) {
    if (!this.#listeners[event]) this.#listeners[event] = [];
    this.#listeners[event].push(callback);
    return this; // chainable
  }

  #emit(event, data) {
    (this.#listeners[event] || []).forEach(fn => fn(data));
  }

  // ─── Achievement registry ──────────────────────────────────────
  /**
   * Register a custom achievement (Open/Closed Principle — extend without modifying)
   */
  addCustomAchievement(achievement) {
    if (!(achievement instanceof Achievement)) throw new Error('Must be an Achievement instance');
    const exists = this.#achievements.find(a => a.id === achievement.id);
    if (exists) throw new Error(`Achievement with id "${achievement.id}" already exists`);
    this.#achievements.push(achievement);
    return this;
  }

  // ─── Core logic ────────────────────────────────────────────────
  /**
   * Check all achievements against current user stats.
   * Returns newly unlocked achievements.
   * Emits 'achieved' event for each new unlock.
   */
  checkAll(userStats) {
    const newlyUnlocked = [];

    for (const achievement of this.#achievements) {
      if (this.#unlockedIds.has(achievement.id)) continue; // already unlocked
      if (achievement.isUnlocked(userStats)) {
        this.#unlockedIds.add(achievement.id);
        const unlocked = {
          ...achievement.toObject(),
          unlockedAt: new Date().toISOString(),
        };
        newlyUnlocked.push(unlocked);
        this.#emit('achieved', unlocked);
      }
    }

    if (newlyUnlocked.length > 0) {
      this.#emit('batchAchieved', newlyUnlocked);
    }

    return newlyUnlocked;
  }

  /**
   * Get all achievements with their unlock status.
   */
  getAllWithStatus(userStats = null) {
    return this.#achievements.map(achievement => ({
      ...achievement.toObject(),
      unlocked: this.#unlockedIds.has(achievement.id),
      progress: userStats ? this._getProgressHint(achievement, userStats) : null,
    }));
  }

  /**
   * Get only unlocked achievements.
   */
  getUnlocked() {
    return this.#achievements
      .filter(a => this.#unlockedIds.has(a.id))
      .map(a => a.toObject());
  }

  /**
   * Get count of unlocked achievements grouped by category.
   */
  getStats() {
    const unlocked = this.getUnlocked();
    const byCategory = {};
    for (const cat of Object.values(Achievement.CATEGORIES)) {
      byCategory[cat] = unlocked.filter(a => a.category === cat).length;
    }
    return {
      total: this.#achievements.length,
      unlocked: unlocked.length,
      percentage: Math.round((unlocked.length / this.#achievements.length) * 100),
      byCategory,
    };
  }

  // ─── Serialization ─────────────────────────────────────────────
  toObject() {
    return {
      userId: this.#userId,
      unlockedIds: [...this.#unlockedIds],
      stats: this.getStats(),
    };
  }

  // ─── Private helpers ────────────────────────────────────────────
  _getProgressHint(achievement, userStats) {
    // Returns a simple 0-1 progress hint for select achievements
    const hints = {
      week_warrior: Math.min(userStats.currentStreak / 7, 1),
      month_master: Math.min(userStats.currentStreak / 30, 1),
      century_achiever: Math.min(userStats.currentStreak / 100, 1),
      ten_hour_titan: Math.min(userStats.totalMinutes / 600, 1),
      hundred_hour_hero: Math.min(userStats.totalMinutes / 6000, 1),
      quiz_master: Math.min((userStats.highScoreQuizzes || 0) / 5, 1),
      knowledge_keeper: Math.min((userStats.totalNotes || 0) / 25, 1),
      fifty_sessions: Math.min((userStats.totalSessions || 0) / 50, 1),
      daily_challenger: Math.min((userStats.dailyChallengesCompleted || 0) / 7, 1),
    };
    return hints[achievement.id] !== undefined ? hints[achievement.id] : null;
  }

  // ─── Static factory ─────────────────────────────────────────────
  static fromFirestoreData(userId, data) {
    return new AchievementManager(userId, data.unlockedIds || []);
  }
}

module.exports = { Achievement, AchievementManager, BUILT_IN_ACHIEVEMENTS };
