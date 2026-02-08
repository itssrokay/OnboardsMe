import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { QuizService } from '../../../core/services/quiz.service';
import { StorageService } from '../../../core/services/storage.service';
import { Course } from '../../../core/models/course.model';
import { DashboardStatsComponent } from '../dashboard-stats/dashboard-stats.component';
import { DashboardCourseCardComponent } from '../dashboard-course-card/dashboard-course-card.component';

export interface CourseProgressData {
  course: Course;
  lessonsCompleted: number;
  totalLessons: number;
  itemsCompleted: number;
  totalItems: number;
  percentComplete: number;
  status: 'not-started' | 'in-progress' | 'completed';
  quizStatus: 'locked' | 'available' | 'failed' | 'passed';
  quizScore?: number;
  lastViewedAt?: string;
  actionButton: {
    text: string;
    action: 'start' | 'continue' | 'take-quiz' | 'retake-quiz' | 'view-results';
  };
}

/**
 * Smart container component for the Progress Dashboard
 * Handles all data fetching and business logic
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardStatsComponent, DashboardCourseCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  router = inject(Router); // Public for template access
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private quizService = inject(QuizService);
  private storageService = inject(StorageService);
  
  loading = signal(true);
  
  // User info
  enrollmentData = computed(() => this.storageService.enrollmentData());
  userRole = computed(() => this.enrollmentData()?.role);
  userName = computed(() => this.enrollmentData()?.name);
  
  // Get all courses for user's role
  userCourses = computed(() => {
    const role = this.userRole();
    if (!role) return [];
    return this.courseService.courses().filter(course => course.roles.includes(role));
  });
  
  // Overall completion percentage
  overallCompletion = computed(() => {
    const courses = this.userCourses();
    if (courses.length === 0) return 0;
    
    const completedCourses = courses.filter(course => 
      this.progressService.getCourseCompletionPercentage(course.id) === 100
    ).length;
    
    return Math.round((completedCourses / courses.length) * 100);
  });
  
  // Total quiz scores
  totalQuizzesPassed = computed(() => {
    const courses = this.userCourses();
    return courses.filter(course => {
      const quiz = this.quizService.getQuizByCourseId(course.id);
      return quiz && this.quizService.hasPassedQuiz(quiz.id);
    }).length;
  });
  
  totalQuizzesFailed = computed(() => {
    const courses = this.userCourses();
    return courses.filter(course => {
      const quiz = this.quizService.getQuizByCourseId(course.id);
      if (!quiz) return false;
      const attempts = this.quizService.getAllAttempts(quiz.id);
      return attempts.length > 0 && !this.quizService.hasPassedQuiz(quiz.id);
    }).length;
  });
  
  averageQuizScore = computed(() => {
    const courses = this.userCourses();
    const scores: number[] = [];
    
    courses.forEach(course => {
      const quiz = this.quizService.getQuizByCourseId(course.id);
      if (quiz) {
        const attempts = this.quizService.getAllAttempts(quiz.id);
        if (attempts.length > 0) {
          const bestScore = Math.max(...attempts.map(a => a.score));
          scores.push(bestScore);
        }
      }
    });
    
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  });
  
  // Course progress data with all necessary info
  courseProgressData = computed<CourseProgressData[]>(() => {
    const courses = this.userCourses();
    
    return courses.map(course => {
      const totalLessons = course.lessons?.length || 0;
      const totalItems = course.lessons?.reduce((sum, lesson) => 
        sum + (lesson.learningItems?.length || 0), 0
      ) || 0;
      
      const courseProgress = this.progressService.getCourseProgress(course.id);
      const completedItems = courseProgress?.completedItems || [];
      
      // Calculate completed lessons (a lesson is complete if all its items are complete)
      const lessonsCompleted = course.lessons?.filter(lesson => {
        const lessonItemIds = lesson.learningItems?.map(item => item.id) || [];
        return lessonItemIds.length > 0 && 
               lessonItemIds.every(itemId => completedItems.includes(itemId));
      }).length || 0;
      
      const itemsCompleted = completedItems.length;
      const percentComplete = this.progressService.getCourseCompletionPercentage(course.id);
      
      // Determine status
      let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';
      if (percentComplete === 100) {
        status = 'completed';
      } else if (percentComplete > 0) {
        status = 'in-progress';
      }
      
      // Quiz status
      const quiz = this.quizService.getQuizByCourseId(course.id);
      let quizStatus: 'locked' | 'available' | 'failed' | 'passed' = 'locked';
      let quizScore: number | undefined;
      
      if (quiz) {
        if (percentComplete === 100) {
          const passed = this.quizService.hasPassedQuiz(quiz.id);
          const attempts = this.quizService.getAllAttempts(quiz.id);
          
          if (passed) {
            quizStatus = 'passed';
          } else if (attempts.length > 0) {
            quizStatus = 'failed';
          } else {
            quizStatus = 'available';
          }
          
          if (attempts.length > 0) {
            quizScore = Math.max(...attempts.map(a => a.score));
          }
        }
      }
      
      // Action button
      let actionButton: CourseProgressData['actionButton'];
      if (status === 'not-started') {
        actionButton = { text: 'Start Course', action: 'start' };
      } else if (status === 'in-progress') {
        actionButton = { text: 'Continue Learning', action: 'continue' };
      } else if (quizStatus === 'available') {
        actionButton = { text: 'Take Quiz', action: 'take-quiz' };
      } else if (quizStatus === 'failed') {
        actionButton = { text: 'Retake Quiz', action: 'retake-quiz' };
      } else if (quizStatus === 'passed') {
        actionButton = { text: 'View Results', action: 'view-results' };
      } else {
        actionButton = { text: 'Continue', action: 'continue' };
      }
      
      return {
        course,
        lessonsCompleted,
        totalLessons,
        itemsCompleted,
        totalItems,
        percentComplete,
        status,
        quizStatus,
        quizScore,
        lastViewedAt: courseProgress?.lastViewedAt,
        actionButton
      };
    }).sort((a, b) => {
      // Sort: in-progress first, then not-started, then completed
      const statusOrder = { 'in-progress': 0, 'not-started': 1, 'completed': 2 };
      const orderDiff = statusOrder[a.status] - statusOrder[b.status];
      
      if (orderDiff !== 0) return orderDiff;
      
      // Within same status, sort by last viewed (most recent first)
      if (a.lastViewedAt && b.lastViewedAt) {
        return new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime();
      }
      if (a.lastViewedAt) return -1;
      if (b.lastViewedAt) return 1;
      
      return 0;
    });
  });
  
  // Filtered views
  inProgressCourses = computed(() => 
    this.courseProgressData().filter(c => c.status === 'in-progress')
  );
  
  completedCourses = computed(() => 
    this.courseProgressData().filter(c => c.status === 'completed')
  );
  
  notStartedCourses = computed(() => 
    this.courseProgressData().filter(c => c.status === 'not-started')
  );
  
  ngOnInit(): void {
    // Wait for services to load
    this.waitForData().then(() => {
      this.loading.set(false);
    });
  }
  
  private waitForData(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (!this.courseService.loading() && !this.quizService.loading()) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
  
  handleCourseAction(data: CourseProgressData): void {
    switch (data.actionButton.action) {
      case 'start':
        this.router.navigate(['/courses', data.course.id]);
        break;
      case 'continue':
        const resumePoint = this.progressService.getResumePoint(data.course.id);
        if (resumePoint) {
          this.router.navigate(['/courses', data.course.id, 'lesson', resumePoint.lessonId], {
            queryParams: { item: resumePoint.itemId }
          });
        } else {
          this.router.navigate(['/courses', data.course.id]);
        }
        break;
      case 'take-quiz':
      case 'retake-quiz':
        this.router.navigate(['/courses', data.course.id, 'quiz']);
        break;
      case 'view-results':
        this.router.navigate(['/courses', data.course.id, 'quiz', 'result']);
        break;
    }
  }
  
  viewCourseDetails(courseId: string): void {
    this.router.navigate(['/courses', courseId]);
  }
}
