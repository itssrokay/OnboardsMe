import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { EnrollmentService } from '../../services/enrollment.service';

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
  
  enrollmentData = computed(() => this.enrollmentService.getEnrollmentData());
  isEnrolled = this.enrollmentService.isEnrolled;
  
  mobileMenuOpen = false;
  
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
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
}
