import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

const TopicProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
  const [activeSubject, setActiveSubject] = useState('all');
  const [showConfidenceModal, setShowConfidenceModal] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) fetchProgress();
  }, [user]);

  const fetchProgress = async () => {
    setError('');
    try {
      const data = await aiApi.getProgress(user.uid);
      if (data.success) {
        setProgress(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load progress');
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustPlan = async () => {
    setAdjusting(true);
    try {
      const data = await aiApi.adjustStudyPlan(user.uid);
      if (data.success) {
        alert('Study plan adjusted based on your progress!');
        window.location.reload();
      }
    } catch (err) {
      alert(err.message || 'Failed to adjust plan');
      console.error('Error adjusting plan:', err);
    } finally {
      setAdjusting(false);
    }
  };

  const handleUpdateConfidence = async (subject, topic, confidence) => {
    try {
      await aiApi.updateConfidence({ userId: user.uid, subject, topic, confidence });
      setShowConfidenceModal(null);
      fetchProgress();
    } catch (err) {
      console.error('Error updating confidence:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-4">
          <p className="text-red-500 mb-3">{error}</p>
          <button
            onClick={fetchProgress}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const topics = progress?.topics || [];
  const grouped = progress?.grouped || { strong: [], medium: [], weak: [] };
  const subjects = [...new Set(topics.map(t => t.subject))];

  const filteredTopics = activeSubject === 'all' 
    ? topics 
    : topics.filter(t => t.subject === activeSubject);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white">
              📊
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Topic Progress</h3>
              <p className="text-sm text-gray-500">Track your strength across topics</p>
            </div>
          </div>
          
          {topics.length > 0 && (
            <button
              onClick={handleAdjustPlan}
              disabled={adjusting}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition disabled:opacity-50 flex items-center gap-2"
            >
              {adjusting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Adjusting...
                </>
              ) : (
                <>🔄 Auto-Adjust Plan</>
              )}
            </button>
          )}
        </div>

        {/* Summary Stats */}
        {topics.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{grouped.strong.length}</div>
              <div className="text-xs text-green-600">Strong</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{grouped.medium.length}</div>
              <div className="text-xs text-amber-600">Medium</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{grouped.weak.length}</div>
              <div className="text-xs text-red-600">Weak</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        {topics.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📈</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">No Progress Yet</h4>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Start learning topics in Smart Learning Room to track your progress and get personalized recommendations.
            </p>
          </div>
        ) : (
          <>
            {/* Subject Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setActiveSubject('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  activeSubject === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({topics.length})
              </button>
              {subjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => setActiveSubject(subject)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    activeSubject === subject
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTopics.slice(0, 6).map(topic => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onUpdateConfidence={() => setShowConfidenceModal(topic)}
                />
              ))}
            </div>

            {filteredTopics.length > 6 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                +{filteredTopics.length - 6} more topics
              </p>
            )}
          </>
        )}
      </div>

      {/* Confidence Update Modal */}
      {showConfidenceModal && (
        <ConfidenceModal
          topic={showConfidenceModal}
          onClose={() => setShowConfidenceModal(null)}
          onUpdate={handleUpdateConfidence}
        />
      )}
    </div>
  );
};

const TopicCard = ({ topic, onUpdateConfidence }) => {
  const strengthColors = {
    strong: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
    weak: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500' },
  };

  const strengthLabel = topic.strengthLabel || 'weak';
  const colors = strengthColors[strengthLabel];

  return (
    <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-sm transition`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate">{topic.topic}</p>
          <p className="text-xs text-gray-500">{topic.subject}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.text} bg-white/50`}>
          {strengthLabel.charAt(0).toUpperCase() + strengthLabel.slice(1)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${colors.bar}`}
            style={{ width: `${topic.strengthScore || 0}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex gap-3">
          <span>⏱️ {topic.timeSpentMinutes || 0}m</span>
          <span>📝 {topic.notesCount || 0}</span>
        </div>
        <button
          onClick={onUpdateConfidence}
          className={`${colors.text} hover:underline font-medium`}
        >
          Update
        </button>
      </div>
    </div>
  );
};

const ConfidenceModal = ({ topic, onClose, onUpdate }) => {
  const [confidence, setConfidence] = useState(topic.confidence || 3);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Update Confidence</h3>
        <p className="text-gray-500 text-sm mb-4">
          How confident are you in <strong className="text-gray-800">{topic.topic}</strong>?
        </p>

        <div className="flex gap-2 mb-2">
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              onClick={() => setConfidence(level)}
              className={`flex-1 py-3 rounded-xl font-medium transition ${
                confidence === level
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mb-6">
          <span>Need help</span>
          <span>Very confident</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpdate(topic.subject, topic.topic, confidence)}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicProgress;
