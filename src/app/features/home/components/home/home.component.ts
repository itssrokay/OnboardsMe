import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { Course } from '../../../../core/models/course.model';

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

  // Continue Learning - enrolled courses with progress, sorted by last viewed
  continueLearning = computed<CourseWithProgress[]>(() => {
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
      })
      .slice(0, 6);
  });

  // Recently Added - sorted by addedDate, filtered by user's role
  recentlyAdded = computed<Course[]>(() => {
    const enrollment = this.enrollmentData();
    if (!enrollment) return [];

    return [...this.courseService.courses()]
      .filter(course => course.roles.includes(enrollment.role))
      .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
      .slice(0, 6);
  });

  // Popular in Role - filtered by user's role
  popularInRole = computed<Course[]>(() => {
    const enrollment = this.enrollmentData();
    if (!enrollment) return [];

    return this.courseService.courses()
      .filter(course => course.roles.includes(enrollment.role))
      .slice(0, 6);
  });

  // Recommended - courses not enrolled that match user's role
  recommendedForYou = computed<Course[]>(() => {
    const enrollment = this.enrollmentData();
    if (!enrollment) return [];

    const enrolledIds = this.courseService.enrolledCourseIds();
    return this.courseService.courses()
      .filter(course => 
        course.roles.includes(enrollment.role) && 
        !enrolledIds.includes(course.id)
      )
      .slice(0, 6);
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
}
