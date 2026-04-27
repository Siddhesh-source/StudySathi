import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

/**
 * AchievementBadges Component
 * Displays all achievements with lock/unlock status and progress bars.
 */
const CATEGORY_LABELS = {
  streak: { label: 'Streak', emoji: '🔥' },
  study_time: { label: 'Study Time', emoji: '⏱️' },
  quiz: { label: 'Quizzes', emoji: '📝' },
  notes: { label: 'Notes', emoji: '📓' },
  social: { label: 'Social', emoji: '👥' },
  milestone: { label: 'Milestones', emoji: '🏅' },
};

const AchievementBadges = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);

  useEffect(() => {
    if (user) fetchAchievements();
  }, [user]);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const data = await aiApi.getAchievements(user.uid);
      if (data.success) {
        setAchievements(data.achievements || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Achievement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async () => {
    try {
      const data = await aiApi.checkAchievements(user.uid);
      if (data.success && data.newlyUnlocked?.length > 0) {
        setNewlyUnlocked(data.newlyUnlocked);
        fetchAchievements();
        setTimeout(() => setNewlyUnlocked([]), 5000);
      }
    } catch (err) {
      console.error('Achievement check error:', err);
    }
  };

  const filtered = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeCategory);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            🏆 Achievements
          </h3>
          {stats && (
            <p className="text-gray-500 text-xs mt-0.5">
              {stats.unlocked}/{stats.total} unlocked ({stats.percentage}%)
            </p>
          )}
        </div>
        <button
          onClick={checkAchievements}
          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition"
        >
          🔄 Sync
        </button>
      </div>

      {/* Newly unlocked celebration banner */}
      {newlyUnlocked.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 animate-bounce">
          <p className="text-yellow-800 font-semibold text-sm text-center">
            🎉 New Achievement{newlyUnlocked.length > 1 ? 's' : ''} Unlocked!{' '}
            {newlyUnlocked.map(a => `${a.emoji} ${a.title}`).join(', ')}
          </p>
        </div>
      )}

      {/* Overall progress bar */}
      {stats && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Overall Progress</span>
            <span>{stats.percentage}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
            activeCategory === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, { label, emoji }]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
              activeCategory === key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((achievement) => (
          <div
            key={achievement.id}
            className={`relative rounded-xl p-3 border transition-all ${
              achievement.unlocked
                ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-sm'
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            {/* Unlock indicator */}
            {achievement.unlocked && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            <div className={`text-2xl mb-1.5 ${!achievement.unlocked ? 'grayscale' : ''}`}>
              {achievement.unlocked ? achievement.emoji : '🔒'}
            </div>
            <div className={`text-xs font-semibold leading-tight ${achievement.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
              {achievement.title}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{achievement.description}</div>

            {/* Progress bar for locked achievements */}
            {!achievement.unlocked && achievement.progress !== null && achievement.progress > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all"
                    style={{ width: `${Math.round(achievement.progress * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{Math.round(achievement.progress * 100)}%</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">🏅</div>
          <p className="text-sm">No achievements in this category yet</p>
        </div>
      )}
    </div>
  );
};

export default AchievementBadges;
