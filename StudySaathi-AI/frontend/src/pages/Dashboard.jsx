import { useState, useEffect, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../firebase/auth';
import { aiApi } from '../utils/api';
import SmartLearningRoom from '../components/SmartLearningRoom';
import QuickDoubt from '../components/QuickDoubt';

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
          <p className="text-red-600 text-sm mb-4">{this.state.error?.message || 'An error occurred'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [streakData, setStreakData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [studyPlan, setStudyPlan] = useState(null);
  const [progress, setProgress] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchAllData(); }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [streakRes, recsRes, planRes, progressRes, notesRes] = await Promise.allSettled([
        aiApi.getStreak(user.uid), aiApi.getRecommendations(user.uid),
        aiApi.getStudyPlan(user.uid), aiApi.getProgress(user.uid),
        aiApi.getNotes(user.uid),
      ]);
      if (streakRes.status === 'fulfilled' && streakRes.value.success) setStreakData(streakRes.value);
      if (recsRes.status === 'fulfilled' && recsRes.value.success) setRecommendations(recsRes.value.recommendations?.slice(0, 5) || []);
      if (planRes.status === 'fulfilled' && planRes.value.success) setStudyPlan(planRes.value);
      if (progressRes.status === 'fulfilled' && progressRes.value.success) setProgress(progressRes.value);
      if (notesRes.status === 'fulfilled') {
        console.log('Notes fetch result:', notesRes.value);
        if (notesRes.value.success) setNotes(notesRes.value.notes || []);
      } else {
        console.error('Notes fetch failed:', notesRes.reason);
      }
    } catch (err) { console.error('Error fetching data:', err); }
    finally { setLoading(false); }
  };

  const fetchNotes = async () => {
    console.log('[DEBUG] fetchNotes called');
    try {
      console.log('[DEBUG] Fetching notes for user:', user?.uid);
      if (!user?.uid) {
        console.error('[DEBUG] No user ID available');
        return;
      }
      const res = await aiApi.getNotes(user.uid);
      console.log('[DEBUG] Notes response:', res);
      if (res && res.success) {
        console.log('[DEBUG] Setting notes:', res.notes?.length || 0, 'notes');
        setNotes(res.notes || []);
      } else {
        console.error('[DEBUG] Notes fetch unsuccessful:', res);
      }
    } catch (err) { 
      console.error('[DEBUG] Error fetching notes:', err); 
    }
  };

  const handleLogout = async () => { try { await logOut(); navigate('/login'); } catch (e) { console.error('Logout error:', e); } };

  const daysUntilExam = userProfile?.examDate ? Math.ceil((new Date(userProfile.examDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  return (
    <div className="min-h-screen">
      {/* Sidebar - Warm & Inviting */}
      <aside className="fixed left-0 top-0 h-full w-14 lg:w-60 bg-gradient-to-b from-stone-50 to-orange-50/30 border-r border-stone-200/60 z-30 flex flex-col">
        <div className="p-3 lg:p-4 border-b border-stone-200/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
              <span className="text-white text-base">📚</span>
            </div>
            <span className="hidden lg:block font-display font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-lg tracking-tight">StudySaathi</span>
          </div>
        </div>
        <nav className="flex-1 p-2 lg:p-3 space-y-0.5">
          <NavItem icon="🏠" label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon="🧠" label="Smart Learn" active={activeTab === 'learn'} onClick={() => setActiveTab('learn')} />
          <NavItem icon="💬" label="Ask Doubt" active={activeTab === 'doubt'} onClick={() => setActiveTab('doubt')} />
          <NavItem icon="📝" label="My Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
          <NavItem icon="📊" label="Progress" active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
          <NavItem icon="📅" label="Study Plan" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
        </nav>
        <div className="p-2 lg:p-3 border-t border-stone-200/40">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/60 cursor-pointer transition-all" onClick={handleLogout}>
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-md shadow-orange-400/25">
              {(user?.displayName || user?.email || 'S')[0].toUpperCase()}
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-700 truncate">{user?.displayName || 'Student'}</p>
              <p className="text-xs text-stone-400 font-medium">Sign out</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-14 lg:ml-60 min-h-screen">
        <header className="sticky top-0 glass border-b border-stone-200/40 z-20 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-400 text-xs font-medium uppercase tracking-wide">{getGreeting()}</p>
              <h1 className="text-lg font-display font-bold text-stone-800 tracking-tight">{user?.displayName || 'Student'}</h1>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              {streakData && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-full shadow-sm">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-semibold text-amber-700">{streakData.currentStreak || 0}d</span>
                </div>
              )}
              {daysUntilExam && daysUntilExam > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 rounded-full shadow-sm">
                  <span className="text-sm">📅</span>
                  <span className="text-xs font-semibold text-indigo-700">{daysUntilExam}d to {userProfile?.examName}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {activeTab === 'home' && <HomeTab onStartLearning={() => setActiveTab('learn')} onAskDoubt={() => setActiveTab('doubt')} recommendations={recommendations} userProfile={userProfile} streakData={streakData} loading={loading} />}
          {activeTab === 'learn' && <LearnTab onEndSession={() => setActiveTab('home')} />}
          {activeTab === 'doubt' && <DoubtTab userProfile={userProfile} />}
          {activeTab === 'notes' && <ErrorBoundary><NotesTab notes={notes} loading={loading} onRefresh={fetchNotes} /></ErrorBoundary>}
          {activeTab === 'progress' && <ProgressTab progress={progress} loading={loading} onRefresh={fetchAllData} />}
          {activeTab === 'plan' && <PlanTab studyPlan={studyPlan} userProfile={userProfile} loading={loading} onRefresh={fetchAllData} />}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200 ${active ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 text-indigo-700 shadow-sm border border-indigo-100/60' : 'text-stone-500 hover:bg-white/60 hover:text-stone-700'}`}>
    <span className="text-base">{icon}</span>
    <span className="hidden lg:block font-medium text-sm">{label}</span>
  </button>
);

// Home Tab - Overview with quick actions
const HomeTab = ({ onStartLearning, onAskDoubt, recommendations, userProfile, streakData, loading }) => (
  <div className="space-y-6 animate-fadeIn">
    {/* Hero CTA - Rich gradient with premium shadow */}
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden hero-shadow">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white rounded-full blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-yellow-300 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-pink-300 rounded-full blur-2xl"></div>
      </div>
      <div className="relative">
        <h2 className="font-display text-xl lg:text-2xl font-bold mb-2 tracking-tight">Ready to learn?</h2>
        <p className="text-indigo-100 text-sm mb-5 max-w-md">Jump into Smart Learning Room and master any topic with AI-powered explanations.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={onStartLearning} className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold text-sm btn-lift shadow-lg hover:shadow-xl flex items-center gap-2">
            <span>🧠</span> Start Learning
          </button>
          <button onClick={onAskDoubt} className="px-5 py-2.5 bg-white/15 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/25 transition-all flex items-center gap-2 border border-white/20 btn-lift">
            <span>💬</span> Quick Doubt
          </button>
        </div>
      </div>
    </div>

    {/* Quick Stats - Colorful but soft with increased spacing */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon="🔥" label="Streak" value={`${streakData?.currentStreak || 0}d`} color="amber" />
      <StatCard icon="📚" label="Subjects" value={userProfile?.subjects?.length || 0} color="indigo" />
      <StatCard icon="⏰" label="Daily Goal" value={`${userProfile?.dailyStudyHours || 0}h`} color="emerald" />
      <StatCard icon="🏆" label="Best" value={`${streakData?.longestStreak || 0}d`} color="rose" />
    </div>

    {/* Two Column Layout with increased gap */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Recommended Topics */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 card-shadow">
        <h3 className="font-display font-semibold text-stone-800 flex items-center gap-2 mb-4 text-sm">
          <span className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-sm shadow-sm">🎯</span> Focus Today
        </h3>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse h-14 bg-stone-100 rounded-xl"></div>)}</div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-2.5">
            {recommendations.map((rec, i) => (
              <button key={i} onClick={onStartLearning} className={`w-full p-3 rounded-xl text-left topic-card border ${rec.priority === 'high' ? 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200/60' : rec.priority === 'medium' ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200/60'}`}>
                <div className="flex justify-between items-center">
                  <div><p className="font-medium text-stone-700 text-sm">{rec.topic}</p><p className="text-xs text-stone-400 mt-0.5">{rec.subject} • {rec.reason}</p></div>
                  <span className="text-xs font-semibold text-stone-500 bg-white/90 px-2.5 py-1 rounded-full border border-stone-100 shadow-sm">{rec.suggestedTime}m</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-stone-400 text-sm mb-3">Start learning to get recommendations</p>
            <button onClick={onStartLearning} className="text-indigo-600 text-sm font-medium hover:underline">Begin your first topic →</button>
          </div>
        )}
      </div>

      {/* Your Subjects */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 card-shadow">
        <h3 className="font-display font-semibold text-stone-800 flex items-center gap-2 mb-4 text-sm">
          <span className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-sm shadow-sm">📖</span> Your Subjects
        </h3>
        {userProfile?.subjects?.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {userProfile.subjects.map((subject, i) => (
              <button key={i} onClick={onStartLearning} className="p-3.5 bg-gradient-to-br from-stone-50 to-stone-100/50 hover:from-indigo-50 hover:to-purple-50 border border-stone-200/60 hover:border-indigo-200 rounded-xl text-left topic-card group">
                <p className="font-medium text-stone-600 group-hover:text-indigo-700 text-sm">{subject}</p>
                <p className="text-xs text-stone-400 mt-1">Click to learn</p>
              </button>
            ))}
          </div>
        ) : <p className="text-stone-400 text-sm text-center py-8">No subjects configured</p>}
      </div>
    </div>

    {streakData?.message && (
      <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/60 rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-2.5"><span className="text-lg">💪</span><p className="text-stone-600 text-sm">{streakData.message}</p></div>
      </div>
    )}
  </div>
);

// Learn Tab - Embedded Smart Learning Room
const LearnTab = ({ onEndSession }) => (
  <div className="animate-fadeIn">
    <SmartLearningRoom embedded={true} onEndSession={onEndSession} />
  </div>
);

// Doubt Tab - Embedded Ask Doubt
const DoubtTab = ({ userProfile }) => {
  // Generate dynamic example questions based on user's subjects
  const getExampleQuestions = () => {
    const subjects = userProfile?.subjects || [];
    const examples = [];
    
    subjects.forEach(subj => {
      const subjectLower = subj.toLowerCase();
      if (subjectLower.includes('physics')) {
        examples.push(`"Explain electromagnetic induction with examples"`, `"Derive the equation for projectile motion"`);
      } else if (subjectLower.includes('chemistry')) {
        examples.push(`"What is hybridization in ${subj}?"`, `"Explain the mechanism of SN1 reaction"`);
      } else if (subjectLower.includes('math')) {
        examples.push(`"How to solve definite integrals?"`, `"Explain the concept of limits"`);
      } else if (subjectLower.includes('biology')) {
        examples.push(`"Explain the process of photosynthesis"`, `"What is DNA replication?"`);
      } else if (subjectLower.includes('history')) {
        examples.push(`"Causes of the French Revolution"`, `"Impact of World War II"`);
      } else if (subjectLower.includes('economics')) {
        examples.push(`"Explain supply and demand curves"`, `"What is GDP and how is it calculated?"`);
      } else if (subjectLower.includes('english')) {
        examples.push(`"Explain the theme of the poem"`, `"How to write a good essay introduction?"`);
      } else if (subjectLower.includes('geography')) {
        examples.push(`"Explain plate tectonics"`, `"What causes monsoons in India?"`);
      } else {
        examples.push(`"Explain key concepts in ${subj}"`);
      }
    });
    
    return [...new Set(examples)].slice(0, 3);
  };

  // Generate dynamic tips based on exam
  const getTips = () => {
    const examName = userProfile?.examName || '';
    const tips = [
      { text: 'Be specific about the topic', icon: '✓' },
      { text: `Mention your exam${examName ? ` (${examName})` : ''}`, icon: '✓' },
      { text: 'Ask one concept at a time', icon: '✓' },
    ];
    
    if (examName.toLowerCase().includes('jee')) {
      tips.push({ text: 'Ask for numerical problem strategies', icon: '✓' });
    } else if (examName.toLowerCase().includes('neet')) {
      tips.push({ text: 'Ask for diagram explanations', icon: '✓' });
    } else if (examName.toLowerCase().includes('upsc')) {
      tips.push({ text: 'Ask for current affairs connections', icon: '✓' });
    }
    
    return tips.slice(0, 4);
  };

  const exampleQuestions = getExampleQuestions();
  const tips = getTips();

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-stone-800 tracking-tight">Ask a Doubt</h2>
          <p className="text-stone-400 text-xs">Get instant AI-powered explanations</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-[550px]"><QuickDoubt embedded={true} /></div>
        <div className="space-y-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-4 card-shadow">
            <h4 className="font-display font-semibold text-stone-700 mb-3 flex items-center gap-2 text-sm">
              <span className="w-7 h-7 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-xs shadow-sm">💡</span>
              Tips for Better Answers
            </h4>
            <ul className="space-y-2 text-xs text-stone-500">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2"><span className="text-emerald-500 font-bold">{tip.icon}</span>{tip.text}</li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-2xl border border-indigo-200/60 p-4 card-shadow">
            <h4 className="font-display font-semibold text-stone-700 mb-3 flex items-center gap-2 text-sm">
              <span className="w-7 h-7 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-xs shadow-sm">📝</span>
              Example Questions
            </h4>
            <ul className="space-y-2 text-xs text-stone-600">
              {exampleQuestions.map((q, i) => (
                <li key={i} className="p-2.5 bg-white/70 rounded-xl border border-white shadow-sm">{q}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colors = { 
    amber: 'from-amber-50 to-orange-50 border-amber-200/60 text-amber-700', 
    indigo: 'from-indigo-50 to-purple-50 border-indigo-200/60 text-indigo-700', 
    emerald: 'from-emerald-50 to-teal-50 border-emerald-200/60 text-emerald-700', 
    rose: 'from-rose-50 to-pink-50 border-rose-200/60 text-rose-700' 
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl border p-4 card-shadow topic-card`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-xs text-stone-400 font-medium">{label}</p>
          <p className="font-display font-bold text-stone-700 text-base">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Progress Tab - Clean design with Google Charts
const ProgressTab = ({ progress, loading, onRefresh }) => {
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  
  const topics = progress?.topics || [];
  const grouped = progress?.grouped || { strong: [], medium: [], weak: [] };
  
  // Calculate statistics
  const totalTopics = topics.length;
  const totalTimeMinutes = topics.reduce((sum, t) => sum + (t.timeSpentMinutes || 0), 0);
  const totalHours = Math.floor(totalTimeMinutes / 60);
  const remainingMinutes = totalTimeMinutes % 60;
  const avgConfidence = topics.length > 0 
    ? (topics.reduce((sum, t) => sum + (t.confidence || 3), 0) / topics.length).toFixed(1)
    : 0;
  const avgStrength = topics.length > 0
    ? Math.round(topics.reduce((sum, t) => sum + (t.strengthScore || 0), 0) / topics.length)
    : 0;
  
  // Group by subject
  const subjectStats = {};
  topics.forEach(topic => {
    const subj = topic.subject || 'Other';
    if (!subjectStats[subj]) {
      subjectStats[subj] = { topics: [], totalTime: 0, avgStrength: 0, strong: 0, medium: 0, weak: 0 };
    }
    subjectStats[subj].topics.push(topic);
    subjectStats[subj].totalTime += topic.timeSpentMinutes || 0;
    if (topic.strengthLabel === 'strong') subjectStats[subj].strong++;
    else if (topic.strengthLabel === 'medium') subjectStats[subj].medium++;
    else subjectStats[subj].weak++;
  });
  
  // Calculate avg strength per subject
  Object.keys(subjectStats).forEach(subj => {
    const subjTopics = subjectStats[subj].topics;
    subjectStats[subj].avgStrength = subjTopics.length > 0
      ? Math.round(subjTopics.reduce((sum, t) => sum + (t.strengthScore || 0), 0) / subjTopics.length)
      : 0;
  });

  // Load Google Charts
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.charts) {
      window.google.charts.load('current', { packages: ['corechart'] });
      window.google.charts.setOnLoadCallback(() => setChartsLoaded(true));
    }
  }, []);

  // Draw charts when data changes
  useEffect(() => {
    if (!chartsLoaded || totalTopics === 0) return;

    // Draw Pie Chart for strength distribution
    if (pieChartRef.current && window.google) {
      const pieData = window.google.visualization.arrayToDataTable([
        ['Strength', 'Count'],
        ['Strong (≥70%)', grouped.strong.length],
        ['Medium (40-69%)', grouped.medium.length],
        ['Needs Work (<40%)', grouped.weak.length]
      ]);
      
      const pieOptions = {
        pieHole: 0.4,
        colors: ['#10b981', '#6366f1', '#a855f7'],
        legend: { position: 'bottom', textStyle: { color: '#78716c', fontSize: 12 } },
        chartArea: { width: '90%', height: '75%' },
        backgroundColor: 'transparent',
        pieSliceTextStyle: { color: '#fff', fontSize: 12 },
        tooltip: { textStyle: { fontSize: 12 } }
      };
      
      const pieChart = new window.google.visualization.PieChart(pieChartRef.current);
      pieChart.draw(pieData, pieOptions);
    }

    // Draw Bar Chart for subject progress
    if (barChartRef.current && window.google && Object.keys(subjectStats).length > 0) {
      const barDataArray = [['Subject', 'Strength %', { role: 'style' }, { role: 'annotation' }]];
      Object.entries(subjectStats).forEach(([subject, stats]) => {
        const color = stats.avgStrength >= 70 ? '#10b981' : stats.avgStrength >= 40 ? '#6366f1' : '#a855f7';
        barDataArray.push([subject, stats.avgStrength, color, `${stats.avgStrength}%`]);
      });
      
      const barData = window.google.visualization.arrayToDataTable(barDataArray);
      
      const barOptions = {
        legend: { position: 'none' },
        chartArea: { width: '70%', height: '80%' },
        backgroundColor: 'transparent',
        hAxis: { 
          minValue: 0, 
          maxValue: 100,
          textStyle: { color: '#64748b', fontSize: 11 },
          gridlines: { color: '#e2e8f0' }
        },
        vAxis: { 
          textStyle: { color: '#334155', fontSize: 12 }
        },
        annotations: { textStyle: { fontSize: 11, color: '#fff' } },
        bar: { groupWidth: '60%' }
      };
      
      const barChart = new window.google.visualization.BarChart(barChartRef.current);
      barChart.draw(barData, barOptions);
    }
  }, [chartsLoaded, totalTopics, grouped, subjectStats]);

  // Format time
  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse h-20 bg-slate-100 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-stone-800 tracking-tight">Your Progress</h2>
          <p className="text-stone-400 text-xs">Track your learning journey</p>
        </div>
        <button 
          onClick={onRefresh} 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors btn-lift"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Quick Stats - Compact cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-4 card-shadow topic-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-lg">📚</span>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Topics</p>
              <p className="font-display text-lg font-bold text-stone-700">{totalTopics}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-4 card-shadow topic-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-lg">⏱️</span>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Time</p>
              <p className="font-display text-lg font-bold text-stone-700">{totalHours}h {remainingMinutes}m</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-4 card-shadow topic-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-lg">💪</span>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Strength</p>
              <p className="font-display text-lg font-bold text-stone-700">{avgStrength}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-4 card-shadow topic-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Confidence</p>
              <p className="font-display text-lg font-bold text-stone-700">{avgConfidence}/5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {totalTopics > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pie Chart - Strength Distribution */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 card-shadow">
            <h3 className="font-display font-semibold text-stone-700 mb-4 flex items-center gap-2 text-sm">
              <span className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-sm shadow-sm">📊</span>
              Strength Distribution
            </h3>
            <div ref={pieChartRef} className="h-56"></div>
            {!chartsLoaded && (
              <div className="h-56 flex items-center justify-center text-stone-400 text-sm">
                Loading chart...
              </div>
            )}
          </div>

          {/* Bar Chart - Subject Progress */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 card-shadow">
            <h3 className="font-display font-semibold text-stone-700 mb-4 flex items-center gap-2 text-sm">
              <span className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center text-sm shadow-sm">📈</span>
              Subject Progress
            </h3>
            <div ref={barChartRef} className="h-56"></div>
            {!chartsLoaded && (
              <div className="h-56 flex items-center justify-center text-stone-400 text-sm">
                Loading chart...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strength Summary Cards - Compact */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/60 p-4 text-center card-shadow topic-card">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
            <span className="text-base">💪</span>
          </div>
          <p className="font-display text-2xl font-bold text-emerald-600">{grouped.strong.length}</p>
          <p className="text-xs text-stone-500 font-medium">Strong</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200/60 p-4 text-center card-shadow topic-card">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
            <span className="text-base">📈</span>
          </div>
          <p className="font-display text-2xl font-bold text-indigo-600">{grouped.medium.length}</p>
          <p className="text-xs text-stone-500 font-medium">Medium</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200/60 p-4 text-center card-shadow topic-card">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
            <span className="text-base">🌱</span>
          </div>
          <p className="font-display text-2xl font-bold text-purple-600">{grouped.weak.length}</p>
          <p className="text-xs text-stone-500 font-medium">Growing</p>
        </div>
      </div>

      {/* Subject-wise Breakdown - Compact cards */}
      {Object.keys(subjectStats).length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 card-shadow">
          <h3 className="font-display font-semibold text-stone-700 mb-4 flex items-center gap-2 text-sm">
            <span className="w-7 h-7 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center text-sm shadow-sm">📖</span>
            Subject Details
          </h3>
          <div className="space-y-2">
            {Object.entries(subjectStats).map(([subject, stats]) => {
              const strengthColor = stats.avgStrength >= 70 ? 'emerald' : stats.avgStrength >= 40 ? 'indigo' : 'purple';
              return (
                <div 
                  key={subject} 
                  className="p-3 bg-gradient-to-r from-stone-50/50 to-stone-100/30 rounded-lg hover:from-stone-100/50 hover:to-stone-100/50 transition-colors cursor-pointer border border-transparent hover:border-stone-200/60"
                  onClick={() => setSelectedSubject(selectedSubject === subject ? null : subject)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 bg-gradient-to-br from-${strengthColor}-100 to-${strengthColor}-50 rounded-lg flex items-center justify-center shadow-sm`}>
                        <span className={`text-${strengthColor}-600 font-bold text-sm`}>{subject.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-stone-700 text-sm">{subject}</p>
                        <p className="text-xs text-stone-400">{stats.topics.length} topics • {formatTime(stats.totalTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex gap-1">
                        <span className="text-xs px-1.5 py-0.5 bg-emerald-100/80 text-emerald-700 rounded font-medium">{stats.strong}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-indigo-100/80 text-indigo-700 rounded font-medium">{stats.medium}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100/80 text-purple-700 rounded font-medium">{stats.weak}</span>
                      </div>
                      <p className={`font-display text-base font-bold text-${strengthColor}-600`}>{stats.avgStrength}%</p>
                      <svg className={`w-3.5 h-3.5 text-stone-400 transition-transform ${selectedSubject === subject ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1 rounded-full overflow-hidden bg-stone-200/60">
                    <div 
                      className={`h-full bg-gradient-to-r from-${strengthColor}-500 to-${strengthColor}-400 transition-all`}
                      style={{ width: `${stats.avgStrength}%` }}
                    ></div>
                  </div>
                  
                  {/* Expanded topic list */}
                  {selectedSubject === subject && (
                    <div className="mt-2.5 pt-2.5 border-t border-stone-200/60 space-y-1.5">
                      {stats.topics.map((topic, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white/80 rounded-lg border border-stone-100 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              topic.strengthLabel === 'strong' ? 'bg-emerald-500' : 
                              topic.strengthLabel === 'medium' ? 'bg-indigo-500' : 'bg-purple-500'
                            }`}></div>
                            <span className="text-xs text-stone-600">{topic.topic}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-400">
                            <span className="font-semibold">{topic.strengthScore || 0}%</span>
                            <span>{formatTime(topic.timeSpentMinutes || 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Topics List - Compact */}
      {topics.length > 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-stone-200/60 overflow-hidden shadow-sm">
          <div className="p-3 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-display font-semibold text-stone-700 flex items-center gap-2 text-sm">
              <span className="w-7 h-7 bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg flex items-center justify-center text-sm shadow-sm">📋</span>
              All Topics ({topics.length})
            </h3>
            <span className="text-xs text-stone-400">Weakest first</span>
          </div>
          <div className="divide-y divide-stone-100/60 max-h-64 overflow-y-auto">
            {topics
              .sort((a, b) => (a.strengthScore || 0) - (b.strengthScore || 0))
              .map((topic, i) => (
                <div key={i} className="px-3 py-2 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-6 rounded-full ${
                      topic.strengthLabel === 'strong' ? 'bg-emerald-500' : 
                      topic.strengthLabel === 'medium' ? 'bg-indigo-500' : 'bg-purple-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-stone-700 text-xs">{topic.topic}</p>
                      <p className="text-xs text-stone-400">{topic.subject} • {formatTime(topic.timeSpentMinutes || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          topic.strengthLabel === 'strong' ? 'bg-emerald-500' : 
                          topic.strengthLabel === 'medium' ? 'bg-indigo-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${topic.strengthScore || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-stone-600 w-8 text-right">{topic.strengthScore || 0}%</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-stone-200/60 p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-xl">📊</span>
          </div>
          <h3 className="font-display text-base font-semibold text-stone-700 mb-1">No Progress Yet</h3>
          <p className="text-stone-400 text-xs mb-3">Start learning to track your progress!</p>
          <div className="text-xs text-stone-400 space-y-0.5">
            <p>✓ Study in Smart Learning Room</p>
            <p>✓ Save notes</p>
          </div>
        </div>
      )}

      {/* Growth Opportunities - Compact */}
      {grouped.weak.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 rounded-xl border border-purple-200/60 p-4 shadow-sm">
          <h3 className="font-display font-semibold text-stone-700 mb-2 flex items-center gap-2 text-sm">
            <span className="w-7 h-7 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-sm shadow-sm">🌱</span>
            Growth Opportunities
          </h3>
          <p className="text-xs text-stone-500 mb-2">Topics with room to grow:</p>
          <div className="flex flex-wrap gap-1.5">
            {grouped.weak.slice(0, 5).map((topic, i) => (
              <span key={i} className="px-2 py-1 bg-white/80 border border-purple-200/60 rounded-lg text-xs text-purple-700 font-medium shadow-sm">
                {topic.topic} ({topic.strengthScore || 0}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Plan Tab
const PlanTab = ({ studyPlan, userProfile, loading, onRefresh }) => {
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const generatePlan = async () => {
    if (!userProfile) return;
    setGenerating(true);
    try {
      await aiApi.generateStudyPlan({ userId: user.uid, examName: userProfile.examName, examDate: userProfile.examDate, subjects: userProfile.subjects, topics: userProfile.topics, weakSubjects: userProfile.weakSubjects, dailyStudyHours: userProfile.dailyStudyHours });
      onRefresh();
    } catch (err) { console.error('Error generating plan:', err); }
    finally { setGenerating(false); }
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse h-20 bg-slate-100 rounded-xl"></div>)}</div>;

  if (!studyPlan?.plan) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-6 text-center shadow-sm animate-fadeIn">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-xl">📅</span></div>
        <h3 className="font-display text-base font-semibold text-slate-700 mb-1">No Study Plan Yet</h3>
        <p className="text-slate-400 text-xs mb-4">Generate a personalized AI study plan</p>
        <button onClick={generatePlan} disabled={generating} className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-semibold text-sm hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50">
          {generating ? 'Generating...' : '✨ Generate Study Plan'}
        </button>
      </div>
    );
  }

  const { metadata, plan } = studyPlan;
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-800 tracking-tight">Your Study Plan</h2>
          <p className="text-slate-400 text-xs">AI-generated schedule</p>
        </div>
        <button onClick={generatePlan} disabled={generating} className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-50">{generating ? 'Regenerating...' : '↻ Regenerate'}</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl p-3 text-center shadow-sm">
          <p className="font-display text-2xl font-bold text-emerald-600">{metadata?.daysLeft || '—'}</p>
          <p className="text-xs text-emerald-700 font-medium">Days Left</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-3 text-center shadow-sm">
          <p className="font-display text-2xl font-bold text-blue-600">{metadata?.weeksLeft || '—'}</p>
          <p className="text-xs text-blue-700 font-medium">Weeks</p>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/60 rounded-xl p-3 text-center shadow-sm">
          <p className="font-display text-2xl font-bold text-teal-600">{metadata?.dailyStudyHours || '—'}h</p>
          <p className="text-xs text-teal-700 font-medium">Daily</p>
        </div>
      </div>
      {plan?.dailyTimetable && (
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <h3 className="font-display font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
            <span className="w-7 h-7 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center text-sm">📆</span>
            Daily Schedule
          </h3>
          <div className="space-y-1.5">
            {plan.dailyTimetable.map((slot, i) => {
              const subjectName = slot.subject && slot.subject !== 'NA' && slot.subject !== 'N/A' ? slot.subject : null;
              const isBreak = slot.activity?.toLowerCase().includes('break') || slot.activity?.toLowerCase().includes('rest') || slot.activity?.toLowerCase().includes('freshen');
              const isRevision = slot.activity?.toLowerCase().includes('revision');
              const isWakeUp = slot.activity?.toLowerCase().includes('wake') || slot.activity?.toLowerCase().includes('morning');
              
              let displayLabel = subjectName || (isBreak ? '☕ Break' : isRevision ? '📖 Revision' : isWakeUp ? '🌅 Morning' : '📚 Study');
              let bgColor = isBreak ? 'bg-orange-50/50' : isRevision ? 'bg-blue-50/50' : isWakeUp ? 'bg-amber-50/50' : 'bg-slate-50/50';
              let textColor = isBreak ? 'text-orange-700' : isRevision ? 'text-blue-700' : isWakeUp ? 'text-amber-700' : 'text-slate-700';
              
              return (
                <div key={i} className={`flex items-center gap-3 p-2.5 ${bgColor} rounded-lg border border-transparent hover:border-slate-200/60 transition-colors`}>
                  <span className="text-xs text-slate-400 w-16 shrink-0 font-medium">{slot.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-xs ${textColor}`}>{displayLabel}</p>
                    {slot.activity && <p className="text-xs text-slate-400 truncate">{slot.activity}</p>}
                  </div>
                  <span className="text-xs text-teal-600 font-semibold shrink-0">{slot.duration}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {plan?.examTips && (
        <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 border border-amber-200/60 rounded-xl p-4 shadow-sm">
          <h3 className="font-display font-semibold text-amber-800 mb-2 text-sm flex items-center gap-2">
            <span>💡</span> Exam Tips
          </h3>
          <ul className="space-y-1.5">{plan.examTips.slice(0, 3).map((tip, i) => <li key={i} className="text-xs text-amber-900 flex items-start gap-2"><span className="text-amber-500">•</span>{tip}</li>)}</ul>
        </div>
      )}
    </div>
  );
};

// Notes Tab
const NotesTab = ({ notes = [], loading, onRefresh }) => {
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const safeNotes = Array.isArray(notes) ? notes : [];
  const subjects = [...new Set(safeNotes.map(n => n.subject).filter(Boolean))];

  const filteredNotes = safeNotes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || note.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      if (typeof onRefresh === 'function') {
        await onRefresh();
      }
    } catch (err) {
      setError(err.message || 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  const getContentPreview = (content) => {
    if (!content) return 'No content';
    if (typeof content === 'string') return content.substring(0, 80);
    if (typeof content === 'object') {
      if (content.sections) {
        const firstSection = Object.values(content.sections)[0];
        if (typeof firstSection === 'string') return firstSection.substring(0, 80);
      }
      try { return JSON.stringify(content).substring(0, 80); } catch (e) { return 'Content available'; }
    }
    return String(content).substring(0, 80);
  };

  const tagLabels = {
    brief: '📝', detailed: '📚', questions: '❓', analogy: '💡', 
    dosdonts: "✅", exampoints: '🎯', quickrevision: '⚡', mistakes: '⚠️'
  };

  if (loading && !refreshing) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-20 bg-slate-100 rounded-xl"></div>
        ))}
      </div>
    );
  }

  // Note detail view
  if (selectedNote) {
    return (
      <div className="space-y-3 animate-fadeIn">
        <button 
          onClick={() => setSelectedNote(null)}
          className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium text-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Notes
        </button>
        
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white">
            <h2 className="font-display text-lg font-bold">{selectedNote.topic}</h2>
            <div className="flex items-center gap-2 mt-1.5 text-teal-100 text-xs">
              {selectedNote.subject && (
                <span className="bg-white/20 px-2 py-0.5 rounded">{selectedNote.subject}</span>
              )}
              <span>{formatDate(selectedNote.createdAt)}</span>
            </div>
          </div>
          
          <div className="p-4">
            {selectedNote.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedNote.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                    {tagLabels[tag] || tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="prose prose-sm max-w-none">
              <NoteContentRenderer content={selectedNote.content} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-2.5 rounded-lg text-xs">
          Error: {error}
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-800 tracking-tight">My Notes</h2>
          <p className="text-slate-400 text-xs">{safeNotes.length} saved notes</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
          />
        </div>
        {subjects.length > 0 && (
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none bg-white transition-all"
          >
            <option value="all">All Subjects</option>
            {subjects.map((subj, i) => (
              <option key={i} value={subj}>{subj}</option>
            ))}
          </select>
        )}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="bg-white rounded-xl border border-slate-200/60 p-3 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-start justify-between mb-1.5">
                <h3 className="font-display font-semibold text-slate-700 group-hover:text-teal-600 transition text-sm line-clamp-2">
                  {note.topic}
                </h3>
                <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              {note.subject && (
                <span className="inline-block px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded text-xs font-medium mb-1.5">
                  {note.subject}
                </span>
              )}
              
              <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                {getContentPreview(note.content)}...
              </p>
              
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{formatDate(note.createdAt)}</span>
                {note.tags?.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {note.tags.slice(0, 3).map((tag, i) => (
                      <span key={i}>{tagLabels[tag] || '📄'}</span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/60 p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">📝</span>
          </div>
          <h3 className="font-display text-base font-semibold text-slate-700 mb-1">
            {searchQuery || filterSubject !== 'all' ? 'No notes found' : 'No saved notes yet'}
          </h3>
          <p className="text-slate-400 text-xs">
            {searchQuery || filterSubject !== 'all' 
              ? 'Try adjusting your search'
              : 'Save notes from Smart Learning Room'}
          </p>
        </div>
      )}
    </div>
  );
};

// Note Content Renderer
const NoteContentRenderer = ({ content }) => {
  if (!content) return <p className="text-slate-400 text-sm">No content available</p>;
  
  let contentString = '';
  
  if (typeof content === 'string') {
    contentString = content;
  } else if (typeof content === 'object') {
    console.log('[DEBUG] NoteContentRenderer received object content:', content);
    // If it's an object with sections, combine them
    if (content.sections && typeof content.sections === 'object') {
      const sectionLabels = {
        brief: '📝 Brief Explanation',
        detailed: '📚 Detailed Explanation', 
        questions: '❓ Practice Questions',
        analogy: '💡 Real-life Analogy',
        dosdonts: "✅ Do's & Don'ts",
        exampoints: '🎯 Exam Points',
        quickrevision: '⚡ Quick Revision',
        mistakes: '⚠️ Common Mistakes'
      };
      
      contentString = Object.entries(content.sections)
        .map(([key, value]) => {
          const label = sectionLabels[key] || key.charAt(0).toUpperCase() + key.slice(1);
          return `## ${label}\n\n${value}`;
        })
        .join('\n\n---\n\n');
    } else {
      // Try to stringify
      try {
        contentString = JSON.stringify(content, null, 2);
      } catch (e) {
        return <p className="text-slate-500">Unable to display content</p>;
      }
    }
  } else {
    contentString = String(content);
  }

  const renderLine = (line, index) => {
    try {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={index} className="h-3" />;

      // Horizontal rule
      if (trimmedLine === '---' || trimmedLine === '***') {
        return <hr key={index} className="my-4 border-slate-200" />;
      }

      // Headers with enhanced styling
      if (trimmedLine.startsWith('###')) {
        return (
          <h4 key={index} className="text-base font-bold text-slate-800 mt-5 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            {trimmedLine.replace(/^#+\s*/, '')}
          </h4>
        );
      }
      if (trimmedLine.startsWith('##')) {
        return (
          <h3 key={index} className="text-lg font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            {trimmedLine.replace(/^#+\s*/, '')}
          </h3>
        );
      }
      if (trimmedLine.startsWith('#')) {
        return (
          <h2 key={index} className="text-xl font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-emerald-200">
            {trimmedLine.replace(/^#+\s*/, '')}
          </h2>
        );
      }

      // Questions - blue card
      if (trimmedLine.match(/^Q\d*[.:]/i) || trimmedLine.match(/^Question\s*\d*/i)) {
        return (
          <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-3 rounded-r-lg mt-4 mb-2">
            <p className="font-semibold text-blue-800">{trimmedLine}</p>
          </div>
        );
      }

      // Answers - green card
      if (trimmedLine.match(/^(A\d*[.:])|(Answer:?)|(Ans:?)|(Solution:?)/i)) {
        return (
          <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-3 rounded-r-lg mb-3">
            <p className="text-green-800">{trimmedLine}</p>
          </div>
        );
      }

      // Do's - green styling
      if (trimmedLine.startsWith('✅') || trimmedLine.match(/^Do:/i) || trimmedLine.match(/^Do\s*\d+:/i)) {
        const cleanText = trimmedLine.replace(/^✅\s*/, '').replace(/^Do:?\s*/i, '').replace(/^Do\s*\d+:\s*/i, '');
        return (
          <div key={index} className="flex items-start gap-2 bg-green-50 border border-green-200 p-2.5 rounded-lg my-2">
            <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs shrink-0">✓</span>
            <p className="text-green-800">{cleanText}</p>
          </div>
        );
      }

      // Don'ts - red styling
      if (trimmedLine.startsWith('❌') || trimmedLine.match(/^Don'?t:/i) || trimmedLine.match(/^Don'?t\s*\d+:/i)) {
        const cleanText = trimmedLine.replace(/^❌\s*/, '').replace(/^Don'?t:?\s*/i, '').replace(/^Don'?t\s*\d+:\s*/i, '');
        return (
          <div key={index} className="flex items-start gap-2 bg-red-50 border border-red-200 p-2.5 rounded-lg my-2">
            <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shrink-0">✗</span>
            <p className="text-red-800">{cleanText}</p>
          </div>
        );
      }

      // Important/Star points - amber card
      if (trimmedLine.includes('⭐') || trimmedLine.match(/^\*\*Important/i) || trimmedLine.match(/^Important:/i)) {
        return (
          <div key={index} className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 p-3 rounded-lg my-3">
            <p className="text-amber-900 font-medium flex items-start gap-2">
              <span>⭐</span>
              {trimmedLine.replace(/^⭐\s*/, '').replace(/^\*\*Important:?\*\*\s*/i, '').replace(/^Important:\s*/i, '')}
            </p>
          </div>
        );
      }

      // Key points/definitions - teal card
      if (trimmedLine.match(/^(Definition|Key Point|Remember|Note|Formula|Theorem|Law|Principle):/i) || trimmedLine.match(/^(📌|🔑|💡|📝)/)) {
        return (
          <div key={index} className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 p-3 rounded-lg my-2">
            <p className="text-teal-900">{trimmedLine}</p>
          </div>
        );
      }

      // Examples - purple styling
      if (trimmedLine.match(/^(Example|E\.g\.|For example):/i) || trimmedLine.match(/^(🔹|📍|➡️)/)) {
        return (
          <div key={index} className="bg-gradient-to-r from-purple-50 to-violet-50 border-l-4 border-purple-400 p-3 rounded-r-lg my-2">
            <p className="text-purple-900">{trimmedLine}</p>
          </div>
        );
      }

      // Tips/Notes - sky blue
      if (trimmedLine.match(/^(Tip|Note|Hint|Pro tip):/i) || trimmedLine.startsWith('💡')) {
        return (
          <div key={index} className="bg-sky-50 border border-sky-200 p-2.5 rounded-lg my-2 flex items-start gap-2">
            <span className="text-sky-500">💡</span>
            <p className="text-sky-800 text-sm">{trimmedLine.replace(/^(Tip|Note|Hint|Pro tip):\s*/i, '').replace(/^💡\s*/, '')}</p>
          </div>
        );
      }

      // Warning/Caution - orange
      if (trimmedLine.match(/^(Warning|Caution|⚠️|Common mistake)/i)) {
        return (
          <div key={index} className="bg-orange-50 border border-orange-300 p-2.5 rounded-lg my-2 flex items-start gap-2">
            <span className="text-orange-500">⚠️</span>
            <p className="text-orange-800">{trimmedLine.replace(/^(Warning|Caution|Common mistake):?\s*/i, '').replace(/^⚠️\s*/, '')}</p>
          </div>
        );
      }

      // Bullet points - styled
      if (trimmedLine.match(/^[-•*]\s/)) {
        return (
          <div key={index} className="flex items-start gap-2 my-1.5 ml-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0"></span>
            <p className="text-slate-700">{renderInlineFormatting(trimmedLine.replace(/^[-•*]\s/, ''))}</p>
          </div>
        );
      }

      // Numbered list - styled
      if (trimmedLine.match(/^\d+\.\s/)) {
        const match = trimmedLine.match(/^(\d+)\./);
        const num = match ? match[1] : '•';
        return (
          <div key={index} className="flex items-start gap-2 my-1.5 ml-2">
            <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">{num}</span>
            <p className="text-slate-700">{renderInlineFormatting(trimmedLine.replace(/^\d+\.\s/, ''))}</p>
          </div>
        );
      }

      // Regular paragraph with inline formatting
      return <p key={index} className="text-slate-700 my-1.5 leading-relaxed">{renderInlineFormatting(trimmedLine)}</p>;
    } catch (e) {
      console.error('[DEBUG] Error rendering line:', index, e);
      return <p key={index} className="text-slate-700">{line}</p>;
    }
  };

  // Render inline formatting (bold, code)
  const renderInlineFormatting = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Handle bold text
    if (text.includes('**')) {
      const parts = text.split(/\*\*(.*?)\*\*/g);
      return parts.map((part, i) => 
        i % 2 === 1 ? <strong key={i} className="text-slate-900 font-semibold">{part}</strong> : part
      );
    }
    
    // Handle inline code
    if (text.includes('`')) {
      const parts = text.split(/`([^`]+)`/g);
      return parts.map((part, i) => 
        i % 2 === 1 ? <code key={i} className="px-1.5 py-0.5 bg-slate-100 text-emerald-700 rounded text-sm font-mono">{part}</code> : part
      );
    }
    
    return text;
  };

  try {
    const lines = contentString.split('\n');
    return <div className="space-y-1">{lines.map((line, index) => renderLine(line, index))}</div>;
  } catch (e) {
    console.error('[DEBUG] Error rendering content:', e);
    return <pre className="text-sm text-slate-700 whitespace-pre-wrap">{contentString}</pre>;
  }
};

export default Dashboard;
