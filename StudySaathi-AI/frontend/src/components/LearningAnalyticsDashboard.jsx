import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

const LearningAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchReport();
  }, [user]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await aiApi.getAnalyticsReport(user.uid);
      if (data.success) setReport(data.report);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="bg-white rounded-2xl shadow p-5"><div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded" />)}</div></div>;
  if (!report) return null;

  const pred = report.prediction;

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">📊 Learning Analytics</h3>
          <p className="text-gray-500 text-xs mt-0.5">AI-powered insights & score prediction</p>
        </div>
        <button onClick={fetchReport} className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition">Refresh</button>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-4 border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Predicted Exam Score</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${pred.confidence === 'high' ? 'bg-green-100 text-green-700' : pred.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{pred.confidence} confidence</span>
        </div>
        <div className="text-4xl font-bold text-purple-600 mb-1">{pred.predictedScore}%</div>
        <div className="text-xs text-gray-500">Based on {Object.keys(pred.contributions).length} factors</div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="text-xs font-semibold text-gray-600 mb-2">Feature Contributions</div>
        {Object.entries(pred.contributions).map(([key, data]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="font-semibold text-gray-800">{data.value}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${data.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 mb-1">Learning Velocity</div>
          <div className="text-lg font-bold text-blue-700">{report.learningVelocity}</div>
          <div className="text-[10px] text-blue-500">topics/week</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-green-600 mb-1">Engagement</div>
          <div className="text-lg font-bold text-green-700">{report.engagementScore}</div>
          <div className="text-[10px] text-green-500">out of 100</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-xs text-orange-600 mb-1">Consistency</div>
          <div className="text-lg font-bold text-orange-700">{report.consistencyIndex}%</div>
          <div className="text-[10px] text-orange-500">streak ratio</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xs text-purple-600 mb-1">Retention</div>
          <div className="text-lg font-bold text-purple-700">{report.knowledgeRetentionRate || 'N/A'}</div>
          <div className="text-[10px] text-purple-500">{report.knowledgeRetentionRate ? '%' : 'pending'}</div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-500">Total Study Time</span>
          <span className="font-semibold text-gray-800">{Math.floor(report.totalTimeOnTask / 60)}h {report.totalTimeOnTask % 60}m</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Topics Covered</span>
          <span className="font-semibold text-gray-800">{report.topicBreakdown.strong + report.topicBreakdown.medium + report.topicBreakdown.weak}</span>
        </div>
      </div>
    </div>
  );
};

export default LearningAnalyticsDashboard;
