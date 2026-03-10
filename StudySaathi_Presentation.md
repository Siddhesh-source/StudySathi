# StudySaathi AI
## Your AI-Powered Exam Companion

**GDG Hackathon 2026 | VIT Technical Council**

Built for Indian Students: JEE • NEET • UPSC  
Powered by Google Gemini AI

---

# THE PROBLEM

## What Indian Students Face Today

**Scattered Study Materials**  
→ Wastes time searching

**Generic AI Gives Textbook Answers**  
→ Hard to understand

**No Personalized Study Plan**  
→ Random, unfocused studying

**Writing Long Prompts on ChatGPT**  
→ 5 mins wasted per question

**Can't Track Weak Topics**  
→ Keep repeating same mistakes

**Social Media Distractions**  
→ No focus, no progress

**Notes Get Lost**  
→ Panic before exams

> *"Students spend more time managing study tools than actually studying."*

---

# PROPOSED SOLUTION

## StudySaathi - Your Smart Exam Partner

StudySaathi is a smart, exam-focused AI study partner designed for the average Indian student.

### What It Converts

**INPUT:**  
Syllabus + Exam Date + Your Notes

**OUTPUT:**  
Daily study plan + Personalized learning + Weakness tracking

---

## Three Pillars of StudySaathi

### 🎯 UNDERSTANDS YOU
- Knows your syllabus & deadline
- Creates realistic daily plan
- Adapts to weak topics
- Teaches in Hinglish

### 📚 LEARNS FROM YOUR DATA
- Upload notes → AI extracts concepts
- NotebookLM-style knowledge base
- Ask AI about YOUR notes
- Never lose important info

### 🏆 EXAM-FOCUSED
- Access real PYQs
- Take practice tests
- AI analyzes mistakes
- Focus mode for deep study

---

# CHATGPT vs STUDYSAATHI

## The ChatGPT Hassle ❌

1. Open ChatGPT
2. Think of what to type...
3. Type long prompt: "Explain electrochemical cells for JEE in simple language with examples and formulas and PYQs and common mistakes..."
4. Get generic essay response
5. Still confused? Type ANOTHER long prompt
6. No tracking, no schedule
7. Tomorrow... forget everything!

## The StudySaathi Way ✅

1. Open App
2. Click topic → Select "Explain Simply"
3. Get exam-focused explanation
4. One click → Practice questions
5. Progress auto-tracked
6. Tomorrow → Revision reminder!

---

## Feature Comparison

| Feature | ChatGPT ❌ | StudySaathi ✅ |
|---------|-----------|----------------|
| Getting Explanation | 50+ word prompts | 1-click |
| Exam Focus | Generic | JEE/NEET/UPSC specific |
| Language | Formal English | Simple Hinglish |
| Your Notes | Forgets everything | Upload once, remembers forever |
| Progress Tracking | None | Auto-tracks |
| Weak Topics | You remember | AI detects & fixes |
| Study Schedule | Make yourself | AI creates daily plan |
| PYQs | Search manually | Built-in, one click |
| Mock Tests | Not possible | Take tests + AI analysis |
| Distractions | Same browser | Focus mode |

> *"ChatGPT makes you the prompt engineer. StudySaathi makes you the student."*

---

# KEY FEATURES

## Core Features

### 1. Syllabus & Exam Input Module
- Enter exam, subjects, topics
- Set exam date & daily free hours
- Self-rated confidence per subject

### 2. AI Study Planner
- Auto-generated daily timetable
- Weak-topic prioritization
- Revision cycles built-in

### 3. Smart Learning Room ⭐
- Select topic → Choose learning style
- AI explains like a friendly tutor
- Customized levels: Beginner → Advanced
- Uses Hinglish + Indian examples
- Step-by-step breakdowns

### 4. Weak Topic Detection
- Tracks time, errors, feedback
- Strong/Medium/Weak classification
- Planner auto-adjusts

---

## New Features

### 5. Notes Upload & Knowledge Base 🆕
- Upload PDFs, images, handwritten notes
- AI extracts key information
- Ask questions about YOUR material
- Like NotebookLM for exam prep

### 6. PYQ Bank & Test Engine 🆕
- Browse PYQs by exam/subject/year
- Take timed mock tests
- AI analyzes wrong answers
- Performance tracking

### 7. Focus Mode 🆕
- Fullscreen distraction-free mode
- Timer-based study sessions
- Perfect for deep work

### 8. Motivation Engine
- Daily streaks
- Encouraging messages
- Consistency nudges

---

# HOW AI TEACHES

## The Learning Flow

📚 **Student picks:** "Organic Chemistry - Aldehydes"  
↓  
🏷️ **Selects style:** "Explain Simply"  
↓  
🤖 **AI generates:**
- Simple definition + real-life example
- Memory tricks (mnemonics)
- Common exam traps
- Practice questions

↓  
❓ **Follow-up:** "Still confused..."  
↓  
🤖 **AI re-explains:**
- Step-by-step diagram
- Simpler language
- "Think of it like..." analogy

↓  
✅ **Student gets it!**

---

## Learning Modes

| Mode | What You Get |
|------|--------------|
| "Explain like I'm 10" | Super simple analogies |
| "Quick revision" | Key points only |
| "Exam-ready" | Answer-writing format |
| "Deep dive" | Full conceptual understanding |

> *"Other AI gives Wikipedia answers. StudySaathi teaches like your friend who topped the exam."*

---

# COMPLETE USER FLOW

📱 Student Opens App  
↓  
📝 Enters Exam + Syllabus + Date  
↓  
📤 Uploads Notes/PDFs (Optional)  
↓  
🤖 AI Creates Personalized Study Plan  
↓  
📖 Learn: Smart Learning Room  
↓  
📝 Practice: PYQs + Mock Tests  
↓  
📊 AI Tracks Progress + Adjusts Plan  
↓  
🎯 Focus Mode: Distraction-Free Study  
↓  
🏆 **Better Scores!**

---

# TECH STACK

## Frontend

| Technology | Purpose |
|------------|---------|
| React 19 + Vite | Fast, modern UI |
| Tailwind CSS | Beautiful styling |
| React Router | Navigation |

## Backend

| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API |
| Multer | File uploads |

## Google Cloud 🔥

| Service | Purpose |
|---------|---------|
| Gemini API | AI brain - explanations, analysis |
| Firebase Auth | User login |
| Cloud Firestore | Database |
| Cloud Storage | Store notes/PDFs |
| Cloud Vision | OCR for handwritten notes |
| Document AI | Extract info from PDFs |
| Firebase Hosting | Frontend deployment |
| Cloud Run | Backend deployment |

---

# ARCHITECTURE

```
┌────────────────────────────────────────┐
│           React Frontend               │
│  Notes Upload │ PYQs │ Tests │ Focus   │
└────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│        Express API (Cloud Run)         │
│  Upload │ PYQ │ Test │ AI Analysis     │
└────────────────────────────────────────┘
        │           │            │
        ▼           ▼            ▼
┌──────────┐ ┌──────────┐ ┌─────────────┐
│  Cloud   │ │Firestore │ │ Gemini +    │
│  Storage │ │(Database)│ │ Vision AI   │
└──────────┘ └──────────┘ └─────────────┘
```

---

# WHY STUDYSAATHI?

| Problem ❌ | Solution ✅ |
|------------|-------------|
| Too many apps | One app for everything |
| Generic AI | Exam-specific AI |
| Can't find PYQs | Complete PYQ database |
| No weakness tracking | Auto-detects & adapts |
| Distractions | Focus mode |
| Lost notes | Cloud storage, AI-searchable |
| Long prompts | One-click learning |

---

# LIVE DEMO

**Frontend:**  
https://crypto-isotope-483913-f4.web.app

**API:**  
https://studysaathi-api-801277786344.asia-south1.run.app

---

# FINAL PITCH

> *"Students waste time writing prompts, searching for PYQs, and fighting distractions. StudySaathi eliminates all that - just pick a topic, click, and learn. It knows your exam, tracks your progress, stores your notes, teaches in YOUR language, and keeps you focused."*

## One App To Replace:

- ❌ ChatGPT
- ❌ Google Search
- ❌ Notes App
- ❌ ToDo App
- ❌ Timer App

## = ✅ StudySaathi

---

# SPEAKER NOTES

| Slide | What to Say |
|-------|-------------|
| Problem | "Students juggle 10 apps and still struggle" |
| ChatGPT vs Us | "5 minutes typing prompts vs 3 seconds clicking" |
| Features | "Not just doubt-solving - complete exam companion" |
| AI Teaching | "Like your senior who topped, not a textbook" |
| Tech Stack | "100% Google Cloud - Gemini powers everything" |

---

*"Saathi means companion - StudySaathi is your AI study companion"* 🎯

**Team: GDG Hackathon 2026**
