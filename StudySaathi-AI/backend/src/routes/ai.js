const express = require('express');
const router = express.Router();
const { sendPrompt, sendChatPrompt, generateStudyContent, generateStudyPlan, generateSmartLearning, askDoubt, generateSmartSuggestions, generatePopularTopics } = require('../services/gemini');
const { db } = require('../config/firebase');
const { 
  trackTimeSpent, 
  trackNoteSaved, 
  updateConfidence, 
  getTopicProgress, 
  getStudyRecommendations 
} = require('../services/topicTracker');
const { updateStreak, getStreakData } = require('../services/streakTracker');

router.post('/prompt', async (req, res) => {
  const { prompt, options } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const result = await sendPrompt(prompt, options);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

router.post('/chat', async (req, res) => {
  const { messages, options } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const result = await sendChatPrompt(messages, options);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

router.post('/study-content', async (req, res) => {
  const { subject, topic, contentType, options } = req.body;

  if (!subject || !topic) {
    return res.status(400).json({ error: 'Subject and topic are required' });
  }

  const validTypes = ['explanation', 'flashcards', 'quiz', 'summary', 'pyq_style'];
  const type = validTypes.includes(contentType) ? contentType : 'explanation';

  const result = await generateStudyContent(subject, topic, type, options);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

router.post('/ask-doubt', async (req, res) => {
  const { question, context } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const result = await askDoubt(question, context || {});
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// Generate smart question suggestions based on user profile
router.post('/smart-suggestions', async (req, res) => {
  const { userId, examName, subjects, topics, weakSubjects } = req.body;

  try {
    // Get recent topics if userId provided
    let recentTopics = [];
    if (userId && db) {
      const progressResult = await getTopicProgress(userId);
      if (progressResult.success) {
        recentTopics = progressResult.topics?.slice(0, 5) || [];
      }
    }

    const result = await generateSmartSuggestions({
      examName,
      subjects,
      topics,
      weakSubjects,
      recentTopics,
    });

    res.json(result);
  } catch (error) {
    console.error('Smart Suggestions Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate popular/recommended topics based on user profile
router.post('/popular-topics', async (req, res) => {
  const { userId, examName, subjects, topics } = req.body;

  try {
    // Get recent topics if userId provided
    let recentTopics = [];
    if (userId && db) {
      const progressResult = await getTopicProgress(userId);
      if (progressResult.success) {
        recentTopics = progressResult.topics?.slice(0, 10) || [];
      }
    }

    const result = await generatePopularTopics({
      examName,
      subjects,
      topics,
      recentTopics,
    });

    res.json(result);
  } catch (error) {
    console.error('Popular Topics Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Study Plan and store in Firestore
router.post('/study-plan', async (req, res) => {
  const { userId, examName, examDate, subjects, topics, weakSubjects, dailyStudyHours } = req.body;

  if (!userId || !examName || !examDate || !subjects || subjects.length === 0) {
    return res.status(400).json({ 
      error: 'userId, examName, examDate, and subjects are required' 
    });
  }

  try {
    const result = await generateStudyPlan({
      examName,
      examDate,
      subjects,
      topics: topics || {},
      weakSubjects: weakSubjects || {},
      dailyStudyHours: dailyStudyHours || 4,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Store in Firestore
    if (db) {
      const planDoc = {
        userId,
        ...result,
        createdAt: new Date(),
        status: 'active',
      };

      const docRef = await db.collection('studyPlans').add(planDoc);
      
      // Also update user's active plan reference
      await db.collection('users').doc(userId).set({
        activeStudyPlanId: docRef.id,
        lastPlanGeneratedAt: new Date(),
      }, { merge: true });

      result.planId = docRef.id;
    }

    res.json(result);
  } catch (error) {
    console.error('Study Plan Generation Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's study plan
router.get('/study-plan/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!db) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    // Get user's active plan
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.activeStudyPlanId) {
      return res.json({ success: true, plan: null, message: 'No active study plan' });
    }

    const planDoc = await db.collection('studyPlans').doc(userData.activeStudyPlanId).get();
    
    if (!planDoc.exists) {
      return res.json({ success: true, plan: null, message: 'Study plan not found' });
    }

    res.json({ 
      success: true, 
      planId: planDoc.id,
      ...planDoc.data() 
    });
  } catch (error) {
    console.error('Get Study Plan Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Smart Learning Room - Generate content based on tags
router.post('/smart-learning', async (req, res) => {
  const { topic, subject, examType, tags } = req.body;

  if (!topic || !tags || tags.length === 0) {
    return res.status(400).json({ error: 'Topic and at least one tag are required' });
  }

  const validTags = ['brief', 'detailed', 'questions', 'analogy', 'dosdonts', 'exampoints', 'quickrevision', 'mistakes'];
  const filteredTags = tags.filter(tag => validTags.includes(tag));

  if (filteredTags.length === 0) {
    return res.status(400).json({ error: 'No valid tags provided' });
  }

  try {
    const result = await generateSmartLearning({
      topic,
      subject: subject || '',
      examType: examType || '',
      tags: filteredTags,
    });

    res.json(result);
  } catch (error) {
    console.error('Smart Learning Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save learning notes to Firestore (with topic tracking)
router.post('/notes', async (req, res) => {
  const { userId, topic, subject, content, tags } = req.body;
  console.log('Saving note:', { userId, topic, subject, tagsCount: tags?.length, contentLength: content?.length });

  if (!userId || !topic || !content) {
    console.log('Missing required fields:', { userId: !!userId, topic: !!topic, content: !!content });
    return res.status(400).json({ error: 'userId, topic, and content are required' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const noteDoc = {
      userId,
      topic,
      subject: subject || '',
      content,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('notes').add(noteDoc);
    console.log('Note saved with ID:', docRef.id);
    
    // Track note saved for topic progress
    if (subject) {
      await trackNoteSaved(userId, subject, topic);
    }

    res.json({ success: true, noteId: docRef.id });
  } catch (error) {
    console.error('Save Note Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's saved notes
router.get('/notes/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('Fetching notes for user:', userId);

  if (!db) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    // Simple query without orderBy to avoid index requirement
    const notesSnapshot = await db.collection('notes')
      .where('userId', '==', userId)
      .get();

    console.log('Notes found:', notesSnapshot.size);

    const notes = notesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by createdAt in memory (descending - newest first)
    notes.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    res.json({ success: true, notes: notes.slice(0, 50) });
  } catch (error) {
    console.error('Get Notes Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ TOPIC TRACKING ROUTES ============

// Track time spent on a topic
router.post('/track/time', async (req, res) => {
  const { userId, subject, topic, minutes } = req.body;

  if (!userId || !subject || !topic || !minutes) {
    return res.status(400).json({ error: 'userId, subject, topic, and minutes are required' });
  }

  const result = await trackTimeSpent(userId, subject, topic, minutes);
  
  // Also update streak when user studies
  if (result.success) {
    await updateStreak(userId);
  }
  
  res.json(result);
});

// Update confidence for a topic
router.post('/track/confidence', async (req, res) => {
  const { userId, subject, topic, confidence } = req.body;

  if (!userId || !subject || !topic || confidence === undefined) {
    return res.status(400).json({ error: 'userId, subject, topic, and confidence are required' });
  }

  const result = await updateConfidence(userId, subject, topic, confidence);
  res.json(result);
});

// Get topic progress for a user
router.get('/track/progress/:userId', async (req, res) => {
  const { userId } = req.params;
  const { subject } = req.query;

  const result = await getTopicProgress(userId, subject || null);
  res.json(result);
});

// Get study recommendations based on topic strengths
router.get('/track/recommendations/:userId', async (req, res) => {
  const { userId } = req.params;

  const result = await getStudyRecommendations(userId);
  res.json(result);
});

// Auto-adjust study plan based on topic progress
router.post('/study-plan/adjust', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get current progress
    const progressResult = await getTopicProgress(userId);
    if (!progressResult.success) {
      return res.status(500).json(progressResult);
    }

    // Get user profile for exam info
    if (!db) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build adjusted weak subjects based on actual progress
    const adjustedWeakSubjects = {};
    progressResult.topics.forEach(topic => {
      const subject = topic.subject;
      if (!adjustedWeakSubjects[subject]) {
        adjustedWeakSubjects[subject] = [];
      }
      adjustedWeakSubjects[subject].push({
        topic: topic.topic,
        strength: topic.strengthLabel || 'weak',
        score: topic.strengthScore || 0,
      });
    });

    // Calculate subject-level confidence from topic averages
    const subjectConfidence = {};
    Object.keys(adjustedWeakSubjects).forEach(subject => {
      const topics = adjustedWeakSubjects[subject];
      const avgScore = topics.reduce((sum, t) => sum + t.score, 0) / topics.length;
      // Convert 0-100 score to 1-5 confidence
      subjectConfidence[subject] = Math.round((avgScore / 100) * 4) + 1;
    });

    // Generate new plan with adjusted data
    const result = await generateStudyPlan({
      examName: userData.examName,
      examDate: userData.examDate,
      subjects: userData.subjects,
      topics: userData.topics,
      weakSubjects: subjectConfidence,
      dailyStudyHours: userData.dailyStudyHours,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Store adjusted plan
    const planDoc = {
      userId,
      ...result,
      adjustedBasedOnProgress: true,
      topicStrengths: adjustedWeakSubjects,
      createdAt: new Date(),
      status: 'active',
    };

    const docRef = await db.collection('studyPlans').add(planDoc);
    
    await db.collection('users').doc(userId).set({
      activeStudyPlanId: docRef.id,
      lastPlanAdjustedAt: new Date(),
    }, { merge: true });

    result.planId = docRef.id;
    result.adjustments = {
      subjectConfidence,
      topicBreakdown: adjustedWeakSubjects,
    };

    res.json(result);
  } catch (error) {
    console.error('Adjust Study Plan Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ STREAK TRACKING ROUTES ============

// Get user's streak data
router.get('/streak/:userId', async (req, res) => {
  const { userId } = req.params;

  const result = await getStreakData(userId);
  res.json(result);
});

// Update streak (call when user studies)
router.post('/streak/update', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const result = await updateStreak(userId);
  res.json(result);
});

module.exports = router;
