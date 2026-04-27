const { db } = require('../config/firebase');
const PYQTest = require('../models/PYQTest');
const PYQQuestion = require('../models/PYQQuestion');
const PYQEvaluator = require('../models/PYQEvaluator');
const { sendPrompt } = require('./gemini');

const COLLECTION = 'pyqTests';

// Built-in PYQ database (sample questions - in production, fetch from external API)
const PYQ_DATABASE = {
  JEE: {
    2023: {
      Physics: [
        {
          id: 'jee_2023_phy_1',
          examName: 'JEE',
          year: 2023,
          subject: 'Physics',
          topic: 'Mechanics',
          questionText: 'A particle moves in a circle of radius R with constant speed v. The magnitude of average acceleration in half revolution is:',
          options: { a: '2v²/πR', b: 'v²/R', c: 'πv²/2R', d: 'zero' },
          correctAnswer: 'a',
          explanation: 'Average acceleration = change in velocity / time. In half revolution, velocity changes from v to -v, so Δv = 2v. Time = πR/v. Therefore, avg acc = 2v/(πR/v) = 2v²/πR',
          difficulty: 3,
          bloomsLevel: 3,
          marks: 4,
          timeAllotted: 180,
          tags: ['circular motion', 'kinematics']
        },
        {
          id: 'jee_2023_phy_2',
          examName: 'JEE',
          year: 2023,
          subject: 'Physics',
          topic: 'Electrostatics',
          questionText: 'Two point charges +Q and -Q are placed at distance d apart. The electric field at the midpoint is:',
          options: { a: 'zero', b: '2kQ/d²', c: '4kQ/d²', d: '8kQ/d²' },
          correctAnswer: 'd',
          explanation: 'At midpoint, both charges are at distance d/2. Field due to +Q = kQ/(d/2)² = 4kQ/d² (rightward). Field due to -Q = 4kQ/d² (rightward, towards -Q). Total = 8kQ/d²',
          difficulty: 2,
          bloomsLevel: 2,
          marks: 4,
          timeAllotted: 120,
          tags: ['electric field', 'point charges']
        }
      ],
      Chemistry: [
        {
          id: 'jee_2023_chem_1',
          examName: 'JEE',
          year: 2023,
          subject: 'Chemistry',
          topic: 'Organic Chemistry',
          questionText: 'Which of the following is the most stable carbocation?',
          options: { a: 'CH₃⁺', b: '(CH₃)₂CH⁺', c: '(CH₃)₃C⁺', d: 'C₆H₅CH₂⁺' },
          correctAnswer: 'd',
          explanation: 'Benzyl carbocation (C₆H₅CH₂⁺) is most stable due to resonance stabilization with the benzene ring. Tertiary (c) is next, then secondary (b), then primary (a).',
          difficulty: 2,
          bloomsLevel: 2,
          marks: 4,
          timeAllotted: 120,
          tags: ['carbocation', 'stability']
        }
      ],
      Mathematics: [
        {
          id: 'jee_2023_math_1',
          examName: 'JEE',
          year: 2023,
          subject: 'Mathematics',
          topic: 'Calculus',
          questionText: 'The value of ∫₀^π sin²x dx is:',
          options: { a: 'π/4', b: 'π/2', c: 'π', d: '2π' },
          correctAnswer: 'b',
          explanation: 'Using identity sin²x = (1-cos2x)/2, integral becomes ∫₀^π (1-cos2x)/2 dx = [x/2 - sin2x/4]₀^π = π/2',
          difficulty: 3,
          bloomsLevel: 3,
          marks: 4,
          timeAllotted: 180,
          tags: ['integration', 'trigonometry']
        }
      ]
    },
    2022: {
      Physics: [
        {
          id: 'jee_2022_phy_1',
          examName: 'JEE',
          year: 2022,
          subject: 'Physics',
          topic: 'Thermodynamics',
          questionText: 'In an adiabatic process, the pressure of a gas is increased by 50%. The volume decreases by approximately (γ=1.5):',
          options: { a: '33%', b: '40%', c: '50%', d: '60%' },
          correctAnswer: 'a',
          explanation: 'For adiabatic process: PVᵞ = constant. If P₂=1.5P₁, then V₂/V₁ = (P₁/P₂)^(1/γ) = (1/1.5)^(1/1.5) ≈ 0.67. So volume decreases by 33%.',
          difficulty: 4,
          bloomsLevel: 3,
          marks: 4,
          timeAllotted: 240,
          tags: ['adiabatic', 'thermodynamics']
        }
      ]
    }
  },
  NEET: {
    2023: {
      Physics: [
        {
          id: 'neet_2023_phy_1',
          examName: 'NEET',
          year: 2023,
          subject: 'Physics',
          topic: 'Optics',
          questionText: 'A convex lens of focal length 20 cm forms an image at 30 cm. The object distance is:',
          options: { a: '10 cm', b: '12 cm', c: '60 cm', d: '15 cm' },
          correctAnswer: 'c',
          explanation: 'Using lens formula 1/f = 1/v - 1/u: 1/20 = 1/30 - 1/u. Solving: 1/u = 1/30 - 1/20 = -1/60. Therefore u = -60 cm (object distance is 60 cm).',
          difficulty: 2,
          bloomsLevel: 3,
          marks: 4,
          timeAllotted: 180,
          tags: ['lens formula', 'optics']
        }
      ],
      Biology: [
        {
          id: 'neet_2023_bio_1',
          examName: 'NEET',
          year: 2023,
          subject: 'Biology',
          topic: 'Genetics',
          questionText: 'In a dihybrid cross, the phenotypic ratio in F2 generation is:',
          options: { a: '3:1', b: '1:2:1', c: '9:3:3:1', d: '1:1:1:1' },
          correctAnswer: 'c',
          explanation: 'In dihybrid cross (AaBb × AaBb), F2 phenotypic ratio is 9:3:3:1 (9 both dominant, 3 first dominant, 3 second dominant, 1 both recessive).',
          difficulty: 1,
          bloomsLevel: 1,
          marks: 4,
          timeAllotted: 60,
          tags: ['dihybrid cross', 'mendelian genetics']
        }
      ]
    }
  }
};

const fetchPYQs = async (examName, year, subject, count = 10) => {
  try {
    const questions = PYQ_DATABASE[examName]?.[year]?.[subject] || [];
    const selected = questions.slice(0, Math.min(count, questions.length));
    
    if (selected.length < count && selected.length > 0) {
      const prompt = `Generate ${count - selected.length} more ${examName} ${year} ${subject} PYQ-style questions similar to these examples. Return as JSON array with fields: questionText, options (a,b,c,d), correctAnswer, explanation, topic, difficulty (1-5), bloomsLevel (1-6), marks, timeAllotted.`;
      const result = await sendPrompt(prompt, { temperature: 0.8, maxTokens: 2000 });
      if (result.success) {
        try {
          const jsonMatch = result.text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const generated = JSON.parse(jsonMatch[0]);
            generated.forEach((q, i) => {
              selected.push(new PYQQuestion({
                id: `${examName.toLowerCase()}_${year}_${subject.toLowerCase()}_gen_${i}`,
                examName,
                year,
                subject,
                ...q
              }));
            });
          }
        } catch (e) {
          console.error('Failed to parse generated questions:', e);
        }
      }
    }
    
    return { success: true, questions: selected.map(q => q instanceof PYQQuestion ? q : new PYQQuestion(q)) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const createTest = async (userId, examName, year, subject, questionCount = 10) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const pyqResult = await fetchPYQs(examName, year, subject, questionCount);
    if (!pyqResult.success) return pyqResult;
    
    const test = new PYQTest(userId, examName, year, subject, pyqResult.questions);
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc(test.testId);
    await ref.set(test.toObject());
    
    return { success: true, test: test.toObject() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const startTest = async (userId, testId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc(testId);
    const doc = await ref.get();
    if (!doc.exists) return { success: false, error: 'Test not found' };
    
    const test = PYQTest.fromObject(doc.data());
    test.start();
    await ref.update({ startTime: test.toObject().startTime, status: test.status });
    
    return { success: true, test: test.toObject() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const recordResponse = async (userId, testId, questionId, answer, timeTaken) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc(testId);
    const doc = await ref.get();
    if (!doc.exists) return { success: false, error: 'Test not found' };
    
    const test = PYQTest.fromObject(doc.data());
    test.recordResponse(questionId, answer, timeTaken);
    await ref.update({ responses: test.toObject().responses });
    
    return { success: true, progress: test.getProgress() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const submitTest = async (userId, testId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc(testId);
    const doc = await ref.get();
    if (!doc.exists) return { success: false, error: 'Test not found' };
    
    const test = PYQTest.fromObject(doc.data());
    test.submit();
    const evaluation = test.evaluate();
    
    await ref.update({ 
      endTime: test.toObject().endTime, 
      status: test.status,
      evaluation,
      scoredMarks: test.scoredMarks
    });
    
    return { success: true, evaluation };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getInsights = async (userId, testId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc(testId);
    const doc = await ref.get();
    if (!doc.exists) return { success: false, error: 'Test not found' };
    
    const test = PYQTest.fromObject(doc.data());
    const evaluator = new PYQEvaluator(test);
    const insights = await evaluator.generateInsights();
    
    await ref.update({ insights });
    
    return { success: true, insights, grade: evaluator.getPerformanceGrade() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getExplanations = async (userId, testId, questionIds = []) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc(testId);
    const doc = await ref.get();
    if (!doc.exists) return { success: false, error: 'Test not found' };
    
    const test = PYQTest.fromObject(doc.data());
    const evaluator = new PYQEvaluator(test);
    const explanations = await evaluator.generateQuestionExplanations(questionIds);
    
    return { success: true, explanations };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getUserTests = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const snap = await db.collection('users').doc(userId).collection(COLLECTION)
      .limit(20)
      .get();
    
    const tests = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.startTime ? new Date(a.startTime) : new Date(0);
        const tb = b.startTime ? new Date(b.startTime) : new Date(0);
        return tb - ta;
      });

    return { success: true, tests };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { 
  fetchPYQs, 
  createTest, 
  startTest, 
  recordResponse, 
  submitTest, 
  getInsights, 
  getExplanations,
  getUserTests 
};
