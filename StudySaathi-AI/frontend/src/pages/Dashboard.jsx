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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar - Premium & Clean */}
      <aside className="fixed left-0 top-0 h-full w-14 lg:w-64 bg-white border-r border-[#E5E7EB] z-30 flex flex-col">
        <div className="p-3 lg:p-5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#818CF8] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
              <span className="text-white text-lg">📚</span>
            </div>
            <span className="hidden lg:block font-display font-bold bg-gradient-to-r from-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent text-xl tracking-tight">StudySaathi</span>
          </div>
        </div>
        <nav className="flex-1 p-2 lg:p-4 space-y-1">
          <NavItem icon="🏠" label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon="🧠" label="Smart Learn" active={activeTab === 'learn'} onClick={() => setActiveTab('learn')} />
          <NavItem icon="💬" label="Ask Doubt" active={activeTab === 'doubt'} onClick={() => setActiveTab('doubt')} />
          <NavItem icon="📝" label="My Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
          <NavItem icon="📊" label="Progress" active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
          <NavItem icon="📅" label="Study Plan" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
        </nav>
        <div className="p-2 lg:p-4 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-all" onClick={handleLogout}>
            <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-indigo-500/20">
              {(user?.displayName || user?.email || 'S')[0].toUpperCase()}
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#0F172A] truncate">{user?.displayName || 'Student'}</p>
              <p className="text-[12px] text-[#64748B] font-medium">Sign out</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-14 lg:ml-64 min-h-screen">
        <header className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-[#E5E7EB] z-20 px-5 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-widest mb-0.5">{getGreeting()}</p>
              <h1 className="text-xl font-display font-bold text-[#0F172A] tracking-tight">{user?.displayName || 'Student'}</h1>
            </div>
            <div className="flex items-center gap-3">
              {streakData && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] border border-[#FCD34D] rounded-xl shadow-sm">
                  <span className="text-base">🔥</span>
                  <span className="text-[13px] font-bold text-[#B45309]">{streakData.currentStreak || 0}d</span>
                </div>
              )}
              {daysUntilExam && daysUntilExam > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] border border-[#C7D2FE] rounded-xl shadow-sm">
                  <span className="text-base">📅</span>
                  <span className="text-[13px] font-bold text-[#4F46E5]">{daysUntilExam}d to {userProfile?.examName}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-8">
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
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] text-[#4F46E5] shadow-sm border border-[#C7D2FE]' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}>
    <span className="text-xl">{icon}</span>
    <span className="hidden lg:block font-semibold text-[14px]">{label}</span>
  </button>
);

// Home Tab - Overview with quick actions
const HomeTab = ({ onStartLearning, onAskDoubt, recommendations, userProfile, streakData, loading }) => (
  <div className="space-y-6 animate-fadeIn">
    {/* Hero CTA - Premium indigo gradient */}
    <div className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#818CF8] rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden hero-shadow">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white rounded-full blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white rounded-full blur-2xl"></div>
      </div>
      <div className="relative">
        <h2 className="font-display text-2xl lg:text-3xl font-bold mb-3 tracking-tight">Ready to learn?</h2>
        <p className="text-indigo-100 text-[15px] mb-6 max-w-md font-medium">Jump into Smart Learning Room and master any topic with AI-powered explanations.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={onStartLearning} className="px-5 py-2.5 bg-white text-[#4F46E5] rounded-xl font-semibold text-sm btn-lift shadow-lg hover:shadow-xl flex items-center gap-2">
            <span>🧠</span> Start Learning
          </button>
          <button onClick={onAskDoubt} className="px-5 py-2.5 bg-white/15 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/25 transition-all flex items-center gap-2 border border-white/20 btn-lift">
            <span>💬</span> Quick Doubt
          </button>
        </div>
      </div>
    </div>

    {/* Quick Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon="🔥" label="Streak" value={`${streakData?.currentStreak || 0}d`} color="emerald" />
      <StatCard icon="📚" label="Subjects" value={userProfile?.subjects?.length || 0} color="indigo" />
      <StatCard icon="⏰" label="Daily Goal" value={`${userProfile?.dailyStudyHours || 0}h`} color="indigo" />
      <StatCard icon="🏆" label="Best" value={`${streakData?.longestStreak || 0}d`} color="emerald" />
    </div>

    {/* Two Column Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Recommended Topics */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow">
        <h3 className="font-display font-bold text-[#0F172A] flex items-center gap-2.5 mb-4 text-[15px] tracking-tight">
          <span className="w-9 h-9 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-xl flex items-center justify-center text-base shadow-sm">🎯</span> Focus Today
        </h3>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse h-14 bg-[#F8FAFC] rounded-xl"></div>)}</div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-2.5">
            {recommendations.map((rec, i) => (
              <button key={i} onClick={onStartLearning} className={`w-full p-3 rounded-xl text-left topic-card border ${rec.priority === 'high' ? 'bg-[#FEF2F2] border-[#FECACA]' : rec.priority === 'medium' ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-[#ECFDF5] border-[#A7F3D0]'}`}>
                <div className="flex justify-between items-center">
                  <div><p className="font-medium text-[#0F172A] text-sm">{rec.topic}</p><p className="text-xs text-[#64748B] mt-0.5">{rec.subject} • {rec.reason}</p></div>
                  <span className="text-xs font-semibold text-[#64748B] bg-white px-2.5 py-1 rounded-full border border-[#E5E7EB]">{rec.suggestedTime}m</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#64748B] text-sm mb-3">Start learning to get recommendations</p>
            <button onClick={onStartLearning} className="text-[#4F46E5] text-sm font-medium hover:underline">Begin your first topic →</button>
          </div>
        )}
      </div>

      {/* Your Subjects */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow">
        <h3 className="font-display font-bold text-[#0F172A] flex items-center gap-2.5 mb-4 text-[15px] tracking-tight">
          <span className="w-9 h-9 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-xl flex items-center justify-center text-base shadow-sm">📖</span> Your Subjects
        </h3>
        {userProfile?.subjects?.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {userProfile.subjects.map((subject, i) => (
              <button key={i} onClick={onStartLearning} className="p-3.5 bg-[#F8FAFC] hover:bg-[#EEF2FF] border border-[#E5E7EB] hover:border-[#C7D2FE] rounded-xl text-left topic-card group">
                <p className="font-medium text-[#0F172A] group-hover:text-[#4F46E5] text-sm">{subject}</p>
                <p className="text-xs text-[#64748B] mt-1">Click to learn</p>
              </button>
            ))}
          </div>
        ) : <p className="text-[#64748B] text-sm text-center py-8">No subjects configured</p>}
      </div>
    </div>

    {streakData?.message && (
      <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-2.5"><span className="text-lg">💪</span><p className="text-[#0F172A] text-sm">{streakData.message}</p></div>
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
          <h2 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">Ask a Doubt</h2>
          <p className="text-[#64748B] text-[14px] font-medium mt-1">Get instant AI-powered explanations</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-[550px]"><QuickDoubt embedded={true} /></div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow">
            <h4 className="font-display font-bold text-[#0F172A] mb-4 flex items-center gap-2.5 text-[15px] tracking-tight">
              <span className="w-8 h-8 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-xl flex items-center justify-center text-sm shadow-sm">💡</span>
              Tips for Better Answers
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#64748B]">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5"><span className="text-[#10B981] font-bold">{tip.icon}</span><span className="font-medium">{tip.text}</span></li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-2xl border border-[#C7D2FE] p-5 card-shadow">
            <h4 className="font-display font-bold text-[#0F172A] mb-4 flex items-center gap-2.5 text-[15px] tracking-tight">
              <span className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-sm shadow-sm">📝</span>
              Example Questions
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#0F172A]">
              {exampleQuestions.map((q, i) => (
                <li key={i} className="p-3 bg-white rounded-xl border border-[#E5E7EB] font-medium">{q}</li>
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
    indigo: 'bg-[#EEF2FF] border-[#C7D2FE]', 
    emerald: 'bg-[#ECFDF5] border-[#A7F3D0]'
  };
  return (
    <div className={`${colors[color]} rounded-2xl border p-4 card-shadow topic-card`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-xs text-[#64748B] font-medium">{label}</p>
          <p className="font-display font-bold text-[#0F172A] text-base">{value}</p>
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
        pieHole: 0.45,
        colors: ['#10B981', '#F59E0B', '#EF4444'],
        legend: { position: 'bottom', textStyle: { color: '#64748B', fontSize: 11, fontName: 'Inter' } },
        chartArea: { width: '90%', height: '70%' },
        backgroundColor: 'transparent',
        pieSliceTextStyle: { color: '#fff', fontSize: 11, fontName: 'Inter' },
        tooltip: { textStyle: { fontSize: 12, fontName: 'Inter' } }
      };
      
      const pieChart = new window.google.visualization.PieChart(pieChartRef.current);
      pieChart.draw(pieData, pieOptions);
    }

    // Draw Bar Chart for subject progress
    if (barChartRef.current && window.google && Object.keys(subjectStats).length > 0) {
      const barDataArray = [['Subject', 'Strength %', { role: 'style' }, { role: 'annotation' }]];
      Object.entries(subjectStats).forEach(([subject, stats]) => {
        const color = stats.avgStrength >= 70 ? '#10B981' : stats.avgStrength >= 40 ? '#F59E0B' : '#EF4444';
        barDataArray.push([subject, stats.avgStrength, color, `${stats.avgStrength}%`]);
      });
      
      const barData = window.google.visualization.arrayToDataTable(barDataArray);
      
      const barOptions = {
        legend: { position: 'none' },
        chartArea: { width: '65%', height: '75%' },
        backgroundColor: 'transparent',
        hAxis: { 
          minValue: 0, 
          maxValue: 100,
          textStyle: { color: '#64748B', fontSize: 10, fontName: 'Inter' },
          gridlines: { color: '#E5E7EB' }
        },
        vAxis: { 
          textStyle: { color: '#0F172A', fontSize: 11, fontName: 'Inter' }
        },
        annotations: { textStyle: { fontSize: 10, color: '#fff', fontName: 'Inter' } },
        bar: { groupWidth: '55%' }
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
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse h-24 bg-[#F8FAFC] rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">Your Progress</h2>
          <p className="text-[#64748B] text-[14px] font-medium mt-1">Track your learning journey</p>
        </div>
        <button 
          onClick={onRefresh} 
          className="text-[13px] text-[#4F46E5] hover:text-[#6366F1] font-semibold flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-[#EEF2FF] transition-all btn-lift"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Quick Stats - Premium cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow topic-card">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <p className="text-[13px] text-[#64748B] font-medium">Topics</p>
              <p className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">{totalTopics}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow topic-card">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-xl">⏱️</span>
            </div>
            <div>
              <p className="text-[13px] text-[#64748B] font-medium">Time Spent</p>
              <p className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">{totalHours}h {remainingMinutes}m</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow topic-card">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-xl">💪</span>
            </div>
            <div>
              <p className="text-[13px] text-[#64748B] font-medium">Avg Strength</p>
              <p className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">{avgStrength}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow topic-card">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-xl">⭐</span>
            </div>
            <div>
              <p className="text-[13px] text-[#64748B] font-medium">Confidence</p>
              <p className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">{avgConfidence}/5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {totalTopics > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pie Chart - Strength Distribution */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 card-shadow">
            <h3 className="font-display font-bold text-[#0F172A] mb-4 flex items-center gap-2.5 text-[15px] tracking-tight">
              <span className="w-9 h-9 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-xl flex items-center justify-center text-base shadow-sm">📊</span>
              Strength Distribution
            </h3>
            <div ref={pieChartRef} className="h-60"></div>
            {!chartsLoaded && (
              <div className="h-60 flex items-center justify-center text-[#64748B] text-[13px] font-medium">
                Loading chart...
              </div>
            )}
          </div>

          {/* Bar Chart - Subject Progress */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 card-shadow">
            <h3 className="font-display font-bold text-[#0F172A] mb-4 flex items-center gap-2.5 text-[15px] tracking-tight">
              <span className="w-9 h-9 bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] rounded-xl flex items-center justify-center text-base shadow-sm">📈</span>
              Subject Progress
            </h3>
            <div ref={barChartRef} className="h-60"></div>
            {!chartsLoaded && (
              <div className="h-60 flex items-center justify-center text-[#64748B] text-[13px] font-medium">
                Loading chart...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strength Summary Cards - Performance Colors */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] rounded-2xl border border-[#A7F3D0] p-5 text-center card-shadow topic-card">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-xl">💪</span>
          </div>
          <p className="font-display text-3xl font-bold text-[#10B981] tracking-tight">{grouped.strong.length}</p>
          <p className="text-[13px] text-[#047857] font-semibold mt-1">Strong</p>
        </div>
        <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] rounded-2xl border border-[#FDE68A] p-5 text-center card-shadow topic-card">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-xl">📈</span>
          </div>
          <p className="font-display text-3xl font-bold text-[#F59E0B] tracking-tight">{grouped.medium.length}</p>
          <p className="text-[13px] text-[#B45309] font-semibold mt-1">Medium</p>
        </div>
        <div className="bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] rounded-2xl border border-[#FECACA] p-5 text-center card-shadow topic-card">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-xl">🌱</span>
          </div>
          <p className="font-display text-3xl font-bold text-[#EF4444] tracking-tight">{grouped.weak.length}</p>
          <p className="text-[13px] text-[#B91C1C] font-semibold mt-1">Needs Work</p>
        </div>
      </div>

      {/* Subject-wise Breakdown */}
      {Object.keys(subjectStats).length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 card-shadow">
          <h3 className="font-display font-bold text-[#0F172A] mb-5 flex items-center gap-2.5 text-[15px] tracking-tight">
            <span className="w-9 h-9 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-xl flex items-center justify-center text-base shadow-sm">📖</span>
            Subject Details
          </h3>
          <div className="space-y-3">
            {Object.entries(subjectStats).map(([subject, stats]) => {
              const strengthColor = stats.avgStrength >= 70 ? '#10B981' : stats.avgStrength >= 40 ? '#F59E0B' : '#EF4444';
              const strengthBg = stats.avgStrength >= 70 ? '#ECFDF5' : stats.avgStrength >= 40 ? '#FFFBEB' : '#FEF2F2';
              return (
                <div 
                  key={subject} 
                  className="p-4 bg-[#F8FAFC] rounded-xl hover:bg-[#EEF2FF] transition-all cursor-pointer border border-transparent hover:border-[#C7D2FE] topic-card"
                  onClick={() => setSelectedSubject(selectedSubject === subject ? null : subject)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-[#4F46E5] font-bold text-[15px]">{subject.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#0F172A] text-[15px]">{subject}</p>
                        <p className="text-[13px] text-[#64748B] font-medium">{stats.topics.length} topics • {formatTime(stats.totalTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex gap-1.5">
                        <span className="text-[12px] px-2 py-1 bg-[#ECFDF5] text-[#10B981] rounded-lg font-semibold">{stats.strong}</span>
                        <span className="text-[12px] px-2 py-1 bg-[#FFFBEB] text-[#F59E0B] rounded-lg font-semibold">{stats.medium}</span>
                        <span className="text-[12px] px-2 py-1 bg-[#FEF2F2] text-[#EF4444] rounded-lg font-semibold">{stats.weak}</span>
                      </div>
                      <p className="font-display text-lg font-bold" style={{ color: strengthColor }}>{stats.avgStrength}%</p>
                      <svg className={`w-4 h-4 text-[#64748B] transition-transform ${selectedSubject === subject ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden bg-[#E5E7EB]">
                    <div 
                      className="h-full transition-all rounded-full"
                      style={{ width: `${stats.avgStrength}%`, backgroundColor: strengthColor }}
                    ></div>
                  </div>
                  
                  {/* Expanded topic list */}
                  {selectedSubject === subject && (
                    <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-2">
                      {stats.topics.map((topic, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E7EB]">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full`} style={{
                              backgroundColor: topic.strengthLabel === 'strong' ? '#10B981' : 
                              topic.strengthLabel === 'medium' ? '#F59E0B' : '#EF4444'
                            }}></div>
                            <span className="text-[13px] text-[#334155] font-medium">{topic.topic}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[13px]">
                            <span className="font-bold text-[#0F172A]">{topic.strengthScore || 0}%</span>
                            <span className="text-[#64748B] font-medium">{formatTime(topic.timeSpentMinutes || 0)}</span>
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

      {/* All Topics List - Premium */}
      {topics.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden card-shadow">
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="font-display font-bold text-[#0F172A] flex items-center gap-2.5 text-[15px] tracking-tight">
              <span className="w-9 h-9 bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] rounded-xl flex items-center justify-center text-base shadow-sm">📋</span>
              All Topics ({topics.length})
            </h3>
            <span className="text-[12px] text-[#64748B] font-medium bg-[#F8FAFC] px-3 py-1 rounded-lg">Weakest first</span>
          </div>
          <div className="divide-y divide-[#E5E7EB] max-h-72 overflow-y-auto">
            {topics
              .sort((a, b) => (a.strengthScore || 0) - (b.strengthScore || 0))
              .map((topic, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-8 rounded-full ${
                      topic.strengthLabel === 'strong' ? 'bg-[#10B981]' : 
                      topic.strengthLabel === 'medium' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                    }`}></div>
                    <div>
                      <p className="font-semibold text-[#0F172A] text-[14px]">{topic.topic}</p>
                      <p className="text-[12px] text-[#64748B] font-medium">{topic.subject} • {formatTime(topic.timeSpentMinutes || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          topic.strengthLabel === 'strong' ? 'bg-[#10B981]' : 
                          topic.strengthLabel === 'medium' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                        }`}
                        style={{ width: `${topic.strengthScore || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-[14px] font-bold text-[#0F172A] w-10 text-right">{topic.strengthScore || 0}%</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center card-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="font-display text-xl font-bold text-[#0F172A] mb-2 tracking-tight">No Progress Yet</h3>
          <p className="text-[#64748B] text-[15px] font-medium mb-4">Start learning to track your progress!</p>
          <div className="text-[13px] text-[#64748B] space-y-1 font-medium">
            <p>✓ Study in Smart Learning Room</p>
            <p>✓ Save notes to track topics</p>
          </div>
        </div>
      )}

      {/* Growth Opportunities - Premium */}
      {grouped.weak.length > 0 && (
        <div className="bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] rounded-2xl border border-[#C7D2FE] p-6 card-shadow">
          <h3 className="font-display font-bold text-[#0F172A] mb-3 flex items-center gap-2.5 text-[15px] tracking-tight">
            <span className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-base shadow-sm">🌱</span>
            Growth Opportunities
          </h3>
          <p className="text-[13px] text-[#64748B] font-medium mb-3">Topics with room to grow:</p>
          <div className="flex flex-wrap gap-2">
            {grouped.weak.slice(0, 5).map((topic, i) => (
              <span key={i} className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-[13px] text-[#4F46E5] font-semibold shadow-sm">
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

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="animate-pulse h-28 bg-[#F8FAFC] rounded-2xl"></div>)}</div>;

  if (!studyPlan?.plan) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center card-shadow animate-fadeIn">
        <div className="w-20 h-20 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm"><span className="text-3xl">📅</span></div>
        <h3 className="font-display text-xl font-bold text-[#0F172A] mb-2 tracking-tight">No Study Plan Yet</h3>
        <p className="text-[#64748B] text-[15px] font-medium mb-6 max-w-sm mx-auto">Generate a personalized AI study plan tailored to your exam schedule</p>
        <button onClick={generatePlan} disabled={generating} className="px-8 py-3.5 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white rounded-xl font-semibold text-[15px] hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 btn-lift">
          {generating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : '✨ Generate Study Plan'}
        </button>
      </div>
    );
  }

  const { metadata, plan } = studyPlan;
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">Your Study Plan</h2>
          <p className="text-[#64748B] text-[14px] font-medium mt-1">AI-generated personalized schedule</p>
        </div>
        <button 
          onClick={generatePlan} 
          disabled={generating} 
          className="text-[13px] text-[#4F46E5] hover:text-[#6366F1] font-semibold px-4 py-2 rounded-xl hover:bg-[#EEF2FF] transition-all disabled:opacity-50 btn-lift flex items-center gap-1.5"
        >
          <svg className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {generating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-[#A7F3D0] rounded-2xl p-5 text-center card-shadow topic-card">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-xl">⏳</span>
          </div>
          <p className="font-display text-3xl font-bold text-[#10B981] tracking-tight">{metadata?.daysLeft || '—'}</p>
          <p className="text-[13px] text-[#047857] font-semibold mt-1">Days Left</p>
        </div>
        <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-[#C7D2FE] rounded-2xl p-5 text-center card-shadow topic-card">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-xl">📆</span>
          </div>
          <p className="font-display text-3xl font-bold text-[#4F46E5] tracking-tight">{metadata?.weeksLeft || '—'}</p>
          <p className="text-[13px] text-[#4338CA] font-semibold mt-1">Weeks</p>
        </div>
        <div className="bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border border-[#FCD34D] rounded-2xl p-5 text-center card-shadow topic-card">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-xl">⏰</span>
          </div>
          <p className="font-display text-3xl font-bold text-[#F59E0B] tracking-tight">{metadata?.dailyStudyHours || '—'}h</p>
          <p className="text-[13px] text-[#B45309] font-semibold mt-1">Daily Goal</p>
        </div>
      </div>

      {/* Daily Schedule */}
      {plan?.dailyTimetable && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 card-shadow">
          <h3 className="font-display font-bold text-[#0F172A] mb-5 text-[15px] flex items-center gap-2.5 tracking-tight">
            <span className="w-9 h-9 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-xl flex items-center justify-center text-base shadow-sm">📆</span>
            Daily Schedule
          </h3>
          <div className="space-y-2">
            {plan.dailyTimetable.map((slot, i) => {
              const subjectName = slot.subject && slot.subject !== 'NA' && slot.subject !== 'N/A' ? slot.subject : null;
              const isBreak = slot.activity?.toLowerCase().includes('break') || slot.activity?.toLowerCase().includes('rest') || slot.activity?.toLowerCase().includes('freshen');
              const isRevision = slot.activity?.toLowerCase().includes('revision');
              const isWakeUp = slot.activity?.toLowerCase().includes('wake') || slot.activity?.toLowerCase().includes('morning');
              
              let displayLabel = subjectName || (isBreak ? '☕ Break' : isRevision ? '📖 Revision' : isWakeUp ? '🌅 Morning' : '📚 Study');
              let bgColor = isBreak ? 'bg-[#FFF7ED]' : isRevision ? 'bg-[#EEF2FF]' : isWakeUp ? 'bg-[#FFFBEB]' : 'bg-[#F8FAFC]';
              let borderColor = isBreak ? 'border-[#FDBA74]' : isRevision ? 'border-[#C7D2FE]' : isWakeUp ? 'border-[#FDE68A]' : 'border-[#E5E7EB]';
              let textColor = isBreak ? 'text-[#EA580C]' : isRevision ? 'text-[#4F46E5]' : isWakeUp ? 'text-[#B45309]' : 'text-[#0F172A]';
              
              return (
                <div key={i} className={`flex items-center gap-4 p-3.5 ${bgColor} rounded-xl border ${borderColor} hover:shadow-sm transition-all`}>
                  <span className="text-[13px] text-[#64748B] w-20 shrink-0 font-semibold">{slot.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-[14px] ${textColor}`}>{displayLabel}</p>
                    {slot.activity && <p className="text-[13px] text-[#64748B] truncate font-medium">{slot.activity}</p>}
                  </div>
                  <span className="text-[13px] text-[#4F46E5] font-bold shrink-0 bg-[#EEF2FF] px-3 py-1 rounded-lg">{slot.duration}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exam Tips */}
      {plan?.examTips && (
        <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-6 card-shadow">
          <h3 className="font-display font-bold text-[#92400E] mb-4 text-[15px] flex items-center gap-2.5 tracking-tight">
            <span className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-base shadow-sm">💡</span>
            Exam Tips
          </h3>
          <ul className="space-y-3">
            {plan.examTips.slice(0, 4).map((tip, i) => (
              <li key={i} className="text-[14px] text-[#78350F] flex items-start gap-3 font-medium">
                <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[#F59E0B] font-bold text-[12px] shrink-0 shadow-sm">{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weekly Focus (if available) */}
      {plan?.weeklyFocus && plan.weeklyFocus.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 card-shadow">
          <h3 className="font-display font-bold text-[#0F172A] mb-5 text-[15px] flex items-center gap-2.5 tracking-tight">
            <span className="w-9 h-9 bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] rounded-xl flex items-center justify-center text-base shadow-sm">🎯</span>
            Weekly Focus Areas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.weeklyFocus.slice(0, 4).map((week, i) => (
              <div key={i} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 bg-[#EEF2FF] rounded-lg flex items-center justify-center text-[#4F46E5] font-bold text-[12px]">W{i + 1}</span>
                  <span className="text-[14px] font-semibold text-[#0F172A]">{week.week || `Week ${i + 1}`}</span>
                </div>
                <p className="text-[13px] text-[#64748B] font-medium">{week.focus || week}</p>
              </div>
            ))}
          </div>
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
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return '';
      }
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  const getContentPreview = (content) => {
    if (!content) return 'No content';
    if (typeof content === 'string') return content.substring(0, 100);
    if (typeof content === 'object') {
      if (content.sections) {
        const firstSection = Object.values(content.sections)[0];
        if (typeof firstSection === 'string') return firstSection.substring(0, 100);
      }
      try { return JSON.stringify(content).substring(0, 100); } catch (e) { return 'Content available'; }
    }
    return String(content).substring(0, 100);
  };

  const tagLabels = {
    brief: '📝', detailed: '📚', questions: '❓', analogy: '💡', 
    dosdonts: "✅", exampoints: '🎯', quickrevision: '⚡', mistakes: '⚠️'
  };

  if (loading && !refreshing) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-24 bg-[#F8FAFC] rounded-2xl"></div>
        ))}
      </div>
    );
  }

  // Note detail view
  if (selectedNote) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <button 
          onClick={() => setSelectedNote(null)}
          className="flex items-center gap-1.5 text-[#4F46E5] hover:text-[#6366F1] font-semibold text-sm btn-lift"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Notes
        </button>
        
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden card-shadow">
          <div className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#818CF8] p-5 text-white">
            <h2 className="font-display text-xl font-bold tracking-tight">{selectedNote.topic}</h2>
            <div className="flex items-center gap-2.5 mt-2 text-indigo-100 text-xs font-medium">
              {selectedNote.subject && (
                <span className="bg-white/20 px-2.5 py-1 rounded-lg">{selectedNote.subject}</span>
              )}
              {formatDate(selectedNote.createdAt) && (
                <span>{formatDate(selectedNote.createdAt)}</span>
              )}
            </div>
          </div>
          
          <div className="p-5">
            {selectedNote.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedNote.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-[#EEF2FF] text-[#4F46E5] rounded-lg text-xs font-medium">
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
    <div className="space-y-5 animate-fadeIn">
      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#F87171] p-3 rounded-xl text-[13px] font-medium">
          Error: {error}
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">My Notes</h2>
          <p className="text-[#64748B] text-[14px] font-medium mt-1">{safeNotes.length} saved notes</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="text-xs text-[#4F46E5] hover:text-[#6366F1] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#EEF2FF] transition-colors disabled:opacity-50 btn-lift"
        >
          <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2.5 text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-all"
          />
        </div>
        {subjects.length > 0 && (
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2.5 text-[13px] font-medium text-[#0F172A] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none bg-white transition-all cursor-pointer"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 hover:border-[#C7D2FE] hover:shadow-lg transition-all cursor-pointer group card-shadow topic-card"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-display font-semibold text-[#0F172A] group-hover:text-[#4F46E5] transition text-[15px] leading-snug line-clamp-2">
                  {note.topic}
                </h3>
                <svg className="w-4 h-4 text-[#94A3B8] group-hover:text-[#4F46E5] shrink-0 ml-2 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              {note.subject && (
                <span className="inline-block px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] rounded-lg text-xs font-semibold mb-2">
                  {note.subject}
                </span>
              )}
              
              <p className="text-[13px] text-[#64748B] line-clamp-2 mb-3 leading-relaxed">
                {getContentPreview(note.content)}...
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8] font-medium">{formatDate(note.createdAt) || 'Recently'}</span>
                {note.tags?.length > 0 && (
                  <span className="flex items-center gap-1">
                    {note.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-sm">{tagLabels[tag] || '📄'}</span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center card-shadow">
          <div className="w-14 h-14 bg-gradient-to-br from-[#EEF2FF] to-[#F8FAFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="font-display text-xl font-bold text-[#0F172A] mb-2 tracking-tight">
            {searchQuery || filterSubject !== 'all' ? 'No notes found' : 'No saved notes yet'}
          </h3>
          <p className="text-[#64748B] text-[15px] font-medium">
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
  if (!content) return <p className="text-[#64748B] text-sm font-medium">No content available</p>;
  
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
        return <p className="text-[#64748B] font-medium">Unable to display content</p>;
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
        return <hr key={index} className="my-5 border-[#E5E7EB]" />;
      }

      // Headers with enhanced styling
      if (trimmedLine.startsWith('###')) {
        return (
          <h4 key={index} className="font-display text-base font-bold text-[#0F172A] mt-5 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"></span>
            {trimmedLine.replace(/^#+\s*/, '')}
          </h4>
        );
      }
      if (trimmedLine.startsWith('##')) {
        return (
          <h3 key={index} className="font-display text-lg font-bold text-[#0F172A] mt-6 mb-3 flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
            <span className="w-2 h-2 bg-[#4F46E5] rounded-full"></span>
            {trimmedLine.replace(/^#+\s*/, '')}
          </h3>
        );
      }
      if (trimmedLine.startsWith('#')) {
        return (
          <h2 key={index} className="font-display text-xl font-bold text-[#0F172A] mt-6 mb-3 pb-2 border-b-2 border-[#C7D2FE]">
            {trimmedLine.replace(/^#+\s*/, '')}
          </h2>
        );
      }

      // Questions - indigo card
      if (trimmedLine.match(/^Q\d*[.:]/i) || trimmedLine.match(/^Question\s*\d*/i)) {
        return (
          <div key={index} className="bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] border-l-4 border-[#4F46E5] p-3.5 rounded-r-xl mt-4 mb-2">
            <p className="font-semibold text-[#4F46E5] text-[15px]">{trimmedLine}</p>
          </div>
        );
      }

      // Answers - green card
      if (trimmedLine.match(/^(A\d*[.:])|(Answer:?)|(Ans:?)|(Solution:?)/i)) {
        return (
          <div key={index} className="bg-gradient-to-r from-[#ECFDF5] to-[#F0FDF4] border-l-4 border-[#10B981] p-3.5 rounded-r-xl mb-3">
            <p className="text-[#059669] text-[15px] font-medium">{trimmedLine}</p>
          </div>
        );
      }

      // Do's - green styling
      if (trimmedLine.startsWith('✅') || trimmedLine.match(/^Do:/i) || trimmedLine.match(/^Do\s*\d+:/i)) {
        const cleanText = trimmedLine.replace(/^✅\s*/, '').replace(/^Do:?\s*/i, '').replace(/^Do\s*\d+:\s*/i, '');
        return (
          <div key={index} className="flex items-start gap-2.5 bg-[#ECFDF5] border border-[#A7F3D0] p-3 rounded-xl my-2">
            <span className="w-5 h-5 bg-[#10B981] text-white rounded-full flex items-center justify-center text-xs shrink-0 font-bold">✓</span>
            <p className="text-[#059669] text-[15px] font-medium">{cleanText}</p>
          </div>
        );
      }

      // Don'ts - red styling
      if (trimmedLine.startsWith('❌') || trimmedLine.match(/^Don'?t:/i) || trimmedLine.match(/^Don'?t\s*\d+:/i)) {
        const cleanText = trimmedLine.replace(/^❌\s*/, '').replace(/^Don'?t:?\s*/i, '').replace(/^Don'?t\s*\d+:\s*/i, '');
        return (
          <div key={index} className="flex items-start gap-2.5 bg-[#FEF2F2] border border-[#FECACA] p-3 rounded-xl my-2">
            <span className="w-5 h-5 bg-[#F87171] text-white rounded-full flex items-center justify-center text-xs shrink-0 font-bold">✗</span>
            <p className="text-[#DC2626] text-[15px] font-medium">{cleanText}</p>
          </div>
        );
      }

      // Important/Star points - amber card
      if (trimmedLine.includes('⭐') || trimmedLine.match(/^\*\*Important/i) || trimmedLine.match(/^Important:/i)) {
        return (
          <div key={index} className="bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A] p-3.5 rounded-xl my-3">
            <p className="text-[#92400E] font-semibold text-[15px] flex items-start gap-2">
              <span>⭐</span>
              {trimmedLine.replace(/^⭐\s*/, '').replace(/^\*\*Important:?\*\*\s*/i, '').replace(/^Important:\s*/i, '')}
            </p>
          </div>
        );
      }

      // Key points/definitions - indigo card
      if (trimmedLine.match(/^(Definition|Key Point|Remember|Note|Formula|Theorem|Law|Principle):/i) || trimmedLine.match(/^(📌|🔑|💡|📝)/)) {
        return (
          <div key={index} className="bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] border border-[#C7D2FE] p-3.5 rounded-xl my-2">
            <p className="text-[#4338CA] text-[15px] font-medium">{trimmedLine}</p>
          </div>
        );
      }

      // Examples - purple styling
      if (trimmedLine.match(/^(Example|E\.g\.|For example):/i) || trimmedLine.match(/^(🔹|📍|➡️)/)) {
        return (
          <div key={index} className="bg-gradient-to-r from-[#FAF5FF] to-[#F5F3FF] border-l-4 border-[#A855F7] p-3.5 rounded-r-xl my-2">
            <p className="text-[#7C3AED] text-[15px] font-medium">{trimmedLine}</p>
          </div>
        );
      }

      // Tips/Notes - sky blue
      if (trimmedLine.match(/^(Tip|Note|Hint|Pro tip):/i) || trimmedLine.startsWith('💡')) {
        return (
          <div key={index} className="bg-[#F0F9FF] border border-[#BAE6FD] p-3 rounded-xl my-2 flex items-start gap-2">
            <span className="text-[#0EA5E9]">💡</span>
            <p className="text-[#0369A1] text-[14px] font-medium">{trimmedLine.replace(/^(Tip|Note|Hint|Pro tip):\s*/i, '').replace(/^💡\s*/, '')}</p>
          </div>
        );
      }

      // Warning/Caution - orange
      if (trimmedLine.match(/^(Warning|Caution|⚠️|Common mistake)/i)) {
        return (
          <div key={index} className="bg-[#FFF7ED] border border-[#FDBA74] p-3 rounded-xl my-2 flex items-start gap-2">
            <span className="text-[#EA580C]">⚠️</span>
            <p className="text-[#C2410C] text-[15px] font-medium">{trimmedLine.replace(/^(Warning|Caution|Common mistake):?\s*/i, '').replace(/^⚠️\s*/, '')}</p>
          </div>
        );
      }

      // Bullet points - styled
      if (trimmedLine.match(/^[-•*]\s/)) {
        return (
          <div key={index} className="flex items-start gap-2.5 my-2 ml-2">
            <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full mt-2 shrink-0"></span>
            <p className="text-[#334155] text-[15px] leading-relaxed">{renderInlineFormatting(trimmedLine.replace(/^[-•*]\s/, ''))}</p>
          </div>
        );
      }

      // Numbered list - styled
      if (trimmedLine.match(/^\d+\.\s/)) {
        const match = trimmedLine.match(/^(\d+)\./);
        const num = match ? match[1] : '•';
        return (
          <div key={index} className="flex items-start gap-2.5 my-2 ml-2">
            <span className="w-6 h-6 bg-[#EEF2FF] text-[#4F46E5] rounded-full flex items-center justify-center text-xs font-bold shrink-0">{num}</span>
            <p className="text-[#334155] text-[15px] leading-relaxed">{renderInlineFormatting(trimmedLine.replace(/^\d+\.\s/, ''))}</p>
          </div>
        );
      }

      // Regular paragraph with inline formatting
      return <p key={index} className="text-[#334155] my-2 text-[15px] leading-relaxed">{renderInlineFormatting(trimmedLine)}</p>;
    } catch (e) {
      console.error('[DEBUG] Error rendering line:', index, e);
      return <p key={index} className="text-[#334155] text-[15px]">{line}</p>;
    }
  };

  // Render inline formatting (bold, code)
  const renderInlineFormatting = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Handle bold text
    if (text.includes('**')) {
      const parts = text.split(/\*\*(.*?)\*\*/g);
      return parts.map((part, i) => 
        i % 2 === 1 ? <strong key={i} className="text-[#0F172A] font-semibold">{part}</strong> : part
      );
    }
    
    // Handle inline code
    if (text.includes('`')) {
      const parts = text.split(/`([^`]+)`/g);
      return parts.map((part, i) => 
        i % 2 === 1 ? <code key={i} className="px-1.5 py-0.5 bg-[#EEF2FF] text-[#4F46E5] rounded-lg text-sm font-mono font-medium">{part}</code> : part
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
