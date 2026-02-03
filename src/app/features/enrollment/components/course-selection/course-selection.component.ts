import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { StorageService } from '../../../../core/services/storage.service';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  lessons: number;
  difficulty: string;
  tags: string[];
  roles: string[];
  addedDate: string;
}

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
  private storageService = inject(StorageService);

  courses = signal<Course[]>([]);
  selectedCourses = signal<Set<string>>(new Set());
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const enrollment = this.enrollmentService.getEnrollmentData();
    if (!enrollment) {
      this.router.navigate(['/enroll']);
      return;
    }

    this.loadCourses();
  }

  private async loadCourses(): Promise<void> {
    try {
      const response = await fetch('/assets/config/courses.config.json');
      const data = await response.json();
      
      const enrollment = this.enrollmentService.getEnrollmentData();
      const relevantCourses = data.courses.filter((course: Course) => 
        course.roles.includes(enrollment?.role || '')
      );
      
      this.courses.set(relevantCourses);
      this.storageService.saveCourses(data.courses);
    } catch (err) {
      console.error('Failed to load courses:', err);
      this.error.set('Failed to load courses');
    } finally {
      this.loading.set(false);
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

  proceed(): void {
    if (this.canProceed()) {
      const courseIds = Array.from(this.selectedCourses());
      this.enrollmentService.selectCourses(courseIds);
      this.router.navigate(['/home']);
    }
  }
}
