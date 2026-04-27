/**
 * PYQQuestion - Previous Year Question Model
 * Represents a single PYQ with metadata, options, and solution.
 * 
 * OOP: Encapsulation, Value Object pattern
 */

class PYQQuestion {
  #id;
  #examName;
  #year;
  #subject;
  #topic;
  #questionText;
  #options;          // { a, b, c, d }
  #correctAnswer;    // 'a', 'b', 'c', or 'd'
  #explanation;
  #difficulty;       // 1-5
  #bloomsLevel;      // 1-6
  #marks;
  #timeAllotted;     // seconds
  #tags;

  static DIFFICULTY = { EASY: 1, MEDIUM: 3, HARD: 5 };

  constructor({
    id,
    examName,
    year,
    subject,
    topic,
    questionText,
    options,
    correctAnswer,
    explanation = '',
    difficulty = 3,
    bloomsLevel = 2,
    marks = 4,
    timeAllotted = 180,
    tags = []
  }) {
    if (!id || !questionText || !options || !correctAnswer) {
      throw new Error('PYQQuestion requires id, questionText, options, and correctAnswer');
    }
    this.#id = id;
    this.#examName = examName;
    this.#year = year;
    this.#subject = subject;
    this.#topic = topic;
    this.#questionText = questionText;
    this.#options = options;
    this.#correctAnswer = correctAnswer.toLowerCase();
    this.#explanation = explanation;
    this.#difficulty = difficulty;
    this.#bloomsLevel = bloomsLevel;
    this.#marks = marks;
    this.#timeAllotted = timeAllotted;
    this.#tags = tags;
  }

  get id() { return this.#id; }
  get examName() { return this.#examName; }
  get year() { return this.#year; }
  get subject() { return this.#subject; }
  get topic() { return this.#topic; }
  get questionText() { return this.#questionText; }
  get options() { return { ...this.#options }; }
  get correctAnswer() { return this.#correctAnswer; }
  get explanation() { return this.#explanation; }
  get difficulty() { return this.#difficulty; }
  get bloomsLevel() { return this.#bloomsLevel; }
  get marks() { return this.#marks; }
  get timeAllotted() { return this.#timeAllotted; }
  get tags() { return [...this.#tags]; }

  isCorrect(userAnswer) {
    return userAnswer?.toLowerCase() === this.#correctAnswer;
  }

  getDifficultyLabel() {
    if (this.#difficulty <= 2) return 'Easy';
    if (this.#difficulty <= 4) return 'Medium';
    return 'Hard';
  }

  toObject() {
    return {
      id: this.#id,
      examName: this.#examName,
      year: this.#year,
      subject: this.#subject,
      topic: this.#topic,
      questionText: this.#questionText,
      options: this.#options,
      correctAnswer: this.#correctAnswer,
      explanation: this.#explanation,
      difficulty: this.#difficulty,
      bloomsLevel: this.#bloomsLevel,
      marks: this.#marks,
      timeAllotted: this.#timeAllotted,
      tags: this.#tags,
    };
  }

  static fromObject(obj) {
    return new PYQQuestion(obj);
  }
}

module.exports = PYQQuestion;
