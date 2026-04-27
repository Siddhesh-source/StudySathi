import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

const CognitiveLoadAlert = () => {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) fetchAssessment();
  }, [user]);

  const fetchAssessment = async () => {
    setLoading(true);
    try {
      const data = await aiApi.getCognitiveLoad(user.uid);
      if (data.success) setAssessment(data.assessment);
    } catch (err) {
      console.error('Cognitive load fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !assessment || dismissed) return null;

  const { burnout, overload, wellbeing } = assessment;
  const anyAlert = burnout.detected || overload.detected;

  if (!anyAlert) return null;

  const primaryAlert = burnout.severityScore > overload.severityScore ? burnout : overload;
  const alertType = burnout.severityScore > overload.severityScore ? 'Burnout' : 'Overload';

  const levelColors = {
    low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    medium: 'bg-orange-50 border-orange-200 text-orange-800',
    high: 'bg-red-50 border-red-200 text-red-800',
    critical: 'bg-red-100 border-red-300 text-red-900',
  };

  const levelEmojis = {
    low: '⚠️',
    medium: '🔶',
    high: '🚨',
    critical: '🛑',
  };

  return (
    <div className={`rounded-2xl border-2 p-4 ${levelColors[primaryAlert.level]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levelEmojis[primaryAlert.level]}</span>
          <div>
            <div className="font-bold text-sm">{alertType} Detected</div>
            <div className="text-xs opacity-75 mt-0.5">Level: {primaryAlert.level}</div>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-xs opacity-50 hover:opacity-100">✕</button>
      </div>

      {primaryAlert.recommendation && (
        <div className="bg-white/50 rounded-lg p-3 mb-3">
          <div className="text-sm font-medium mb-1">{primaryAlert.recommendation.message}</div>
          <div className="text-xs opacity-75">Action: {primaryAlert.recommendation.action}</div>
        </div>
      )}

      <div className="space-y-2">
        {primaryAlert.signals.slice(0, 3).map((signal, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="opacity-50">•</span>
            <span>{signal.message}</span>
          </div>
        ))}
      </div>

      {(burnout.detected && overload.detected) && (
        <div className="mt-3 pt-3 border-t border-current/20 text-xs opacity-75">
          Both burnout and overload signals detected. Consider taking a full rest day.
        </div>
      )}
    </div>
  );
};

export default CognitiveLoadAlert;
