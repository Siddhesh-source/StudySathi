# StudySaathi AI 📚🤖

An AI-powered study companion for Indian competitive exam preparation (JEE, NEET, UPSC, etc.)

## What it does

StudySaathi helps students prepare smarter by providing:

- **Quick Doubt Solver** - Get instant AI explanations for any concept or problem
- **Smart Learning Room** - Generate customized study content (explanations, quizzes, PYQ-style questions)
- **Personalized Study Plans** - AI creates daily schedules based on your exam date and weak areas
- **Topic Progress Tracking** - Monitor time spent and confidence levels across subjects
- **Study Streaks** - Stay motivated with daily streak tracking

## Tech Stack

### Frontend
- React 19 + Vite
- Tailwind CSS
- React Router

### Backend
- Node.js + Express
- RESTful API

### Google Technologies 🔥

| Service | Purpose |
|---------|---------|
| **Gemini API** | AI-powered doubt solving, content generation, study plans |
| **Firebase Auth** | User authentication (Email/Password) |
| **Cloud Firestore** | Database for user data, notes, progress tracking |
| **Firebase Hosting** | Frontend deployment |
| **Cloud Run** | Backend API deployment |
| **Secret Manager** | Secure API key storage |
| **Artifact Registry** | Container image storage |

## Architecture

### System Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Express API    │────▶│   Gemini AI     │
│  (Firebase      │     │  (Cloud Run)    │     │                 │
│   Hosting)      │     │                 │     └─────────────────┘
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Cloud Firestore│
                        │  + Firebase Auth│
                        └─────────────────┘
```

### OOP Architecture (Backend)

**Strong Object-Oriented Design** with proper class hierarchies, design patterns, and encapsulation:

#### Core Classes

1. **StudyMetrics** - Encapsulates metric calculations with private fields and validation
2. **StreakManager** - Manages study streaks with state management and business logic
3. **ContentGenerator Hierarchy** - Abstract base class with 4 specialized subclasses:
   - `ExplanationGenerator`
   - `QuizGenerator`
   - `FlashcardGenerator`
   - `SummaryGenerator`

#### Design Patterns Implemented
- **Factory Pattern** - `ContentGeneratorFactory` for object creation
- **Template Method Pattern** - `ContentGenerator.generate()` defines algorithm structure
- **Strategy Pattern** - Interchangeable content generation strategies

#### OOP Principles Demonstrated
✅ Encapsulation (private fields with `#`)  
✅ Inheritance (2-level class hierarchy)  
✅ Polymorphism (method overriding)  
✅ Abstraction (abstract base classes)  
✅ SOLID Principles

📖 **[View Detailed OOP Documentation](StudySaathi-AI/backend/OOP_ARCHITECTURE.md)**

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud CLI

### Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

Backend (`backend/.env`):
```
GEMINI_API_KEY=your_key
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

Frontend (`frontend/.env`):
```
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_project
```

## Live Demo

- **Frontend:** https://crypto-isotope-483913-f4.web.app
- **API:** https://studysaathi-api-801277786344.asia-south1.run.app

## Team

Built for GDG Hackathon 2025

---

*"Saathi" means companion in Hindi - StudySaathi is your AI study companion* 🎯
