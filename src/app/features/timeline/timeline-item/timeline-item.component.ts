import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineEvent } from '../timeline/timeline.component';

/**
 * Reusable presentational component for timeline items
 * Uses OnPush change detection for optimal performance
 */
@Component({
  selector: 'app-timeline-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-item.component.html',
  styleUrl: './timeline-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineItemComponent {
  @Input({ required: true }) event!: TimelineEvent;
  @Input() formattedDate: string = '';
  @Input() formattedTime: string = '';
  @Input() relativeTime: string = '';
  @Input() isFirst: boolean = false;
  @Input() isLast: boolean = false;
  @Output() eventClick = new EventEmitter<TimelineEvent>();
  
  onEventClick(): void {
    if (this.event.courseId) {
      this.eventClick.emit(this.event);
    }
  }
  
  getIconClass(): string {
    return `icon-${this.event.icon}`;
  }
  
  getEventTypeClass(): string {
    return `event-${this.event.type}`;
  }
  
  isClickable(): boolean {
    return !!this.event.courseId;
  }
}
