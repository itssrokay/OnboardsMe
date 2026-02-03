import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { StorageService } from '../services/storage.service';

export const enrollmentGuard: CanActivateFn = (route, state) => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  const isEnrolled = storageService.isEnrolled();
  const currentPath = route.routeConfig?.path || '';

  if (currentPath === 'enroll' || currentPath === 'enroll/select-courses') {
    if (isEnrolled && currentPath === 'enroll') {
      router.navigate(['/home']);
      return false;
    }
    if (!isEnrolled && currentPath === 'enroll/select-courses') {
      router.navigate(['/enroll']);
      return false;
    }
    return true;
  }

  if (!isEnrolled) {
    router.navigate(['/enroll']);
    return false;
  }

  return true;
};
