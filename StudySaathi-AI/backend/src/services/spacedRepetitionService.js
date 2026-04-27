const { db } = require('../config/firebase');
const SpacedRepetitionScheduler = require('../models/SpacedRepetitionScheduler');

const COLLECTION = 'spacedRepetition';

const getScheduler = async (userId, topicId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc(topicId);
    const doc = await ref.get();
    const userDoc = await db.collection('users').doc(userId).get();
    const examType = userDoc.data()?.examName || 'OTHER';
    
    if (!doc.exists) {
      return { success: true, scheduler: new SpacedRepetitionScheduler(userId, topicId, {}, examType), isNew: true };
    }
    return { success: true, scheduler: SpacedRepetitionScheduler.fromFirestoreData(userId, topicId, doc.data(), examType), isNew: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const recordReview = async (userId, topicId, quality) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const result = await getScheduler(userId, topicId);
    if (!result.success) return result;
    
    const scheduler = result.scheduler;
    const reviewResult = scheduler.review(quality);
    
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc(topicId);
    await ref.set(scheduler.toObject(), { merge: true });
    
    return { success: true, ...reviewResult };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getDueReviews = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const snap = await db.collection('users').doc(userId).collection(COLLECTION).get();
    const userDoc = await db.collection('users').doc(userId).get();
    const examType = userDoc.data()?.examName || 'OTHER';
    
    const schedulers = snap.docs.map(d => SpacedRepetitionScheduler.fromFirestoreData(userId, d.id, d.data(), examType));
    const due = schedulers.filter(s => s.isDue);
    const prioritized = SpacedRepetitionScheduler.prioritize(due);
    
    return { success: true, dueReviews: prioritized.map(s => s.toObject()), total: due.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getAllSchedules = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const snap = await db.collection('users').doc(userId).collection(COLLECTION).get();
    const userDoc = await db.collection('users').doc(userId).get();
    const examType = userDoc.data()?.examName || 'OTHER';
    
    const schedulers = snap.docs.map(d => SpacedRepetitionScheduler.fromFirestoreData(userId, d.id, d.data(), examType));
    return { success: true, schedules: schedulers.map(s => s.toObject()), total: schedulers.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { getScheduler, recordReview, getDueReviews, getAllSchedules };
