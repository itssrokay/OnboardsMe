import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Presentational component for displaying dashboard statistics
 * Uses OnPush change detection for optimal performance
 */
@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-stats.component.html',
  styleUrl: './dashboard-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardStatsComponent {
  @Input() overallCompletion: number = 0;
  @Input() totalCourses: number = 0;
  @Input() inProgressCount: number = 0;
  @Input() completedCount: number = 0;
  @Input() quizzesPassed: number = 0;
  @Input() quizzesFailed: number = 0;
  @Input() averageQuizScore: number = 0;
  
  getCompletionClass(): string {
    if (this.overallCompletion >= 80) return 'excellent';
    if (this.overallCompletion >= 50) return 'good';
    if (this.overallCompletion >= 25) return 'fair';
    return 'starting';
  }
  
  getCircumference(): number {
    return 2 * Math.PI * 54; // radius = 54
  }
  
  getStrokeDashoffset(): number {
    const circumference = this.getCircumference();
    return circumference - (this.overallCompletion / 100) * circumference;
  }
}
