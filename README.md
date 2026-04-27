# StudySaathi AI 🎓

> *"Saathi" means companion in Hindi — your AI-powered study companion for competitive exam success*

---

## The Problem: A Student's Journey

Meet Priya, a JEE aspirant from Pune. It's 11 PM. She's stuck on a Physics problem, her study plan is a mess of sticky notes, and she has no idea if she's actually improving. Her coaching institute has 200 students per batch. Personal attention? Forget it.

**The reality for 2 million+ Indian exam aspirants:**
- Coaching classes are overcrowded and expensive (₹1-2 lakhs/year)
- Doubts pile up with no one to ask at midnight
- No personalized tracking of weak topics
- Generic study plans that don't adapt to individual progress
- Zero insight into whether they're exam-ready

**StudySaathi changes this.** An AI study companion that's available 24/7, tracks every topic you study, predicts your exam score, and adapts to your learning patterns — all powered by cutting-edge AI and research-backed algorithms.

---

## Key Features

### 🤖 AI-Powered Learning Engine
**What it does:** Instant doubt solving and personalized content generation using Google's Gemini 2.5 Flash

**Key Concepts:**
- **Prompt Engineering:** Specialized system prompts tuned for Indian exam patterns (JEE, NEET, UPSC)
- **Context-Aware Generation:** AI understands your exam type, weak subjects, and learning history
- **Multi-Modal Content:** Generates explanations, quizzes, flashcards, mind maps, and PYQ-style questions

**Features:**
- 💬 **Quick Doubt Solver** — Ask any question, get instant explanations in simple Indian English
- 🧠 **Smart Learning Room** — Generate custom content with 8 learning modes (brief, detailed, analogies, exam tips, etc.)
- 📝 **PYQ Test Engine** — Practice with real Previous Year Questions from JEE/NEET 2020-2023

---

### 📊 Spaced Repetition System (SM-2 Algorithm)
**What it does:** Scientifically optimizes when you review each topic to maximize retention

**Key Concepts:**
- **SM-2 Algorithm:** The gold standard for spaced repetition (used by Anki), adapted for Indian competitive exams
- **Ebbinghaus Forgetting Curve:** Reviews are scheduled just before you're about to forget
- **Exam-Specific Multipliers:** JEE/NEET get tighter revision cycles (0.85x) than UPSC (1.0x)

**How it works:**
```
First review: 1 day → Second: 6 days → Third: 15 days → Fourth: 37 days...
(Intervals grow based on how well you recall — fail = reset to day 1)
```

**Features:**
- 🔄 Automatic review scheduling based on your performance (0-5 quality rating)
- 📈 Mastery levels: New → Learning → Reviewing → Proficient → Mastered
- 🎯 Retention probability tracking (predicts if you'll remember a topic)

---

### 🗺️ Knowledge Graph (Prerequisite Mapping)
**What it does:** Ensures you learn topics in the correct order using graph theory

**Key Concepts:**
- **Directed Acyclic Graph (DAG):** Topics are nodes, prerequisites are edges
- **Topological Sort:** Automatically generates optimal study order
- **Prerequisite Locking:** Can't study Integration without mastering Differentiation first

**Example Chain:**
```
Basic Math → Limits → Differentiation → Integration → Differential Equations
                                ↓
                         Applications (Area, Volume)
```

**Features:**
- 🔓 **Unlocked Topics** — Shows what you can study right now
- 🔗 **Learning Paths** — Visualizes the journey from topic A to topic B
- 📊 **Coverage Score** — Percentage of syllabus mastered

---

### 🎯 IRT Calibration (Item Response Theory)
**What it does:** Estimates your true ability using psychometric science (same as GRE/CAT)

**Key Concepts:**
- **3-Parameter Logistic (3PL) Model:** `P(correct|θ) = c + (1-c)/(1 + e^(-1.7a(θ-b)))`
  - **θ (theta):** Your latent ability (-4 to +4 scale)
  - **a:** Question discrimination (how well it separates strong/weak students)
  - **b:** Question difficulty
  - **c:** Guessing probability
- **Newton-Raphson MLE:** Maximum likelihood estimation to calculate θ
- **Adaptive Difficulty:** Next question difficulty = θ + 0.3 (just above your level)

**Features:**
- 📈 Ability score (0-100) with confidence intervals
- 🎓 Ability labels: Beginner → Developing → Intermediate → Advanced → Expert
- 🔮 Optimal next question difficulty for maximum learning

---

### 📉 Learning Analytics & Score Prediction
**What it does:** Predicts your exam score using weighted linear regression

**Key Concepts:**
- **Weighted Regression:** `Predicted Score = Σ(weight_i × feature_i)`
- **5 Features Tracked:**
  1. Average quiz score (35% weight)
  2. Consistency index (20%) — streak/max_possible_streak
  3. Topic coverage (20%) — % of syllabus studied
  4. Average confidence (15%)
  5. Revision compliance (10%) — % of SRS reviews done on time

**Features:**
- 🎯 **Exam Score Predictor** — "You'll score 78% in JEE Mains" with confidence level
- 📊 **Learning Velocity** — Topics mastered per week
- 🧠 **Knowledge Retention Rate** — % of topics still "strong" after 7 days
- 💪 **Engagement Score** — Composite metric (0-100) of daily activity

---

### 🧠 Cognitive Load Monitoring (Burnout Detection)
**What it does:** Detects burnout and overload using Sweller's Cognitive Load Theory

**Key Concepts:**
- **Cognitive Load Theory (CLT):** Working memory has limited capacity — overload = poor learning
- **Burnout Signals:** Declining quiz scores + excessive hours + no rest days
- **Overload Signals:** Session length spikes + note-taking drops + topic switching

**Detection Algorithm:**
```
IF quiz_score_dropped_15% AND daily_hours > 6 AND no_break_10_days:
    ALERT: "Critical burnout — take a rest day"
```

**Features:**
- 🚨 Real-time alerts (Low/Medium/High/Critical levels)
- 💡 Actionable recommendations ("Switch to Pomodoro", "Take 15-min break now")
- 📊 Study pattern analysis (avg daily hours, consecutive days, session length trends)

---

### 🏆 Gamification & Motivation
**What it does:** Keeps you engaged with streaks, achievements, and leaderboards

**Key Concepts:**
- **Observer Pattern:** Achievement system listens to events (streak updated, quiz completed)
- **Strategy Pattern:** Each achievement has custom unlock condition
- **Milestone System:** Week Warrior (7d) → Month Master (30d) → Century Achiever (100d)

**Features:**
- 🔥 **Study Streaks** — Daily tracking with AI-generated motivational messages
- 🏅 **15+ Achievements** — Unlock badges across 6 categories (streak, study time, quiz, notes, social, milestones)
- 📅 **Study Heatmap** — GitHub-style contribution graph (last 20 weeks)
- 🏆 **Leaderboard** — Compare streaks with other students
- ⚡ **Daily Challenges** — Timed 3-question quiz with bonus XP

---

### 📝 PYQ Test Engine
**What it does:** Full-featured test interface with real Previous Year Questions

**Key Concepts:**
- **OOP State Machine:** Test lifecycle (not_started → in_progress → completed → evaluated)
- **Bloom's Taxonomy Tagging:** Questions tagged L1-L6 (Remember → Create)
- **AI Evaluation:** Generates personalized insights (strengths, weaknesses, study plan)

**Features:**
- 📚 Built-in PYQ database (JEE/NEET 2020-2023 Physics, Chemistry, Math, Biology)
- ⏱️ Live timer with auto-submit
- 📊 Comprehensive analysis: topic-wise, difficulty-wise, Bloom's level breakdown
- 🤖 AI-generated explanations for wrong answers
- 📈 Performance trends across multiple tests

---

### ⏱️ Pomodoro Timer
**What it does:** 25/5/15 minute study-break cycles integrated with session tracking

**Features:**
- 🍅 Automatic mode switching (Study → Short Break → Long Break after 4 cycles)
- ⏰ Circular progress indicator
- 📊 Total study time tracking
- 🔗 Integrates with session tracker for analytics

---

### 🧪 A/B Testing Framework (Experimental)
**What it does:** Tests which teaching methods work best using controlled experiments

**Key Concepts:**
- **Hash Bucketing:** Deterministic user assignment (same user = same variant always)
- **Statistical Significance:** Two-tailed t-test with p-value calculation
- **3 Active Experiments:**
  1. Explanation style (Standard vs Analogy-First vs Testing Effect)
  2. Quiz difficulty (Fixed-Mixed vs IRT-Adaptive)
  3. Revision schedule (Massed Practice vs Spaced Repetition)

**Features:**
- 🔬 Automatic variant assignment per user
- 📊 Outcome tracking (quiz scores, retention rates, engagement)
- 📈 Statistical analysis (mean ± std, p-values, significance)

---

## Technical Architecture

### Tech Stack

**Frontend:**
- React 19 + Vite
- Tailwind CSS 4
- React Router 7
- Firebase SDK 12

**Backend:**
- Node.js + Express 5
- Google Generative AI SDK
- Firebase Admin SDK

**Google Cloud Platform:**
| Service | Purpose |
|---------|---------|
| **Gemini 2.5 Flash** | AI content generation, doubt solving |
| **Firebase Auth** | User authentication (email/password) |
| **Cloud Firestore** | NoSQL database (users, sessions, tests, notes) |
| **Firebase Hosting** | Frontend deployment |
| **Cloud Run** | Serverless backend API |
| **Secret Manager** | Secure API key storage |
| **Artifact Registry** | Docker container images |

---

### System Architecture

```
┌─────────────────────┐
│   React Frontend    │
│  (Firebase Hosting) │
│                     │
│  • Dashboard        │
│  • Smart Learning   │
│  • PYQ Tests        │
│  • Analytics        │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│   Express API       │
│   (Cloud Run)       │
│                     │
│  • 50+ REST routes  │
│  • OOP services     │
│  • Middleware       │
└─────┬───────────┬───┘
      │           │
      ▼           ▼
┌──────────┐  ┌──────────────┐
│ Gemini   │  │  Firestore   │
│ 2.5 Flash│  │  + Auth      │
│          │  │              │
│ AI Gen   │  │ • Users      │
│ Prompts  │  │ • Sessions   │
└──────────┘  │ • Tests      │
              │ • Streaks    │
              │ • SRS Data   │
              └──────────────┘
```

---

### OOP Architecture (Backend)

**15 Core Classes** implementing SOLID principles and design patterns:

#### 📦 Model Classes

| Class | Purpose | Design Pattern |
|-------|---------|----------------|
| `StudyMetrics` | Progress calculation with strategy-based scoring | **Strategy Pattern** (JEE/NEET/default scoring) |
| `StreakManager` | Daily streak tracking with event emission | **Observer Pattern** |
| `ContentGenerator` | Abstract base for content generation | **Template Method + Factory** |
| `SpacedRepetitionScheduler` | SM-2 algorithm implementation | Encapsulation |
| `KnowledgeGraph` | DAG with topological sort | **Composite Pattern** |
| `IRTCalibrator` | 3PL model with Newton-Raphson MLE | Encapsulation |
| `LearningAnalytics` | Score prediction via regression | Static methods |
| `CognitiveLoadMonitor` | Burnout/overload detection | **Strategy Pattern** |
| `ExperimentManager` | A/B test assignment & analysis | **Strategy Pattern** |
| `PYQTest` | Test lifecycle state machine | **Observer Pattern** |
| `PYQQuestion` | Question value object | Value Object |
| `PYQEvaluator` | AI-powered test evaluation | **Template Method** |
| `Achievement` | Achievement definition | **Strategy Pattern** (condition functions) |
| `AchievementManager` | Achievement unlock system | **Observer Pattern** |
| `UserProfile` | User data encapsulation | Encapsulation |
| `StudySession` | Session lifecycle management | **Command Pattern** (for undo/redo) |

#### 🎨 Design Patterns Implemented

**1. Factory Pattern** — `ContentGeneratorFactory`
```javascript
// Registry-based (Open/Closed Principle)
const generator = ContentGeneratorFactory.create('quiz', 'Physics', 'Mechanics');
// Returns: QuizGenerator instance
```

**2. Template Method Pattern** — `ContentGenerator.generate()`
```javascript
async generate() {
  const prompt = this.buildPrompt();        // Subclass implements
  const enhanced = this.addExamContext();   // Hook method
  const result = await this.executeGeneration();
  return this.formatResponse(result);       // Subclass implements
}
```

**3. Strategy Pattern** — `StudyMetrics` scoring
```javascript
// Swap scoring algorithm at runtime
metrics.setScoringStrategy('JEE');  // Uses JEEScoringStrategy
metrics.calculateStrengthScore();   // Delegates to strategy
```

**4. Observer Pattern** — `StreakManager` events
```javascript
streakManager.on('streakUpdated', (data) => {
  achievementManager.checkAll(data);  // Listener reacts
});
streakManager.updateForToday();  // Emits event
```

**5. Composite Pattern** — `KnowledgeGraph` nodes
```javascript
graph.addNode('integration', { bloomsLevel: 4 });
graph.addEdge('differentiation', 'integration');  // Prerequisite
const order = graph.getStudyOrder();  // Topological sort
```

#### ✅ SOLID Principles

- **S**ingle Responsibility: Each class has one job (e.g., `StreakManager` only handles streaks)
- **O**pen/Closed: Registry pattern allows adding generators without modifying factory
- **L**iskov Substitution: All `ContentGenerator` subclasses are interchangeable
- **I**nterface Segregation: Focused interfaces (no god objects)
- **D**ependency Inversion: Services depend on abstractions, not concrete classes

---

## Research Foundations

All algorithms are grounded in peer-reviewed research:

| Feature | Research Paper | Year |
|---------|---------------|------|
| Spaced Repetition | Wozniak, P.A. "Optimization of learning" | 1990 |
| IRT (3PL Model) | Lord, F.M. "Applications of Item Response Theory" | 1980 |
| Cognitive Load Theory | Sweller, J. "Cognitive Load During Problem Solving" | 1988 |
| Bloom's Taxonomy | Bloom, B.S. "Taxonomy of Educational Objectives" | 1956 |
| Learning Analytics | Siemens & Long "Penetrating the Fog: Analytics in Learning" | 2011 |
| A/B Testing | Kohavi, Tang, Xu "Trustworthy Online Controlled Experiments" | 2020 |

---

## Project Structure

```
StudySaathi-AI/
├── backend/
│   ├── src/
│   │   ├── models/           # 15 OOP classes
│   │   │   ├── StudyMetrics.js
│   │   │   ├── StreakManager.js
│   │   │   ├── ContentGenerator.js
│   │   │   ├── SpacedRepetitionScheduler.js
│   │   │   ├── KnowledgeGraph.js
│   │   │   ├── IRTCalibrator.js
│   │   │   ├── LearningAnalytics.js
│   │   │   ├── CognitiveLoadMonitor.js
│   │   │   ├── ExperimentManager.js
│   │   │   ├── PYQTest.js
│   │   │   ├── PYQQuestion.js
│   │   │   ├── PYQEvaluator.js
│   │   │   ├── Achievement.js
│   │   │   ├── UserProfile.js
│   │   │   └── StudySession.js
│   │   ├── services/         # Business logic
│   │   │   ├── gemini.js
│   │   │   ├── topicTracker.js
│   │   │   ├── streakTracker.js
│   │   │   ├── sessionTracker.js
│   │   │   ├── achievementService.js
│   │   │   ├── spacedRepetitionService.js
│   │   │   ├── irtService.js
│   │   │   ├── knowledgeGraphService.js
│   │   │   ├── analyticsService.js
│   │   │   ├── experimentService.js
│   │   │   └── pyqService.js
│   │   ├── routes/
│   │   │   └── ai.js         # 50+ REST endpoints
│   │   ├── config/
│   │   │   └── firebase.js
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/       # 19 React components
│   │   │   ├── SmartLearningRoom.jsx
│   │   │   ├── QuickDoubt.jsx
│   │   │   ├── PYQTestPanel.jsx
│   │   │   ├── PomodoroTimer.jsx
│   │   │   ├── AchievementBadges.jsx
│   │   │   ├── StudyHeatmap.jsx
│   │   │   ├── DailyChallenge.jsx
│   │   │   ├── SpacedRepetitionCard.jsx
│   │   │   ├── KnowledgeGraphView.jsx
│   │   │   ├── LearningAnalyticsDashboard.jsx
│   │   │   ├── ScorePredictor.jsx
│   │   │   ├── CognitiveLoadAlert.jsx
│   │   │   ├── StreakCard.jsx
│   │   │   ├── TopicProgress.jsx
│   │   │   └── StudyPlan.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Onboarding.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── firebase/
│   │   │   ├── config.js
│   │   │   └── auth.js
│   │   ├── utils/
│   │   │   └── api.js        # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .firebase/
├── firebase.json
├── .firebaserc
├── FIREBASE_SETUP.md
├── LOCAL_DEVELOPMENT.md
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Google Cloud CLI (optional, for deployment)

### Local Development

**1. Clone & Install**
```bash
git clone <repo-url>
cd StudySaathi-AI

# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

**2. Environment Setup**

Create `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
PORT=5000
NODE_ENV=development
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**3. Run Development Servers**
```bash
# Terminal 1: Backend
cd backend
npm run dev
# → http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

---

## API Documentation

### Base URL
- **Local:** `http://localhost:5000`
- **Production:** `https://studysaathi-api-801277786344.asia-south1.run.app`

### Key Endpoints

#### AI Content Generation
```
POST /api/ai/smart-learning
Body: { topic, subject, examType, tags: ['brief', 'questions', 'analogy'] }

POST /api/ai/ask-doubt
Body: { question, context: { subject, topic, examType } }

POST /api/ai/mindmap
Body: { subject, topic, examType }

POST /api/ai/daily-challenge
Body: { subject, topic, examType, difficulty, userId }
```

#### Spaced Repetition
```
POST /api/ai/srs/review
Body: { userId, topicId, quality: 0-5 }

GET /api/ai/srs/due/:userId
Returns: { dueReviews: [...], total }

GET /api/ai/srs/all/:userId
Returns: { schedules: [...] }
```

#### Knowledge Graph
```
GET /api/ai/graph/:userId?examKey=JEE_PHYSICS
Returns: { graph: { nodes, edges }, source }

GET /api/ai/graph/unlocked/:userId
Returns: { unlocked: [...], masteredCount }

GET /api/ai/graph/order/:userId
Returns: { studyOrder: [...] }
```

#### IRT Calibration
```
POST /api/ai/irt/response
Body: { userId, itemId, correct: true/false, itemParams }

GET /api/ai/irt/ability/:userId
Returns: { theta, thetaSE, abilityScore, abilityLabel, nextDifficulty }
```

#### Learning Analytics
```
GET /api/ai/analytics/:userId?totalPlannedTopics=50
Returns: { report: { prediction, metrics, topicBreakdown } }

GET /api/ai/analytics/cognitive/:userId
Returns: { assessment: { burnout, overload, wellbeing } }
```

#### PYQ Tests
```
POST /api/ai/pyq/create
Body: { userId, examName, year, subject, questionCount }

POST /api/ai/pyq/start
Body: { userId, testId }

POST /api/ai/pyq/response
Body: { userId, testId, questionId, answer, timeTaken }

POST /api/ai/pyq/submit
Body: { userId, testId }

GET /api/ai/pyq/insights/:userId/:testId
Returns: { insights, grade }
```

#### Achievements & Streaks
```
GET /api/ai/achievements/:userId
Returns: { achievements: [...], stats }

POST /api/ai/achievements/check
Body: { userId }

GET /api/ai/streak/:userId
Returns: { currentStreak, longestStreak, message, milestone }

POST /api/ai/streak/update
Body: { userId }

GET /api/ai/leaderboard?limit=10
Returns: { leaderboard: [...] }
```

---

## Deployment

### Firebase Hosting (Frontend)
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Cloud Run (Backend)
```bash
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/studysaathi-api
gcloud run deploy studysaathi-api \
  --image gcr.io/PROJECT_ID/studysaathi-api \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

---

## Live Demo

- **Frontend:** https://crypto-isotope-483913-f4.web.app
- **API:** https://studysaathi-api-801277786344.asia-south1.run.app

**Test Credentials:**
- Email: `demo@studysaathi.ai`
- Password: `demo123`

---

## Performance Metrics

- **API Response Time:** <500ms (p95)
- **Gemini AI Latency:** 1-3 seconds
- **Frontend Load Time:** <2 seconds
- **Firestore Queries:** <100ms
- **Concurrent Users:** Tested up to 100

---

## Future Roadmap

- [ ] Voice input for doubt solving (Web Speech API)
- [ ] Image upload for handwritten problem solving (Gemini Vision)
- [ ] Collaborative study groups (real-time Firestore)
- [ ] Mobile app (React Native)
- [ ] Offline mode (service workers + IndexedDB)
- [ ] Multi-language support (Hindi, Tamil, Telugu)
- [ ] Integration with coaching institute LMS
- [ ] Parent dashboard for progress monitoring

---

## Contributing

This project was built for GDG Hackathon 2025. Contributions welcome!

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

- **Google Gemini API** for powering the AI engine
- **Firebase** for authentication and database
- **Research Papers** cited throughout for algorithmic foundations
- **Indian Students** for inspiring this project

---

## Contact

Built with ❤️ for Indian students preparing for competitive exams.

**Team:** GDG Hackathon 2025  
**Support:** [Create an issue](https://github.com/your-repo/issues)

---

*StudySaathi: Because every student deserves a personal AI tutor.* 🎓✨
