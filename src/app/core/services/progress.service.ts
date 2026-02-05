import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  CourseProgress, 
  ItemProgress, 
  UserProgressStore,
  Course,
  Lesson,
  LearningItem 
} from '../models/course.model';
import { CourseService } from './course.service';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private courseService = inject(CourseService);
  
  private readonly PROGRESS_KEY = 'onboardsMe_progress';
  
  // Reactive progress store
  private progressStore = signal<UserProgressStore>(this.loadProgressStore());
  
  /**
   * Get progress for a specific course
   */
  getCourseProgress(courseId: string): CourseProgress | null {
    return this.progressStore().courses[courseId] || null;
  }
  
  /**
   * Get all course progress as a computed signal
   */
  getAllProgress = computed(() => this.progressStore().courses);
  
  /**
   * Check if a learning item is completed
   */
  isItemCompleted(itemId: string): boolean {
    const item = this.progressStore().items[itemId];
    return item?.completedAt !== undefined;
  }
  
  /**
   * Get completion percentage for a course
   */
  getCourseCompletionPercentage(courseId: string): number {
    const progress = this.getCourseProgress(courseId);
    if (!progress) return 0;
    return progress.progressPercentage;
  }
  
  /**
   * Get completion percentage for a lesson
   */
  getLessonCompletionPercentage(courseId: string, lessonId: string): number {
    const course = this.courseService.getCourseById(courseId);
    const lesson = course?.lessons.find(l => l.id === lessonId);
    if (!lesson) return 0;
    
    const completedItems = lesson.learningItems.filter(item => 
      this.isItemCompleted(item.id)
    ).length;
    
    return Math.round((completedItems / lesson.learningItems.length) * 100);
  }
  
  /**
   * Get number of completed items in a course
   */
  getCompletedItemsCount(courseId: string): number {
    const progress = this.getCourseProgress(courseId);
    return progress?.completedCount || 0;
  }
  
  /**
   * Mark a learning item as completed
   */
  markItemCompleted(courseId: string, lessonId: string, itemId: string): void {
    const store = this.progressStore();
    const now = new Date().toISOString();
    
    // Update item progress
    const itemProgress: ItemProgress = {
      itemId,
      lessonId,
      courseId,
      completedAt: now,
      urlVisited: true,
      pdfOpened: true,
      videoProgress: {
        currentTime: 0,
        duration: 0,
        completed: true
      }
    };
    
    const updatedItems = {
      ...store.items,
      [itemId]: itemProgress
    };
    
    // Update course progress
    let courseProgress = store.courses[courseId];
    const course = this.courseService.getCourseById(courseId);
    const totalItems = this.courseService.getTotalItemsInCourse(courseId);
    
    if (!courseProgress) {
      courseProgress = {
        courseId,
        enrolledAt: now,
        lastViewedAt: now,
        lastLessonId: lessonId,
        lastItemId: itemId,
        completedItems: [itemId],
        totalItems,
        completedCount: 1,
        progressPercentage: Math.round((1 / totalItems) * 100)
      };
    } else {
      const completedItems = courseProgress.completedItems.includes(itemId)
        ? courseProgress.completedItems
        : [...courseProgress.completedItems, itemId];
      
      courseProgress = {
        ...courseProgress,
        lastViewedAt: now,
        lastLessonId: lessonId,
        lastItemId: itemId,
        completedItems,
        completedCount: completedItems.length,
        progressPercentage: Math.round((completedItems.length / totalItems) * 100)
      };
    }
    
    const updatedStore: UserProgressStore = {
      courses: {
        ...store.courses,
        [courseId]: courseProgress
      },
      items: updatedItems,
      lastActivity: now
    };
    
    this.progressStore.set(updatedStore);
    this.saveProgressStore(updatedStore);
  }
  
  /**
   * Mark a learning item as started (not completed)
   */
  markItemStarted(courseId: string, lessonId: string, itemId: string): void {
    const store = this.progressStore();
    const now = new Date().toISOString();
    
    // Update item progress (mark as started, not completed)
    const existingItem = store.items[itemId];
    if (!existingItem?.completedAt) {
      const itemProgress: ItemProgress = {
        itemId,
        lessonId,
        courseId,
        urlVisited: true,
        pdfOpened: true
      };
      
      const updatedItems = {
        ...store.items,
        [itemId]: itemProgress
      };
      
      // Update last viewed in course progress
      let courseProgress = store.courses[courseId];
      const totalItems = this.courseService.getTotalItemsInCourse(courseId);
      
      if (!courseProgress) {
        courseProgress = {
          courseId,
          enrolledAt: now,
          lastViewedAt: now,
          lastLessonId: lessonId,
          lastItemId: itemId,
          completedItems: [],
          totalItems,
          completedCount: 0,
          progressPercentage: 0
        };
      } else {
        courseProgress = {
          ...courseProgress,
          lastViewedAt: now,
          lastLessonId: lessonId,
          lastItemId: itemId
        };
      }
      
      const updatedStore: UserProgressStore = {
        courses: {
          ...store.courses,
          [courseId]: courseProgress
        },
        items: updatedItems,
        lastActivity: now
      };
      
      this.progressStore.set(updatedStore);
      this.saveProgressStore(updatedStore);
    }
  }
  
  /**
   * Update video progress
   */
  updateVideoProgress(courseId: string, lessonId: string, itemId: string, currentTime: number, duration: number): void {
    const store = this.progressStore();
    const now = new Date().toISOString();
    
    const existingItem = store.items[itemId] || {
      itemId,
      lessonId,
      courseId
    };
    
    const isCompleted = duration > 0 && (currentTime / duration) >= 0.9; // 90% watched = completed
    
    const itemProgress: ItemProgress = {
      ...existingItem,
      videoProgress: {
        currentTime,
        duration,
        completed: isCompleted
      }
    };
    
    if (isCompleted && !existingItem.completedAt) {
      itemProgress.completedAt = now;
      // Also update course progress
      this.markItemCompleted(courseId, lessonId, itemId);
      return;
    }
    
    const updatedStore: UserProgressStore = {
      ...store,
      items: {
        ...store.items,
        [itemId]: itemProgress
      },
      lastActivity: now
    };
    
    this.progressStore.set(updatedStore);
    this.saveProgressStore(updatedStore);
  }
  
  /**
   * Get the last viewed item for a course (for resume functionality)
   */
  getLastViewedItem(courseId: string): { lessonId: string; itemId: string } | null {
    const progress = this.getCourseProgress(courseId);
    if (!progress || !progress.lastLessonId || !progress.lastItemId) {
      return null;
    }
    return {
      lessonId: progress.lastLessonId,
      itemId: progress.lastItemId
    };
  }
  
  /**
   * Get resume point for a course
   * Returns the last viewed item or the first incomplete item
   */
  getResumePoint(courseId: string): { lessonId: string; itemId: string } | null {
    const course = this.courseService.getCourseById(courseId);
    if (!course) return null;
    
    // First, check last viewed
    const lastViewed = this.getLastViewedItem(courseId);
    if (lastViewed) {
      // Check if this item is not completed, if so, resume here
      if (!this.isItemCompleted(lastViewed.itemId)) {
        return lastViewed;
      }
      
      // If completed, find the next incomplete item
      const next = this.courseService.getNextLearningItem(courseId, lastViewed.lessonId, lastViewed.itemId);
      if (next) {
        return {
          lessonId: next.lesson.id,
          itemId: next.item.id
        };
      }
    }
    
    // Find first incomplete item
    for (const lesson of course.lessons) {
      for (const item of lesson.learningItems) {
        if (!this.isItemCompleted(item.id)) {
          return {
            lessonId: lesson.id,
            itemId: item.id
          };
        }
      }
    }
    
    // All completed, return first item
    const first = this.courseService.getFirstLearningItem(courseId);
    return first ? { lessonId: first.lesson.id, itemId: first.item.id } : null;
  }
  
  /**
   * Get video progress for a specific item
   */
  getVideoProgress(itemId: string): { currentTime: number; duration: number } | null {
    const item = this.progressStore().items[itemId];
    if (!item?.videoProgress) return null;
    return {
      currentTime: item.videoProgress.currentTime,
      duration: item.videoProgress.duration
    };
  }
  
  /**
   * Reset progress for a course
   */
  resetCourseProgress(courseId: string): void {
    const store = this.progressStore();
    const course = this.courseService.getCourseById(courseId);
    
    if (!course) return;
    
    // Remove all item progress for this course
    const updatedItems = { ...store.items };
    course.lessons.forEach(lesson => {
      lesson.learningItems.forEach(item => {
        delete updatedItems[item.id];
      });
    });
    
    // Remove course progress
    const updatedCourses = { ...store.courses };
    delete updatedCourses[courseId];
    
    const updatedStore: UserProgressStore = {
      courses: updatedCourses,
      items: updatedItems,
      lastActivity: new Date().toISOString()
    };
    
    this.progressStore.set(updatedStore);
    this.saveProgressStore(updatedStore);
  }
  
  /**
   * Get recently viewed courses (sorted by last viewed)
   */
  getRecentlyViewedCourses(limit: number = 5): string[] {
    const courses = this.progressStore().courses;
    return Object.values(courses)
      .sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime())
      .slice(0, limit)
      .map(c => c.courseId);
  }
  
  // Persistence helpers
  private loadProgressStore(): UserProgressStore {
    try {
      const stored = localStorage.getItem(this.PROGRESS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Failed to load progress store:', err);
    }
    return {
      courses: {},
      items: {},
      lastActivity: new Date().toISOString()
    };
  }
  
  private saveProgressStore(store: UserProgressStore): void {
    try {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(store));
    } catch (err) {
      console.warn('Failed to save progress store:', err);
    }
  }
}
