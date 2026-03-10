# Class Diagram - Visual Guide

> Simple visual guide to understand our OOP structure

## 1. Main Class Hierarchy

```mermaid
classDiagram
    class ContentGenerator {
        <<abstract>>
        #subject: string
        #topic: string
        #examType: string
        +generate() Promise
        +buildPrompt()* string
        +addExamContext() string
    }
    
    class ExplanationGenerator {
        -detailLevel: string
        +buildPrompt() string
    }
    
    class QuizGenerator {
        -questionCount: number
        -difficulty: string
        +buildPrompt() string
        +formatResponse() object
    }
    
    class FlashcardGenerator {
        -cardCount: number
        +buildPrompt() string
        +formatResponse() object
    }
    
    class SummaryGenerator {
        +buildPrompt() string
    }
    
    ContentGenerator <|-- ExplanationGenerator
    ContentGenerator <|-- QuizGenerator
    ContentGenerator <|-- FlashcardGenerator
    ContentGenerator <|-- SummaryGenerator
```

**What this means:**
- `ContentGenerator` is the parent (you can't create it directly)
- 4 children classes inherit from it
- Each child has its own special way of creating content

---

## 2. StudyMetrics Class

```mermaid
classDiagram
    class StudyMetrics {
        -timeSpentMinutes: number
        -notesCount: number
        -confidence: number
        -quizAvgScore: number
        +calculateStrengthScore() number
        +getStrengthLabel() string
        +addTimeSpent(minutes) StudyMetrics
        +addNote() StudyMetrics
        +getImprovementSuggestions() array
        +fromObject(obj)$ StudyMetrics
    }
```

**What this does:**
- Tracks how much a student studied a topic
- Calculates if they're "weak", "medium", or "strong"
- Gives suggestions on what to improve

---

## 3. StreakManager Class

```mermaid
classDiagram
    class StreakManager {
        -currentStreak: number
        -longestStreak: number
        -lastActiveDate: string
        -streakHistory: array
        +hasStudiedToday() boolean
        +isStreakBroken() boolean
        +updateForToday() object
        +getMilestone() object
        +generateMotivationalMessage() Promise
        +fromFirestoreData(userId, data)$ StreakManager
    }
```

**What this does:**
- Tracks daily study streaks (like Snapchat streaks!)
- Checks if you studied today
- Gives motivational messages
- Shows milestones (7 days, 30 days, etc.)

---

## 4. How Services Use Classes

```mermaid
graph LR
    A[topicTracker.js] -->|uses| B[StudyMetrics]
    C[streakTracker.js] -->|uses| D[StreakManager]
    E[gemini.js] -->|uses| F[ContentGeneratorFactory]
    F -->|creates| G[Quiz/Explanation/Flashcard/Summary]
    
    style B fill:#e1f5ff
    style D fill:#e1f5ff
    style F fill:#ffe1f5
    style G fill:#ffe1f5
```

**What this means:**
- Services (the functions) use our classes
- Classes do the heavy lifting
- Clean separation of concerns

---

## 5. Factory Pattern Flow

```mermaid
sequenceDiagram
    participant Client
    participant Factory
    participant QuizGen
    participant ExplanationGen
    
    Client->>Factory: create('quiz', 'Physics', 'Mechanics')
    Factory->>QuizGen: new QuizGenerator(...)
    QuizGen-->>Client: quiz generator instance
    
    Client->>Factory: create('explanation', 'Physics', 'Mechanics')
    Factory->>ExplanationGen: new ExplanationGenerator(...)
    ExplanationGen-->>Client: explanation generator instance
```

**What this means:**
- You ask the Factory for what you need
- Factory creates the right type for you
- You don't worry about how it's made

---

## 6. Template Method Pattern

```mermaid
flowchart TD
    A[generator.generate called] --> B[buildPrompt]
    B --> C[addExamContext]
    C --> D[executeGeneration]
    D --> E[formatResponse]
    E --> F[Return result]
    
    style B fill:#ffcccc
    style E fill:#ffcccc
    
    note1[Each subclass implements this differently]
    note2[Each subclass can customize this]
    
    B -.-> note1
    E -.-> note2
```

**What this means:**
- Parent class defines the steps
- Child classes fill in the details
- Same process, different implementations

---

## 7. Object Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: new StudyMetrics() or fromObject()
    Created --> InUse: addTimeSpent(), addNote()
    InUse --> InUse: updateConfidence()
    InUse --> Calculated: calculateStrengthScore()
    Calculated --> Saved: toObject() → Database
    Saved --> [*]
```

**What this means:**
- Create object
- Use it (add data)
- Calculate results
- Save to database

---

## 8. Real Example Flow

```mermaid
sequenceDiagram
    participant Student
    participant Service
    participant StudyMetrics
    participant Database
    
    Student->>Service: Studies Physics for 45 min
    Service->>StudyMetrics: new StudyMetrics(45, 0, 3, 0)
    Service->>StudyMetrics: addNote()
    Service->>StudyMetrics: updateConfidence(4)
    StudyMetrics->>StudyMetrics: calculateStrengthScore()
    StudyMetrics-->>Service: Score: 65 (Medium)
    Service->>Database: Save progress
    Service-->>Student: "Good progress! Keep going 💪"
```

**What this means:**
- Student studies
- We track it with our class
- Calculate their strength
- Save and show feedback

---

## Key Concepts Explained Simply

### 🔒 Encapsulation
**Like a capsule** - data is hidden inside, only accessible through methods
```javascript
// Can't do this: metrics.#timeSpentMinutes (private!)
// Must do this: metrics.timeSpentMinutes (getter)
```

### 👨‍👦 Inheritance
**Like family** - children inherit from parents
```javascript
QuizGenerator extends ContentGenerator
// QuizGenerator gets all ContentGenerator's methods
```

### 🎭 Polymorphism
**Same action, different results**
```javascript
quiz.generate()        // Creates quiz questions
explanation.generate() // Creates explanation
// Same method name, different behavior!
```

### 🏭 Factory Pattern
**Like a factory** - you order, it makes
```javascript
Factory.create('quiz')  // Factory makes a quiz generator
Factory.create('flashcards') // Factory makes flashcard generator
```

---

## Why This Matters

✅ **Easy to maintain** - Each class has one job  
✅ **Easy to extend** - Add new generators without breaking old code  
✅ **Easy to test** - Test each class separately  
✅ **Easy to understand** - Clear structure and relationships  

---

## Quick Reference

| Class | Purpose | Key Method |
|-------|---------|------------|
| StudyMetrics | Track study progress | `calculateStrengthScore()` |
| StreakManager | Track daily streaks | `updateForToday()` |
| ContentGenerator | Generate study content | `generate()` |
| Factory | Create generators | `create(type)` |

---

**Bottom line:** We use proper OOP to make code organized, reusable, and professional! 🎯
