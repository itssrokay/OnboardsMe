import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { 
  Course, 
  Lesson, 
  LearningItem, 
  CoursesConfig 
} from '../models/course.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  
  private readonly COURSES_CONFIG_URL = '/assets/config/courses.config.json';
  private readonly COURSES_CACHE_KEY = 'onboardsMe_courses_cache';
  
  // All courses loaded from config
  courses = signal<Course[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Derived signals
  enrolledCourseIds = computed(() => {
    const enrollment = this.storageService.enrollmentData();
    return enrollment?.enrolledCourses || [];
  });
  
  enrolledCourses = computed(() => {
    const ids = this.enrolledCourseIds();
    return this.courses().filter(c => ids.includes(c.id));
  });
  
  availableCourses = computed(() => {
    const ids = this.enrolledCourseIds();
    return this.courses().filter(c => !ids.includes(c.id));
  });
  
  // Get courses filtered by user role
  coursesForUserRole = computed(() => {
    const enrollment = this.storageService.enrollmentData();
    if (!enrollment) return [];
    return this.courses().filter(c => c.roles.includes(enrollment.role));
  });
  
  constructor() {
    this.loadCourses();
  }
  
  /**
   * Load courses from JSON config (with caching)
   */
  async loadCourses(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      // Try to load from cache first
      const cached = this.getCachedCourses();
      if (cached && cached.length > 0) {
        this.courses.set(cached);
        this.loading.set(false);
        
        // Refresh from server in background
        this.refreshCoursesFromServer();
        return;
      }
      
      // Load from server
      await this.refreshCoursesFromServer();
    } catch (err) {
      console.error('Failed to load courses:', err);
      this.error.set('Failed to load courses. Please try again.');
      this.loading.set(false);
    }
  }
  
  /**
   * Refresh courses from server
   */
  private async refreshCoursesFromServer(): Promise<void> {
    try {
      const response = await fetch(this.COURSES_CONFIG_URL);
      const data: CoursesConfig = await response.json();
      
      this.courses.set(data.courses);
      this.cacheCourses(data.courses);
    } catch (err) {
      console.error('Failed to refresh courses:', err);
      if (this.courses().length === 0) {
        this.error.set('Failed to load courses from server.');
      }
    } finally {
      this.loading.set(false);
    }
  }
  
  /**
   * Get all courses
   */
  getAllCourses(): Course[] {
    return this.courses();
  }
  
  /**
   * Get a single course by ID
   */
  getCourseById(courseId: string): Course | undefined {
    return this.courses().find(c => c.id === courseId);
  }
  
  /**
   * Get a lesson by course and lesson ID
   */
  getLessonById(courseId: string, lessonId: string): Lesson | undefined {
    const course = this.getCourseById(courseId);
    return course?.lessons.find(l => l.id === lessonId);
  }
  
  /**
   * Get a learning item by IDs
   */
  getLearningItemById(courseId: string, lessonId: string, itemId: string): LearningItem | undefined {
    const lesson = this.getLessonById(courseId, lessonId);
    return lesson?.learningItems.find(i => i.id === itemId);
  }
  
  /**
   * Check if user is enrolled in a course
   */
  isEnrolledInCourse(courseId: string): boolean {
    return this.enrolledCourseIds().includes(courseId);
  }
  
  /**
   * Enroll user in a course
   */
  enrollInCourse(courseId: string): void {
    const current = this.enrolledCourseIds();
    if (!current.includes(courseId)) {
      this.storageService.updateEnrolledCourses([...current, courseId]);
    }
  }
  
  /**
   * Unenroll user from a course
   */
  unenrollFromCourse(courseId: string): void {
    const current = this.enrolledCourseIds();
    this.storageService.updateEnrolledCourses(
      current.filter(id => id !== courseId)
    );
  }
  
  /**
   * Get total number of learning items in a course
   */
  getTotalItemsInCourse(courseId: string): number {
    const course = this.getCourseById(courseId);
    if (!course) return 0;
    return course.lessons.reduce((total, lesson) => total + lesson.learningItems.length, 0);
  }
  
  /**
   * Get total number of lessons in a course
   */
  getTotalLessonsInCourse(courseId: string): number {
    const course = this.getCourseById(courseId);
    return course?.lessons.length || 0;
  }
  
  /**
   * Get next learning item after a given item
   */
  getNextLearningItem(courseId: string, lessonId: string, itemId: string): { lesson: Lesson; item: LearningItem } | null {
    const course = this.getCourseById(courseId);
    if (!course) return null;
    
    const currentLessonIndex = course.lessons.findIndex(l => l.id === lessonId);
    if (currentLessonIndex === -1) return null;
    
    const currentLesson = course.lessons[currentLessonIndex];
    const currentItemIndex = currentLesson.learningItems.findIndex(i => i.id === itemId);
    
    // Check if there's a next item in the current lesson
    if (currentItemIndex < currentLesson.learningItems.length - 1) {
      return {
        lesson: currentLesson,
        item: currentLesson.learningItems[currentItemIndex + 1]
      };
    }
    
    // Check if there's a next lesson
    if (currentLessonIndex < course.lessons.length - 1) {
      const nextLesson = course.lessons[currentLessonIndex + 1];
      if (nextLesson.learningItems.length > 0) {
        return {
          lesson: nextLesson,
          item: nextLesson.learningItems[0]
        };
      }
    }
    
    return null;
  }
  
  /**
   * Get previous learning item before a given item
   */
  getPreviousLearningItem(courseId: string, lessonId: string, itemId: string): { lesson: Lesson; item: LearningItem } | null {
    const course = this.getCourseById(courseId);
    if (!course) return null;
    
    const currentLessonIndex = course.lessons.findIndex(l => l.id === lessonId);
    if (currentLessonIndex === -1) return null;
    
    const currentLesson = course.lessons[currentLessonIndex];
    const currentItemIndex = currentLesson.learningItems.findIndex(i => i.id === itemId);
    
    // Check if there's a previous item in the current lesson
    if (currentItemIndex > 0) {
      return {
        lesson: currentLesson,
        item: currentLesson.learningItems[currentItemIndex - 1]
      };
    }
    
    // Check if there's a previous lesson
    if (currentLessonIndex > 0) {
      const prevLesson = course.lessons[currentLessonIndex - 1];
      if (prevLesson.learningItems.length > 0) {
        return {
          lesson: prevLesson,
          item: prevLesson.learningItems[prevLesson.learningItems.length - 1]
        };
      }
    }
    
    return null;
  }
  
  /**
   * Get first learning item in a course
   */
  getFirstLearningItem(courseId: string): { lesson: Lesson; item: LearningItem } | null {
    const course = this.getCourseById(courseId);
    if (!course || course.lessons.length === 0) return null;
    
    const firstLesson = course.lessons[0];
    if (firstLesson.learningItems.length === 0) return null;
    
    return {
      lesson: firstLesson,
      item: firstLesson.learningItems[0]
    };
  }
  
  // Cache helpers
  private getCachedCourses(): Course[] | null {
    try {
      const cached = localStorage.getItem(this.COURSES_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
  
  private cacheCourses(courses: Course[]): void {
    try {
      localStorage.setItem(this.COURSES_CACHE_KEY, JSON.stringify(courses));
    } catch (err) {
      console.warn('Failed to cache courses:', err);
    }
  }
}
