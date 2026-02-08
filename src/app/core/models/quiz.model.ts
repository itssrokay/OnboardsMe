export interface QuizQuestion {
  id: string;
  type: 'single-choice' | 'true-false';
  question: string;
  options?: string[]; // For single-choice questions
  correctAnswer: string | number; // Option index (0-based) or 'true'/'false'
  explanation?: string; // Optional explanation shown after answering
  points: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  passingScore: number; // Percentage (0-100)
  timeLimit?: number; // Minutes (optional)
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  quizId: string;
  courseId: string;
  startedAt: string;
  completedAt?: string;
  answers: Record<string, string | number>; // questionId -> answer
  score: number; // 0-100
  passed: boolean;
  timeTaken?: number; // Seconds
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number; // 0-100
  passed: boolean;
  passingScore: number;
  timeTaken?: number;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  question: string;
  userAnswer: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  points: number;
  earnedPoints: number;
  explanation?: string;
}
