const { db } = require('../config/firebase');
const { KnowledgeGraph } = require('../models/KnowledgeGraph');

const COLLECTION = 'knowledgeGraphs';

const getGraph = async (userId, examKey = null) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    if (examKey) {
      const graph = KnowledgeGraph.buildFromExam(examKey);
      return { success: true, graph: graph.toObject(), source: 'built-in' };
    }
    
    const ref = db.collection('users').doc(userId).collection(COLLECTION).doc('current');
    const doc = await ref.get();
    
    if (!doc.exists) {
      const userDoc = await db.collection('users').doc(userId).get();
      const examName = userDoc.data()?.examName;
      const examKey = examName ? `${examName.toUpperCase()}_PHYSICS` : null;
      if (examKey && KnowledgeGraph.BUILT_IN_GRAPHS[examKey]) {
        const graph = KnowledgeGraph.buildFromExam(examKey);
        return { success: true, graph: graph.toObject(), source: 'built-in' };
      }
      return { success: true, graph: new KnowledgeGraph().toObject(), source: 'empty' };
    }
    
    const graph = KnowledgeGraph.buildFromData(doc.data());
    return { success: true, graph: graph.toObject(), source: 'custom' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getUnlockedTopics = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const graphResult = await getGraph(userId);
    if (!graphResult.success) return graphResult;
    
    const graph = KnowledgeGraph.buildFromData(graphResult.graph);
    const progressSnap = await db.collection('users').doc(userId).collection('topicProgress').get();
    const masteredIds = progressSnap.docs
      .filter(d => d.data().strengthLabel === 'strong')
      .map(d => d.id);
    
    const unlocked = graph.getUnlockedTopics(masteredIds);
    return { success: true, unlocked: unlocked.map(n => n.toObject()), masteredCount: masteredIds.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getStudyOrder = async (userId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const graphResult = await getGraph(userId);
    if (!graphResult.success) return graphResult;
    
    const graph = KnowledgeGraph.buildFromData(graphResult.graph);
    const order = graph.getStudyOrder();
    return { success: true, studyOrder: order.map(n => n.toObject()) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getLearningPath = async (userId, fromTopicId, toTopicId) => {
  if (!db) return { success: false, error: 'Database not configured' };
  try {
    const graphResult = await getGraph(userId);
    if (!graphResult.success) return graphResult;
    
    const graph = KnowledgeGraph.buildFromData(graphResult.graph);
    const path = graph.getLearningPath(fromTopicId, toTopicId);
    return { success: true, path: path ? path.map(n => n.toObject()) : null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { getGraph, getUnlockedTopics, getStudyOrder, getLearningPath };
