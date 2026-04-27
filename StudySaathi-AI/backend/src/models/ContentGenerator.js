/**
 * Base Content Generator Class
 * Demonstrates OOP principles: Inheritance, Polymorphism, Encapsulation
 */

// Lazy-loaded to break circular dependency: gemini.js ↔ ContentGenerator.js
let _sendPrompt = null;
const getSendPrompt = () => {
  if (!_sendPrompt) _sendPrompt = require('../services/gemini').sendPrompt;
  return _sendPrompt;
};

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
    return await getSendPrompt()(prompt, options);
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
 * Quiz Generator - generates practice questions with Bloom's Taxonomy levels
 */
class QuizGenerator extends ContentGenerator {
  constructor(subject, topic, examType, questionCount = 5, difficulty = 'mixed', bloomsDistribution = null) {
    super(subject, topic, examType);
    this._questionCount = questionCount;
    this._difficulty = difficulty;
    // Default Bloom's distribution: balanced across levels 1-4
    this._bloomsDistribution = bloomsDistribution || {
      1: Math.ceil(questionCount * 0.2),  // Remember
      2: Math.ceil(questionCount * 0.3),  // Understand
      3: Math.ceil(questionCount * 0.3),  // Apply
      4: Math.floor(questionCount * 0.2), // Analyze
    };
  }

  buildPrompt() {
    const difficultyGuide = this._difficulty === 'mixed' 
      ? `Mix of difficulty: ${Math.ceil(this._questionCount * 0.3)} easy, ${Math.ceil(this._questionCount * 0.4)} medium, ${Math.floor(this._questionCount * 0.3)} hard`
      : `All questions should be ${this._difficulty} level`;

    const bloomsGuide = `
Bloom's Taxonomy Distribution (CRITICAL - follow exactly):
- ${this._bloomsDistribution[1] || 0} questions at Level 1 (Remember): Direct recall, definitions, facts
- ${this._bloomsDistribution[2] || 0} questions at Level 2 (Understand): Explain, describe, summarize
- ${this._bloomsDistribution[3] || 0} questions at Level 3 (Apply): Calculate, solve, use formulas
- ${this._bloomsDistribution[4] || 0} questions at Level 4 (Analyze): Compare, differentiate, examine`;

    return `Create ${this._questionCount} multiple choice questions on "${this._topic}" in ${this._subject}.

${difficultyGuide}
${bloomsGuide}

Format each question as:
Q[N] [Bloom's Level X]: [Question]
a) [Option]
b) [Option]
c) [Option]
d) [Option]
Answer: [Correct option] - [Brief explanation]

Make questions exam-focused and practical.`;
  }

  formatResponse(result) {
    if (!result.success) return result;

    // Parse questions from text and extract Bloom's level
    const questions = this._parseQuestions(result.text);
    return {
      ...result,
      questions,
      count: questions.length,
      bloomsDistribution: this._getBloomsDistribution(questions),
    };
  }

  _parseQuestions(text) {
    // Parse with Bloom's level extraction
    const questionBlocks = text.split(/Q\d+/i).slice(1);
    return questionBlocks.map((block, index) => {
      const bloomsMatch = block.match(/\[?Bloom'?s?\s*Level\s*(\d)\]?/i);
      const bloomsLevel = bloomsMatch ? parseInt(bloomsMatch[1]) : null;
      return {
        id: index + 1,
        text: block.trim(),
        bloomsLevel,
      };
    });
  }

  _getBloomsDistribution(questions) {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    questions.forEach(q => {
      if (q.bloomsLevel && dist[q.bloomsLevel] !== undefined) {
        dist[q.bloomsLevel]++;
      }
    });
    return dist;
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
 * Mind Map Generator - generates structured mind map text
 */
class MindMapGenerator extends ContentGenerator {
  buildPrompt() {
    return `Create a structured mind map for "${this._topic}" in ${this._subject}.

Format:
CENTRAL TOPIC: ${this._topic}

BRANCH 1: [Main Concept]
  - Sub-point 1
  - Sub-point 2

BRANCH 2: [Another Concept]
  - Sub-point 1
  - Sub-point 2

(Include 4-6 branches, 2-4 sub-points each. Focus on key exam-relevant concepts.)`;
  }

  formatResponse(result) {
    if (!result.success) return result;
    const branches = this._parseMindMap(result.text);
    return { ...result, mindMap: { centralTopic: this._topic, branches }, count: branches.length };
  }

  _parseMindMap(text) {
    const branches = [];
    const branchBlocks = text.split(/BRANCH\s+\d+:/i).slice(1);
    branchBlocks.forEach((block, i) => {
      const lines = block.trim().split('\n').filter(l => l.trim());
      const title = lines[0]?.replace(/[\[\]]/g, '').trim() || `Branch ${i + 1}`;
      const subPoints = lines.slice(1)
        .map(l => l.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);
      branches.push({ id: i + 1, title, subPoints });
    });
    return branches;
  }
}

/**
 * Daily Challenge Generator — generates a timed challenge quiz
 */
class DailyChallengeGenerator extends ContentGenerator {
  constructor(subject, topic, examType, difficulty = 'mixed') {
    super(subject, topic, examType);
    this._difficulty = difficulty;
  }

  buildPrompt() {
    return `Create a DAILY CHALLENGE for "${this._topic}" in ${this._subject}.

The challenge should have:
1. A short intro paragraph (2 sentences)
2. Exactly 3 multiple-choice questions (difficulty: ${this._difficulty})
3. One bonus "Think Deeper" open-ended question

Format:
INTRO: [intro text]

Q1: [question]
a) [opt] b) [opt] c) [opt] d) [opt]
Answer: [letter] — [explanation]

Q2: ...
Q3: ...

BONUS: [open-ended question]`;
  }

  formatResponse(result) {
    if (!result.success) return result;
    return { ...result, challengeType: 'daily', subject: this._subject, topic: this._topic, difficulty: this._difficulty };
  }
}

// ─────────────────────────────────────────────────────────────
// Registry-based Factory (Open/Closed Principle)
// Add new generators by registering — no switch-case modification needed.
// ─────────────────────────────────────────────────────────────
const _generatorRegistry = new Map([
  ['explanation', (s, t, e, o) => new ExplanationGenerator(s, t, e, o.detailLevel)],
  ['quiz',        (s, t, e, o) => new QuizGenerator(s, t, e, o.questionCount, o.difficulty)],
  ['flashcards',  (s, t, e, o) => new FlashcardGenerator(s, t, e, o.cardCount)],
  ['summary',     (s, t, e, _) => new SummaryGenerator(s, t, e)],
  ['mindmap',     (s, t, e, _) => new MindMapGenerator(s, t, e)],
  ['challenge',   (s, t, e, o) => new DailyChallengeGenerator(s, t, e, o.difficulty)],
]);

/**
 * Factory class for creating content generators
 * Implements Registry-based Factory Pattern (Open/Closed Principle)
 */
class ContentGeneratorFactory {
  /**
   * Register a new generator type without modifying this class.
   * @param {string} type - unique type key
   * @param {Function} creator - (subject, topic, examType, options) => ContentGenerator
   */
  static register(type, creator) {
    if (_generatorRegistry.has(type)) throw new Error(`Generator type "${type}" already registered`);
    _generatorRegistry.set(type.toLowerCase(), creator);
  }

  static create(type, subject, topic, examType, options = {}) {
    const key = type.toLowerCase();
    const creator = _generatorRegistry.get(key);
    if (!creator) throw new Error(`Unknown content type: "${type}". Supported: ${[..._generatorRegistry.keys()].join(', ')}`);
    return creator(subject, topic, examType, options);
  }

  static getSupportedTypes() {
    return [..._generatorRegistry.keys()];
  }
}

module.exports = {
  ContentGenerator,
  ExplanationGenerator,
  QuizGenerator,
  FlashcardGenerator,
  SummaryGenerator,
  MindMapGenerator,
  DailyChallengeGenerator,
  ContentGeneratorFactory
};
