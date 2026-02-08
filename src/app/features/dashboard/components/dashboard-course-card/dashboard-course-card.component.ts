import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseProgressData } from '../dashboard/dashboard.component';

/**
 * Presentational component for displaying course progress cards
 * Uses OnPush change detection for optimal performance
 */
@Component({
  selector: 'app-dashboard-course-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-course-card.component.html',
  styleUrl: './dashboard-course-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardCourseCardComponent {
  @Input({ required: true }) data!: CourseProgressData;
  @Output() actionClick = new EventEmitter<CourseProgressData>();
  @Output() courseClick = new EventEmitter<string>();
  
  onActionClick(event: Event): void {
    event.stopPropagation();
    this.actionClick.emit(this.data);
  }
  
  onCourseClick(): void {
    this.courseClick.emit(this.data.course.id);
  }
  
  getStatusClass(): string {
    return this.data.status;
  }
  
  getQuizStatusClass(): string {
    switch (this.data.quizStatus) {
      case 'passed': return 'quiz-passed';
      case 'failed': return 'quiz-failed';
      case 'available': return 'quiz-available';
      default: return 'quiz-locked';
    }
  }
  
  getQuizStatusText(): string {
    switch (this.data.quizStatus) {
      case 'passed': return `Quiz Passed - ${this.data.quizScore}%`;
      case 'failed': return `Quiz Failed - ${this.data.quizScore}%`;
      case 'available': return 'Quiz Available';
      default: return 'Quiz Locked';
    }
  }
  
  getStatusBadgeText(): string {
    switch (this.data.status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      default: return 'Not Started';
    }
  }
}
