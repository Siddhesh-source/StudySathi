const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Log API configuration on load
console.log('🔧 API Configuration:', {
  url: API_URL,
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV
});

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new ApiError(
      data.error || data.message || 'Request failed',
      response.status,
      data
    );
  }
  
  return data;
};

const api = {
  async get(endpoint) {
    const url = `${API_URL}${endpoint}`;
    console.log(`📡 GET ${url}`);
    try {
      const response = await fetch(url);
      return handleResponse(response);
    } catch (error) {
      console.error(`❌ GET ${url} failed:`, error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error. Please check your connection.', 0, null);
    }
  },

  async post(endpoint, body) {
    const url = `${API_URL}${endpoint}`;
    console.log(`📡 POST ${url}`, { bodyKeys: Object.keys(body || {}) });
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`❌ POST ${url} failed:`, error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error. Please check your connection.', 0, null);
    }
  },
};

// API endpoints
export const aiApi = {
  // Study Plan
  getStudyPlan: (userId) => api.get(`/api/ai/study-plan/${userId}`),
  generateStudyPlan: (data) => api.post('/api/ai/study-plan', data),
  adjustStudyPlan: (userId) => api.post('/api/ai/study-plan/adjust', { userId }),

  // Smart Learning
  generateLearning: (data) => api.post('/api/ai/smart-learning', data),

  // Ask Doubt
  askDoubt: (data) => api.post('/api/ai/ask-doubt', data),
  getSmartSuggestions: (data) => api.post('/api/ai/smart-suggestions', data),
  
  // Popular Topics
  getPopularTopics: (data) => api.post('/api/ai/popular-topics', data),

  // Notes
  saveNote: (data) => api.post('/api/ai/notes', data),
  getNotes: (userId) => api.get(`/api/ai/notes/${userId}`),

  // Topic Tracking
  trackTime: (data) => api.post('/api/ai/track/time', data),
  updateConfidence: (data) => api.post('/api/ai/track/confidence', data),
  getProgress: (userId, subject) => 
    api.get(`/api/ai/track/progress/${userId}${subject ? `?subject=${subject}` : ''}`),
  getRecommendations: (userId) => api.get(`/api/ai/track/recommendations/${userId}`),

  // Streak
  getStreak: (userId) => api.get(`/api/ai/streak/${userId}`),
  updateStreak: (userId) => api.post('/api/ai/streak/update', { userId }),

  // ── NEW: Sessions ──────────────────────────────────────────────
  startSession: (data) => api.post('/api/ai/session/start', data),
  endSession: (data) => api.post('/api/ai/session/end', data),
  addNoteToSession: (data) => api.post('/api/ai/session/note', data),
  getSessions: (userId, subject) =>
    api.get(`/api/ai/session/${userId}${subject ? `?subject=${subject}` : ''}`),
  getSessionStats: (userId) => api.get(`/api/ai/session/stats/${userId}`),

  // ── NEW: Achievements ─────────────────────────────────────────
  getAchievements: (userId) => api.get(`/api/ai/achievements/${userId}`),
  checkAchievements: (userId) => api.post('/api/ai/achievements/check', { userId }),

  // ── NEW: Leaderboard ─────────────────────────────────────────
  getLeaderboard: (limit = 10) => api.get(`/api/ai/leaderboard?limit=${limit}`),

  // ── NEW: Mind Map ─────────────────────────────────────────────
  generateMindMap: (data) => api.post('/api/ai/mindmap', data),

  // ── NEW: Daily Challenge ─────────────────────────────────────
  generateDailyChallenge: (data) => api.post('/api/ai/daily-challenge', data),

  // ── RESEARCH FEATURES ─────────────────────────────────────────
  // Spaced Repetition (SM-2)
  recordSRSReview: (data) => api.post('/api/ai/srs/review', data),
  getDueReviews: (userId) => api.get(`/api/ai/srs/due/${userId}`),
  getAllSRSSchedules: (userId) => api.get(`/api/ai/srs/all/${userId}`),

  // IRT Calibration
  recordIRTResponse: (data) => api.post('/api/ai/irt/response', data),
  getIRTAbility: (userId) => api.get(`/api/ai/irt/ability/${userId}`),

  // Knowledge Graph
  getKnowledgeGraph: (userId, examKey) => api.get(`/api/ai/graph/${userId}${examKey ? `?examKey=${examKey}` : ''}`),
  getUnlockedTopics: (userId) => api.get(`/api/ai/graph/unlocked/${userId}`),
  getStudyOrder: (userId) => api.get(`/api/ai/graph/order/${userId}`),
  getLearningPath: (userId, from, to) => api.get(`/api/ai/graph/path/${userId}?from=${from}&to=${to}`),

  // Learning Analytics
  getAnalyticsReport: (userId, totalPlannedTopics) => 
    api.get(`/api/ai/analytics/${userId}${totalPlannedTopics ? `?totalPlannedTopics=${totalPlannedTopics}` : ''}`),
  getCognitiveLoad: (userId) => api.get(`/api/ai/analytics/cognitive/${userId}`),

  // A/B Experiments
  assignExperiment: (data) => api.post('/api/ai/experiment/assign', data),
  getExperimentAssignments: (userId) => api.get(`/api/ai/experiment/assignments/${userId}`),
  recordExperimentOutcome: (data) => api.post('/api/ai/experiment/outcome', data),
  analyzeExperiment: (experimentId, metric) => 
    api.get(`/api/ai/experiment/analyze?experimentId=${experimentId}&metric=${metric}`),

  // PYQ Tests
  createPYQTest: (data) => api.post('/api/ai/pyq/create', data),
  startPYQTest: (data) => api.post('/api/ai/pyq/start', data),
  recordPYQResponse: (data) => api.post('/api/ai/pyq/response', data),
  submitPYQTest: (data) => api.post('/api/ai/pyq/submit', data),
  getPYQInsights: (userId, testId) => api.get(`/api/ai/pyq/insights/${userId}/${testId}`),
  getPYQExplanations: (data) => api.post('/api/ai/pyq/explanations', data),
  getPYQTests: (userId) => api.get(`/api/ai/pyq/tests/${userId}`),
};

export { ApiError };
export default api;
