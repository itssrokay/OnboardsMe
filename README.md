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



## Architecture Decisions

### Configuration-Driven with TypeScript Safety

We store all content (courses, quizzes, form fields) in JSON files, but define TypeScript interfaces to ensure type safety:

**JSON for flexibility:**
- Content editors can add courses/quizzes without touching code
- Easy to update questions, add lessons, change form fields
- All config lives in `src/assets/config/*.json`

**TypeScript for safety:**
- Interfaces define the exact structure JSON must follow
- VS Code shows errors instantly if JSON doesn't match the interface
- Autocomplete works when accessing course/quiz properties
- Can't accidentally misspell a property name

Example - Course interface with sample JSON:

```typescript
// TypeScript Interface (src/app/core/models/course.model.ts)
interface Course {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  roles: ('Developer' | 'Product Definition Analyst (PDA)')[];
  category: 'Angular' | 'Java' | 'Python' | 'Computer Fundamentals';
  minExperience?: number;
  thumbnail: string;
  lessons: Lesson[];
}
```

```json
{
  "courses": [
    {
      "id": "angular-fundamentals",
      "title": "Angular Fundamentals",
      "difficulty": "Beginner",
      "roles": ["Developer"],
      "category": "Angular",
      "minExperience": 0,
      "maxExperience": 2,
      "thumbnail": "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
      "lessons": [
        {
          "id": "lesson-1",
          "title": "Introduction to Angular",
          "learningItems": [
            {
              "id": "item-1",
              "type": "video",
              "title": "What is Angular?",
              "content": "https://www.youtube.com/watch?v=..."
            }
          ]
        }
      ]
    }
  ]
}
```

When the app loads JSON, TypeScript ensures it matches the interface. If someone adds a typo in the JSON or forgets a required field, VS Code flags it immediately.

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



