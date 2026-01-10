import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

const StreakCard = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) fetchStreakData();
  }, [user]);

  const fetchStreakData = async () => {
    setError('');
    try {
      const data = await aiApi.getStreak(user.uid);
      if (data.success) {
        setStreakData(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load streak');
      console.error('Error fetching streak:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-xl shadow-lg p-5 text-white">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-white/20 rounded w-1/3"></div>
          <div className="h-12 bg-white/20 rounded w-1/4"></div>
          <div className="flex gap-2">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="w-8 h-8 bg-white/20 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-xl shadow-lg p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold flex items-center gap-2">🔥 Study Streak</h3>
            <p className="text-orange-100 text-sm mt-1">Unable to load streak data</p>
          </div>
          <button 
            onClick={fetchStreakData} 
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { currentStreak = 0, longestStreak = 0, message, streakHistory = [], studiedToday } = streakData || {};

  // Generate last 7 days for streak visualization
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'narrow' });
    const hasStreak = streakHistory.some(h => h.date === dateStr);
    const isToday = i === 0;
    last7Days.push({ date: dateStr, dayName, hasStreak, isToday });
  }

  return (
    <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-xl shadow-lg p-5 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 blur-xl"></div>

      <div className="relative">
        {/* Header Row */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">Study Streak</h3>
              <p className="text-orange-100 text-xs">Keep the fire burning!</p>
            </div>
          </div>
          {studiedToday && (
            <span className="bg-white/25 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Today
            </span>
          )}
        </div>

        {/* Streak Numbers */}
        <div className="flex items-end gap-4 mb-4">
          <div>
            <div className="text-4xl font-bold leading-none">{currentStreak}</div>
            <div className="text-orange-100 text-xs mt-0.5">day streak</div>
          </div>
          <div className="pb-1">
            <div className="text-lg font-semibold text-orange-100">{longestStreak}</div>
            <div className="text-[10px] text-orange-200">best</div>
          </div>
        </div>

        {/* Week visualization */}
        <div className="flex justify-between mb-3">
          {last7Days.map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  day.hasStreak
                    ? 'bg-white text-orange-500 shadow-lg shadow-orange-900/30'
                    : day.isToday
                    ? 'bg-white/30 text-white border-2 border-white/50 border-dashed'
                    : 'bg-white/15 text-white/50'
                }`}
              >
                {day.hasStreak ? '🔥' : day.isToday ? '?' : '○'}
              </div>
              <div className={`text-[10px] mt-1 ${day.isToday ? 'text-white font-medium' : 'text-orange-200'}`}>
                {day.dayName}
              </div>
            </div>
          ))}
        </div>

        {/* Motivational Message */}
        {message && (
          <div className="bg-white/15 backdrop-blur rounded-lg p-3">
            <p className="text-sm leading-relaxed">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakCard;
