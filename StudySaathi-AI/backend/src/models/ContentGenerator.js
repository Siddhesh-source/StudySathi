/**
 * Base Content Generator Class
 * Demonstrates OOP principles: Inheritance, Polymorphism, Encapsulation
 */

const { sendPrompt } = require('../services/gemini');

/**
 * Abstract base class for all content generators
 * Implements Template Method pattern
 */
class ContentGenerator {
  constructor(subject, topic, examType = null) {
    if (this.constructor === ContentGenerator) {
      throw new Error("ContentGenerator is abstract and cannot be instantiated");
    }
    this._subject = subject;
    this._topic = topic;
    this._examType = examType;
  }

  // Getters (Encapsulation)
  get subject() { return this._subject; }
  get topic() { return this._topic; }
  get examType() { return this._examType; }

  // Template method - defines the algorithm structure
  async generate(options = {}) {
    const prompt = this.buildPrompt();
    const enhancedPrompt = this.addExamContext(prompt);
    const result = await this.executeGeneration(enhancedPrompt, options);
    return this.formatResponse(result);
  }

  // Abstract methods - must be implemented by subclasses
  buildPrompt() {
    throw new Error("buildPrompt() must be implemented by subclass");
  }

  // Hook methods - can be overridden
  addExamContext(prompt) {
    if (this._examType) {
      return `[Exam: ${this._examType}]\n${prompt}\n\nFocus on exam-relevant content and scoring tips.`;
    }
    return prompt;
  }

  async executeGeneration(prompt, options) {
    return await sendPrompt(prompt, options);
  }

  formatResponse(result) {
    return result;
  }
}

/**
 * Explanation Generator - generates detailed explanations
 */
class ExplanationGenerator extends ContentGenerator {
  constructor(subject, topic, examType, detailLevel = 'medium') {
    super(subject, topic, examType);
    this._detailLevel = detailLevel;
  }

  buildPrompt() {
    const detailPrompts = {
      brief: `Explain "${this._topic}" in ${this._subject} in 3-4 simple sentences.`,
      medium: `Explain "${this._topic}" in ${this._subject} with key concepts and examples.`,
      detailed: `Provide a comprehensive explanation of "${this._topic}" in ${this._subject} with:
- Core concepts and definitions
- Step-by-step breakdown
- Real-world applications
- Common misconceptions`
    };

    return detailPrompts[this._detailLevel] || detailPrompts.medium;
  }
}

/**
 * Quiz Generator - generates practice questions
 */
class QuizGenerator extends ContentGenerator {
  constructor(subject, topic, examType, questionCount = 5, difficulty = 'mixed') {
    super(subject, topic, examType);
    this._questionCount = questionCount;
    this._difficulty = difficulty;
  }

  buildPrompt() {
    const difficultyGuide = this._difficulty === 'mixed' 
      ? `Mix of difficulty: ${Math.ceil(this._questionCount * 0.3)} easy, ${Math.ceil(this._questionCount * 0.4)} medium, ${Math.floor(this._questionCount * 0.3)} hard`
      : `All questions should be ${this._difficulty} level`;

    return `Create ${this._questionCount} multiple choice questions on "${this._topic}" in ${this._subject}.

${difficultyGuide}

Format each question as:
Q[N]: [Question]
a) [Option]
b) [Option]
c) [Option]
d) [Option]
Answer: [Correct option] - [Brief explanation]

Make questions exam-focused and practical.`;
  }

  formatResponse(result) {
    if (!result.success) return result;

    // Parse questions from text
    const questions = this._parseQuestions(result.text);
    return {
      ...result,
      questions,
      count: questions.length
    };
  }

  _parseQuestions(text) {
    // Simple parsing logic
    const questionBlocks = text.split(/Q\d+:/i).slice(1);
    return questionBlocks.map((block, index) => ({
      id: index + 1,
      text: block.trim()
    }));
  }
}

/**
 * Flashcard Generator - generates flashcards for quick revision
 */
class FlashcardGenerator extends ContentGenerator {
  constructor(subject, topic, examType, cardCount = 5) {
    super(subject, topic, examType);
    this._cardCount = cardCount;
  }

  buildPrompt() {
    return `Create ${this._cardCount} flashcards for "${this._topic}" in ${this._subject}.

Format each flashcard as:
Card [N]:
Q: [Concise question]
A: [Clear, exam-focused answer]

Focus on key concepts, formulas, and frequently asked points.`;
  }

  formatResponse(result) {
    if (!result.success) return result;

    const flashcards = this._parseFlashcards(result.text);
    return {
      ...result,
      flashcards,
      count: flashcards.length
    };
  }

  _parseFlashcards(text) {
    const cards = [];
    const cardBlocks = text.split(/Card\s+\d+:/i).slice(1);
    
    cardBlocks.forEach((block, index) => {
      const qMatch = block.match(/Q:\s*(.+?)(?=A:)/s);
      const aMatch = block.match(/A:\s*(.+?)(?=Card|$)/s);
      
      if (qMatch && aMatch) {
        cards.push({
          id: index + 1,
          question: qMatch[1].trim(),
          answer: aMatch[1].trim()
        });
      }
    });

    return cards;
  }
}

/**
 * Summary Generator - generates quick revision notes
 */
class SummaryGenerator extends ContentGenerator {
  buildPrompt() {
    return `Create quick revision notes for "${this._topic}" in ${this._subject}:

- Key definitions (one line each)
- Important formulas/facts
- Memory tricks/mnemonics
- Common exam patterns
- 5-point summary

Keep it concise for last-minute revision.`;
  }
}

/**
 * Factory class for creating content generators
 * Implements Factory Pattern
 */
class ContentGeneratorFactory {
  static create(type, subject, topic, examType, options = {}) {
    switch (type.toLowerCase()) {
      case 'explanation':
        return new ExplanationGenerator(subject, topic, examType, options.detailLevel);
      
      case 'quiz':
        return new QuizGenerator(subject, topic, examType, options.questionCount, options.difficulty);
      
      case 'flashcards':
        return new FlashcardGenerator(subject, topic, examType, options.cardCount);
      
      case 'summary':
        return new SummaryGenerator(subject, topic, examType);
      
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
  }

  static getSupportedTypes() {
    return ['explanation', 'quiz', 'flashcards', 'summary'];
  }
}

module.exports = {
  ContentGenerator,
  ExplanationGenerator,
  QuizGenerator,
  FlashcardGenerator,
  SummaryGenerator,
  ContentGeneratorFactory
};
