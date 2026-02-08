import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { Course } from '../../../core/models/course.model';

interface CourseWithProgress extends Course {
  progress: number;
  lastViewed?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  router = inject(Router);
  private enrollmentService = inject(EnrollmentService);
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);

  enrollmentData = computed(() => this.enrollmentService.getEnrollmentData());
  
  // Section expansion states
  showAllContinueLearning = signal(false);
  showAllRecentlyAdded = signal(false);
  showAllPopularInRole = signal(false);
  showAllRecommended = signal(false);

  // Continue Learning - enrolled courses with progress, sorted by last viewed
  continueLearningAll = computed<CourseWithProgress[]>(() => {
    const enrolledCourses = this.courseService.enrolledCourses();
    const allProgress = this.progressService.getAllProgress();
    
    return enrolledCourses
      .map(course => ({
        ...course,
        progress: this.progressService.getCourseCompletionPercentage(course.id),
        lastViewed: allProgress[course.id]?.lastViewedAt
      }))
      .sort((a, b) => {
        const dateA = a.lastViewed ? new Date(a.lastViewed).getTime() : 0;
        const dateB = b.lastViewed ? new Date(b.lastViewed).getTime() : 0;
        return dateB - dateA;
      });
  });

  continueLearning = computed<CourseWithProgress[]>(() => {
    const all = this.continueLearningAll();
    return this.showAllContinueLearning() ? all : all.slice(0, 3);
  });

  // Recently Added - sorted by addedDate, filtered by user's role
  recentlyAddedAll = computed<Course[]>(() => {
    const enrollment = this.enrollmentData();
    if (!enrollment) return [];

    return [...this.courseService.courses()]
      .filter(course => course.roles.includes(enrollment.role))
      .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
  });

  recentlyAdded = computed<Course[]>(() => {
    const all = this.recentlyAddedAll();
    return this.showAllRecentlyAdded() ? all : all.slice(0, 3);
  });

  // Popular in Role - filtered by user's role
  popularInRoleAll = computed<Course[]>(() => {
    const enrollment = this.enrollmentData();
    if (!enrollment) return [];

    return this.courseService.courses()
      .filter(course => course.roles.includes(enrollment.role));
  });

  popularInRole = computed<Course[]>(() => {
    const all = this.popularInRoleAll();
    return this.showAllPopularInRole() ? all : all.slice(0, 3);
  });

  // Recommended - courses not enrolled that match user's role
  recommendedForYouAll = computed<Course[]>(() => {
    const enrollment = this.enrollmentData();
    if (!enrollment) return [];

    const enrolledIds = this.courseService.enrolledCourseIds();
    return this.courseService.courses()
      .filter(course => 
        course.roles.includes(enrollment.role) && 
        !enrolledIds.includes(course.id)
      );
  });

  recommendedForYou = computed<Course[]>(() => {
    const all = this.recommendedForYouAll();
    return this.showAllRecommended() ? all : all.slice(0, 3);
  });

  ngOnInit(): void {
    // CourseService loads courses automatically in constructor
  }

  getGreeting(): string {
    const enrollment = this.enrollmentData();
    if (!enrollment) return 'Welcome!';
    
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${enrollment.name}!`;
    if (hour < 18) return `Good afternoon, ${enrollment.name}!`;
    return `Good evening, ${enrollment.name}!`;
  }

  getCourseProgress(courseId: string): number {
    return this.progressService.getCourseCompletionPercentage(courseId);
  }

  getResumePoint(courseId: string) {
    return this.progressService.getResumePoint(courseId);
  }

  continueCourse(courseId: string, event: Event): void {
    event.stopPropagation();
    const resumePoint = this.getResumePoint(courseId);
    if (resumePoint) {
      this.router.navigate(['/courses', courseId, 'lesson', resumePoint.lessonId], {
        queryParams: { item: resumePoint.itemId }
      });
    } else {
      this.router.navigate(['/courses', courseId]);
    }
  }

  viewCourse(courseId: string): void {
    this.router.navigate(['/courses', courseId]);
  }

  getTotalLessons(course: Course): number {
    return course.lessons?.length || 0;
  }

  isEnrolled(courseId: string): boolean {
    return this.courseService.isEnrolledInCourse(courseId);
  }

  // Toggle functions for See More/Show Less
  toggleContinueLearning(): void {
    this.showAllContinueLearning.set(!this.showAllContinueLearning());
  }

  toggleRecentlyAdded(): void {
    this.showAllRecentlyAdded.set(!this.showAllRecentlyAdded());
  }

  togglePopularInRole(): void {
    this.showAllPopularInRole.set(!this.showAllPopularInRole());
  }

  toggleRecommended(): void {
    this.showAllRecommended.set(!this.showAllRecommended());
  }

  // Check if section should show See More button
  shouldShowSeeMore(sectionType: 'continue' | 'recent' | 'popular' | 'recommended'): boolean {
    switch (sectionType) {
      case 'continue':
        return this.continueLearningAll().length > 3;
      case 'recent':
        return this.recentlyAddedAll().length > 3;
      case 'popular':
        return this.popularInRoleAll().length > 3;
      case 'recommended':
        return this.recommendedForYouAll().length > 3;
      default:
        return false;
    }
  }
}
