/**
 * OOP Usage Examples
 * Demonstrates how to use the OOP classes in StudySaathi-AI
 */

const StudyMetrics = require('../models/StudyMetrics');
const StreakManager = require('../models/StreakManager');
const { ContentGeneratorFactory } = require('../models/ContentGenerator');

// ============================================
// Example 1: StudyMetrics Class
// ============================================

function exampleStudyMetrics() {
  console.log('=== StudyMetrics Example ===\n');

  // Create a new StudyMetrics instance
  const metrics = new StudyMetrics(
    90,  // timeSpentMinutes
    4,   // notesCount
    4,   // confidence (1-5)
    85   // quizAvgScore
  );

  // Get calculated scores
  console.log('Time Score:', metrics.getTimeScore());
  console.log('Notes Score:', metrics.getNotesScore());
  console.log('Confidence Score:', metrics.getConfidenceScore());
  console.log('Overall Strength Score:', metrics.calculateStrengthScore());
  console.log('Strength Label:', metrics.getStrengthLabel());

  // Get detailed breakdown
  const breakdown = metrics.getBreakdown();
  console.log('\nDetailed Breakdown:', breakdown);

  // Get improvement suggestions
  const suggestions = metrics.getImprovementSuggestions();
  console.log('\nImprovement Suggestions:', suggestions);

  // Update metrics (method chaining)
  metrics.addTimeSpent(30).addNote().updateConfidence(5);
  console.log('\nAfter updates - New Score:', metrics.calculateStrengthScore());

  // Create from existing object (Factory pattern)
  const metricsFromDB = StudyMetrics.fromObject({
    timeSpentMinutes: 60,
    notesCount: 2,
    confidence: 3,
    quizAvgScore: 70
  });
  console.log('\nFrom DB - Score:', metricsFromDB.calculateStrengthScore());

  // Compare two metrics
  const comparison = metrics.compareTo(metricsFromDB);
  console.log('Comparison result:', comparison > 0 ? 'First is stronger' : 'Second is stronger');
}

// ============================================
// Example 2: StreakManager Class
// ============================================

function exampleStreakManager() {
  console.log('\n\n=== StreakManager Example ===\n');

  // Create a new StreakManager
  const streakManager = new StreakManager('user123', {
    currentStreak: 7,
    longestStreak: 15,
    lastActiveDate: '2026-03-09',
    streakHistory: [
      { date: '2026-03-03', streak: 1 },
      { date: '2026-03-04', streak: 2 },
      { date: '2026-03-05', streak: 3 },
      { date: '2026-03-06', streak: 4 },
      { date: '2026-03-07', streak: 5 },
      { date: '2026-03-08', streak: 6 },
      { date: '2026-03-09', streak: 7 }
    ],
    userContext: {
      examName: 'JEE',
      userName: 'Rahul',
      examDate: '2026-04-15'
    }
  });

  // Check streak status
  console.log('Has studied today?', streakManager.hasStudiedToday());
  console.log('Is streak broken?', streakManager.isStreakBroken());

  // Get statistics
  const stats = streakManager.getStatistics();
  console.log('\nStreak Statistics:', stats);

  // Get milestone information
  const milestone = streakManager.getMilestone();
  console.log('\nCurrent Milestone:', milestone.current);
  console.log('Next Milestone:', milestone.next);
  console.log('Days to next milestone:', milestone.daysToNext);

  // Update for today
  const updateResult = streakManager.updateForToday();
  console.log('\nUpdate Result:', updateResult);

  // Export to plain object (for database storage)
  const dataToSave = streakManager.toObject();
  console.log('\nData to save:', dataToSave);

  // Create from Firestore data (Factory pattern)
  const streakFromDB = StreakManager.fromFirestoreData('user456', {
    currentStreak: 3,
    longestStreak: 10,
    lastActiveDate: '2026-03-10',
    examName: 'NEET',
    userName: 'Priya'
  });
  console.log('\nFrom Firestore - Current Streak:', streakFromDB.currentStreak);
}

// ============================================
// Example 3: ContentGenerator Hierarchy
// ============================================

async function exampleContentGenerators() {
  console.log('\n\n=== ContentGenerator Examples ===\n');

  // Example 3a: Quiz Generator
  console.log('--- Quiz Generator ---');
  const quizGenerator = ContentGeneratorFactory.create(
    'quiz',
    'Physics',
    'Newton\'s Laws of Motion',
    'JEE',
    { questionCount: 5, difficulty: 'medium' }
  );

  console.log('Generator type:', quizGenerator.constructor.name);
  console.log('Subject:', quizGenerator.subject);
  console.log('Topic:', quizGenerator.topic);
  console.log('Exam Type:', quizGenerator.examType);

  // In real usage, this would call the AI API
  // const quizResult = await quizGenerator.generate();

  // Example 3b: Explanation Generator
  console.log('\n--- Explanation Generator ---');
  const explanationGenerator = ContentGeneratorFactory.create(
    'explanation',
    'Chemistry',
    'Chemical Bonding',
    'NEET',
    { detailLevel: 'detailed' }
  );

  console.log('Generator type:', explanationGenerator.constructor.name);
  console.log('Detail level:', explanationGenerator._detailLevel);

  // Example 3c: Flashcard Generator
  console.log('\n--- Flashcard Generator ---');
  const flashcardGenerator = ContentGeneratorFactory.create(
    'flashcards',
    'Mathematics',
    'Trigonometry',
    'JEE',
    { cardCount: 8 }
  );

  console.log('Generator type:', flashcardGenerator.constructor.name);
  console.log('Card count:', flashcardGenerator._cardCount);

  // Example 3d: Summary Generator
  console.log('\n--- Summary Generator ---');
  const summaryGenerator = ContentGeneratorFactory.create(
    'summary',
    'Biology',
    'Cell Structure',
    'NEET'
  );

  console.log('Generator type:', summaryGenerator.constructor.name);

  // Get supported types
  console.log('\nSupported content types:', ContentGeneratorFactory.getSupportedTypes());
}

// ============================================
// Example 4: Polymorphism Demonstration
// ============================================

async function examplePolymorphism() {
  console.log('\n\n=== Polymorphism Example ===\n');

  const generators = [
    ContentGeneratorFactory.create('quiz', 'Physics', 'Mechanics', 'JEE'),
    ContentGeneratorFactory.create('explanation', 'Chemistry', 'Acids', 'NEET'),
    ContentGeneratorFactory.create('flashcards', 'Math', 'Algebra', 'CAT'),
    ContentGeneratorFactory.create('summary', 'Biology', 'Genetics', 'NEET')
  ];

  // All generators can be treated uniformly (polymorphism)
  generators.forEach(generator => {
    console.log(`${generator.constructor.name}:`);
    console.log(`  Subject: ${generator.subject}`);
    console.log(`  Topic: ${generator.topic}`);
    console.log(`  Exam: ${generator.examType}`);
    // Each would call generate() the same way, but behave differently
    // await generator.generate();
  });
}

// ============================================
// Example 5: Encapsulation & Data Protection
// ============================================

function exampleEncapsulation() {
  console.log('\n\n=== Encapsulation Example ===\n');

  const metrics = new StudyMetrics(50, 2, 3, 60);

  // Can't access private fields directly
  console.log('Can access private field directly?', metrics.#timeSpentMinutes); // This would error
  
  // Must use getters
  console.log('Time spent (via getter):', metrics.timeSpentMinutes);

  // Setters have validation
  try {
    metrics.timeSpentMinutes = -10; // This will throw error
  } catch (error) {
    console.log('Validation error caught:', error.message);
  }

  // Confidence is automatically clamped
  metrics.confidence = 10; // Will be clamped to 5
  console.log('Confidence after setting to 10:', metrics.confidence); // Shows 5

  // Data integrity is protected
  console.log('\nData integrity maintained through encapsulation!');
}

// ============================================
// Example 6: Real-world Integration
// ============================================

async function exampleRealWorldUsage() {
  console.log('\n\n=== Real-world Integration Example ===\n');

  // Simulating a student studying a topic
  console.log('Student starts studying "Thermodynamics"...\n');

  // Track study session
  const metrics = new StudyMetrics(0, 0, 2, 0); // Starting weak
  console.log('Initial strength:', metrics.getStrengthLabel());

  // After 45 minutes of study
  metrics.addTimeSpent(45);
  console.log('After 45 min study:', metrics.getStrengthLabel());

  // Student takes notes
  metrics.addNote().addNote();
  console.log('After taking 2 notes:', metrics.getStrengthLabel());

  // Student takes a quiz and scores 75%
  metrics.updateQuizScore(75);
  console.log('After quiz (75%):', metrics.getStrengthLabel());

  // Student feels more confident
  metrics.updateConfidence(4);
  console.log('After confidence boost:', metrics.getStrengthLabel());

  // Final assessment
  const finalBreakdown = metrics.getBreakdown();
  console.log('\nFinal Assessment:', finalBreakdown);

  // Get personalized suggestions
  const suggestions = metrics.getImprovementSuggestions();
  console.log('\nSuggestions for improvement:');
  suggestions.forEach(s => console.log(`  - [${s.priority}] ${s.area}: ${s.message}`));

  // Update streak
  const streakManager = new StreakManager('student123', {
    currentStreak: 5,
    longestStreak: 10
  });
  
  const streakUpdate = streakManager.updateForToday();
  console.log('\nStreak updated:', streakUpdate);
  
  const milestone = streakManager.getMilestone();
  if (milestone.next) {
    console.log(`Next milestone: ${milestone.next.title} in ${milestone.daysToNext} days!`);
  }
}

// ============================================
// Run Examples
// ============================================

if (require.main === module) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     StudySaathi-AI OOP Architecture Examples          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Run all examples
  exampleStudyMetrics();
  exampleStreakManager();
  exampleContentGenerators();
  examplePolymorphism();
  
  // Note: Encapsulation example would cause syntax error due to private field access
  // exampleEncapsulation();
  
  exampleRealWorldUsage();

  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║              Examples completed!                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
}

module.exports = {
  exampleStudyMetrics,
  exampleStreakManager,
  exampleContentGenerators,
  examplePolymorphism,
  exampleRealWorldUsage
};
