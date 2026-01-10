const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error. Please check your connection.', 0, null);
    }
  },

  async post(endpoint, body) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return handleResponse(response);
    } catch (error) {
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
};

export { ApiError };
export default api;
