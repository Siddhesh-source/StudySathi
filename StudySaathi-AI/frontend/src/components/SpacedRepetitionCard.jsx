import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

const SpacedRepetitionCard = () => {
  const { user } = useAuth();
  const [dueReviews, setDueReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => {
    if (user) fetchDueReviews();
  }, [user]);

  const fetchDueReviews = async () => {
    setLoading(true);
    try {
      const data = await aiApi.getDueReviews(user.uid);
      if (data.success) setDueReviews(data.dueReviews || []);
    } catch (err) {
      console.error('SRS fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (topicId, quality) => {
    try {
      const data = await aiApi.recordSRSReview({ userId: user.uid, topicId, quality });
      if (data.success) {
        setDueReviews(prev => prev.filter(r => r.topicId !== topicId));
        setReviewing(null);
      }
    } catch (err) {
      console.error('Review error:', err);
    }
  };

  if (loading) return <div className="bg-white rounded-2xl shadow p-5"><div className="animate-pulse h-20 bg-gray-100 rounded" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">🔄 Spaced Repetition</h3>
          <p className="text-gray-500 text-xs mt-0.5">SM-2 Algorithm • {dueReviews.length} due</p>
        </div>
        <button onClick={fetchDueReviews} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition">Refresh</button>
      </div>

      {dueReviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-gray-500 text-sm">All caught up! No reviews due today.</p>
        </div>
      ) : reviewing ? (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-800">{reviewing.topicId.replace(/_/g, ' ')}</div>
              <div className="text-xs text-gray-500">{reviewing.masteryLevel?.emoji} {reviewing.masteryLevel?.label}</div>
            </div>
            <div className="text-xs text-gray-500 mb-3">Interval: {reviewing.interval}d • EF: {reviewing.easinessFactor?.toFixed(2)} • Rep: {reviewing.repetitions}</div>
            <div className="text-sm text-gray-600 mb-4">How well did you recall this topic?</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { q: 0, l: 'Forgot', c: 'bg-red-100 text-red-700 hover:bg-red-200' },
                { q: 1, l: 'Hard', c: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
                { q: 2, l: 'Wrong', c: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                { q: 3, l: 'OK', c: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                { q: 4, l: 'Good', c: 'bg-green-100 text-green-700 hover:bg-green-200' },
                { q: 5, l: 'Easy', c: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
              ].map(({ q, l, c }) => (
                <button key={q} onClick={() => handleReview(reviewing.topicId, q)} className={`py-2 px-3 rounded-lg text-xs font-medium transition ${c}`}>{l}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setReviewing(null)} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700">Cancel</button>
        </div>
      ) : (
        <div className="space-y-2">
          {dueReviews.slice(0, 5).map((review) => (
            <button key={review.topicId} onClick={() => setReviewing(review)} className="w-full p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl text-left transition group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm group-hover:text-blue-700">{review.topicId.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{review.masteryLevel?.emoji} {review.masteryLevel?.label} • {review.daysUntilReview < 0 ? `${Math.abs(review.daysUntilReview)}d overdue` : 'Due today'}</div>
                </div>
                <div className="text-xs font-semibold text-gray-400 group-hover:text-blue-600">Review →</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpacedRepetitionCard;
