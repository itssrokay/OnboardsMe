import { Injectable, signal } from '@angular/core';

export interface EnrollmentData {
  name: string;
  age: number;
  email: string;
  role: 'Developer' | 'Product Definition Analyst (PDA)';
  yearsOfExperience: number;
  enrolledCourses: string[];
  enrollmentDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ENROLLMENT_KEY = 'onboardsMe_enrollment';
  private readonly COURSES_KEY = 'onboardsMe_courses';
  private readonly PROGRESS_KEY = 'onboardsMe_progress';

  enrollmentData = signal<EnrollmentData | null>(this.getEnrollmentData());

  isEnrolled(): boolean {
    return this.enrollmentData() !== null;
  }

  getEnrollmentData(): EnrollmentData | null {
    const data = localStorage.getItem(this.ENROLLMENT_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveEnrollmentData(data: EnrollmentData): void {
    localStorage.setItem(this.ENROLLMENT_KEY, JSON.stringify(data));
    this.enrollmentData.set(data);
  }

  updateEnrolledCourses(courseIds: string[]): void {
    const enrollment = this.getEnrollmentData();
    if (enrollment) {
      enrollment.enrolledCourses = courseIds;
      this.saveEnrollmentData(enrollment);
    }
  }

  getCourses(): any[] {
    const data = localStorage.getItem(this.COURSES_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveCourses(courses: any[]): void {
    localStorage.setItem(this.COURSES_KEY, JSON.stringify(courses));
  }

  getProgress(): Record<string, any> {
    const data = localStorage.getItem(this.PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  }

  saveProgress(progress: Record<string, any>): void {
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(progress));
  }
}
