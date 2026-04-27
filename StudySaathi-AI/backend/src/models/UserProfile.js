/**
 * UserProfile Class
 * Centralizes all user-profile logic: exam countdown, study-plan
 * recommendation, and profile validation.
 * Demonstrates: Encapsulation, Single Responsibility, Static Factory
 */

class UserProfile {
  #userId;
  #displayName;
  #email;
  #examName;
  #examDate;       // Date object
  #subjects;       // string[]
  #topics;         // { [subject]: string[] }
  #weakSubjects;   // { [subject]: number (1-5 confidence) }
  #dailyStudyHours;
  #createdAt;

  // ─── Supported exam types ──────────────────────────────────────
  static EXAM_TYPES = ['JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'SSC', 'BOARDS', 'OTHER'];

  static STUDY_LOAD = {
    LIGHT: { hours: 2, label: 'Light' },
    MODERATE: { hours: 4, label: 'Moderate' },
    INTENSIVE: { hours: 6, label: 'Intensive' },
    EXTREME: { hours: 8, label: 'Extreme' },
  };

  constructor({
    userId,
    displayName = '',
    email = '',
    examName = '',
    examDate = null,
    subjects = [],
    topics = {},
    weakSubjects = {},
    dailyStudyHours = 4,
    createdAt = null,
  }) {
    if (!userId) throw new Error('userId is required to create a UserProfile');
    this.#userId = userId;
    this.#displayName = displayName;
    this.#email = email;
    this.#examName = examName;
    this.#examDate = examDate ? new Date(examDate) : null;
    this.#subjects = subjects;
    this.#topics = topics;
    this.#weakSubjects = weakSubjects;
    this.#dailyStudyHours = dailyStudyHours;
    this.#createdAt = createdAt ? new Date(createdAt) : new Date();
  }

  // ─── Getters ────────────────────────────────────────────────────
  get userId() { return this.#userId; }
  get displayName() { return this.#displayName; }
  get email() { return this.#email; }
  get examName() { return this.#examName; }
  get examDate() { return this.#examDate; }
  get subjects() { return [...this.#subjects]; }
  get topics() { return { ...this.#topics }; }
  get weakSubjects() { return { ...this.#weakSubjects }; }
  get dailyStudyHours() { return this.#dailyStudyHours; }
  get createdAt() { return this.#createdAt; }

  // ─── Setters with validation ─────────────────────────────────────
  set displayName(val) { this.#displayName = val; }
  set dailyStudyHours(val) {
    if (val < 0.5 || val > 16) throw new Error('dailyStudyHours must be between 0.5 and 16');
    this.#dailyStudyHours = val;
  }
  set examDate(val) { this.#examDate = val ? new Date(val) : null; }

  // ─── Business Logic ──────────────────────────────────────────────
  getDaysToExam() {
    if (!this.#examDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(this.#examDate);
    exam.setHours(0, 0, 0, 0);
    return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  }

  isExamNear(thresholdDays = 30) {
    const days = this.getDaysToExam();
    return days !== null && days <= thresholdDays && days >= 0;
  }

  isExamOver() {
    const days = this.getDaysToExam();
    return days !== null && days < 0;
  }

  getExamUrgencyLabel() {
    const days = this.getDaysToExam();
    if (days === null) return 'unknown';
    if (days < 0) return 'past';
    if (days <= 7) return 'critical';
    if (days <= 30) return 'near';
    if (days <= 90) return 'moderate';
    return 'far';
  }

  /**
   * Recommend daily study hours based on exam proximity
   * and current load setting.
   */
  getStudyLoadRecommendation() {
    const days = this.getDaysToExam();
    if (days === null) return UserProfile.STUDY_LOAD.MODERATE;
    if (days <= 7) return UserProfile.STUDY_LOAD.EXTREME;
    if (days <= 30) return UserProfile.STUDY_LOAD.INTENSIVE;
    if (days <= 90) return UserProfile.STUDY_LOAD.MODERATE;
    return UserProfile.STUDY_LOAD.LIGHT;
  }

  /**
   * Returns total topic count across all subjects.
   */
  getTotalTopicCount() {
    return Object.values(this.#topics).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  }

  /**
   * Returns subjects where confidence < threshold (weak)
   */
  getWeakSubjectsList(threshold = 3) {
    return Object.entries(this.#weakSubjects)
      .filter(([, confidence]) => confidence < threshold)
      .map(([subject]) => subject);
  }

  /**
   * Validate that profile has minimum required data for study plan generation.
   */
  isReadyForStudyPlan() {
    return !!(
      this.#examName &&
      this.#examDate &&
      this.#subjects.length > 0 &&
      this.getDaysToExam() > 0
    );
  }

  getValidationErrors() {
    const errors = [];
    if (!this.#examName) errors.push('examName is required');
    if (!this.#examDate) errors.push('examDate is required');
    if (this.#subjects.length === 0) errors.push('At least one subject is required');
    if (this.#examDate && this.getDaysToExam() <= 0) errors.push('Exam date must be in the future');
    return errors;
  }

  // ─── Serialization ───────────────────────────────────────────────
  toObject() {
    return {
      userId: this.#userId,
      displayName: this.#displayName,
      email: this.#email,
      examName: this.#examName,
      examDate: this.#examDate?.toISOString() || null,
      subjects: this.#subjects,
      topics: this.#topics,
      weakSubjects: this.#weakSubjects,
      dailyStudyHours: this.#dailyStudyHours,
      createdAt: this.#createdAt.toISOString(),
      daysToExam: this.getDaysToExam(),
      examUrgency: this.getExamUrgencyLabel(),
    };
  }

  toString() {
    return `UserProfile(${this.#userId}) | ${this.#displayName} | ${this.#examName} | ${this.getDaysToExam()} days left`;
  }

  toJSON() { return this.toObject(); }

  // ─── Static Factory ──────────────────────────────────────────────
  static fromFirestoreData(userId, data) {
    return new UserProfile({
      userId,
      displayName: data.displayName || data.name || '',
      email: data.email || '',
      examName: data.examName || '',
      examDate: data.examDate || null,
      subjects: data.subjects || [],
      topics: data.topics || {},
      weakSubjects: data.weakSubjects || {},
      dailyStudyHours: data.dailyStudyHours || 4,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
    });
  }

  static fromObject(obj) {
    return new UserProfile(obj);
  }
}

module.exports = UserProfile;
