import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './core/components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private router = inject(Router);
  title = 'OnboardsMe';
  
  showHeader = signal(true);
  
  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Hide header on enrollment pages
        const hideHeaderRoutes = ['/enroll', '/enroll/select-courses'];
        this.showHeader.set(!hideHeaderRoutes.includes(event.url));
      });
  }
}
