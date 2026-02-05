import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { CourseService } from '../../../../core/services/course.service';
import { Course } from '../../../../core/models/course.model';

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
  
  // Get courses relevant to user's role
  courses = computed(() => {
    const enrollment = this.enrollmentService.getEnrollmentData();
    if (!enrollment) return [];
    
    return this.courseService.courses().filter(course => 
      course.roles.includes(enrollment.role)
    );
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
      this.router.navigate(['/home']);
    }
  }
}
