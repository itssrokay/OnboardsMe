import { Routes } from '@angular/router';
import { enrollmentGuard } from './core/guards/enrollment.guard';
import { courseDetailGuard, lessonAccessGuard } from './core/guards/course-access.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  // Enrollment routes
  {
    path: 'enroll',
    loadComponent: () => import('./features/enrollment/components/enrollment-form/enrollment-form.component').then(m => m.EnrollmentFormComponent),
    canActivate: [enrollmentGuard]
  },
  {
    path: 'enroll/select-courses',
    loadComponent: () => import('./features/enrollment/components/course-selection/course-selection.component').then(m => m.CourseSelectionComponent),
    canActivate: [enrollmentGuard]
  },
  // Home route
  {
    path: 'home',
    loadComponent: () => import('./features/home/components/home/home.component').then(m => m.HomeComponent),
    canActivate: [enrollmentGuard]
  },
  // Course routes
  {
    path: 'courses',
    canActivate: [enrollmentGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/courses/components/course-list/course-list.component').then(m => m.CourseListComponent)
      },
      {
        path: ':courseId',
        loadComponent: () => import('./features/courses/components/course-detail/course-detail.component').then(m => m.CourseDetailComponent),
        canActivate: [courseDetailGuard]
      },
      {
        path: ':courseId/lesson/:lessonId',
        loadComponent: () => import('./features/courses/components/lesson-viewer/lesson-viewer.component').then(m => m.LessonViewerComponent),
        canActivate: [lessonAccessGuard]
      }
    ]
  },
  // Fallback
  {
    path: '**',
    redirectTo: '/home'
  }
];
