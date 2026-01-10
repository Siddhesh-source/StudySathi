import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

const QuickDoubt = ({ embedded = false, onClose }) => {
  const { user, userProfile } = useAuth();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const answerRef = useRef(null);

  // Fetch smart suggestions on mount
  useEffect(() => {
    if (userProfile) {
      fetchSmartSuggestions();
    }
  }, [userProfile]);

  const fetchSmartSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await aiApi.getSmartSuggestions({
        userId: user?.uid,
        examName: userProfile?.examName || '',
        subjects: userProfile?.subjects || [],
        topics: userProfile?.topics || {},
        weakSubjects: userProfile?.weakSubjects || {},
      });
      if (data.success && data.suggestions?.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        // Fallback suggestions based on user's subjects
        setSuggestions(getDefaultSuggestions());
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      // Use default suggestions on error - don't block the UI
      setSuggestions(getDefaultSuggestions());
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getDefaultSuggestions = () => {
    const subjects = userProfile?.subjects || [];
    const examName = userProfile?.examName || 'exam';
    
    const defaults = [];
    if (subjects.includes('Physics') || subjects.includes('physics')) {
      defaults.push(`Explain Newton's laws with real examples`);
    }
    if (subjects.includes('Chemistry') || subjects.includes('chemistry')) {
      defaults.push(`What are the important reactions for ${examName}?`);
    }
    if (subjects.includes('Mathematics') || subjects.includes('Maths') || subjects.includes('maths')) {
      defaults.push(`How to solve integration problems faster?`);
    }
    if (subjects.includes('Biology') || subjects.includes('biology')) {
      defaults.push(`Explain cell division in simple terms`);
    }
    
    // Add generic ones if not enough
    while (defaults.length < 4) {
      const generic = [
        `What are the most important topics for ${examName}?`,
        `How to manage time during ${examName}?`,
        `Common mistakes to avoid in ${examName}?`,
        `Best revision strategy for ${examName}?`,
      ];
      defaults.push(generic[defaults.length]);
    }
    
    return defaults.slice(0, 6);
  };

  const handleAsk = async (questionText = question) => {
    const q = questionText.trim();
    if (!q) {
      setError('Please enter your question');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await aiApi.askDoubt({
        question: q,
        context: {
          examType: userProfile?.examName || '',
          subjects: userProfile?.subjects || [],
        },
      });

      if (data.success) {
        const newEntry = {
          question: q,
          answer: data.answer || data.text,
          timestamp: new Date(),
        };
        setConversationHistory(prev => [newEntry, ...prev]);
        setAnswer(data.answer || data.text);
        setQuestion('');
        
        // Scroll to answer
        setTimeout(() => {
          answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setError(data.error || 'Failed to get answer');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuestion(suggestion);
    handleAsk(suggestion);
  };

  const clearConversation = () => {
    setConversationHistory([]);
    setAnswer(null);
    setQuestion('');
  };

  // Embedded version (for dashboard)
  if (embedded) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden h-full flex flex-col card-shadow">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#818CF8] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">❓</span>
              <div>
                <h3 className="font-display font-semibold text-base tracking-tight">Ask a Doubt</h3>
                <p className="text-indigo-100 text-xs font-medium">Get instant AI explanations</p>
              </div>
            </div>
            {conversationHistory.length > 0 && (
              <button 
                onClick={clearConversation}
                className="text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Smart Suggestions */}
          {!answer && conversationHistory.length === 0 && (
            <div>
              <p className="text-xs text-[#64748B] mb-2.5 flex items-center gap-1.5 font-medium">
                {loadingSuggestions ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading smart suggestions...
                  </>
                ) : (
                  <>✨ Smart suggestions for you</>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    disabled={loading}
                    className="px-3 py-2 bg-[#F8FAFC] hover:bg-[#EEF2FF] hover:text-[#4F46E5] border border-[#E5E7EB] hover:border-[#C7D2FE] rounded-xl text-[13px] text-[#475569] transition text-left disabled:opacity-50 leading-relaxed font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
              {!loadingSuggestions && (
                <button
                  onClick={fetchSmartSuggestions}
                  className="mt-3 text-xs text-[#4F46E5] hover:text-[#6366F1] flex items-center gap-1.5 font-semibold"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh suggestions
                </button>
              )}
            </div>
          )}

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="space-y-4" ref={answerRef}>
              {conversationHistory.map((entry, index) => (
                <div key={index} className="space-y-2">
                  {/* Question */}
                  <div className="flex justify-end">
                    <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl rounded-br-sm px-3.5 py-2.5 max-w-[85%]">
                      <p className="text-[13px] text-[#4F46E5] font-medium leading-relaxed">{entry.question}</p>
                    </div>
                  </div>
                  {/* Answer */}
                  <div className="flex justify-start">
                    <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl rounded-bl-sm px-3.5 py-2.5 max-w-[95%]">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-5 h-5 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center text-white text-[10px] font-semibold">AI</span>
                        <span className="text-[10px] text-[#64748B] font-medium">StudySaathi</span>
                      </div>
                      <div className="prose prose-sm max-w-none text-[#0F172A]">
                        <AnswerRenderer content={entry.answer} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-[#FEF2F2] text-[#F87171] p-3 rounded-xl text-[13px] border border-[#FECACA] font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3.5 border-t border-[#E5E7EB] bg-[#F8FAFC]">
          <div className="flex gap-2.5">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your doubt..."
              className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none"
              disabled={loading}
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 btn-lift"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal version (fallback)
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-5 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">❓</span>
                Ask a Doubt
              </h2>
              <p className="text-cyan-100 text-sm mt-1">Get instant AI-powered explanations</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {!answer ? (
            <>
              {/* Question Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to know?
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question here... (Press Enter to ask)"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none"
                  autoFocus
                />
              </div>

              {/* Smart Suggestions */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  {loadingSuggestions ? (
                    <>
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading smart suggestions...
                    </>
                  ) : (
                    <>✨ Smart suggestions for you:</>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(s)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-cyan-50 hover:text-cyan-600 rounded-full text-sm text-gray-600 transition disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Ask Button */}
              <button
                onClick={() => handleAsk()}
                disabled={loading || !question.trim()}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Thinking...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Get Answer
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Question Display */}
              <div className="mb-4 p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                <p className="text-sm text-cyan-600 font-medium mb-1">Your Question</p>
                <p className="text-gray-800">{conversationHistory[0]?.question}</p>
              </div>

              {/* Answer Display */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 font-medium mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs">AI</span>
                  Answer
                </p>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="prose prose-sm max-w-none">
                    <AnswerRenderer content={answer} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAnswer(null);
                    setQuestion('');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Ask Another Question
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl font-medium hover:from-cyan-700 hover:to-teal-700 transition"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Answer renderer component with study-optimized formatting
const AnswerRenderer = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!content) return null;

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse inline formatting (bold, italic, code)
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
          <code key={`code-${keyIndex++}`} className="px-1.5 py-0.5 bg-slate-100 text-cyan-700 rounded text-xs font-mono">
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

  const renderLine = (line, index) => {
    const trimmedLine = line.trim();
    
    // Empty line
    if (!trimmedLine) return <div key={index} className="h-2" />;

    // Headers
    if (trimmedLine.startsWith('###')) {
      return (
        <h4 key={index} className="text-sm font-bold text-slate-800 mt-4 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
          {trimmedLine.replace(/^#+\s*/, '')}
        </h4>
      );
    }
    if (trimmedLine.startsWith('##')) {
      return (
        <h3 key={index} className="text-base font-bold text-slate-800 mt-4 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
          {trimmedLine.replace(/^#+\s*/, '')}
        </h3>
      );
    }
    if (trimmedLine.startsWith('#')) {
      return (
        <h2 key={index} className="text-lg font-bold text-slate-800 mt-4 mb-2 pb-1 border-b border-cyan-200">
          {trimmedLine.replace(/^#+\s*/, '')}
        </h2>
      );
    }

    // Questions
    if (trimmedLine.match(/^Q\d*[.:]/i) || trimmedLine.match(/^Question/i)) {
      return (
        <div key={index} className="bg-blue-50 border-l-3 border-blue-500 p-2.5 rounded-r-lg mt-3 mb-1">
          <p className="font-medium text-blue-800 text-sm">{parseInlineFormatting(trimmedLine)}</p>
        </div>
      );
    }

    // Answers
    if (trimmedLine.match(/^(A\d*[.:])|(Answer:?)|(Ans:?)|(Solution:?)/i)) {
      return (
        <div key={index} className="bg-green-50 border-l-3 border-green-500 p-2.5 rounded-r-lg mb-2">
          <p className="text-green-800 text-sm">{parseInlineFormatting(trimmedLine)}</p>
        </div>
      );
    }

    // Do's
    if (trimmedLine.startsWith('✅') || trimmedLine.match(/^Do:/i)) {
      const cleanText = trimmedLine.replace(/^✅\s*/, '').replace(/^Do:?\s*/i, '');
      return (
        <div key={index} className="flex items-start gap-2 bg-green-50 border border-green-200 p-2 rounded-lg my-1.5">
          <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs shrink-0">✓</span>
          <p className="text-green-800 text-sm">{parseInlineFormatting(cleanText)}</p>
        </div>
      );
    }

    // Don'ts
    if (trimmedLine.startsWith('❌') || trimmedLine.match(/^Don'?t:/i)) {
      const cleanText = trimmedLine.replace(/^❌\s*/, '').replace(/^Don'?t:?\s*/i, '');
      return (
        <div key={index} className="flex items-start gap-2 bg-red-50 border border-red-200 p-2 rounded-lg my-1.5">
          <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shrink-0">✗</span>
          <p className="text-red-800 text-sm">{parseInlineFormatting(cleanText)}</p>
        </div>
      );
    }

    // Important points
    if (trimmedLine.includes('⭐') || trimmedLine.match(/^\*\*Important/i) || trimmedLine.match(/^Important:/i)) {
      return (
        <div key={index} className="bg-amber-50 border border-amber-300 p-2.5 rounded-lg my-2">
          <p className="text-amber-900 font-medium text-sm flex items-start gap-1.5">
            <span>⭐</span>
            {parseInlineFormatting(trimmedLine.replace(/^⭐\s*/, '').replace(/^\*\*Important:?\*\*\s*/i, '').replace(/^Important:\s*/i, ''))}
          </p>
        </div>
      );
    }

    // Key points/definitions
    if (trimmedLine.match(/^(Definition|Key Point|Remember|Note|Formula|Theorem|Law|Principle):/i) || trimmedLine.match(/^(📌|🔑|💡|📝)/)) {
      return (
        <div key={index} className="bg-teal-50 border border-teal-200 p-2.5 rounded-lg my-2">
          <p className="text-teal-900 text-sm">{parseInlineFormatting(trimmedLine)}</p>
        </div>
      );
    }

    // Examples
    if (trimmedLine.match(/^(Example|E\.g\.|For example):/i) || trimmedLine.match(/^(🔹|📍|➡️)/)) {
      return (
        <div key={index} className="bg-purple-50 border-l-3 border-purple-400 p-2.5 rounded-r-lg my-2">
          <p className="text-purple-900 text-sm">{parseInlineFormatting(trimmedLine)}</p>
        </div>
      );
    }

    // Formulas with copy button
    if (isFormula(trimmedLine)) {
      return (
        <div key={index} className="bg-slate-800 p-3 rounded-lg my-2 group relative">
          <div className="flex items-center justify-between">
            <code className="text-cyan-400 font-mono text-sm">{trimmedLine}</code>
            <button
              onClick={() => copyToClipboard(trimmedLine, index)}
              className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-slate-700 rounded"
              title="Copy formula"
            >
              {copiedIndex === index ? (
                <span className="text-green-400 text-xs">Copied!</span>
              ) : (
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      );
    }

    // Tips/Notes
    if (trimmedLine.match(/^(Tip|Note|Hint|Pro tip):/i) || trimmedLine.startsWith('💡')) {
      return (
        <div key={index} className="bg-sky-50 border border-sky-200 p-2 rounded-lg my-1.5 flex items-start gap-1.5">
          <span className="text-sky-500 text-sm">💡</span>
          <p className="text-sky-800 text-xs">{parseInlineFormatting(trimmedLine.replace(/^(Tip|Note|Hint|Pro tip):\s*/i, '').replace(/^💡\s*/, ''))}</p>
        </div>
      );
    }

    // Warning/Caution
    if (trimmedLine.match(/^(Warning|Caution|⚠️|Common mistake)/i)) {
      return (
        <div key={index} className="bg-orange-50 border border-orange-300 p-2 rounded-lg my-1.5 flex items-start gap-1.5">
          <span className="text-orange-500 text-sm">⚠️</span>
          <p className="text-orange-800 text-sm">{parseInlineFormatting(trimmedLine.replace(/^(Warning|Caution|Common mistake):?\s*/i, '').replace(/^⚠️\s*/, ''))}</p>
        </div>
      );
    }

    // Bullet points
    if (trimmedLine.match(/^[-•*]\s/)) {
      return (
        <div key={index} className="flex items-start gap-2 my-1.5 ml-1">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5 shrink-0"></span>
          <p className="text-slate-700 text-sm">{parseInlineFormatting(trimmedLine.replace(/^[-•*]\s/, ''))}</p>
        </div>
      );
    }

    // Numbered list
    if (trimmedLine.match(/^\d+\.\s/)) {
      const num = trimmedLine.match(/^(\d+)\./)[1];
      return (
        <div key={index} className="flex items-start gap-2 my-1.5 ml-1">
          <span className="w-5 h-5 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">{num}</span>
          <p className="text-slate-700 text-sm">{parseInlineFormatting(trimmedLine.replace(/^\d+\.\s/, ''))}</p>
        </div>
      );
    }

    // Regular paragraph
    return (
      <p key={index} className="text-slate-700 my-1.5 text-sm leading-relaxed">
        {parseInlineFormatting(trimmedLine)}
      </p>
    );
  };

  return (
    <div className="space-y-0.5">
      {content.split('\n').map((line, index) => renderLine(line, index))}
    </div>
  );
};

export default QuickDoubt;
