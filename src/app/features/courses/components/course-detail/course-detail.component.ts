import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { Course, Lesson } from '../../../../core/models/course.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss'
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  
  courseId = signal<string>('');
  course = signal<Course | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Enrollment and progress
  isEnrolled = computed(() => {
    const id = this.courseId();
    return id ? this.courseService.isEnrolledInCourse(id) : false;
  });
  
  courseProgress = computed(() => {
    const id = this.courseId();
    return id ? this.progressService.getCourseCompletionPercentage(id) : 0;
  });
  
  completedItems = computed(() => {
    const id = this.courseId();
    return id ? this.progressService.getCompletedItemsCount(id) : 0;
  });
  
  totalItems = computed(() => {
    const id = this.courseId();
    return id ? this.courseService.getTotalItemsInCourse(id) : 0;
  });
  
  // Expanded lessons tracking
  expandedLessons = signal<Set<string>>(new Set());
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('courseId');
      if (id) {
        this.courseId.set(id);
        this.loadCourse(id);
      }
    });
  }
  
  private loadCourse(courseId: string): void {
    this.loading.set(true);
    this.error.set(null);
    
    // Wait for courses to be loaded if not already
    const checkCourse = () => {
      const course = this.courseService.getCourseById(courseId);
      if (course) {
        this.course.set(course);
        this.loading.set(false);
        
        // Auto-expand first lesson
        if (course.lessons.length > 0) {
          this.expandedLessons.set(new Set([course.lessons[0].id]));
        }
      } else if (this.courseService.loading()) {
        // Wait and retry
        setTimeout(checkCourse, 100);
      } else {
        this.error.set('Course not found');
        this.loading.set(false);
      }
    };
    
    checkCourse();
  }
  
  toggleLesson(lessonId: string): void {
    const expanded = new Set(this.expandedLessons());
    if (expanded.has(lessonId)) {
      expanded.delete(lessonId);
    } else {
      expanded.add(lessonId);
    }
    this.expandedLessons.set(expanded);
  }
  
  isLessonExpanded(lessonId: string): boolean {
    return this.expandedLessons().has(lessonId);
  }
  
  getLessonProgress(lessonId: string): number {
    return this.progressService.getLessonCompletionPercentage(this.courseId(), lessonId);
  }
  
  isItemCompleted(itemId: string): boolean {
    return this.progressService.isItemCompleted(itemId);
  }
  
  canAccessLesson(lesson: Lesson): boolean {
    return this.isEnrolled() || lesson.isFree === true;
  }
  
  enrollInCourse(): void {
    const id = this.courseId();
    if (id) {
      this.courseService.enrollInCourse(id);
    }
  }
  
  startLearning(): void {
    const resumePoint = this.progressService.getResumePoint(this.courseId());
    if (resumePoint) {
      this.router.navigate(['/courses', this.courseId(), 'lesson', resumePoint.lessonId], {
        queryParams: { item: resumePoint.itemId }
      });
    } else {
      const first = this.courseService.getFirstLearningItem(this.courseId());
      if (first) {
        this.router.navigate(['/courses', this.courseId(), 'lesson', first.lesson.id], {
          queryParams: { item: first.item.id }
        });
      }
    }
  }
  
  openLesson(lesson: Lesson): void {
    if (!this.canAccessLesson(lesson)) {
      return;
    }
    
    const firstItem = lesson.learningItems[0];
    if (firstItem) {
      this.router.navigate(['/courses', this.courseId(), 'lesson', lesson.id], {
        queryParams: { item: firstItem.id }
      });
    }
  }
  
  openLearningItem(lesson: Lesson, itemId: string): void {
    if (!this.canAccessLesson(lesson)) {
      return;
    }
    
    this.router.navigate(['/courses', this.courseId(), 'lesson', lesson.id], {
      queryParams: { item: itemId }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/courses']);
  }
  
  getItemTypeIcon(type: string): string {
    switch (type) {
      case 'video': return 'play-circle';
      case 'pdf': return 'file-text';
      case 'url': return 'external-link';
      default: return 'file';
    }
  }
  
  formatDuration(minutes: number | undefined): string {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}
