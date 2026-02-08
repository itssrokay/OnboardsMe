import { Component, inject, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { EnrollmentService } from '../../services/enrollment.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  router = inject(Router);
  private enrollmentService = inject(EnrollmentService);
  private storageService = inject(StorageService);
  
  enrollmentData = computed(() => this.enrollmentService.getEnrollmentData());
  isEnrolled = this.enrollmentService.isEnrolled;
  
  mobileMenuOpen = false;
  userMenuOpen = signal(false);
  showResetConfirm = signal(false);
  
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
  
  toggleUserMenu(): void {
    this.userMenuOpen.set(!this.userMenuOpen());
  }
  
  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close user menu when clicking outside
    if (this.userMenuOpen()) {
      this.closeUserMenu();
    }
  }
  
  getUserInitials(): string {
    const data = this.enrollmentData();
    if (!data) return '?';
    
    const names = data.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return data.name.substring(0, 2).toUpperCase();
  }
  
  // Reset progress
  openResetConfirm(): void {
    this.showResetConfirm.set(true);
  }
  
  cancelReset(): void {
    this.showResetConfirm.set(false);
  }
  
  confirmReset(): void {
    // Clear EVERYTHING - complete reset
    localStorage.removeItem('onboardsMe_enrollment');
    localStorage.removeItem('onboardsMe_progress');
    localStorage.removeItem('onboardsMe_quiz_attempts');
    localStorage.removeItem('onboardsMe_courses_cache');
    
    // Update the signal to reflect cleared state
    this.storageService.enrollmentData.set(null);
    
    // Close dialogs
    this.showResetConfirm.set(false);
    this.closeUserMenu();
    
    // Navigate to enrollment page (start from scratch)
    this.router.navigate(['/enroll']).then(() => {
      // Reload to ensure clean state
      window.location.reload();
    });
  }
}
