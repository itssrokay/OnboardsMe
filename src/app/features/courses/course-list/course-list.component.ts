import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { StorageService } from '../../../core/services/storage.service';
import { Course } from '../../../core/models/course.model';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.scss'
})
export class CourseListComponent {
  private router = inject(Router);
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private storageService = inject(StorageService);
  
  // Filter state
  activeFilter = signal<'all' | 'enrolled' | 'available'>('all');
  searchQuery = signal('');
  
  // User info
  userRole = computed(() => this.storageService.enrollmentData()?.role);
  userName = computed(() => this.storageService.enrollmentData()?.name);
  
  // Course lists - all filtered by user's role
  allCourses = computed(() => {
    const role = this.userRole();
    const courses = this.courseService.courses();
    return role ? courses.filter(course => course.roles.includes(role)) : courses;
  });
  
  enrolledCourses = computed(() => {
    const role = this.userRole();
    return this.courseService.enrolledCourses()
      .filter(course => !role || course.roles.includes(role))
      .map(course => ({
        ...course,
        progress: this.progressService.getCourseCompletionPercentage(course.id),
        isEnrolled: true
      }));
  });
  
  availableCourses = computed(() => {
    const role = this.userRole();
    return this.courseService.availableCourses()
      .filter(course => !role || course.roles.includes(role))
      .map(course => ({
        ...course,
        progress: 0,
        isEnrolled: false
      }));
  });
  
  // Filtered courses based on active filter and search
  filteredCourses = computed(() => {
    let courses: (Course & { progress: number; isEnrolled: boolean })[] = [];
    
    switch (this.activeFilter()) {
      case 'enrolled':
        courses = this.enrolledCourses();
        break;
      case 'available':
        courses = this.availableCourses();
        break;
      default:
        courses = [...this.enrolledCourses(), ...this.availableCourses()];
    }
    
    // Apply search filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      courses = courses.filter(course => 
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return courses;
  });
  
  // Stats
  totalEnrolled = computed(() => this.enrolledCourses().length);
  totalAvailable = computed(() => this.availableCourses().length);
  
  setFilter(filter: 'all' | 'enrolled' | 'available'): void {
    this.activeFilter.set(filter);
  }
  
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }
  
  viewCourse(courseId: string): void {
    this.router.navigate(['/courses', courseId]);
  }
  
  continueLearning(courseId: string, event: Event): void {
    event.stopPropagation();
    const resumePoint = this.progressService.getResumePoint(courseId);
    if (resumePoint) {
      this.router.navigate(['/courses', courseId, 'lesson', resumePoint.lessonId], {
        queryParams: { item: resumePoint.itemId }
      });
    } else {
      this.router.navigate(['/courses', courseId]);
    }
  }
  
  getTotalLessons(course: Course): number {
    return course.lessons?.length || 0;
  }
  
  getTotalItems(course: Course): number {
    return course.lessons?.reduce((total, lesson) => 
      total + (lesson.learningItems?.length || 0), 0
    ) || 0;
  }
  
  getDifficultyClass(difficulty: string): string {
    return difficulty.toLowerCase();
  }
}
