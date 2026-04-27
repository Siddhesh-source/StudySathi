import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

const ScorePredictor = () => {
  const { user } = useAuth();
  const [irtData, setIrtData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchIRT();
  }, [user]);

  const fetchIRT = async () => {
    setLoading(true);
    try {
      const data = await aiApi.getIRTAbility(user.uid);
      if (data.success) setIrtData(data);
    } catch (err) {
      console.error('IRT fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="bg-white rounded-2xl shadow p-5"><div className="animate-pulse h-24 bg-gray-100 rounded" /></div>;
  if (!irtData) return null;

  const { theta, thetaSE, abilityScore, abilityLabel, nextDifficulty } = irtData;

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">🎯 IRT Ability Estimate</h3>
          <p className="text-gray-500 text-xs mt-0.5">Item Response Theory calibration</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 mb-4 border border-indigo-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">Ability Score</div>
            <div className="text-3xl font-bold text-indigo-600">{abilityScore}</div>
          </div>
          <div className="text-4xl">{abilityLabel.emoji}</div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">{abilityLabel.label}</span>
          <span className="text-gray-500">θ = {theta.toFixed(3)} ± {thetaSE.toFixed(3)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Latent Ability (θ)</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${((theta + 4) / 8) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-gray-700">{theta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>-4</span>
            <span>0</span>
            <span>+4</span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 mb-1">Next Question Difficulty</div>
          <div className="text-lg font-bold text-blue-700">{nextDifficulty.toFixed(2)}</div>
          <div className="text-[10px] text-blue-500">Optimized for maximum information gain</div>
        </div>

        <div className="bg-amber-50 rounded-lg p-3">
          <div className="text-xs text-amber-600 mb-1">Standard Error</div>
          <div className="text-lg font-bold text-amber-700">±{thetaSE.toFixed(3)}</div>
          <div className="text-[10px] text-amber-500">Lower is more precise</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
        IRT uses 3PL model to estimate your true ability independent of question difficulty. More responses = more accurate estimate.
      </div>
    </div>
  );
};

export default ScorePredictor;
