# OnboardsMe - Employee Onboarding Platform

A modern Angular-based onboarding platform for new employees with role-based learning paths, interactive courses, and progress tracking.

## 🚀 Features

- **Role-Based Learning**: Customized course recommendations based on user role (Developer/PDA)
- **Experience-Based Suggestions**: Courses grouped by technology and filtered by experience level
- **Interactive Quizzes**: 5+ quizzes per course with instant feedback
- **Progress Dashboard**: Track completion percentage, quiz scores, and learning progress
- **Course Timeline**: Visual timeline showing enrollment, course completion, and achievements
- **Onboarding Portal**: Welcome videos, manager messages, and mentorship contacts
- **See More Functionality**: Clean UI with expandable course sections

## 🛠️ Tech Stack

- **Angular 19** - Standalone components architecture
- **TypeScript 5.7**
- **Angular Signals** - For reactive state management
- **RxJS** - For async operations
- **SCSS** - Modern styling with responsive design
- **GitHub Pages** - Deployment

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build:prod

# Deploy to GitHub Pages
npm run deploy
```

## 🏗️ Project Structure

```
src/app/
├── core/
│   ├── guards/          # Route guards (enrollment, course access)
│   ├── models/          # TypeScript interfaces
│   ├── services/        # Business logic services
│   └── header.component # Global navigation header
├── features/
│   ├── courses/         # Course browsing and learning
│   ├── dashboard/       # Progress tracking
│   ├── enrollment/      # User enrollment and course selection
│   ├── home/            # Home dashboard
│   ├── onboarding/      # Welcome and orientation
│   ├── quiz/            # Quiz and assessments
│   └── timeline/        # Learning journey timeline
└── assets/
    └── config/          # JSON configuration files
```

## 🔑 Key Architectural Decisions

- **Standalone Components**: Modern Angular architecture, no NgModules
- **Signals for State**: Reactive state management without external libraries
- **Configuration-Driven UI**: Forms, courses, and quizzes defined in JSON
- **Feature-Based Structure**: Each feature is self-contained
- **Smart/Presentational Pattern**: Separation of business logic and UI

## 📊 Deployment

Deployed at: [https://itssrokay.github.io/OnboardsMe/](https://itssrokay.github.io/OnboardsMe/)

The app uses GitHub Pages with automatic deployment via `angular-cli-ghpages`.

## 🎯 Key Highlights

- **12 Courses** across Angular, Java, Python, and Computer Fundamentals
- **60+ Quiz Questions** with detailed explanations
- **Role-Based Filtering** throughout the platform
- **Experience-Based Recommendations** for personalized learning paths
- **Clean, Modern UI** with responsive design
- **Optimized Bundle Size**: ~314KB initial, ~87KB gzipped

## 📝 License

This project is for educational purposes.
