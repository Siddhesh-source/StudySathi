import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { aiApi } from '../utils/api';

const StudyPlan = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    if (user) fetchUserProfileAndPlan();
  }, [user]);

  const fetchUserProfileAndPlan = async () => {
    setLoading(true);
    setError('');
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }

      const data = await aiApi.getStudyPlan(user.uid);
      if (data.success && data.plan) {
        setPlan(data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load study plan');
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!userProfile) {
      setError('Please complete onboarding first');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const data = await aiApi.generateStudyPlan({
        userId: user.uid,
        examName: userProfile.examName,
        examDate: userProfile.examDate,
        subjects: userProfile.subjects,
        topics: userProfile.topics,
        weakSubjects: userProfile.weakSubjects,
        dailyStudyHours: userProfile.dailyStudyHours,
      });

      if (data.success) {
        setPlan(data);
      } else {
        setError(data.error || 'Failed to generate plan');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-4">
          <p className="text-red-500 mb-3">{error}</p>
          <button
            onClick={fetchUserProfileAndPlan}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📅</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Your Study Plan</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Generate a personalized AI-powered study plan based on your exam, subjects, and available time.
          </p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={generatePlan}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 inline-flex items-center gap-2 shadow-lg shadow-emerald-200"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Plan...
              </>
            ) : (
              <>✨ Generate My Study Plan</>
            )}
          </button>
        </div>
      </div>
    );
  }

  const { metadata, plan: planData, rawPlan } = plan;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold mb-0.5">Your Study Plan</h3>
            <p className="text-emerald-100 text-sm">{metadata?.examName}</p>
          </div>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {generating ? '...' : '🔄 Regenerate'}
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 backdrop-blur rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{metadata?.daysLeft || '—'}</div>
            <div className="text-[10px] text-emerald-100 uppercase tracking-wide">Days Left</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{metadata?.weeksLeft || '—'}</div>
            <div className="text-[10px] text-emerald-100 uppercase tracking-wide">Weeks</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{metadata?.dailyStudyHours || '—'}h</div>
            <div className="text-[10px] text-emerald-100 uppercase tracking-wide">Daily</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex">
          {[
            { id: 'daily', label: 'Daily', icon: '📆' },
            { id: 'weekly', label: 'Weekly', icon: '📋' },
            { id: 'revision', label: 'Revision', icon: '🔄' },
            { id: 'tips', label: 'Tips', icon: '💡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-3 text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 max-h-96 overflow-y-auto">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        {planData ? (
          <>
            {activeTab === 'daily' && <DailyTimetable timetable={planData.dailyTimetable} />}
            {activeTab === 'weekly' && <WeeklyPlan weeklyPlan={planData.weeklyPlan} />}
            {activeTab === 'revision' && <RevisionStrategy strategy={planData.revisionStrategy} />}
            {activeTab === 'tips' && <ExamTips tips={planData.examTips} summary={planData.summary} />}
          </>
        ) : rawPlan ? (
          <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{rawPlan}</pre>
        ) : (
          <p className="text-gray-500 text-center py-4">No plan data available</p>
        )}
      </div>
    </div>
  );
};

const DailyTimetable = ({ timetable }) => {
  if (!timetable || timetable.length === 0) {
    return <p className="text-gray-500 text-center py-4">No timetable available</p>;
  }

  return (
    <div className="space-y-2">
      {timetable.map((slot, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group">
          <div className="text-xs font-medium text-gray-400 w-20 shrink-0">{slot.time}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 text-sm truncate">{slot.subject}</div>
            <div className="text-xs text-gray-500 truncate">{slot.activity}</div>
          </div>
          <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded shrink-0">
            {slot.duration}
          </div>
        </div>
      ))}
    </div>
  );
};

const WeeklyPlan = ({ weeklyPlan }) => {
  if (!weeklyPlan || weeklyPlan.length === 0) {
    return <p className="text-gray-500 text-center py-4">No weekly plan available</p>;
  }

  return (
    <div className="space-y-3">
      {weeklyPlan.slice(0, 4).map((week, index) => (
        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm">Week {week.week}</span>
            {week.focus && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{week.focus}</span>}
          </div>
          <div className="p-3">
            {week.subjects?.slice(0, 3).map((subject, sIndex) => (
              <div key={sIndex} className="mb-2 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700 text-sm">{subject.name}</span>
                  {subject.hours && <span className="text-xs text-gray-400">{subject.hours}h</span>}
                </div>
                {subject.topics && (
                  <div className="flex flex-wrap gap-1">
                    {subject.topics.slice(0, 3).map((topic, tIndex) => (
                      <span key={tIndex} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{topic}</span>
                    ))}
                    {subject.topics.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{subject.topics.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const RevisionStrategy = ({ strategy }) => {
  if (!strategy) return <p className="text-gray-500 text-center py-4">No revision strategy available</p>;

  return (
    <div className="space-y-4">
      {strategy.daily && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2 text-sm flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs">📅</span>
            Daily Revision
          </h4>
          <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{strategy.daily}</p>
        </div>
      )}
      {strategy.weekly && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2 text-sm flex items-center gap-2">
            <span className="w-6 h-6 bg-teal-100 rounded flex items-center justify-center text-xs">📆</span>
            Weekly Revision
          </h4>
          <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{strategy.weekly}</p>
        </div>
      )}
      {strategy.sheets?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2 text-sm flex items-center gap-2">
            <span className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-xs">📝</span>
            Sheets to Prepare
          </h4>
          <ul className="space-y-1">
            {strategy.sheets.slice(0, 4).map((sheet, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-600 text-sm bg-gray-50 p-2 rounded-lg">
                <span className="text-green-500 text-xs">✓</span>{sheet}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ExamTips = ({ tips, summary }) => (
  <div className="space-y-4">
    {summary && (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
        <p className="text-green-800 text-sm font-medium">{summary}</p>
      </div>
    )}
    {tips?.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-800 mb-2 text-sm">💡 Scoring Tips</h4>
        <div className="space-y-2">
          {tips.slice(0, 5).map((tip, index) => (
            <div key={index} className="flex gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-600 font-bold text-sm">{index + 1}.</span>
              <p className="text-gray-700 text-sm">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default StudyPlan;
