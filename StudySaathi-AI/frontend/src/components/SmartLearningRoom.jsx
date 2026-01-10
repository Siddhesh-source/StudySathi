import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

const LEARNING_MODES = [
  { id: 'understand', label: 'Understand', icon: '🎯', description: 'Learn the concept from scratch', tags: ['brief', 'detailed', 'analogy'], color: 'indigo' },
  { id: 'practice', label: 'Practice', icon: '✍️', description: 'Test your knowledge', tags: ['questions', 'mistakes'], color: 'indigo' },
  { id: 'revise', label: 'Revise', icon: '⚡', description: 'Quick recap before exam', tags: ['quickrevision', 'exampoints', 'dosdonts'], color: 'emerald' },
  { id: 'custom', label: 'Custom', icon: '🔧', description: 'Choose specific sections', tags: [], color: 'slate' },
];

const ALL_TAGS = [
  { id: 'brief', label: 'Brief Explanation', icon: '📝' },
  { id: 'detailed', label: 'Detailed Explanation', icon: '📚' },
  { id: 'questions', label: 'Practice Questions', icon: '❓' },
  { id: 'analogy', label: 'Real-life Analogy', icon: '💡' },
  { id: 'dosdonts', label: "Do's & Don'ts", icon: '✅' },
  { id: 'exampoints', label: 'Exam Points', icon: '🎯' },
  { id: 'quickrevision', label: 'Quick Revision', icon: '⚡' },
  { id: 'mistakes', label: 'Common Mistakes', icon: '⚠️' },
];

const SmartLearningRoom = ({ embedded = false, onClose, onEndSession, initialTopic = '', initialSubject = '' }) => {
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState(initialSubject);
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confidence, setConfidence] = useState(3);
  const startTimeRef = useRef(null);
  const hasTrackedRef = useRef(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const userSubjects = userProfile?.subjects || [];

  useEffect(() => {
    if (result) {
      startTimeRef.current = Date.now();
      hasTrackedRef.current = false;
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [result]);

  const trackTimeAndConfidence = useCallback(async () => {
    if (hasTrackedRef.current || !startTimeRef.current || !subject || !topic) return;
    hasTrackedRef.current = true;
    const minutes = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 60000));
    try {
      await Promise.all([
        aiApi.trackTime({ userId: user.uid, subject, topic, minutes }),
        aiApi.updateConfidence({ userId: user.uid, subject, topic, confidence })
      ]);
    } catch (err) {
      console.error('Error tracking:', err);
    }
  }, [user?.uid, subject, topic, confidence]);

  const handleClose = () => {
    if (result) trackTimeAndConfidence();
    if (onClose) onClose();
  };

  const handleEndSession = () => {
    if (result) trackTimeAndConfidence();
    if (onEndSession) onEndSession();
    else if (onClose) onClose();
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setSelectedTags(mode.id !== 'custom' ? mode.tags : []);
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Please enter a topic'); return; }
    if (selectedTags.length === 0) { setError('Please select at least one content type'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);
    try {
      const data = await aiApi.generateLearning({
        topic: topic.trim(),
        subject: subject.trim(),
        examType: userProfile?.examName || '',
        tags: selectedTags,
      });
      if (data.success) { setResult(data); setStep(3); }
      else { setError(data.error || 'Failed to generate content'); }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!result) return;
    setSaving(true);
    setError('');
    try {
      // Convert content to string if it's an object with sections
      let contentToSave = result.rawContent || '';
      if (result.content?.sections) {
        // Combine all sections into a single string
        contentToSave = Object.entries(result.content.sections)
          .map(([key, value]) => `## ${key.charAt(0).toUpperCase() + key.slice(1)}\n\n${value}`)
          .join('\n\n---\n\n');
      } else if (typeof result.content === 'string') {
        contentToSave = result.content;
      }
      
      console.log('Saving note:', { userId: user.uid, topic, subject, contentLength: contentToSave?.length, tags: selectedTags });
      
      if (!contentToSave) {
        setError('No content to save');
        return;
      }
      
      const data = await aiApi.saveNote({ userId: user.uid, topic, subject, content: contentToSave, tags: selectedTags });
      console.log('Save response:', data);
      
      if (data.success) {
        setSaved(true);
        console.log('Note saved successfully with ID:', data.noteId);
      } else {
        setError(data.error || 'Failed to save notes');
      }
    } catch (err) {
      console.error('Save note error:', err);
      setError(err.message || 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleNewTopic = () => {
    trackTimeAndConfidence();
    setStep(1); setTopic(''); setSubject(''); setSelectedMode(null); setSelectedTags([]);
    setResult(null); setSaved(false); setConfidence(3);
    startTimeRef.current = null; hasTrackedRef.current = false; setTimeSpent(0);
  };

  const canProceedToGenerate = topic.trim() && selectedTags.length > 0;

  // Embedded version for dashboard
  if (embedded) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">Smart Learning Room</h2>
            <p className="text-[#64748B] text-[14px] font-medium mt-1">
              {step === 1 && "What do you want to learn today?"}
              {step === 2 && "How do you want to learn it?"}
              {step === 3 && `Learning: ${topic}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && step < 3 && (
              <button onClick={() => setStep(step - 1)} className="text-sm text-[#4F46E5] hover:underline">← Back</button>
            )}
            <button 
              onClick={handleEndSession}
              className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#EEF2FF] text-[#64748B] rounded-xl text-sm font-medium transition flex items-center gap-1.5 border border-[#E5E7EB]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              End Session
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded-full transition-all ${s <= step ? 'bg-[#4F46E5]' : 'bg-[#E5E7EB]'}`} />
          ))}
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#F87171] p-3 rounded-xl text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Step 1: Topic Input */}
        {step === 1 && (
          <EmbeddedStepOne topic={topic} setTopic={setTopic} subject={subject} setSubject={setSubject}
            userSubjects={userSubjects} onNext={() => setStep(2)} canProceed={topic.trim().length > 0} />
        )}

        {/* Step 2: Mode Selection */}
        {step === 2 && (
          <EmbeddedStepTwo selectedMode={selectedMode} setSelectedMode={handleModeSelect}
            selectedTags={selectedTags} toggleTag={toggleTag} onGenerate={handleGenerate}
            loading={loading} canProceed={canProceedToGenerate} />
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <EmbeddedStepThree result={result} topic={topic} subject={subject} selectedTags={selectedTags}
            timeSpent={timeSpent} confidence={confidence} setConfidence={setConfidence}
            onSave={handleSaveNotes} saving={saving} saved={saved} onNewTopic={handleNewTopic} />
        )}
      </div>
    );
  }

  // Modal version (fallback)
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white relative overflow-hidden">
          <div className="relative flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">🧠</span>
                Smart Learning Room
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                {step === 1 && "What do you want to learn today?"}
                {step === 2 && "How do you want to learn it?"}
                {step === 3 && `Learning: ${topic}`}
              </p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {step < 3 && (
            <div className="flex gap-2 mt-4">
              {[1, 2].map((s) => (<div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-white' : 'bg-white/30'}`} />))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">⚠️ {error}</div>}
          {step === 1 && <EmbeddedStepOne topic={topic} setTopic={setTopic} subject={subject} setSubject={setSubject} userSubjects={userSubjects} onNext={() => setStep(2)} canProceed={topic.trim().length > 0} />}
          {step === 2 && <EmbeddedStepTwo selectedMode={selectedMode} setSelectedMode={handleModeSelect} selectedTags={selectedTags} toggleTag={toggleTag} onBack={() => setStep(1)} onGenerate={handleGenerate} loading={loading} canProceed={canProceedToGenerate} />}
          {step === 3 && result && <EmbeddedStepThree result={result} topic={topic} subject={subject} selectedTags={selectedTags} timeSpent={timeSpent} confidence={confidence} setConfidence={setConfidence} onSave={handleSaveNotes} saving={saving} saved={saved} onNewTopic={handleNewTopic} />}
        </div>
      </div>
    </div>
  );
};

// Embedded Step 1: Topic Input
const EmbeddedStepOne = ({ topic, setTopic, subject, setSubject, userSubjects, onNext, canProceed }) => {
  const { user, userProfile } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchPopularTopics();
    }
  }, [userProfile]);

  const fetchPopularTopics = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await aiApi.getPopularTopics({
        userId: user?.uid,
        examName: userProfile?.examName || '',
        subjects: userProfile?.subjects || [],
        topics: userProfile?.topics || {},
      });
      if (data.success && data.topics?.length > 0) {
        setSuggestions(data.topics);
      } else {
        // Fallback to subject-based defaults
        setSuggestions(getDefaultTopics());
      }
    } catch (err) {
      console.error('Error fetching popular topics:', err);
      setSuggestions(getDefaultTopics());
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getDefaultTopics = () => {
    const subjects = userProfile?.subjects || [];
    const defaults = [];
    
    // Generate defaults based on user's subjects
    subjects.forEach(subj => {
      const subjectLower = subj.toLowerCase();
      if (subjectLower.includes('physics')) {
        defaults.push("Newton's Laws", "Electromagnetic Induction");
      } else if (subjectLower.includes('chemistry')) {
        defaults.push("Chemical Bonding", "Organic Reactions");
      } else if (subjectLower.includes('math')) {
        defaults.push("Integration", "Quadratic Equations");
      } else if (subjectLower.includes('biology')) {
        defaults.push("Cell Division", "Photosynthesis");
      } else if (subjectLower.includes('history')) {
        defaults.push("French Revolution", "World War II");
      } else {
        defaults.push(`${subj} Basics`);
      }
    });
    
    return defaults.slice(0, 6);
  };

  // Generate dynamic placeholder based on user's subjects
  const getPlaceholder = () => {
    const subjects = userProfile?.subjects || [];
    if (subjects.length === 0) return "e.g., Newton's Laws of Motion, Photosynthesis...";
    
    const examples = [];
    subjects.slice(0, 2).forEach(subj => {
      const subjectLower = subj.toLowerCase();
      if (subjectLower.includes('physics')) examples.push("Newton's Laws");
      else if (subjectLower.includes('chemistry')) examples.push("Chemical Bonding");
      else if (subjectLower.includes('math')) examples.push("Integration");
      else if (subjectLower.includes('biology')) examples.push("Photosynthesis");
      else if (subjectLower.includes('history')) examples.push("French Revolution");
      else if (subjectLower.includes('economics')) examples.push("Supply and Demand");
      else if (subjectLower.includes('english')) examples.push("Grammar Rules");
      else if (subjectLower.includes('geography')) examples.push("Climate Zones");
      else if (subjectLower.includes('polity') || subjectLower.includes('civics')) examples.push("Fundamental Rights");
      else examples.push(`${subj} concepts`);
    });
    
    return `e.g., ${examples.join(', ')}...`;
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Input Area */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow">
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">What topic do you want to learn?</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none text-lg" autoFocus />
          
          {!topic && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#64748B] flex items-center gap-1">
                  {loadingSuggestions ? (
                    <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Loading suggestions...</>
                  ) : (
                    <>✨ Recommended for you:</>
                  )}
                </p>
                {!loadingSuggestions && (
                  <button onClick={fetchPopularTopics} className="text-xs text-[#4F46E5] hover:text-[#6366F1] flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((t, i) => (
                  <button key={i} onClick={() => setTopic(t)}
                    className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#EEF2FF] hover:text-[#4F46E5] rounded-full text-sm text-[#64748B] transition border border-[#E5E7EB]">{t}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow">
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">
            Subject <span className="font-normal text-[#64748B]">(helps AI give better answers)</span>
          </label>
          {userSubjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userSubjects.map((s, i) => (
                <button key={i} onClick={() => setSubject(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${subject === s ? 'bg-[#4F46E5] text-white' : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#EEF2FF] border border-[#E5E7EB]'}`}>{s}</button>
              ))}
              <button onClick={() => setSubject('')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${!subject ? 'bg-[#4F46E5] text-white' : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#EEF2FF] border border-[#E5E7EB]'}`}>Other</button>
            </div>
          ) : (
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Physics, Biology, Mathematics..."
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none" />
          )}
        </div>

        <button onClick={onNext} disabled={!canProceed}
          className="w-full py-4 bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#818CF8] text-white rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-lift">
          Continue <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Tips Sidebar */}
      <div className="space-y-4">
        <div className="bg-[#EEF2FF] rounded-2xl border border-[#C7D2FE] p-4 card-shadow">
          <h4 className="font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-sm">🧠</span>
            How it works
          </h4>
          <ol className="space-y-2 text-sm text-[#0F172A]">
            <li className="flex items-start gap-2"><span className="w-5 h-5 bg-[#4F46E5] text-white rounded-full flex items-center justify-center text-xs shrink-0">1</span>Enter your topic</li>
            <li className="flex items-start gap-2"><span className="w-5 h-5 bg-[#4F46E5] text-white rounded-full flex items-center justify-center text-xs shrink-0">2</span>Choose learning mode</li>
            <li className="flex items-start gap-2"><span className="w-5 h-5 bg-[#4F46E5] text-white rounded-full flex items-center justify-center text-xs shrink-0">3</span>Get AI-generated content</li>
          </ol>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 card-shadow">
          <h4 className="font-semibold text-[#0F172A] mb-2 text-sm">💡 Pro Tips</h4>
          <ul className="space-y-1 text-xs text-[#64748B]">
            <li>• Be specific with your topic</li>
            <li>• Select your subject for better context</li>
            <li>• Use "Revise" mode before exams</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Embedded Step 2: Mode Selection
const EmbeddedStepTwo = ({ selectedMode, setSelectedMode, selectedTags, toggleTag, onBack, onGenerate, loading, canProceed }) => {
  const modeColors = {
    indigo: 'from-[#4F46E5] to-[#6366F1] border-[#C7D2FE]',
    emerald: 'from-[#10B981] to-[#34D399] border-[#A7F3D0]',
    slate: 'from-[#64748B] to-[#94A3B8] border-[#E5E7EB]',
  };

  return (
    <div className="space-y-6">
      {/* Learning Modes */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow">
        <label className="block text-sm font-semibold text-[#0F172A] mb-4">Choose your learning mode</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LEARNING_MODES.map((mode) => (
            <button key={mode.id} onClick={() => setSelectedMode(mode)}
              className={`p-4 rounded-2xl border-2 text-left topic-card ${
                selectedMode?.id === mode.id
                  ? `${modeColors[mode.color].split(' ')[2]} bg-gradient-to-br ${modeColors[mode.color].split(' ').slice(0, 2).join(' ')} text-white`
                  : 'border-[#E5E7EB] hover:border-[#C7D2FE] bg-white'
              }`}>
              <div className="text-2xl mb-2">{mode.icon}</div>
              <div className={`font-semibold text-sm ${selectedMode?.id === mode.id ? 'text-white' : 'text-[#0F172A]'}`}>{mode.label}</div>
              <div className={`text-xs mt-1 ${selectedMode?.id === mode.id ? 'text-white/80' : 'text-[#64748B]'}`}>{mode.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Tags */}
      {selectedMode?.id === 'custom' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow">
          <label className="block text-sm font-semibold text-[#0F172A] mb-3">Select content types</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ALL_TAGS.map((tag) => (
              <button key={tag.id} onClick={() => toggleTag(tag.id)}
                className={`p-3 rounded-xl border text-left topic-card ${selectedTags.includes(tag.id) ? 'border-[#4F46E5] bg-[#EEF2FF]' : 'border-[#E5E7EB] hover:border-[#C7D2FE]'}`}>
                <div className="flex items-center gap-2">
                  <span>{tag.icon}</span>
                  <span className="font-medium text-[#0F172A] text-sm">{tag.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Tags Preview */}
      {selectedTags.length > 0 && (
        <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E5E7EB]">
          <p className="text-sm text-[#64748B] mb-2">Content that will be generated:</p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tagId) => {
              const tag = ALL_TAGS.find(t => t.id === tagId);
              return <span key={tagId} className="px-3 py-1 bg-white border border-[#E5E7EB] rounded-full text-sm text-[#0F172A] flex items-center gap-1">{tag?.icon} {tag?.label}</span>;
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onBack && <button onClick={onBack} className="px-6 py-3 bg-[#F8FAFC] text-[#64748B] rounded-2xl font-medium hover:bg-[#EEF2FF] transition btn-lift border border-[#E5E7EB]">← Back</button>}
        <button onClick={onGenerate} disabled={loading || !canProceed}
          className="flex-1 py-3 bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#818CF8] text-white rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-lift">
          {loading ? (<><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</>) : (<>✨ Generate Content</>)}
        </button>
      </div>
    </div>
  );
};

// Embedded Step 3: Results
const EmbeddedStepThree = ({ result, topic, subject, selectedTags, timeSpent, confidence, setConfidence, onSave, saving, saved, onNewTopic }) => {
  const [activeSection, setActiveSection] = useState(selectedTags[0]);
  const content = result.content?.sections || {};
  const formatTime = (seconds) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${secs.toString().padStart(2, '0')}`; };
  const tagLabels = { brief: { label: 'Brief', icon: '📝' }, detailed: { label: 'Detailed', icon: '📚' }, questions: { label: 'Questions', icon: '❓' }, analogy: { label: 'Analogy', icon: '💡' }, dosdonts: { label: "Do's & Don'ts", icon: '✅' }, exampoints: { label: 'Exam Points', icon: '🎯' }, quickrevision: { label: 'Revision', icon: '⚡' }, mistakes: { label: 'Mistakes', icon: '⚠️' } };

  return (
    <div className="space-y-5">
      {/* Topic Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 card-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-[#0F172A]">{topic}</h3>
            <p className="text-sm text-[#64748B] flex items-center gap-2 mt-1">
              {subject && <span className="bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E5E7EB]">{subject}</span>}
              <span>⏱️ {formatTime(timeSpent)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onSave} disabled={saving || saved}
              className={`px-4 py-2 rounded-xl font-medium transition text-sm ${saved ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#C7D2FE]'}`}>
              {saved ? '✓ Saved' : saving ? 'Saving...' : '💾 Save'}
            </button>
            <button onClick={onNewTopic} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition text-sm">+ New Topic</button>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2.5">
        {selectedTags.map((tag) => (
          <button key={tag} onClick={() => setActiveSection(tag)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-1.5 btn-lift ${activeSection === tag ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            {tagLabels[tag]?.icon} {tagLabels[tag]?.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[400px] card-shadow">
        {content[activeSection] ? (
          <ContentRenderer content={content[activeSection]} />
        ) : result.rawContent ? (
          <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">{result.rawContent}</pre>
        ) : (
          <p className="text-slate-500 text-center py-8">No content available for this section</p>
        )}
      </div>

      {/* Confidence Rating */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-medium text-slate-800">How well do you understand this topic now?</p>
            <p className="text-sm text-slate-500">This helps us track your progress</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button key={level} onClick={() => setConfidence(level)}
                className={`w-10 h-10 rounded-lg font-medium transition ${confidence >= level ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 border border-slate-200 hover:border-emerald-300'}`}>{level}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Content Renderer with study-optimized formatting
const ContentRenderer = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!content) return null;

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse inline formatting (bold, italic, code, highlights)
  const parseInlineFormatting = (text) => {
    if (!text) return text;
    
    const parts = [];
    let remaining = text;
    let keyIndex = 0;

    // Process inline code first
    while (remaining.includes('`')) {
      const match = remaining.match(/`([^`]+)`/);
      if (match) {
        const beforeCode = remaining.substring(0, match.index);
        if (beforeCode) parts.push(beforeCode);
        parts.push(
          <code key={`code-${keyIndex++}`} className="px-1.5 py-0.5 bg-slate-100 text-emerald-700 rounded text-sm font-mono">
            {match[1]}
          </code>
        );
        remaining = remaining.substring(match.index + match[0].length);
      } else break;
    }
    if (remaining) parts.push(remaining);

    // Process bold text
    return parts.map((part, i) => {
      if (typeof part !== 'string') return part;
      if (part.includes('**')) {
        const boldParts = part.split(/\*\*(.*?)\*\*/g);
        return boldParts.map((bp, j) => 
          j % 2 === 1 ? <strong key={`bold-${i}-${j}`} className="text-slate-900 font-semibold">{bp}</strong> : bp
        );
      }
      return part;
    });
  };

  // Check if line is a formula/equation
  const isFormula = (line) => {
    return line.includes('=') && (
      line.match(/[A-Za-z]\s*=\s*[A-Za-z0-9\s+\-*/^()]+/) ||
      line.match(/^\s*[A-Z][a-z]*\s*=/) ||
      line.match(/\b(sin|cos|tan|log|ln|sqrt|∫|∑|∏|Δ|π|θ|α|β|γ)\b/i)
    );
  };

  // Check if line is a key point/definition
  const isKeyPoint = (line) => {
    return line.match(/^(Definition|Key Point|Remember|Note|Tip|Formula|Theorem|Law|Principle|Rule):/i) ||
           line.match(/^(📌|🔑|💡|📝|⚡|🎯)/);
  };

  // Check if line is an example
  const isExample = (line) => {
    return line.match(/^(Example|E\.g\.|For example|Consider|Suppose|Let's say):/i) ||
           line.match(/^(🔹|📍|➡️)/);
  };

  const renderLine = (line, index, lines) => {
    const trimmedLine = line.trim();
    
    // Empty line - add spacing
    if (!trimmedLine) {
      return <div key={index} className="h-3" />;
    }

    // Headers with enhanced styling
    if (trimmedLine.startsWith('###')) {
      return (
        <h4 key={index} className="text-base font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
          {trimmedLine.replace(/^#+\s*/, '')}
        </h4>
      );
    }
    if (trimmedLine.startsWith('##')) {
      return (
        <h3 key={index} className="text-lg font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          {trimmedLine.replace(/^#+\s*/, '')}
        </h3>
      );
    }
    if (trimmedLine.startsWith('#')) {
      return (
        <h2 key={index} className="text-xl font-bold text-slate-800 mt-6 mb-4 pb-2 border-b-2 border-emerald-200 flex items-center gap-3">
          <span className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded"></span>
          {trimmedLine.replace(/^#+\s*/, '')}
        </h2>
      );
    }

    // Questions - blue card styling
    if (trimmedLine.match(/^Q\d*[.:]/i) || trimmedLine.match(/^Question\s*\d*/i)) {
      return (
        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-xl mt-5 mb-2 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-lg">❓</span>
            <p className="font-semibold text-blue-900 leading-relaxed">{parseInlineFormatting(trimmedLine)}</p>
          </div>
        </div>
      );
    }

    // Answers - green card styling
    if (trimmedLine.match(/^(A\d*[.:])|(Answer:?)|(Ans:?)|(Solution:?)/i)) {
      return (
        <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-r-xl mb-4 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-500 text-lg">✅</span>
            <p className="text-green-900 leading-relaxed">{parseInlineFormatting(trimmedLine)}</p>
          </div>
        </div>
      );
    }

    // Do's - green styling
    if (trimmedLine.startsWith('✅') || trimmedLine.match(/^Do:/i) || trimmedLine.match(/^Do\s*\d+:/i)) {
      const cleanText = trimmedLine.replace(/^✅\s*/, '').replace(/^Do:?\s*/i, '').replace(/^Do\s*\d+:\s*/i, '');
      return (
        <div key={index} className="flex items-start gap-3 bg-green-50 border border-green-200 p-3 rounded-xl my-2 hover:bg-green-100 transition">
          <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm shrink-0">✓</span>
          <p className="text-green-800 leading-relaxed">{parseInlineFormatting(cleanText)}</p>
        </div>
      );
    }

    // Don'ts - red styling
    if (trimmedLine.startsWith('❌') || trimmedLine.match(/^Don'?t:/i) || trimmedLine.match(/^Don'?t\s*\d+:/i)) {
      const cleanText = trimmedLine.replace(/^❌\s*/, '').replace(/^Don'?t:?\s*/i, '').replace(/^Don'?t\s*\d+:\s*/i, '');
      return (
        <div key={index} className="flex items-start gap-3 bg-red-50 border border-red-200 p-3 rounded-xl my-2 hover:bg-red-100 transition">
          <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm shrink-0">✗</span>
          <p className="text-red-800 leading-relaxed">{parseInlineFormatting(cleanText)}</p>
        </div>
      );
    }

    // Important/Star points - amber card
    if (trimmedLine.includes('⭐') || trimmedLine.match(/^\*\*Important/i) || trimmedLine.match(/^Important:/i)) {
      return (
        <div key={index} className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 p-4 rounded-xl my-3 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg">⭐</span>
            <p className="text-amber-900 font-medium leading-relaxed">{parseInlineFormatting(trimmedLine.replace(/^⭐\s*/, '').replace(/^\*\*Important:?\*\*\s*/i, '').replace(/^Important:\s*/i, ''))}</p>
          </div>
        </div>
      );
    }

    // Key Points/Definitions - teal card with icon
    if (isKeyPoint(trimmedLine)) {
      return (
        <div key={index} className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 p-4 rounded-xl my-3 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-teal-600 text-lg">🔑</span>
            <p className="text-teal-900 leading-relaxed">{parseInlineFormatting(trimmedLine)}</p>
          </div>
        </div>
      );
    }

    // Examples - purple styling
    if (isExample(trimmedLine)) {
      return (
        <div key={index} className="bg-gradient-to-r from-purple-50 to-violet-50 border-l-4 border-purple-400 p-4 rounded-r-xl my-3">
          <div className="flex items-start gap-2">
            <span className="text-purple-500">📍</span>
            <p className="text-purple-900 leading-relaxed">{parseInlineFormatting(trimmedLine)}</p>
          </div>
        </div>
      );
    }

    // Formulas - special card with copy button
    if (isFormula(trimmedLine)) {
      return (
        <div key={index} className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl my-3 shadow-lg group relative">
          <div className="flex items-center justify-between">
            <code className="text-emerald-400 font-mono text-base tracking-wide">{trimmedLine}</code>
            <button
              onClick={() => copyToClipboard(trimmedLine, index)}
              className="opacity-0 group-hover:opacity-100 transition p-1.5 hover:bg-slate-700 rounded-lg"
              title="Copy formula"
            >
              {copiedIndex === index ? (
                <span className="text-green-400 text-xs">Copied!</span>
              ) : (
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      );
    }

    // Tips/Notes - light blue info card
    if (trimmedLine.match(/^(Tip|Note|Hint|Pro tip):/i) || trimmedLine.startsWith('💡')) {
      return (
        <div key={index} className="bg-sky-50 border border-sky-200 p-3 rounded-xl my-2 flex items-start gap-2">
          <span className="text-sky-500">💡</span>
          <p className="text-sky-800 text-sm leading-relaxed">{parseInlineFormatting(trimmedLine.replace(/^(Tip|Note|Hint|Pro tip):\s*/i, '').replace(/^💡\s*/, ''))}</p>
        </div>
      );
    }

    // Warning/Caution - orange card
    if (trimmedLine.match(/^(Warning|Caution|⚠️|Common mistake)/i)) {
      return (
        <div key={index} className="bg-orange-50 border border-orange-300 p-3 rounded-xl my-2 flex items-start gap-2">
          <span className="text-orange-500">⚠️</span>
          <p className="text-orange-800 leading-relaxed">{parseInlineFormatting(trimmedLine.replace(/^(Warning|Caution|Common mistake):?\s*/i, '').replace(/^⚠️\s*/, ''))}</p>
        </div>
      );
    }

    // Bullet points - styled list
    if (trimmedLine.match(/^[-•*]\s/)) {
      return (
        <div key={index} className="flex items-start gap-3 my-2 ml-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shrink-0"></span>
          <p className="text-slate-700 leading-relaxed">{parseInlineFormatting(trimmedLine.replace(/^[-•*]\s/, ''))}</p>
        </div>
      );
    }

    // Numbered list - styled
    if (trimmedLine.match(/^\d+\.\s/)) {
      const num = trimmedLine.match(/^(\d+)\./)[1];
      return (
        <div key={index} className="flex items-start gap-3 my-2 ml-2">
          <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">{num}</span>
          <p className="text-slate-700 leading-relaxed">{parseInlineFormatting(trimmedLine.replace(/^\d+\.\s/, ''))}</p>
        </div>
      );
    }

    // Code blocks
    if (trimmedLine.startsWith('```')) {
      return null; // Handle multi-line code blocks separately if needed
    }

    // Regular paragraph with inline formatting
    return (
      <p key={index} className="text-slate-700 my-2 leading-relaxed text-[15px]">
        {parseInlineFormatting(trimmedLine)}
      </p>
    );
  };

  const lines = content.split('\n');
  
  return (
    <div className="study-content space-y-1">
      {lines.map((line, index) => renderLine(line, index, lines))}
    </div>
  );
};

export default SmartLearningRoom;
