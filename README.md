# OnboardsMe

An employee onboarding platform built with Angular 19. New joiners can enroll, select courses based on their role and experience, complete learning materials, take quizzes, and track their progress.

## Getting Started

```bash
# Install dependencies
npm install

# Run the app locally
npm start
# Opens at http://localhost:4200

# Build for production
npm run build:prod

# Deploy to GitHub Pages
npm run deploy
```

That's it! The app will guide you through enrollment first, then you can start learning.

## What's Inside

The platform adapts to your role (Developer or Product Analyst) and suggests courses based on your experience level. You can:

- Browse and enroll in relevant courses
- Learn from structured lessons (videos, PDFs, external links)
- Take quizzes to test your knowledge
- Track your progress on a dashboard
- See your learning journey on a timeline
- Access onboarding resources (welcome videos, manager info, mentor contacts)

**Live Demo:** [https://itssrokay.github.io/OnboardsMe/](https://itssrokay.github.io/OnboardsMe/)

## Architecture Decisions

### Why TypeScript Everywhere

Using TypeScript interfaces for everything (courses, quizzes, user data) gives us:
- **VS Code intelligence** - autocomplete knows exactly what fields exist
- **Instant error detection** - typos get caught while typing, not at runtime
- **Type safety** - can't accidentally pass a string where a number is expected
- **Better refactoring** - rename a property once, VS Code updates it everywhere

Example interfaces:

```typescript
interface Course {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  roles: ('Developer' | 'Product Definition Analyst (PDA)')[];
  category: 'Angular' | 'Java' | 'Python' | 'Computer Fundamentals';
  minExperience?: number;
  lessons: Lesson[];
}

interface Quiz {
  id: string;
  courseId: string;
  passingScore: number;
  questions: QuizQuestion[];
}

interface EnrollmentData {
  name: string;
  email: string;
  role: 'Developer' | 'Product Definition Analyst (PDA)';
  yearsOfExperience: number;
  enrolledCourses: string[];
}
```

### Standalone Components

Ditched NgModules entirely - every component is standalone. This makes the codebase:
- Easier to understand (no hunting through module imports)
- Faster to load (tree-shaking works better)
- Simpler to maintain (each component declares what it needs)

### Angular Signals for State

No Redux, no NgRx - just Angular's built-in Signals. They're:
- Simpler than observables for most cases
- Automatically optimize change detection
- Easy to compose with `computed()`

```typescript
// Services expose signals, components consume them
enrollmentData = computed(() => this.storageService.enrollmentData());
userCourses = computed(() => {
  const role = this.userRole();
  return this.courses().filter(c => c.roles.includes(role));
});
```

### Configuration-Driven UI

Forms, courses, and quizzes are defined in JSON files under `src/assets/config/`. This means:
- No code changes needed to add new courses or questions
- Content editors can update JSON without touching TypeScript
- Easy to test with different configurations

### Feature-Based Folders

```
src/app/features/
├── enrollment/    # User signup and course selection
├── home/          # Dashboard with course sections
├── courses/       # Course browsing and learning
├── quiz/          # Quizzes and results
├── dashboard/     # Progress tracking
├── timeline/      # Learning journey visualization
└── onboarding/    # Welcome portal
```

Each feature is self-contained. No deep nesting of components folders - if it's in the `dashboard` folder, we know it's a component.

## Angular Concepts Used

- **Signals** - Reactive state management (`signal()`, `computed()`)
- **Standalone Components** - No NgModules anywhere
- **Lazy Loading** - Each feature loads only when needed
- **Route Guards** - Protect routes that require enrollment
- **Reactive Forms** - Dynamic form generation from config
- **OnPush Change Detection** - Optimized rendering in presentational components
- **Content Projection** - Reusable layout components
- **Dependency Injection** - Services injected via `inject()`
- **Router** - Client-side navigation with lazy-loaded routes

## Key Features

**Role-Based Filtering**  
Courses and quizzes automatically filter based on your role. Developers see Angular/Java/Python, Analysts see Requirements/Product courses.

**Experience-Based Suggestions**  
Beginners (0-2 years) see Computer Fundamentals first. Experienced devs (2+ years) get advanced courses.

**Smart Progress Tracking**  
Dashboard knows if you're mid-course, ready for a quiz, or need to retake. One click takes you exactly where you need to go.

**See More Pattern**  
Home page shows 3 courses per section by default, expandable to show all. Keeps the UI clean.

## Project Stats

- **12 courses** across 4 technology categories
- **60 quiz questions** with explanations
- **7 feature modules** with lazy loading
- **~315KB** initial bundle (87KB gzipped)

## Why No Backend?

Everything runs client-side with localStorage. This keeps the project simple for demonstration purposes. In production, you'd swap `StorageService` for an HTTP service hitting a real API - the rest of the code stays the same.

## Browser Support

Works on any modern browser. Tested on Chrome, Firefox, Safari, and Edge.
