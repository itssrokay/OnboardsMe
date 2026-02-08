import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { QuizResult, Quiz } from '../../../core/models/quiz.model';

@Component({
  selector: 'app-quiz-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-result.component.html',
  styleUrl: './quiz-result.component.scss'
})
export class QuizResultComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private quizService = inject(QuizService);
  
  courseId = signal<string>('');
  quiz = signal<Quiz | null>(null);
  result = signal<QuizResult | null>(null);
  
  showAnswers = signal(false);
  
  // Computed
  passed = computed(() => this.result()?.passed || false);
  scorePercentage = computed(() => this.result()?.score || 0);
  
  scoreColor = computed(() => {
    const score = this.scorePercentage();
    if (score >= 90) return '#48bb78';
    if (score >= 70) return '#667eea';
    if (score >= 50) return '#ed8936';
    return '#e53e3e';
  });
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const courseId = params.get('courseId');
      if (courseId) {
        this.courseId.set(courseId);
        this.loadQuiz(courseId);
      }
    });
    
    // Get result from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['result']) {
      this.result.set(navigation.extras.state['result']);
    } else {
      // Try to get from latest attempt
      this.loadLatestResult();
    }
  }
  
  private loadQuiz(courseId: string): void {
    const quiz = this.quizService.getQuizByCourseId(courseId);
    if (quiz) {
      this.quiz.set(quiz);
    }
  }
  
  private loadLatestResult(): void {
    const quiz = this.quiz();
    if (!quiz) return;
    
    const attempt = this.quizService.getLatestAttempt(quiz.id);
    if (attempt && attempt.completedAt) {
      // Reconstruct result from attempt
      const result = this.quizService.calculateQuizScore(quiz, attempt.answers);
      this.result.set(result);
    } else {
      // No result found, redirect to course
      this.router.navigate(['/courses', this.courseId()]);
    }
  }
  
  toggleAnswers(): void {
    this.showAnswers.update(show => !show);
  }
  
  retakeQuiz(): void {
    this.router.navigate(['/courses', this.courseId(), 'quiz']);
  }
  
  backToCourse(): void {
    this.router.navigate(['/courses', this.courseId()]);
  }
  
  continueToCourses(): void {
    this.router.navigate(['/courses']);
  }
  
  getAnswerLabel(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }
  
  getAnswerText(question: any, answerIndex: number): string {
    const quiz = this.quiz();
    if (!quiz) return '';
    
    const q = quiz.questions.find(q => q.id === question.questionId);
    if (!q) return '';
    
    if (q.type === 'true-false') {
      return answerIndex.toString();
    }
    
    return q.options?.[answerIndex] || '';
  }
  
  formatAnswer(answer: string | number): string {
    if (typeof answer === 'number') {
      return this.getAnswerLabel(answer);
    }
    return answer === 'true' ? 'True' : 'False';
  }
  
  formatTimeTaken(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
}
