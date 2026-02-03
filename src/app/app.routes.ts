import { Routes } from '@angular/router';
import { enrollmentGuard } from './core/guards/enrollment.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
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
  {
    path: 'home',
    loadComponent: () => import('./features/home/components/home/home.component').then(m => m.HomeComponent),
    canActivate: [enrollmentGuard]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
