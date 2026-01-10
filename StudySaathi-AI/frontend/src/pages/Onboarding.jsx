import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const EXAM_OPTIONS = [
  'JEE Main',
  'JEE Advanced',
  'NEET',
  'UPSC',
  'CAT',
  'GATE',
  'Board Exams',
  'Other',
];

const SUBJECT_OPTIONS = {
  'JEE Main': ['Physics', 'Chemistry', 'Mathematics'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Mathematics'],
  'NEET': ['Physics', 'Chemistry', 'Biology'],
  'UPSC': ['History', 'Geography', 'Polity', 'Economy', 'Science', 'Current Affairs'],
  'CAT': ['Quantitative Aptitude', 'Verbal Ability', 'Data Interpretation', 'Logical Reasoning'],
  'GATE': ['Engineering Mathematics', 'Core Subject', 'General Aptitude'],
  'Board Exams': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi'],
  'Other': ['Subject 1', 'Subject 2', 'Subject 3'],
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, refreshUserProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    examName: '',
    customExam: '',
    subjects: [],
    topics: {},
    examDate: '',
    dailyStudyHours: 2,
    weakSubjects: {},
  });

  const availableSubjects = SUBJECT_OPTIONS[formData.examName] || [];

  const handleExamChange = (exam) => {
    setFormData({
      ...formData,
      examName: exam,
      subjects: [],
      topics: {},
      weakSubjects: {},
    });
  };

  const handleSubjectToggle = (subject) => {
    const newSubjects = formData.subjects.includes(subject)
      ? formData.subjects.filter((s) => s !== subject)
      : [...formData.subjects, subject];

    const newWeakSubjects = { ...formData.weakSubjects };
    if (!newSubjects.includes(subject)) {
      delete newWeakSubjects[subject];
    } else if (!newWeakSubjects[subject]) {
      newWeakSubjects[subject] = 3;
    }

    setFormData({
      ...formData,
      subjects: newSubjects,
      weakSubjects: newWeakSubjects,
    });
  };

  const handleWeakRatingChange = (subject, rating) => {
    setFormData({
      ...formData,
      weakSubjects: {
        ...formData.weakSubjects,
        [subject]: rating,
      },
    });
  };

  const handleTopicChange = (subject, topicsText) => {
    setFormData({
      ...formData,
      topics: {
        ...formData.topics,
        [subject]: topicsText,
      },
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (!user?.uid) {
      setError('User not authenticated. Please login again.');
      setLoading(false);
      return;
    }

    try {
      const userProfile = {
        examName: formData.examName === 'Other' ? formData.customExam : formData.examName,
        subjects: formData.subjects,
        topics: formData.topics,
        examDate: formData.examDate,
        dailyStudyHours: formData.dailyStudyHours,
        weakSubjects: formData.weakSubjects,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Saving profile to Firestore...');
      await setDoc(doc(db, 'users', user.uid), userProfile, { merge: true });
      console.log('Save successful!');
      
      // Refresh the user profile in context before navigating
      await refreshUserProfile();
      
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Save error:', err);
      setError(`Failed to save: ${err.code || err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.examName && (formData.examName !== 'Other' || formData.customExam);
      case 2:
        return formData.subjects.length > 0;
      case 3:
        return formData.examDate && formData.dailyStudyHours > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl hero-shadow p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 mx-1 rounded-full ${
                    s <= step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 text-center">Step {step} of 4</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                What exam are you preparing for?
              </h2>
              <p className="text-gray-600 mb-6">Select your target examination</p>

              <div className="grid grid-cols-2 gap-4">
                {EXAM_OPTIONS.map((exam) => (
                  <button
                    key={exam}
                    onClick={() => handleExamChange(exam)}
                    className={`p-4 rounded-2xl border-2 text-left topic-card ${
                      formData.examName === exam
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium text-gray-800">{exam}</span>
                  </button>
                ))}
              </div>

              {formData.examName === 'Other' && (
                <input
                  type="text"
                  value={formData.customExam}
                  onChange={(e) => setFormData({ ...formData, customExam: e.target.value })}
                  placeholder="Enter exam name"
                  className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Select your subjects
              </h2>
              <p className="text-gray-600 mb-6">Choose the subjects you'll be studying</p>

              <div className="space-y-4">
                {availableSubjects.map((subject) => (
                  <div key={subject} className="space-y-2">
                    <button
                      onClick={() => handleSubjectToggle(subject)}
                      className={`w-full p-4 rounded-2xl border-2 text-left topic-card ${
                        formData.subjects.includes(subject)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-gray-800">{subject}</span>
                    </button>

                    {formData.subjects.includes(subject) && (
                      <textarea
                        value={formData.topics[subject] || ''}
                        onChange={(e) => handleTopicChange(subject, e.target.value)}
                        placeholder={`Enter topics for ${subject} (comma separated)`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        rows={2}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Study schedule
              </h2>
              <p className="text-gray-600 mb-6">Help us plan your preparation</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Study Hours: {formData.dailyStudyHours} hours
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={formData.dailyStudyHours}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyStudyHours: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 hr</span>
                    <span>12 hrs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Rate your confidence
              </h2>
              <p className="text-gray-600 mb-6">
                How confident are you in each subject? (1 = Need help, 5 = Strong)
              </p>

              <div className="space-y-6">
                {formData.subjects.map((subject) => (
                  <div key={subject}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">{subject}</span>
                      <span className="text-sm text-gray-500">
                        {formData.weakSubjects[subject] || 3}/5
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleWeakRatingChange(subject, rating)}
                          className={`flex-1 py-2 rounded-xl font-medium transition ${
                            (formData.weakSubjects[subject] || 3) === rating
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Need help</span>
                      <span>Strong</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition btn-lift"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed btn-lift"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed btn-lift"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
