import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';

@Component({
  selector: 'app-course-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-selection.component.html',
  styleUrl: './course-selection.component.scss'
})
export class CourseSelectionComponent implements OnInit {
  private router = inject(Router);
  private enrollmentService = inject(EnrollmentService);
  private courseService = inject(CourseService);

  selectedCourses = signal<Set<string>>(new Set());
  loading = computed(() => this.courseService.loading());
  error = computed(() => this.courseService.error());
  
  // Get user's years of experience
  userExperience = computed(() => {
    const enrollment = this.enrollmentService.getEnrollmentData();
    return enrollment?.yearsOfExperience || 0;
  });
  
  // Get courses relevant to user's role and experience level
  courses = computed(() => {
    const enrollment = this.enrollmentService.getEnrollmentData();
    if (!enrollment) return [];
    
    const experience = this.userExperience();
    
    return this.courseService.courses().filter(course => {
      // Filter by role
      if (!course.roles.includes(enrollment.role)) return false;
      
      // Filter by experience level
      if (course.minExperience !== undefined && experience < course.minExperience) {
        return false;
      }
      if (course.maxExperience !== undefined && experience > course.maxExperience) {
        return false;
      }
      
      return true;
    });
  });
  
  // Group courses by category
  groupedCourses = computed(() => {
    const courses = this.courses();
    const groups = new Map<string, Course[]>();
    
    courses.forEach(course => {
      const category = course.category || 'Other';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(course);
    });
    
    // Sort categories: Computer Fundamentals first for beginners, then others
    const sortedCategories = Array.from(groups.entries()).sort((a, b) => {
      const categoryOrder = ['Computer Fundamentals', 'Angular', 'Java', 'Python', 'Product Analysis', 'Requirements', 'Other'];
      const indexA = categoryOrder.indexOf(a[0]);
      const indexB = categoryOrder.indexOf(b[0]);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    return sortedCategories;
  });

  ngOnInit(): void {
    const enrollment = this.enrollmentService.getEnrollmentData();
    if (!enrollment) {
      this.router.navigate(['/enroll']);
      return;
    }
  }

  toggleCourse(courseId: string): void {
    const selected = new Set(this.selectedCourses());
    if (selected.has(courseId)) {
      selected.delete(courseId);
    } else {
      selected.add(courseId);
    }
    this.selectedCourses.set(selected);
  }

  isSelected(courseId: string): boolean {
    return this.selectedCourses().has(courseId);
  }

  canProceed(): boolean {
    return this.selectedCourses().size > 0;
  }
  
  getTotalLessons(course: Course): number {
    return course.lessons?.length || 0;
  }

  proceed(): void {
    if (this.canProceed()) {
      const courseIds = Array.from(this.selectedCourses());
      this.enrollmentService.selectCourses(courseIds);
      this.router.navigate(['/onboarding']);
    }
  }
}
