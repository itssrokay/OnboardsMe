import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../../../core/services/quiz.service';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { Quiz, QuizQuestion, QuizAttempt } from '../../../../core/models/quiz.model';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private fb = inject(FormBuilder);
  private quizService = inject(QuizService);
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  
  courseId = signal<string>('');
  quiz = signal<Quiz | null>(null);
  currentAttempt = signal<QuizAttempt | null>(null);
  
  quizForm!: FormGroup;
  loading = signal(true);
  error = signal<string | null>(null);
  submitting = signal(false);
  
  // Timer
  startTime = signal<number>(0);
  elapsedTime = signal<number>(0);
  private timerInterval: any;
  
  // UI state
  showConfirmDialog = signal(false);
  currentQuestionIndex = signal(0);
  
  // Computed
  timeRemaining = computed(() => {
    const quiz = this.quiz();
    if (!quiz?.timeLimit) return null;
    
    const limit = quiz.timeLimit * 60; // Convert to seconds
    const remaining = limit - this.elapsedTime();
    return remaining > 0 ? remaining : 0;
  });
  
  isTimeUp = computed(() => {
    const remaining = this.timeRemaining();
    return remaining !== null && remaining <= 0;
  });
  
  currentQuestion = computed(() => {
    const quiz = this.quiz();
    const index = this.currentQuestionIndex();
    return quiz?.questions[index] || null;
  });
  
  totalQuestions = computed(() => this.quiz()?.questions.length || 0);
  isLastQuestion = computed(() => this.currentQuestionIndex() >= this.totalQuestions() - 1);
  isFirstQuestion = computed(() => this.currentQuestionIndex() === 0);
  
  progress = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round(((this.currentQuestionIndex() + 1) / total) * 100);
  });
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const courseId = params.get('courseId');
      if (courseId) {
        this.courseId.set(courseId);
        this.loadQuiz(courseId);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.stopTimer();
  }
  
  private loadQuiz(courseId: string): void {
    this.loading.set(true);
    this.error.set(null);
    
    // Check if course is completed
    const completion = this.progressService.getCourseCompletionPercentage(courseId);
    if (completion < 100) {
      this.error.set('You must complete all learning materials before taking the quiz.');
      this.loading.set(false);
      return;
    }
    
    const checkQuiz = () => {
      const quiz = this.quizService.getQuizByCourseId(courseId);
      
      if (quiz) {
        this.quiz.set(quiz);
        this.initializeForm(quiz);
        this.startQuiz(quiz);
        this.loading.set(false);
      } else if (this.quizService.loading()) {
        setTimeout(checkQuiz, 100);
      } else {
        this.error.set('Quiz not found for this course.');
        this.loading.set(false);
      }
    };
    
    checkQuiz();
  }
  
  private initializeForm(quiz: Quiz): void {
    const questionsArray = this.fb.array(
      quiz.questions.map(q => this.fb.control('', Validators.required))
    );
    
    this.quizForm = this.fb.group({
      questions: questionsArray
    });
  }
  
  get questionsFormArray(): FormArray {
    return this.quizForm?.get('questions') as FormArray;
  }
  
  private startQuiz(quiz: Quiz): void {
    const attempt = this.quizService.startQuizAttempt(quiz.id, this.courseId());
    this.currentAttempt.set(attempt);
    this.startTime.set(Date.now());
    this.startTimer();
  }
  
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime()) / 1000);
      this.elapsedTime.set(elapsed);
      
      // Auto-submit if time is up
      if (this.isTimeUp()) {
        this.autoSubmit();
      }
    }, 1000);
  }
  
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
  
  selectAnswer(questionIndex: number, answer: string | number): void {
    this.questionsFormArray.at(questionIndex).setValue(answer);
  }
  
  isAnswerSelected(questionIndex: number, answer: string | number): boolean {
    return this.questionsFormArray.at(questionIndex).value === answer;
  }
  
  nextQuestion(): void {
    if (!this.isLastQuestion()) {
      this.currentQuestionIndex.update(i => i + 1);
    }
  }
  
  previousQuestion(): void {
    if (!this.isFirstQuestion()) {
      this.currentQuestionIndex.update(i => i - 1);
    }
  }
  
  goToQuestion(index: number): void {
    this.currentQuestionIndex.set(index);
  }
  
  isQuestionAnswered(index: number): boolean {
    const control = this.questionsFormArray.at(index);
    return control && control.value !== '';
  }
  
  getAnsweredCount(): number {
    return this.questionsFormArray.controls.filter(c => c.value !== '').length;
  }
  
  canSubmit(): boolean {
    return this.quizForm.valid && !this.submitting();
  }
  
  requestSubmit(): void {
    if (!this.canSubmit()) {
      return;
    }
    this.showConfirmDialog.set(true);
  }
  
  cancelSubmit(): void {
    this.showConfirmDialog.set(false);
  }
  
  confirmSubmit(): void {
    this.showConfirmDialog.set(false);
    this.submitQuiz();
  }
  
  private autoSubmit(): void {
    this.stopTimer();
    this.submitQuiz();
  }
  
  private submitQuiz(): void {
    if (!this.quiz() || !this.currentAttempt()) {
      return;
    }
    
    this.submitting.set(true);
    this.stopTimer();
    
    // Collect answers
    const quiz = this.quiz()!;
    const answers: Record<string, string | number> = {};
    
    quiz.questions.forEach((question, index) => {
      const answer = this.questionsFormArray.at(index).value;
      answers[question.id] = answer;
    });
    
    // Submit to service
    try {
      const result = this.quizService.submitQuizAttempt(this.currentAttempt()!, answers);
      
      // Navigate to results
      this.router.navigate(['/courses', this.courseId(), 'quiz', 'result'], {
        state: { result }
      });
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      this.error.set('Failed to submit quiz. Please try again.');
      this.submitting.set(false);
    }
  }
  
  exitQuiz(): void {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
      this.stopTimer();
      this.router.navigate(['/courses', this.courseId()]);
    }
  }
  
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  getQuestionNumber(index: number): number {
    return index + 1;
  }
  
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
