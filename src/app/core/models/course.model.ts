/**
 * Course Models - Configuration-driven course structure
 * 
 * Hierarchy:
 * Course → Lessons → LearningItems
 * 
 * A Course contains multiple Lessons
 * A Lesson contains multiple LearningItems (the actual content)
 * A LearningItem can be: External URL, Video, or PDF
 */

// Types of learning materials supported
export type LearningItemType = 'url' | 'video' | 'pdf';

// Video source types
export type VideoSource = 'youtube' | 'vimeo' | 'direct';

// PDF source types  
export type PdfSource = 'local' | 'external';

/**
 * Learning Item - A single piece of learning material
 */
export interface LearningItem {
  id: string;
  title: string;
  description?: string;
  type: LearningItemType;
  
  // For URL type - external links (docs, blogs, articles)
  url?: string;
  
  // For Video type
  videoUrl?: string;
  videoSource?: VideoSource;
  videoDuration?: string; // e.g., "10:30"
  
  // For PDF type
  pdfUrl?: string;
  pdfSource?: PdfSource;
  
  // Estimated time to complete (in minutes)
  estimatedTime?: number;
  
  // Order within the lesson
  order: number;
}

/**
 * Lesson - A collection of related learning items
 */
export interface Lesson {
  id: string;
  title: string;
  description: string;
  order: number;
  learningItems: LearningItem[];
  
  // Optional metadata
  estimatedDuration?: string; // e.g., "45 mins"
  isFree?: boolean; // Preview lesson available without enrollment
}

/**
 * Course - A complete learning module
 */
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  roles: ('Developer' | 'Product Definition Analyst (PDA)')[];
  addedDate: string;
  
  // Technology category for grouping courses
  category?: 'Angular' | 'Java' | 'Python' | 'Computer Fundamentals' | 'Product Analysis' | 'Requirements' | 'Other';
  
  // Experience level requirements (in years)
  minExperience?: number; // Minimum years of experience
  maxExperience?: number; // Maximum years of experience (for beginner courses)
  
  // Course content
  lessons: Lesson[];
  
  // Metadata
  instructor?: {
    name: string;
    title: string;
    avatar?: string;
  };
  
  // Learning outcomes
  learningOutcomes?: string[];
  
  // Prerequisites
  prerequisites?: string[];
}

/**
 * Course Progress - Tracks user's progress in a course
 */
export interface CourseProgress {
  courseId: string;
  enrolledAt: string;
  lastViewedAt: string;
  lastLessonId?: string;
  lastItemId?: string;
  
  // Completion tracking
  completedItems: string[]; // Array of learning item IDs
  
  // Computed fields (stored for quick access)
  totalItems: number;
  completedCount: number;
  progressPercentage: number;
}

/**
 * Learning Item Progress - Individual item completion status
 */
export interface ItemProgress {
  itemId: string;
  lessonId: string;
  courseId: string;
  completedAt?: string;
  
  // For videos - track watch progress
  videoProgress?: {
    currentTime: number;
    duration: number;
    completed: boolean;
  };
  
  // For PDFs - track if opened/read
  pdfOpened?: boolean;
  
  // For URLs - track if visited
  urlVisited?: boolean;
}

/**
 * User Progress Store - All progress data for a user
 */
export interface UserProgressStore {
  courses: Record<string, CourseProgress>;
  items: Record<string, ItemProgress>;
  lastActivity: string;
}

/**
 * Courses Configuration - Root structure of courses.config.json
 */
export interface CoursesConfig {
  courses: Course[];
}
