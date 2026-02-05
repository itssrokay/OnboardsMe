import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { CourseService } from '../services/course.service';

/**
 * Guard for course detail pages
 * - Anyone who is enrolled in the app can VIEW course details
 * - This allows users to see course info before enrolling
 */
export const courseDetailGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  
  // User must be enrolled in the app first
  if (!storageService.isEnrolled()) {
    router.navigate(['/enroll']);
    return false;
  }
  
  // User can view any course detail (to decide whether to enroll)
  return true;
};

/**
 * Guard for lesson/content pages
 * - User must be enrolled in the app
 * - User must be enrolled in the specific course to access its content
 * - Exception: Free preview lessons can be accessed without enrollment
 */
export const lessonAccessGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const storageService = inject(StorageService);
  const courseService = inject(CourseService);
  const router = inject(Router);
  
  // User must be enrolled in the app first
  if (!storageService.isEnrolled()) {
    router.navigate(['/enroll']);
    return false;
  }
  
  const courseId = route.paramMap.get('courseId');
  const lessonId = route.paramMap.get('lessonId');
  
  if (!courseId) {
    router.navigate(['/courses']);
    return false;
  }
  
  // Check if user is enrolled in this course
  const isEnrolledInCourse = courseService.isEnrolledInCourse(courseId);
  
  if (isEnrolledInCourse) {
    return true;
  }
  
  // Check if this is a free lesson
  if (lessonId) {
    const lesson = courseService.getLessonById(courseId, lessonId);
    if (lesson?.isFree) {
      return true; // Allow access to free preview lessons
    }
  }
  
  // Not enrolled and not a free lesson - redirect to course detail page
  // User can see course info and enroll from there
  router.navigate(['/courses', courseId]);
  return false;
};

/**
 * Guard that checks if user can access learning content
 * Similar to lessonAccessGuard but for individual learning items
 */
export const contentAccessGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const storageService = inject(StorageService);
  const courseService = inject(CourseService);
  const router = inject(Router);
  
  // User must be enrolled in the app first
  if (!storageService.isEnrolled()) {
    router.navigate(['/enroll']);
    return false;
  }
  
  const courseId = route.paramMap.get('courseId');
  const lessonId = route.paramMap.get('lessonId');
  
  if (!courseId || !lessonId) {
    router.navigate(['/courses']);
    return false;
  }
  
  // Check if user is enrolled in this course
  const isEnrolledInCourse = courseService.isEnrolledInCourse(courseId);
  
  if (isEnrolledInCourse) {
    return true;
  }
  
  // Check if this is a free lesson
  const lesson = courseService.getLessonById(courseId, lessonId);
  if (lesson?.isFree) {
    return true;
  }
  
  // Not enrolled - redirect to course detail page
  router.navigate(['/courses', courseId]);
  return false;
};
