import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

const PYQTestPanel = () => {
  const { user, userProfile } = useAuth();
  const [view, setView] = useState('home'); // home, create, test, results
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && view === 'home') fetchTests();
  }, [user, view]);

  useEffect(() => {
    if (view === 'test' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [view, timeLeft]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const data = await aiApi.getPYQTests(user.uid);
      if (data.success) setTests(data.tests || []);
    } catch (err) {
      console.error('Fetch tests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async (examName, year, subject, count) => {
    setLoading(true);
    try {
      const data = await aiApi.createPYQTest({ userId: user.uid, examName, year, subject, questionCount: count });
      if (!data.success) throw new Error(data.error || 'Failed to create test');

      // Start the test first, THEN switch view so TestView always gets the started test
      const startData = await aiApi.startPYQTest({ userId: user.uid, testId: data.test.testId });
      if (!startData.success) throw new Error(startData.error || 'Failed to start test');

      if (!startData.test?.questions?.length) {
        throw new Error('No questions found for this exam/year/subject combination.');
      }

      setCurrentTest(startData.test);
      setTimeLeft(startData.test.questions.length * 180);
      setResponses({});
      setCurrentQuestionIndex(0);
      setView('test');
    } catch (err) {
      console.error('Create test error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (testId) => {
    try {
      const data = await aiApi.startPYQTest({ userId: user.uid, testId });
      if (data.success && data.test?.questions?.length) {
        setCurrentTest(data.test);
        setTimeLeft(data.test.questions.length * 180);
        setResponses({});
        setCurrentQuestionIndex(0);
        setView('test');
      }
    } catch (err) {
      console.error('Start test error:', err);
    }
  };

  const recordAnswer = async (questionId, answer) => {
    const newResponses = { ...responses, [questionId]: answer };
    setResponses(newResponses);
    try {
      await aiApi.recordPYQResponse({ userId: user.uid, testId: currentTest.testId, questionId, answer, timeTaken: 0 });
    } catch (err) {
      console.error('Record response error:', err);
    }
  };

  const submitTest = async () => {
    setLoading(true);
    try {
      const data = await aiApi.submitPYQTest({ userId: user.uid, testId: currentTest.testId });
      if (data.success) {
        setEvaluation(data.evaluation);
        setView('results');
        fetchInsights();
      }
    } catch (err) {
      console.error('Submit test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const data = await aiApi.getPYQInsights(user.uid, currentTest.testId);
      if (data.success) setInsights(data.insights);
    } catch (err) {
      console.error('Fetch insights error:', err);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loading && view === 'home') {
    return <div className="p-5"><div className="animate-pulse h-40 bg-gray-100 rounded-xl" /></div>;
  }

  return (
    <div className="h-full flex flex-col">
      {view === 'home' && <HomeView tests={tests} onCreateNew={() => setView('create')} onResumeTest={(test) => { setCurrentTest(test); setView('test'); }} />}
      {view === 'create' && <CreateView onBack={() => setView('home')} onCreate={createTest} examName={userProfile?.examName} />}
      {view === 'test' && currentTest && (
        <TestView 
          test={currentTest} 
          questionIndex={currentQuestionIndex} 
          responses={responses} 
          timeLeft={timeLeft}
          onAnswer={recordAnswer}
          onNext={() => setCurrentQuestionIndex(i => Math.min(i + 1, currentTest.questions.length - 1))}
          onPrev={() => setCurrentQuestionIndex(i => Math.max(i - 1, 0))}
          onSubmit={submitTest}
        />
      )}
      {view === 'results' && evaluation && (
        <ResultsView 
          evaluation={evaluation} 
          insights={insights} 
          test={currentTest}
          onBack={() => setView('home')} 
        />
      )}
    </div>
  );
};

const HomeView = ({ tests, onCreateNew, onResumeTest }) => (
  <div className="p-5 space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-bold text-gray-800 text-lg">Previous Year Questions</h3>
        <p className="text-gray-500 text-xs mt-0.5">Practice with real exam questions</p>
      </div>
      <button onClick={onCreateNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">+ New Test</button>
    </div>

    {tests.length === 0 ? (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">📝</div>
        <p className="text-gray-500 text-sm mb-4">No tests yet. Create your first PYQ test!</p>
        <button onClick={onCreateNew} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Start Now</button>
      </div>
    ) : (
      <div className="space-y-2">
        {tests.map((test) => (
          <div key={test.testId} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-800 text-sm">{test.examName} {test.year} - {test.subject}</div>
                <div className="text-xs text-gray-500 mt-1">{test.questions?.length || 0} questions • {test.status}</div>
                {test.evaluation && (
                  <div className="text-xs text-blue-600 mt-1 font-medium">Score: {test.evaluation.scoredMarks}/{test.evaluation.totalMarks} ({test.evaluation.percentage}%)</div>
                )}
              </div>
              {test.status === 'evaluated' ? (
                <button onClick={() => onResumeTest(test)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition">View Results</button>
              ) : (
                <button onClick={() => onResumeTest(test)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition">Resume</button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CreateView = ({ onBack, onCreate, examName }) => {
  const exams = ['JEE', 'NEET', 'UPSC', 'CAT'];
  const years = [2023, 2022, 2021, 2020];
  const subjects = {
    JEE: ['Physics', 'Chemistry', 'Mathematics'],
    NEET: ['Physics', 'Chemistry', 'Biology'],
    UPSC: ['History', 'Geography', 'Polity'],
    CAT: ['Quantitative', 'Verbal', 'Logical']
  };

  const defaultExam = examName || 'JEE';
  const [selectedExam, setSelectedExam] = useState(defaultExam);
  const [selectedYear, setSelectedYear] = useState(2023);
  const [selectedSubject, setSelectedSubject] = useState(subjects[defaultExam]?.[0] || 'Physics');
  const [questionCount, setQuestionCount] = useState(10);

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← Back</button>
        <h3 className="font-bold text-gray-800 text-lg">Create PYQ Test</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Exam</label>
          <div className="grid grid-cols-4 gap-2">
            {exams.map(exam => (
              <button key={exam} onClick={() => { setSelectedExam(exam); setSelectedSubject(subjects[exam][0]); }} className={`py-2 rounded-lg text-sm font-medium transition ${selectedExam === exam ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{exam}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Year</label>
          <div className="grid grid-cols-4 gap-2">
            {years.map(year => (
              <button key={year} onClick={() => setSelectedYear(year)} className={`py-2 rounded-lg text-sm font-medium transition ${selectedYear === year ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{year}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Subject</label>
          <div className="grid grid-cols-3 gap-2">
            {(subjects[selectedExam] || []).map(subject => (
              <button key={subject} onClick={() => setSelectedSubject(subject)} className={`py-2 rounded-lg text-sm font-medium transition ${selectedSubject === subject ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{subject}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Number of Questions: {questionCount}</label>
          <input type="range" min="5" max="30" step="5" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full" />
        </div>
      </div>

      <button onClick={() => onCreate(selectedExam, selectedYear, selectedSubject, questionCount)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">Create Test</button>
    </div>
  );
};

const TestView = ({ test, questionIndex, responses, timeLeft, onAnswer, onNext, onPrev, onSubmit }) => {
  const question = test?.questions?.[questionIndex];
  const total = test?.questions?.length || 0;
  const progress = total > 0 ? ((questionIndex + 1) / total) * 100 : 0;

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm">No questions available for this test.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-800">{test.examName} {test.year} - {test.subject}</div>
          <div className={`text-sm font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>{formatTime(timeLeft)}</div>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-gray-500 mt-1">Question {questionIndex + 1} of {total}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <span className="font-semibold">{question.topic}</span> • {question.marks} marks • {Math.floor(question.timeAllotted / 60)} min
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="text-sm text-gray-800 leading-relaxed mb-4">{question.questionText}</div>
            <div className="space-y-2">
              {Object.entries(question.options).map(([key, value]) => (
                <button key={key} onClick={() => onAnswer(question.id, key)} className={`w-full p-3 text-left rounded-lg border-2 transition ${responses[question.id] === key ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <span className="font-semibold text-gray-700">{key.toUpperCase()}</span> <span className="text-gray-600 text-sm ml-2">{value}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
        <button onClick={onPrev} disabled={questionIndex === 0} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-40">← Previous</button>
        {questionIndex === total - 1 ? (
          <button onClick={onSubmit} className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">Submit Test</button>
        ) : (
          <button onClick={onNext} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Next →</button>
        )}
      </div>
    </div>
  );
};

const ResultsView = ({ evaluation, insights, test, onBack }) => (
  <div className="flex-1 overflow-y-auto p-5">
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm">← Back to Tests</button>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <div className="text-center">
          <div className="text-5xl font-bold text-blue-600 mb-2">{evaluation.percentage}%</div>
          <div className="text-gray-600 text-sm mb-3">{evaluation.scoredMarks}/{evaluation.totalMarks} marks</div>
          <div className="flex justify-center gap-4 text-xs">
            <span className="text-green-600 font-medium">✓ {evaluation.correct} Correct</span>
            <span className="text-red-600 font-medium">✗ {evaluation.incorrect} Wrong</span>
            <span className="text-gray-500">— {evaluation.unattempted} Skipped</span>
          </div>
        </div>
      </div>

      {insights && (
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3">AI Insights</h4>
          <div className="space-y-3 text-sm text-gray-700">
            <p>{insights.overallAssessment || insights.raw}</p>
            {insights.strengths && (
              <div>
                <div className="font-semibold text-green-700 mb-1">Strengths:</div>
                <ul className="list-disc list-inside space-y-1">{insights.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {insights.weaknesses && (
              <div>
                <div className="font-semibold text-red-700 mb-1">Areas to Improve:</div>
                <ul className="list-disc list-inside space-y-1">{insights.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h4 className="font-bold text-gray-800 mb-3">Topic-wise Performance</h4>
        <div className="space-y-2">
          {evaluation.strengthByTopic.map((topic) => (
            <div key={topic.topic} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{topic.topic}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${topic.accuracy >= 70 ? 'bg-green-500' : topic.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${topic.accuracy}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-600 w-12 text-right">{topic.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default PYQTestPanel;
