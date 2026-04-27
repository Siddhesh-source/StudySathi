/**
 * PYQEvaluator - Evaluation Engine with AI-powered insights
 * Analyzes test performance and generates personalized recommendations.
 * 
 * OOP: Strategy Pattern (different evaluation strategies), Template Method
 */

const { sendPrompt } = require('../services/gemini');

class PYQEvaluator {
  #test;
  #evaluation;
  #insights;

  constructor(test) {
    this.#test = test;
    this.#evaluation = test.evaluation;
    this.#insights = null;
  }

  async generateInsights() {
    if (!this.#evaluation) {
      throw new Error('Test must be evaluated first');
    }

    const weakTopics = this.#evaluation.strengthByTopic
      .filter(t => t.accuracy < 60)
      .map(t => t.topic);

    const weakDifficulty = this.#evaluation.strengthByDifficulty
      .filter(d => d.accuracy < 50)
      .map(d => d.level);

    const weakBlooms = this.#evaluation.bloomsDistribution
      .filter(b => b.accuracy < 60)
      .map(b => `Level ${b.level}`);

    const prompt = `Analyze this ${this.#test.examName} ${this.#test.year} test performance and provide insights:

PERFORMANCE SUMMARY:
- Score: ${this.#evaluation.scoredMarks}/${this.#evaluation.totalMarks} (${this.#evaluation.percentage}%)
- Accuracy: ${this.#evaluation.accuracy}%
- Correct: ${this.#evaluation.correct}, Incorrect: ${this.#evaluation.incorrect}, Unattempted: ${this.#evaluation.unattempted}
- Time: ${Math.round(this.#evaluation.timeTaken / 60000)} minutes

WEAK AREAS:
- Topics: ${weakTopics.join(', ') || 'None'}
- Difficulty: ${weakDifficulty.join(', ') || 'None'}
- Bloom's Levels: ${weakBlooms.join(', ') || 'None'}

TOPIC-WISE PERFORMANCE:
${this.#evaluation.strengthByTopic.map(t => `- ${t.topic}: ${t.correct}/${t.total} (${t.accuracy}%)`).join('\n')}

Generate a JSON response with:
{
  "overallAssessment": "2-3 sentence summary of performance",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": [
    {"priority": "high", "action": "specific action", "reason": "why"},
    {"priority": "medium", "action": "...", "reason": "..."}
  ],
  "studyPlan": {
    "immediate": "what to do in next 2-3 days",
    "shortTerm": "what to do in next 1-2 weeks",
    "longTerm": "overall strategy"
  },
  "motivationalMessage": "encouraging message"
}`;

    const result = await sendPrompt(prompt, { temperature: 0.7, maxTokens: 1500 });
    
    if (result.success) {
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          this.#insights = JSON.parse(jsonMatch[0]);
        } else {
          this.#insights = { raw: result.text };
        }
      } catch {
        this.#insights = { raw: result.text };
      }
    }

    return this.#insights;
  }

  async generateQuestionExplanations(questionIds = []) {
    const questions = questionIds.length > 0
      ? this.#evaluation.questionAnalysis.filter(q => questionIds.includes(q.questionId))
      : this.#evaluation.questionAnalysis.filter(q => !q.isCorrect);

    const explanations = [];

    for (const q of questions.slice(0, 5)) {
      const prompt = `Explain this ${this.#test.examName} question in detail:

QUESTION: ${q.question}
OPTIONS: ${Object.entries(q.options || {}).map(([k, v]) => `${k}) ${v}`).join(', ')}
CORRECT ANSWER: ${q.correctAnswer}
USER ANSWER: ${q.userAnswer || 'Not attempted'}
TOPIC: ${q.topic}

Provide:
1. Why the correct answer is right (2-3 sentences)
2. Why other options are wrong (1 sentence each)
3. Key concept to remember
4. Common mistake students make
5. Exam tip for similar questions

Keep it concise and exam-focused.`;

      const result = await sendPrompt(prompt, { temperature: 0.6, maxTokens: 800 });
      
      if (result.success) {
        explanations.push({
          questionId: q.questionId,
          question: q.question,
          explanation: result.text,
        });
      }
    }

    return explanations;
  }

  getPerformanceGrade() {
    const percentage = this.#evaluation.percentage;
    if (percentage >= 90) return { grade: 'A+', label: 'Outstanding', color: 'green' };
    if (percentage >= 80) return { grade: 'A', label: 'Excellent', color: 'green' };
    if (percentage >= 70) return { grade: 'B', label: 'Good', color: 'blue' };
    if (percentage >= 60) return { grade: 'C', label: 'Average', color: 'yellow' };
    if (percentage >= 50) return { grade: 'D', label: 'Below Average', color: 'orange' };
    return { grade: 'F', label: 'Needs Improvement', color: 'red' };
  }

  compareWithPreviousTests(previousTests = []) {
    if (previousTests.length === 0) return null;

    const currentScore = this.#evaluation.percentage;
    const avgPrevious = previousTests.reduce((s, t) => s + (t.evaluation?.percentage || 0), 0) / previousTests.length;
    const improvement = currentScore - avgPrevious;

    return {
      currentScore,
      averagePrevious: Math.round(avgPrevious),
      improvement: Math.round(improvement),
      trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
    };
  }

  toObject() {
    return {
      evaluation: this.#evaluation,
      insights: this.#insights,
      grade: this.getPerformanceGrade(),
    };
  }
}

module.exports = PYQEvaluator;
