import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { StorageService } from '../../../core/services/storage.service';
import { Quiz } from '../../../core/models/quiz.model';

interface QuizCardData {
  quiz: Quiz;
  courseTitle: string;
  courseThumbnail: string;
  isLocked: boolean;
  isPassed: boolean;
  isAttempted: boolean;
  bestScore?: number;
  attemptCount: number;
  courseProgress: number;
}

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-list.component.html',
  styleUrl: './quiz-list.component.scss'
})
export class QuizListComponent implements OnInit {
  private router = inject(Router);
  private quizService = inject(QuizService);
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private storageService = inject(StorageService);
  
  quizCards = signal<QuizCardData[]>([]);
  loading = signal(true);
  
  // User role for filtering
  userRole = computed(() => this.storageService.enrollmentData()?.role);
  
  // Filters
  filterMode = signal<'all' | 'available' | 'passed' | 'locked'>('all');
  
  filteredQuizzes = computed(() => {
    const mode = this.filterMode();
    const cards = this.quizCards();
    
    switch (mode) {
      case 'available':
        return cards.filter(c => !c.isLocked && !c.isPassed);
      case 'passed':
        return cards.filter(c => c.isPassed);
      case 'locked':
        return cards.filter(c => c.isLocked);
      default:
        return cards;
    }
  });
  
  stats = computed(() => {
    const cards = this.quizCards();
    return {
      total: cards.length,
      available: cards.filter(c => !c.isLocked && !c.isPassed).length,
      passed: cards.filter(c => c.isPassed).length,
      locked: cards.filter(c => c.isLocked).length
    };
  });
  
  ngOnInit(): void {
    this.loadQuizzes();
  }
  
  private async loadQuizzes(): Promise<void> {
    this.loading.set(true);
    
    // Wait for services to load
    await this.waitForData();
    
    const quizCards: QuizCardData[] = [];
    
    // Get courses filtered by user's role
    const userRole = this.userRole();
    const allCourses = this.courseService.getAllCourses();
    const courses = userRole 
      ? allCourses.filter(course => course.roles.includes(userRole))
      : allCourses;
    
    courses.forEach(course => {
      const quiz = this.quizService.getQuizByCourseId(course.id);
      
      if (quiz) {
        const courseProgress = this.progressService.getCourseCompletionPercentage(course.id);
        const isLocked = courseProgress < 100;
        const isPassed = this.quizService.hasPassedQuiz(quiz.id);
        const isAttempted = this.quizService.hasAttemptedQuiz(quiz.id);
        const allAttempts = this.quizService.getAllAttempts(quiz.id);
        const attemptCount = allAttempts.length;
        
        let bestScore: number | undefined;
        if (allAttempts.length > 0) {
          bestScore = Math.max(...allAttempts.map(a => a.score));
        }
        
        quizCards.push({
          quiz,
          courseTitle: course.title,
          courseThumbnail: course.thumbnail,
          isLocked,
          isPassed,
          isAttempted,
          bestScore,
          attemptCount,
          courseProgress
        });
      }
    });
    
    this.quizCards.set(quizCards);
    this.loading.set(false);
  }
  
  private waitForData(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (!this.quizService.loading() && !this.courseService.loading()) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
  
  setFilter(mode: 'all' | 'available' | 'passed' | 'locked'): void {
    this.filterMode.set(mode);
  }
  
  takeQuiz(card: QuizCardData): void {
    if (card.isLocked) return;
    this.router.navigate(['/courses', card.quiz.courseId, 'quiz']);
  }
  
  viewResults(card: QuizCardData): void {
    if (!card.isAttempted) return;
    this.router.navigate(['/courses', card.quiz.courseId, 'quiz', 'result']);
  }
  
  goToCourse(card: QuizCardData): void {
    this.router.navigate(['/courses', card.quiz.courseId]);
  }
  
  getStatusBadgeClass(card: QuizCardData): string {
    if (card.isPassed) return 'status-passed';
    if (card.isAttempted) return 'status-attempted';
    if (card.isLocked) return 'status-locked';
    return 'status-available';
  }
  
  getStatusText(card: QuizCardData): string {
    if (card.isPassed) return 'Passed';
    if (card.isAttempted) return 'Not Passed';
    if (card.isLocked) return 'Locked';
    return 'Available';
  }
  
  getActionButtonText(card: QuizCardData): string {
    if (card.isLocked) return 'Complete Course';
    if (card.isPassed) return 'View Results';
    if (card.isAttempted) return 'Retake Quiz';
    return 'Take Quiz';
  }
}
