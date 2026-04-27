const { db } = require('../config/firebase');
const { IRTCalibrator } = require('../models/IRTCalibrator');

const COLLECTION = 'irtCalibration';

const getCalibrator = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc('current');
    const doc = await ref.get();
    
    if (!doc.exists) {
      return { success: true, calibrator: new IRTCalibrator(userId), isNew: true };
    }
    return { success: true, calibrator: IRTCalibrator.fromFirestoreData(userId, doc.data()), isNew: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const recordQuizResponse = async (userId, itemId, correct, itemParams = {}) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const result = await getCalibrator(userId);
    if (!result.success) return result;
    
    const calibrator = result.calibrator;
    const responseResult = calibrator.recordResponse(itemId, correct, itemParams);
    
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc('current');
    await ref.set(calibrator.toObject(), { merge: true });
    
    return { success: true, ...responseResult };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getAbilityEstimate = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const result = await getCalibrator(userId);
    if (!result.success) return result;
    
    const calibrator = result.calibrator;
    return {
      success: true,
      theta: calibrator.theta,
      thetaSE: calibrator.thetaSE,
      abilityScore: calibrator.abilityScore,
      abilityLabel: calibrator.abilityLabel,
      nextDifficulty: calibrator.getNextItemDifficulty(),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { getCalibrator, recordQuizResponse, getAbilityEstimate };
