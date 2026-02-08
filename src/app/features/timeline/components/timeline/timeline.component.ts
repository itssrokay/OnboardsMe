import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { QuizService } from '../../../../core/services/quiz.service';
import { StorageService } from '../../../../core/services/storage.service';
import { TimelineItemComponent } from '../timeline-item/timeline-item.component';

export interface TimelineEvent {
  id: string;
  type: 'enrollment' | 'course-start' | 'course-complete' | 'quiz-passed';
  title: string;
  description: string;
  date: string;
  timestamp: number;
  courseId?: string;
  courseName?: string;
  score?: number;
  icon: 'enrollment' | 'start' | 'complete' | 'quiz';
}

/**
 * Smart container component for Course Timeline
 * Derives all timeline events from stored progress using computed signals
 */
@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, TimelineItemComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss'
})
export class TimelineComponent implements OnInit {
  router = inject(Router);
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
  
  // Generate timeline events from all progress data
  timelineEvents = computed<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];
    const enrollment = this.enrollmentData();
    
    if (!enrollment) return events;
    
    // 1. Enrollment Event
    events.push({
      id: 'enrollment',
      type: 'enrollment',
      title: 'Enrolled in OnboardsMe',
      description: `Started your learning journey as ${enrollment.role}`,
      date: enrollment.enrollmentDate,
      timestamp: new Date(enrollment.enrollmentDate).getTime(),
      icon: 'enrollment'
    });
    
    // 2. Course Events (start, completion)
    const courses = this.userCourses();
    courses.forEach(course => {
      const courseProgress = this.progressService.getCourseProgress(course.id);
      
      if (courseProgress) {
        // Course Start Event
        events.push({
          id: `course-start-${course.id}`,
          type: 'course-start',
          title: `Started "${course.title}"`,
          description: `Began learning ${course.lessons?.length || 0} lessons`,
          date: courseProgress.enrolledAt,
          timestamp: new Date(courseProgress.enrolledAt).getTime(),
          courseId: course.id,
          courseName: course.title,
          icon: 'start'
        });
        
        // Course Completion Event (only if 100% complete)
        const percentComplete = this.progressService.getCourseCompletionPercentage(course.id);
        if (percentComplete === 100 && courseProgress.lastViewedAt) {
          // Use lastViewedAt as approximation for completion time
          events.push({
            id: `course-complete-${course.id}`,
            type: 'course-complete',
            title: `Completed "${course.title}"`,
            description: `Finished all ${courseProgress.totalItems} learning items`,
            date: courseProgress.lastViewedAt,
            timestamp: new Date(courseProgress.lastViewedAt).getTime(),
            courseId: course.id,
            courseName: course.title,
            icon: 'complete'
          });
        }
      }
    });
    
    // 3. Quiz Events (only passed quizzes)
    courses.forEach(course => {
      const quiz = this.quizService.getQuizByCourseId(course.id);
      if (quiz) {
        const attempts = this.quizService.getAllAttempts(quiz.id);
        
        // Find the first passing attempt
        const passingAttempt = attempts.find(attempt => 
          attempt.score >= quiz.passingScore && attempt.completedAt
        );
        
        if (passingAttempt && passingAttempt.completedAt) {
          // Calculate correct answers
          const totalQuestions = quiz.questions.length;
          const correctAnswers = Math.round((passingAttempt.score / 100) * totalQuestions);
          
          events.push({
            id: `quiz-passed-${course.id}`,
            type: 'quiz-passed',
            title: `Passed "${course.title}" Quiz`,
            description: `Scored ${passingAttempt.score}% (${correctAnswers}/${totalQuestions} correct)`,
            date: passingAttempt.completedAt,
            timestamp: new Date(passingAttempt.completedAt).getTime(),
            courseId: course.id,
            courseName: course.title,
            score: passingAttempt.score,
            icon: 'quiz'
          });
        }
      }
    });
    
    // Sort events chronologically (newest first for timeline display)
    return events.sort((a, b) => b.timestamp - a.timestamp);
  });
  
  // Stats for summary
  totalEvents = computed(() => this.timelineEvents().length);
  coursesStarted = computed(() => 
    this.timelineEvents().filter(e => e.type === 'course-start').length
  );
  coursesCompleted = computed(() => 
    this.timelineEvents().filter(e => e.type === 'course-complete').length
  );
  quizzesPassed = computed(() => 
    this.timelineEvents().filter(e => e.type === 'quiz-passed').length
  );
  
  // Get enrollment date formatted
  enrollmentDate = computed(() => {
    const enrollment = this.enrollmentData();
    if (!enrollment) return null;
    return new Date(enrollment.enrollmentDate);
  });
  
  // Calculate days since enrollment
  daysSinceEnrollment = computed(() => {
    const enrollDate = this.enrollmentDate();
    if (!enrollDate) return 0;
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - enrollDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });
  
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
  
  navigateToCourse(courseId?: string): void {
    if (courseId) {
      this.router.navigate(['/courses', courseId]);
    }
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }
  
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleTimeString('en-US', options);
  }
  
  formatDateTime(dateString: string): string {
    return `${this.formatDate(dateString)} at ${this.formatTime(dateString)}`;
  }
  
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}
