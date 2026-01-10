const { GoogleGenerativeAI } = require('@google/generative-ai');

// Validate API key on module load
if (!process.env.GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY not found in environment variables');
} else {
  console.log('Gemini API Key loaded:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are StudySaathi, an AI study companion designed for Indian students preparing for competitive exams like JEE, NEET, UPSC, CAT, GATE, SSC, Banking, and board exams (CBSE, ICSE, State Boards).

IMPORTANT - Language Style:
- Use simple, clear Indian English only
- Write like a friendly senior (bhaiya/didi) explaining to a younger student
- Avoid complex vocabulary - use everyday words
- Use common Indian phrases naturally: "Let's understand this step by step", "This is very important for your exam", "Don't worry, it's simple"

IMPORTANT - Exam-Focused Approach:
- Always connect concepts to how they appear in exams
- Mention weightage: "This topic carries 4-5 marks in JEE", "NEET asks 2-3 questions from here"
- Highlight: "Previous year favourite", "Frequently asked", "Scoring topic"
- Give exam tips: "In MCQs, eliminate options like this...", "For numericals, always check units"
- Include shortcuts and tricks wherever possible
- Point out common mistakes students make in exams

Response Guidelines:
1. Start with a brief, encouraging intro
2. Break complex topics into numbered steps
3. Use bullet points for key facts
4. Highlight formulas in clear format
5. End with quick revision points or exam tips
6. Keep it concise - students have limited time
7. Be positive: "You can do this!", "Practice makes perfect"

Remember: Your goal is to help students score maximum marks in minimum time.`;

const getModel = (modelName = 'gemini-2.0-flash') => {
  return genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
  });
};

// Helper function to retry API calls
const withRetry = async (fn, maxRetries = 2, delay = 1000) => {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
};

const sendPrompt = async (prompt, options = {}) => {
  const {
    modelName = 'gemini-2.0-flash',
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  try {
    const model = getModel(modelName);
    
    const generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    const result = await withRetry(async () => {
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });
    });

    const response = result.response;
    return {
      success: true,
      text: response.text(),
      usage: response.usageMetadata,
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    // More descriptive error messages
    let errorMessage = error.message;
    if (error.message.includes('fetch failed')) {
      errorMessage = 'Network error - unable to reach Gemini API. Please check your internet connection.';
    } else if (error.message.includes('API_KEY')) {
      errorMessage = 'Invalid or missing Gemini API key. Please check your .env file.';
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
};

const sendChatPrompt = async (messages, options = {}) => {
  const {
    modelName = 'gemini-2.0-flash',
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  try {
    const model = getModel(modelName);
    
    const generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    const chat = model.startChat({
      generationConfig,
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    
    return {
      success: true,
      text: result.response.text(),
      usage: result.response.usageMetadata,
    };
  } catch (error) {
    console.error('Gemini Chat API Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const generateStudyContent = async (subject, topic, contentType, options = {}) => {
  const prompts = {
    explanation: `Explain the topic "${topic}" in ${subject} for exam preparation. Include key concepts, important formulas (if any), and exam tips.`,
    
    flashcards: `Create 5 flashcards for the topic "${topic}" in ${subject}. Format each flashcard as:
Q: [Question]
A: [Answer]
Make questions exam-focused and answers concise but complete.`,
    
    quiz: `Create 5 multiple choice questions on "${topic}" in ${subject} for exam practice. Format:
Q1: [Question]
a) [Option]
b) [Option]
c) [Option]
d) [Option]
Answer: [Correct option with brief explanation]`,
    
    summary: `Provide a quick revision summary of "${topic}" in ${subject}. Include:
- Key points (bullet points)
- Important formulas/facts
- Common exam patterns
- Memory tricks if any`,
    
    pyq_style: `Create 3 previous year exam style questions on "${topic}" in ${subject}. Include variety - one easy, one medium, one hard. Provide solutions.`,
  };

  const prompt = prompts[contentType] || prompts.explanation;
  return sendPrompt(prompt, options);
};

/**
 * Generate personalized study plan based on syllabus, exam date, and weak subjects
 */
const generateStudyPlan = async (planData) => {
  const { 
    examName, 
    examDate, 
    subjects, 
    topics, 
    weakSubjects, 
    dailyStudyHours 
  } = planData;

  const today = new Date();
  const exam = new Date(examDate);
  const daysLeft = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  const weeksLeft = Math.ceil(daysLeft / 7);

  // Build syllabus string
  const syllabusDetails = subjects.map(subject => {
    const subjectTopics = topics[subject] || 'General topics';
    const confidence = weakSubjects[subject] || 3;
    const priority = confidence <= 2 ? 'HIGH PRIORITY (Weak)' : confidence >= 4 ? 'Low priority (Strong)' : 'Medium priority';
    return `- ${subject}: ${subjectTopics} [Confidence: ${confidence}/5, ${priority}]`;
  }).join('\n');

  const prompt = `Create a detailed study plan for a student preparing for ${examName}.

STUDENT DETAILS:
- Exam Date: ${examDate} (${daysLeft} days left, ~${weeksLeft} weeks)
- Daily Study Hours Available: ${dailyStudyHours} hours
- Subjects & Topics:
${syllabusDetails}

GENERATE A COMPLETE STUDY PLAN WITH:

1. DAILY TIMETABLE (for a typical day):
   - Create hour-by-hour schedule for ${dailyStudyHours} hours
   - Include short breaks (5-10 min after every 45-50 min)
   - Allocate more time to weak subjects
   - Include revision slots
   - Format: Time | Subject | Activity | Duration

2. WEEKLY PLAN (${Math.min(weeksLeft, 8)} weeks):
   - Week-wise breakdown of topics to cover
   - Focus more on weak subjects in early weeks
   - Keep last 1-2 weeks for revision and mock tests
   - Format: Week X | Subject | Topics | Goals

3. REVISION STRATEGY:
   - Daily quick revision (15-20 min)
   - Weekly revision schedule
   - Formula/fact sheets to prepare

4. EXAM TIPS:
   - Subject-wise scoring strategies
   - Time management in exam
   - Common mistakes to avoid

IMPORTANT: 
- Give more weightage to weak subjects (low confidence scores)
- Be realistic with the time available
- Include buffer time for unexpected delays
- Suggest mock test schedule

Return the response in this JSON format:
{
  "dailyTimetable": [
    {"time": "6:00 AM - 7:00 AM", "subject": "Physics", "activity": "Theory + Notes", "duration": "60 min"}
  ],
  "weeklyPlan": [
    {"week": 1, "focus": "Foundation Building", "subjects": [{"name": "Physics", "topics": ["Mechanics basics"], "hours": 10}]}
  ],
  "revisionStrategy": {
    "daily": "description",
    "weekly": "description",
    "sheets": ["list of sheets to prepare"]
  },
  "examTips": ["tip1", "tip2"],
  "summary": "Brief motivational summary"
}`;

  const result = await sendPrompt(prompt, { temperature: 0.7, maxTokens: 4096 });
  
  if (result.success) {
    try {
      // Extract JSON from response
      let jsonStr = result.text;
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const planJson = JSON.parse(jsonStr);
      return {
        success: true,
        plan: planJson,
        metadata: {
          examName,
          examDate,
          daysLeft,
          weeksLeft,
          dailyStudyHours,
          generatedAt: new Date().toISOString(),
        }
      };
    } catch (parseError) {
      // Return raw text if JSON parsing fails
      return {
        success: true,
        plan: null,
        rawPlan: result.text,
        metadata: {
          examName,
          examDate,
          daysLeft,
          weeksLeft,
          dailyStudyHours,
          generatedAt: new Date().toISOString(),
        }
      };
    }
  }
  
  return result;
};

/**
 * Smart Learning Room - Generate content based on selected learning tags
 */
const generateSmartLearning = async (learningData) => {
  const { topic, subject, examType, tags } = learningData;

  const tagPrompts = {
    brief: `BRIEF EXPLANATION:
Explain "${topic}" in 3-4 simple sentences. Keep it short and easy to understand.`,

    detailed: `DETAILED EXPLANATION:
Explain "${topic}" in depth with:
- Core concept and definition
- How it works (step by step)
- Key components/parts
- Why it's important
Keep language simple but thorough.`,

    questions: `10 PRACTICE QUESTIONS:
Create 10 exam-style questions on "${topic}":
- 3 Easy (direct concept)
- 4 Medium (application based)
- 3 Hard (analytical/tricky)
Format: Q1, Q2... with answers at the end.`,

    analogy: `REAL-LIFE ANALOGY:
Explain "${topic}" using 2-3 relatable real-life examples that Indian students can connect with. Use everyday situations, cricket, movies, or common experiences.`,

    dosdonts: `DO'S & DON'TS:
List important Do's and Don'ts for "${topic}":
✅ DO's (5-6 points) - What to remember, correct approaches
❌ DON'Ts (5-6 points) - Common wrong approaches, what to avoid`,

    exampoints: `EXAM IMPORTANT POINTS:
For "${topic}", list:
- Most frequently asked concepts (mark with ⭐)
- Formulas/facts that MUST be memorized
- Types of questions asked in exams
- Marks weightage (if applicable)
- Previous year pattern insights`,

    quickrevision: `QUICK REVISION NOTES:
Create bullet-point revision notes for "${topic}":
- Key definitions (one line each)
- Important formulas/facts
- Memory tricks/mnemonics
- Quick summary in 5 points
Perfect for last-minute revision.`,

    mistakes: `COMMON MISTAKES:
List common mistakes students make in "${topic}":
- Conceptual errors
- Calculation mistakes
- Silly mistakes in exams
- How to avoid each mistake
- Correct approach for each`,
  };

  // Build dynamic prompt based on selected tags
  const selectedPrompts = tags
    .filter(tag => tagPrompts[tag])
    .map(tag => tagPrompts[tag])
    .join('\n\n---\n\n');

  const prompt = `You are helping a student learn "${topic}"${subject ? ` in ${subject}` : ''}${examType ? ` for ${examType} exam` : ''}.

Generate content for the following sections:

${selectedPrompts}

IMPORTANT GUIDELINES:
- Use simple Indian English
- Be exam-focused and practical
- Include tips wherever relevant
- Make it easy to understand and remember

Return response in this JSON format:
{
  "topic": "${topic}",
  "sections": {
    ${tags.map(tag => `"${tag}": "content here"`).join(',\n    ')}
  }
}`;

  const result = await sendPrompt(prompt, { temperature: 0.7, maxTokens: 4096 });

  if (result.success) {
    try {
      let jsonStr = result.text;
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const content = JSON.parse(jsonStr);
      return {
        success: true,
        content,
        rawContent: result.text,
      };
    } catch {
      return {
        success: true,
        content: null,
        rawContent: result.text,
      };
    }
  }

  return result;
};

const askDoubt = async (question, context = {}) => {
  const { subject, topic, examType } = context;
  
  let prompt = question;
  if (subject || topic || examType) {
    prompt = `Context: ${examType ? `Exam: ${examType}, ` : ''}${subject ? `Subject: ${subject}, ` : ''}${topic ? `Topic: ${topic}` : ''}

Student's doubt: ${question}

Please explain in simple terms with exam focus.`;
  }

  return sendPrompt(prompt);
};

/**
 * Generate smart question suggestions based on user's profile
 */
const generateSmartSuggestions = async (profileData) => {
  const { examName, subjects, topics, weakSubjects, recentTopics } = profileData;

  const subjectsList = subjects?.join(', ') || 'General subjects';
  const weakList = weakSubjects ? Object.entries(weakSubjects)
    .filter(([_, conf]) => conf <= 2)
    .map(([subj]) => subj)
    .join(', ') : '';
  
  const topicsList = topics ? Object.entries(topics)
    .map(([subj, topicArr]) => `${subj}: ${Array.isArray(topicArr) ? topicArr.join(', ') : topicArr}`)
    .join('; ') : '';

  const recentList = recentTopics?.slice(0, 5).map(t => t.topic).join(', ') || '';

  const prompt = `You are StudySaathi AI. Generate 6 smart, exam-focused questions that a student preparing for ${examName || 'competitive exams'} would want to ask.

STUDENT PROFILE:
- Exam: ${examName || 'Competitive Exam'}
- Subjects: ${subjectsList}
- Topics being studied: ${topicsList || 'Various topics'}
${weakList ? `- Weak areas: ${weakList}` : ''}
${recentList ? `- Recently studied: ${recentList}` : ''}

GENERATE 6 QUESTIONS:
- 2 questions about weak/difficult concepts (conceptual doubts)
- 2 questions about exam strategies/tips
- 2 questions about specific topics from their syllabus

REQUIREMENTS:
- Questions should be specific, not generic
- Focus on what students actually struggle with
- Include subject name in question where relevant
- Make them sound natural (like a student would ask)
- Keep questions concise (under 15 words each)

Return ONLY a JSON array of 6 question strings:
["question1", "question2", "question3", "question4", "question5", "question6"]`;

  const result = await sendPrompt(prompt, { temperature: 0.8, maxTokens: 1024 });

  if (result.success) {
    try {
      let jsonStr = result.text;
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const suggestions = JSON.parse(jsonStr);
      return {
        success: true,
        suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 6) : [],
      };
    } catch {
      // Fallback: try to extract questions from text
      const lines = result.text.split('\n').filter(l => l.trim().length > 10 && l.includes('?'));
      return {
        success: true,
        suggestions: lines.slice(0, 6).map(l => l.replace(/^[\d\.\-\*\s"]+/, '').replace(/"$/,'').trim()),
      };
    }
  }

  return { success: false, suggestions: [], error: result.error };
};

/**
 * Generate popular/recommended topics based on user's profile
 */
const generatePopularTopics = async (profileData) => {
  const { examName, subjects, topics, recentTopics } = profileData;

  const subjectsList = subjects?.join(', ') || 'General subjects';
  const topicsList = topics ? Object.entries(topics)
    .map(([subj, topicArr]) => `${subj}: ${Array.isArray(topicArr) ? topicArr.join(', ') : topicArr}`)
    .join('; ') : '';
  const recentList = recentTopics?.slice(0, 5).map(t => `${t.topic} (${t.subject})`).join(', ') || '';

  const prompt = `You are StudySaathi AI helping a student preparing for ${examName || 'competitive exams'}.

STUDENT PROFILE:
- Exam: ${examName || 'Competitive Exam'}
- Subjects: ${subjectsList}
- Syllabus topics: ${topicsList || 'Not specified'}
${recentList ? `- Recently studied: ${recentList}` : ''}

Generate 8 topic suggestions for the student to study next. Include:
- 3 high-weightage/important topics for their exam
- 2 topics they haven't studied recently (if recent topics provided)
- 3 foundational topics that are prerequisites for advanced concepts

REQUIREMENTS:
- Topics must be from their subjects: ${subjectsList}
- Be specific (e.g., "Newton's Laws of Motion" not just "Physics")
- Focus on exam-relevant topics
- Each topic should be 2-5 words
- Don't repeat recently studied topics

Return ONLY a JSON array of 8 topic strings:
["topic1", "topic2", "topic3", "topic4", "topic5", "topic6", "topic7", "topic8"]`;

  const result = await sendPrompt(prompt, { temperature: 0.7, maxTokens: 512 });

  if (result.success) {
    try {
      let jsonStr = result.text;
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const suggestions = JSON.parse(jsonStr);
      return {
        success: true,
        topics: Array.isArray(suggestions) ? suggestions.slice(0, 8) : [],
      };
    } catch {
      // Fallback: try to extract topics from text
      const lines = result.text.split('\n')
        .filter(l => l.trim().length > 3 && l.trim().length < 50)
        .map(l => l.replace(/^[\d\.\-\*\s"]+/, '').replace(/["',]/g, '').trim())
        .filter(l => l.length > 3);
      return {
        success: true,
        topics: lines.slice(0, 8),
      };
    }
  }

  return { success: false, topics: [], error: result.error };
};

/**
 * Stream response from Gemini (for real-time output)
 */
const sendPromptStream = async (prompt, onChunk, options = {}) => {
  const {
    modelName = 'gemini-2.0-flash',
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  try {
    const model = getModel(modelName);
    
    const generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      if (onChunk) onChunk(chunkText);
    }

    return {
      success: true,
      text: fullText,
    };
  } catch (error) {
    console.error('Gemini Stream API Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Wrapper to ensure Indian English exam-focused response
 */
const sendExamFocusedPrompt = async (prompt, examType = '', options = {}) => {
  const enhancedPrompt = `${examType ? `[Exam: ${examType}] ` : ''}${prompt}

Remember: Explain in simple Indian English. Focus on exam relevance and scoring tips.`;
  
  return sendPrompt(enhancedPrompt, options);
};

module.exports = {
  sendPrompt,
  sendPromptStream,
  sendChatPrompt,
  sendExamFocusedPrompt,
  generateStudyContent,
  generateStudyPlan,
  generateSmartLearning,
  askDoubt,
  generateSmartSuggestions,
  generatePopularTopics,
  SYSTEM_PROMPT,
};
