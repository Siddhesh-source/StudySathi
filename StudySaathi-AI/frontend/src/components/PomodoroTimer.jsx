import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * PomodoroTimer Component
 * 25-min study / 5-min break timer integrated with session tracking.
 * Props:
 *  - onSessionComplete(durationMinutes) — called when a full Pomodoro finishes
 *  - subject, topic — for display purposes
 */
const PomodoroTimer = ({ onSessionComplete, subject = '', topic = '' }) => {
  const MODES = {
    STUDY: { label: 'Study', duration: 25 * 60, color: 'from-violet-600 to-purple-700', emoji: '📚' },
    SHORT_BREAK: { label: 'Short Break', duration: 5 * 60, color: 'from-emerald-500 to-teal-600', emoji: '☕' },
    LONG_BREAK: { label: 'Long Break', duration: 15 * 60, color: 'from-blue-500 to-cyan-600', emoji: '🌿' },
  };

  const [mode, setMode] = useState('STUDY');
  const [timeLeft, setTimeLeft] = useState(MODES.STUDY.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [totalStudySeconds, setTotalStudySeconds] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const currentMode = MODES[mode];
  const progress = 1 - timeLeft / currentMode.duration;
  const circumference = 2 * Math.PI * 54; // r=54

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    clearInterval(intervalRef.current);

    if (mode === 'STUDY') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      const studyMinutes = MODES.STUDY.duration / 60;
      setTotalStudySeconds(prev => prev + studyMinutes * 60);
      onSessionComplete?.(studyMinutes);

      // Auto-switch to break
      const nextMode = newCount % 4 === 0 ? 'LONG_BREAK' : 'SHORT_BREAK';
      setMode(nextMode);
      setTimeLeft(MODES[nextMode].duration);
    } else {
      setMode('STUDY');
      setTimeLeft(MODES.STUDY.duration);
    }
  }, [mode, pomodoroCount, onSessionComplete]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { handleComplete(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleComplete]);

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(currentMode.duration);
  };

  return (
    <div className={`bg-gradient-to-br ${currentMode.color} rounded-2xl p-6 text-white shadow-xl`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            ⏱️ Pomodoro Timer
          </h3>
          {subject && topic && (
            <p className="text-white/70 text-xs mt-0.5">{subject} • {topic}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-white/80 text-xs">Completed</div>
          <div className="font-bold text-lg">{'🍅'.repeat(Math.min(pomodoroCount, 4))}{pomodoroCount === 0 ? '—' : ''}</div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-white/10 rounded-xl p-1 mb-5">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === key ? 'bg-white text-purple-700 shadow' : 'text-white/70 hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Circular progress */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke="white" strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold tabular-nums">{formatTime(timeLeft)}</div>
            <div className="text-white/70 text-xs mt-0.5">{currentMode.emoji} {currentMode.label}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center mb-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-medium transition"
        >
          ↺ Reset
        </button>
        <button
          onClick={() => setIsRunning(r => !r)}
          className="px-8 py-2 bg-white text-purple-700 hover:bg-white/90 rounded-xl text-sm font-bold shadow-lg transition"
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
      </div>

      {/* Total study time */}
      {totalStudySeconds > 0 && (
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <div className="text-white/70 text-xs">Total Study Time Today</div>
          <div className="font-bold">{Math.floor(totalStudySeconds / 60)} min</div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
