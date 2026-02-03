import { Injectable, computed, inject } from '@angular/core';
import { StorageService, EnrollmentData } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private storageService = inject(StorageService);
  
  enrollmentData = this.storageService.enrollmentData;
  isEnrolled = computed(() => this.enrollmentData() !== null);
  enrolledCourses = computed(() => this.enrollmentData()?.enrolledCourses || []);

  enroll(data: Omit<EnrollmentData, 'enrolledCourses' | 'enrollmentDate'>): void {
    const enrollmentData: EnrollmentData = {
      ...data,
      enrolledCourses: [],
      enrollmentDate: new Date().toISOString()
    };
    this.storageService.saveEnrollmentData(enrollmentData);
  }

  selectCourses(courseIds: string[]): void {
    this.storageService.updateEnrolledCourses(courseIds);
  }

  getEnrollmentData(): EnrollmentData | null {
    return this.storageService.getEnrollmentData();
  }
}
