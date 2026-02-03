import { Component, OnInit, signal, computed, inject } from '@angular/core';
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
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  router = inject(Router);
  private enrollmentService = inject(EnrollmentService);
  private storageService = inject(StorageService);

  allCourses = signal<Course[]>([]);
  enrolledCourseIds = computed(() => this.enrollmentService.enrolledCourses());
  enrollmentData = computed(() => this.enrollmentService.getEnrollmentData());

  continueLearning = computed(() => {
    const enrolled = this.enrolledCourseIds();
    const courses = this.allCourses();
    const progress = this.storageService.getProgress();
    
    return enrolled
      .map(id => {
        const course = courses.find(c => c.id === id);
        const courseProgress = progress[id] || {};
        return {
          course,
          lastViewed: courseProgress.lastViewed || courseProgress.enrollmentDate || '1970-01-01',
          progress: courseProgress.progress || 0
        };
      })
      .filter(item => item.course)
      .sort((a, b) => new Date(b.lastViewed).getTime() - new Date(a.lastViewed).getTime())
      .map(item => item.course!)
      .slice(0, 6);
  });

  recentlyAdded = computed(() => {
    return [...this.allCourses()]
      .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
      .slice(0, 6);
  });

  popularInRole = computed(() => {
    const enrollment = this.enrollmentData();
    if (!enrollment) return [];

    return this.allCourses()
      .filter(course => course.roles.includes(enrollment.role))
      .slice(0, 6);
  });

  recommendedForYou = computed(() => {
    const enrollment = this.enrollmentData();
    if (!enrollment) return [];

    const enrolled = this.enrolledCourseIds();
    return this.allCourses()
      .filter(course => 
        course.roles.includes(enrollment.role) && 
        !enrolled.includes(course.id)
      )
      .slice(0, 6);
  });

  ngOnInit(): void {
    this.loadCourses();
  }

  private async loadCourses(): Promise<void> {
    try {
      const stored = this.storageService.getCourses();
      if (stored.length > 0) {
        this.allCourses.set(stored);
      } else {
        const response = await fetch('/assets/config/courses.config.json');
        const data = await response.json();
        this.allCourses.set(data.courses);
        this.storageService.saveCourses(data.courses);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  }

  getGreeting(): string {
    const enrollment = this.enrollmentData();
    if (!enrollment) return 'Welcome!';
    
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${enrollment.name}!`;
    if (hour < 18) return `Good afternoon, ${enrollment.name}!`;
    return `Good evening, ${enrollment.name}!`;
  }
}
