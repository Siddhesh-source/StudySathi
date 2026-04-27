const { db } = require('../config/firebase');
const { ExperimentManager } = require('../models/ExperimentManager');

const COLLECTION = 'experiments';

const getExperimentManager = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc('current');
    const doc = await ref.get();
    
    if (!doc.exists) {
      return { success: true, manager: new ExperimentManager(userId), isNew: true };
    }
    return { success: true, manager: ExperimentManager.fromFirestoreData(userId, doc.data()), isNew: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const assignVariant = async (userId, experimentId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const result = await getExperimentManager(userId);
    if (!result.success) return result;
    
    const manager = result.manager;
    const variant = manager.getVariantConfig(experimentId);
    
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc('current');
    await ref.set(manager.toObject(), { merge: true });
    
    return { success: true, variant };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getAllAssignments = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const result = await getExperimentManager(userId);
    if (!result.success) return result;
    
    const manager = result.manager;
    const assignments = manager.getAllAssignments();
    
    return { success: true, assignments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const recordOutcome = async (userId, experimentId, metric, value) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const result = await getExperimentManager(userId);
    if (!result.success) return result;
    
    const manager = result.manager;
    const recorded = manager.recordOutcome(experimentId, metric, value);
    
    if (recorded) {
      const ref = db.collection('users').doc(userId).collection(COLLECTION).doc('current');
      await ref.set(manager.toObject(), { merge: true });
    }
    
    return { success: true, recorded };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const analyzeExperiment = async (experimentId, metric) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const snap = await db.collectionGroup(COLLECTION).get();
    const allOutcomes = snap.docs.flatMap(d => d.data().outcomes || []);
    
    const analysis = ExperimentManager.analyzeExperiment(allOutcomes, experimentId, metric);
    return { success: true, analysis };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { getExperimentManager, assignVariant, getAllAssignments, recordOutcome, analyzeExperiment };
