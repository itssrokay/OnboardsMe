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
    loadComponent: () => import('./features/enrollment/components/enrollment-form/enrollment-form.component').then(m => m.EnrollmentFormComponent)
  },
  {
    path: 'enroll/select-courses',
    loadComponent: () => import('./features/enrollment/components/course-selection/course-selection.component').then(m => m.CourseSelectionComponent)
  },
  // Home route
  {
    path: 'home',
    loadComponent: () => import('./features/home/components/home/home.component').then(m => m.HomeComponent),
    canActivate: [enrollmentGuard]
  },
  // Quizzes route
  {
    path: 'quizzes',
    loadComponent: () => import('./features/quiz/components/quiz-list/quiz-list.component').then(m => m.QuizListComponent),
    canActivate: [enrollmentGuard]
  },
  // Dashboard route
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [enrollmentGuard]
  },
  // Timeline route
  {
    path: 'timeline',
    loadComponent: () => import('./features/timeline/components/timeline/timeline.component').then(m => m.TimelineComponent),
    canActivate: [enrollmentGuard]
  },
  // Onboarding route
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/components/onboarding-welcome/onboarding-welcome.component').then(m => m.OnboardingWelcomeComponent),
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
      },
      {
        path: ':courseId/quiz',
        loadComponent: () => import('./features/quiz/components/quiz/quiz.component').then(m => m.QuizComponent)
      },
      {
        path: ':courseId/quiz/result',
        loadComponent: () => import('./features/quiz/components/quiz-result/quiz-result.component').then(m => m.QuizResultComponent)
      }
    ]
  },
  // Fallback
  {
    path: '**',
    redirectTo: '/home'
  }
];
