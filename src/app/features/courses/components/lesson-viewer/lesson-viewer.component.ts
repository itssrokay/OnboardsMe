import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { Course, Lesson, LearningItem } from '../../../../core/models/course.model';

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-viewer.component.html',
  styleUrl: './lesson-viewer.component.scss'
})
export class LessonViewerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private sanitizer = inject(DomSanitizer);
  
  // Route params
  courseId = signal<string>('');
  lessonId = signal<string>('');
  currentItemId = signal<string>('');
  
  // Data
  course = signal<Course | null>(null);
  lesson = signal<Lesson | null>(null);
  currentItem = signal<LearningItem | null>(null);
  
  loading = signal(true);
  error = signal<string | null>(null);
  
  // UI state
  sidebarCollapsed = signal(false);
  showCompletionModal = signal(false);
  
  // Computed values
  isEnrolled = computed(() => 
    this.courseId() ? this.courseService.isEnrolledInCourse(this.courseId()) : false
  );
  
  isCurrentItemCompleted = computed(() => {
    const itemId = this.currentItemId();
    return itemId ? this.progressService.isItemCompleted(itemId) : false;
  });
  
  lessonProgress = computed(() => {
    const cId = this.courseId();
    const lId = this.lessonId();
    return cId && lId ? this.progressService.getLessonCompletionPercentage(cId, lId) : 0;
  });
  
  courseProgress = computed(() => {
    const cId = this.courseId();
    return cId ? this.progressService.getCourseCompletionPercentage(cId) : 0;
  });
  
  // Navigation
  hasPrevious = computed(() => {
    const cId = this.courseId();
    const lId = this.lessonId();
    const iId = this.currentItemId();
    if (!cId || !lId || !iId) return false;
    return this.courseService.getPreviousLearningItem(cId, lId, iId) !== null;
  });
  
  hasNext = computed(() => {
    const cId = this.courseId();
    const lId = this.lessonId();
    const iId = this.currentItemId();
    if (!cId || !lId || !iId) return false;
    return this.courseService.getNextLearningItem(cId, lId, iId) !== null;
  });
  
  ngOnInit(): void {
    // Subscribe to route params and query params
    this.route.paramMap.subscribe(params => {
      const courseId = params.get('courseId');
      const lessonId = params.get('lessonId');
      
      if (courseId && lessonId) {
        this.courseId.set(courseId);
        this.lessonId.set(lessonId);
        this.loadData();
      }
    });
    
    this.route.queryParamMap.subscribe(params => {
      const itemId = params.get('item');
      if (itemId && itemId !== this.currentItemId()) {
        this.currentItemId.set(itemId);
        this.loadCurrentItem();
      }
    });
  }
  
  ngOnDestroy(): void {
    // Save progress on exit
    this.saveProgress();
  }
  
  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    
    const checkData = () => {
      const course = this.courseService.getCourseById(this.courseId());
      
      if (course) {
        this.course.set(course);
        
        const lesson = course.lessons.find(l => l.id === this.lessonId());
        if (lesson) {
          this.lesson.set(lesson);
          
          // Set first item if no item specified
          if (!this.currentItemId() && lesson.learningItems.length > 0) {
            this.currentItemId.set(lesson.learningItems[0].id);
          }
          
          this.loadCurrentItem();
          this.loading.set(false);
        } else {
          this.error.set('Lesson not found');
          this.loading.set(false);
        }
      } else if (this.courseService.loading()) {
        setTimeout(checkData, 100);
      } else {
        this.error.set('Course not found');
        this.loading.set(false);
      }
    };
    
    checkData();
  }
  
  private loadCurrentItem(): void {
    const lesson = this.lesson();
    const itemId = this.currentItemId();
    
    if (lesson && itemId) {
      const item = lesson.learningItems.find(i => i.id === itemId);
      if (item) {
        this.currentItem.set(item);
        
        // Mark as started (viewed)
        this.progressService.markItemStarted(
          this.courseId(),
          this.lessonId(),
          itemId
        );
      }
    }
  }
  
  private saveProgress(): void {
    // Progress is saved automatically by the progress service
  }
  
  // Content helpers
  getYouTubeEmbedUrl(url: string): SafeResourceUrl {
    // Extract video ID from various YouTube URL formats
    let videoId = '';
    
    // Handle youtu.be format
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    // Handle youtube.com/watch format
    else if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v') || '';
    }
    // Handle youtube.com/embed format
    else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
    }
    
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
  
  getVimeoEmbedUrl(url: string): SafeResourceUrl {
    // Extract video ID from Vimeo URL
    const match = url.match(/vimeo\.com\/(\d+)/);
    const videoId = match ? match[1] : '';
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
  
  getVideoEmbedUrl(item: LearningItem): SafeResourceUrl {
    const url = item.videoUrl || '';
    
    if (item.videoSource === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      return this.getYouTubeEmbedUrl(url);
    }
    
    if (item.videoSource === 'vimeo' || url.includes('vimeo.com')) {
      return this.getVimeoEmbedUrl(url);
    }
    
    // Direct video URL
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  getPdfViewerUrl(url: string): SafeResourceUrl {
    // Use Google Docs viewer for external PDFs
    if (url.startsWith('http')) {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
    }
    // Local PDF - use direct URL
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  getExternalUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  isYouTubeVideo(item: LearningItem): boolean {
    if (item.videoSource === 'youtube') return true;
    const url = item.videoUrl || '';
    return url.includes('youtube.com') || url.includes('youtu.be');
  }
  
  isVimeoVideo(item: LearningItem): boolean {
    if (item.videoSource === 'vimeo') return true;
    const url = item.videoUrl || '';
    return url.includes('vimeo.com');
  }
  
  isDirectVideo(item: LearningItem): boolean {
    return item.videoSource === 'direct' || 
           (!this.isYouTubeVideo(item) && !this.isVimeoVideo(item));
  }
  
  // Actions
  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }
  
  selectItem(item: LearningItem): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { item: item.id },
      queryParamsHandling: 'merge'
    });
  }
  
  markAsComplete(): void {
    const cId = this.courseId();
    const lId = this.lessonId();
    const iId = this.currentItemId();
    
    if (cId && lId && iId) {
      this.progressService.markItemCompleted(cId, lId, iId);
      
      // Check if this was the last item
      if (!this.hasNext()) {
        this.showCompletionModal.set(true);
      } else {
        this.goToNext();
      }
    }
  }
  
  goToPrevious(): void {
    const prev = this.courseService.getPreviousLearningItem(
      this.courseId(),
      this.lessonId(),
      this.currentItemId()
    );
    
    if (prev) {
      // Check if it's in a different lesson
      if (prev.lesson.id !== this.lessonId()) {
        this.router.navigate(['/courses', this.courseId(), 'lesson', prev.lesson.id], {
          queryParams: { item: prev.item.id }
        });
      } else {
        this.selectItem(prev.item);
      }
    }
  }
  
  goToNext(): void {
    const next = this.courseService.getNextLearningItem(
      this.courseId(),
      this.lessonId(),
      this.currentItemId()
    );
    
    if (next) {
      // Check if it's in a different lesson
      if (next.lesson.id !== this.lessonId()) {
        this.router.navigate(['/courses', this.courseId(), 'lesson', next.lesson.id], {
          queryParams: { item: next.item.id }
        });
      } else {
        this.selectItem(next.item);
      }
    }
  }
  
  closeCompletionModal(): void {
    this.showCompletionModal.set(false);
  }
  
  backToCourse(): void {
    this.router.navigate(['/courses', this.courseId()]);
  }
  
  continueToCourses(): void {
    this.showCompletionModal.set(false);
    this.router.navigate(['/courses']);
  }
  
  isItemCompleted(itemId: string): boolean {
    return this.progressService.isItemCompleted(itemId);
  }
  
  openInNewTab(url: string): void {
    window.open(url, '_blank');
  }

  navigateToLesson(lessonId: string, itemId: string): void {
    this.router.navigate(['/courses', this.courseId(), 'lesson', lessonId], {
      queryParams: { item: itemId }
    });
  }
}
