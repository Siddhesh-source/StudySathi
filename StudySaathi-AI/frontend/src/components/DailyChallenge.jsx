import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

/**
 * DailyChallenge Component
 * AI-generated daily challenge quiz with bonus question.
 * Props: subject, topic, examType
 */
const DailyChallenge = ({ subject, topic, examType }) => {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [bonusAnswer, setBonusAnswer] = useState('');

  const generateChallenge = async () => {
    if (!subject || !topic) return;
    setLoading(true);
    setChallenge(null);
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setBonusAnswer('');
    try {
      const data = await aiApi.generateDailyChallenge({
        subject,
        topic,
        examType: examType || '',
        userId: user?.uid,
      });
      if (data.success) setChallenge(data);
    } catch (err) {
      console.error('Daily challenge error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qIndex, option) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length === 0) return;
    setSubmitted(true);

    // Parse score from challenge text (simple heuristic)
    // In a real app, the backend would return structured data
    const correct = Object.keys(answers).filter(qi => {
      const text = challenge?.text || '';
      const answerMatch = text.match(new RegExp(`Q${parseInt(qi) + 1}[^\\n]*\\n[^\\n]*\\n[^\\n]*\\n[^\\n]*\\nAnswer:\\s*([a-d])`, 'i'));
      return answerMatch && answerMatch[1].toLowerCase() === answers[qi].toLowerCase();
    });
    setScore(correct.length);
  };

  const getScoreColor = () => {
    if (score === null) return '';
    if (score === 3) return 'text-green-600';
    if (score >= 2) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            ⚡ Daily Challenge
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">
            {subject && topic ? `${subject} • ${topic}` : 'Select a topic to start'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">+XP Bonus</span>
        </div>
      </div>

      {/* Generate button */}
      {!challenge && !loading && (
        <div className="text-center py-6">
          <div className="text-5xl mb-3">⚡</div>
          <p className="text-gray-500 text-sm mb-4">
            Test your knowledge with today's AI-generated challenge!
          </p>
          <button
            onClick={generateChallenge}
            disabled={!subject || !topic}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition shadow-lg"
          >
            🎯 Start Challenge
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Generating your challenge...</p>
        </div>
      )}

      {/* Challenge content */}
      {challenge && !loading && (
        <div className="space-y-4">
          {/* Raw text display — nicely formatted */}
          <div className="bg-amber-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-xs">
            {challenge.text}
          </div>

          {/* Simple MCQ interface — 3 questions */}
          {!submitted && (
            <div className="space-y-3">
              {[1, 2, 3].map((qNum) => (
                <div key={qNum} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Question {qNum}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(qNum - 1, opt)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition ${
                          answers[qNum - 1] === opt
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        ({opt})
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Bonus question */}
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-purple-700 mb-2">🌟 Bonus: Think Deeper</p>
                <textarea
                  value={bonusAnswer}
                  onChange={e => setBonusAnswer(e.target.value)}
                  placeholder="Write your answer here..."
                  rows={2}
                  className="w-full text-xs border border-purple-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < 3}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition"
              >
                Submit Answers
              </button>
            </div>
          )}

          {/* Score */}
          {submitted && (
            <div className="text-center py-4">
              <div className={`text-4xl font-bold ${getScoreColor()}`}>{score}/3</div>
              <p className="text-gray-600 text-sm mt-1">
                {score === 3 ? '🎉 Perfect score! You nailed it!' :
                 score === 2 ? '👏 Great effort! Almost there!' :
                 score === 1 ? '💪 Keep practicing!' :
                 '📚 Review the topic and try again!'}
              </p>
              {bonusAnswer && (
                <div className="mt-3 bg-purple-50 rounded-xl p-3 text-left">
                  <p className="text-xs font-semibold text-purple-700 mb-1">Your Bonus Answer:</p>
                  <p className="text-xs text-gray-600">{bonusAnswer}</p>
                </div>
              )}
              <button
                onClick={generateChallenge}
                className="mt-4 px-5 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-200 transition"
              >
                🔄 Try Another Challenge
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyChallenge;
