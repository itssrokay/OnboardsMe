import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Quiz, QuizAttempt, QuizResult, QuestionResult } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private http = inject(HttpClient);
  
  private quizzes = signal<Quiz[]>([]);
  private attempts = signal<QuizAttempt[]>([]);
  loading = signal(false);
  
  private readonly ATTEMPTS_KEY = 'onboardsMe_quiz_attempts';
  
  constructor() {
    this.loadQuizzes();
    this.loadAttempts();
  }
  
  private loadQuizzes(): void {
    this.loading.set(true);
    this.http.get<{ quizzes: Quiz[] }>('/assets/config/quizzes.config.json').subscribe({
      next: (data) => {
        this.quizzes.set(data.quizzes);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load quizzes:', err);
        this.loading.set(false);
      }
    });
  }
  
  private loadAttempts(): void {
    const stored = localStorage.getItem(this.ATTEMPTS_KEY);
    if (stored) {
      try {
        const attempts = JSON.parse(stored);
        this.attempts.set(attempts);
      } catch (err) {
        console.error('Failed to parse quiz attempts:', err);
      }
    }
  }
  
  private saveAttempts(): void {
    localStorage.setItem(this.ATTEMPTS_KEY, JSON.stringify(this.attempts()));
  }
  
  getQuizByCourseId(courseId: string): Quiz | null {
    return this.quizzes().find(q => q.courseId === courseId) || null;
  }
  
  getQuizById(quizId: string): Quiz | null {
    return this.quizzes().find(q => q.id === quizId) || null;
  }
  
  hasAttemptedQuiz(quizId: string): boolean {
    return this.attempts().some(a => a.quizId === quizId);
  }
  
  getLatestAttempt(quizId: string): QuizAttempt | null {
    const quizAttempts = this.attempts()
      .filter(a => a.quizId === quizId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    
    return quizAttempts[0] || null;
  }
  
  getAllAttempts(quizId: string): QuizAttempt[] {
    return this.attempts()
      .filter(a => a.quizId === quizId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
  
  getPassedQuizIds(): string[] {
    return this.attempts()
      .filter(a => a.passed && a.completedAt)
      .map(a => a.quizId);
  }
  
  hasPassedQuiz(quizId: string): boolean {
    return this.attempts().some(a => a.quizId === quizId && a.passed);
  }
  
  startQuizAttempt(quizId: string, courseId: string): QuizAttempt {
    const attempt: QuizAttempt = {
      quizId,
      courseId,
      startedAt: new Date().toISOString(),
      answers: {},
      score: 0,
      passed: false
    };
    
    return attempt;
  }
  
  submitQuizAttempt(attempt: QuizAttempt, answers: Record<string, string | number>): QuizResult {
    const quiz = this.getQuizById(attempt.quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    
    const result = this.calculateQuizScore(quiz, answers);
    
    // Update attempt
    attempt.completedAt = new Date().toISOString();
    attempt.answers = answers;
    attempt.score = result.score;
    attempt.passed = result.passed;
    
    if (attempt.startedAt) {
      const timeTaken = (new Date().getTime() - new Date(attempt.startedAt).getTime()) / 1000;
      attempt.timeTaken = Math.round(timeTaken);
    }
    
    // Save attempt
    const allAttempts = [...this.attempts(), attempt];
    this.attempts.set(allAttempts);
    this.saveAttempts();
    
    return result;
  }
  
  /**
   * Pure function to calculate quiz score
   * @param quiz The quiz configuration
   * @param answers User's answers (questionId -> answer)
   * @returns QuizResult with detailed breakdown
   */
  calculateQuizScore(quiz: Quiz, answers: Record<string, string | number>): QuizResult {
    const questionResults: QuestionResult[] = [];
    let totalPoints = 0;
    let earnedPoints = 0;
    
    quiz.questions.forEach(question => {
      const userAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer;
      
      // Normalize answers for comparison
      const normalizedUserAnswer = typeof userAnswer === 'string' ? userAnswer.toLowerCase() : userAnswer;
      const normalizedCorrectAnswer = typeof correctAnswer === 'string' ? correctAnswer.toLowerCase() : correctAnswer;
      
      const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      const earnedPts = isCorrect ? question.points : 0;
      
      totalPoints += question.points;
      earnedPoints += earnedPts;
      
      questionResults.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer,
        isCorrect,
        points: question.points,
        earnedPoints: earnedPts,
        explanation: question.explanation
      });
    });
    
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const correctAnswers = questionResults.filter(r => r.isCorrect).length;
    const wrongAnswers = questionResults.length - correctAnswers;
    const passed = score >= quiz.passingScore;
    
    return {
      totalQuestions: quiz.questions.length,
      correctAnswers,
      wrongAnswers,
      score,
      passed,
      passingScore: quiz.passingScore,
      questionResults
    };
  }
  
  resetQuizAttempts(quizId: string): void {
    const filtered = this.attempts().filter(a => a.quizId !== quizId);
    this.attempts.set(filtered);
    this.saveAttempts();
  }
}
