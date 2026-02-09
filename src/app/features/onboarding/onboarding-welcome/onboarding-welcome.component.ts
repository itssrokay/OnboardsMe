import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface VideoCard {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  embedUrl: SafeResourceUrl;
  thumbnail: string;
  speaker?: string;
}

interface Mentor {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

interface Manager {
  name: string;
  role: string;
  email: string;
  message: string;
  videoUrl?: string;
  avatar?: string;
}

@Component({
  selector: 'app-onboarding-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-welcome.component.html',
  styleUrl: './onboarding-welcome.component.scss'
})
export class OnboardingWelcomeComponent implements OnInit {
  router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  searchQuery = signal('');
  selectedVideo = signal<VideoCard | null>(null);

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Manager data
  manager: Manager = {
    name: 'Meenakshi Panigrahi',
    role: 'Engineering Manager',
    email: 'meenakshi.panigrahi@amadeus.com',
    message: 'Welcome to the team! I\'m thrilled to have you join us. Our team is dedicated to building innovative solutions that transform the travel industry. Feel free to reach out anytime – my door is always open. Looking forward to working together!',
    videoUrl: 'https://www.youtube.com/watch?v=4at6rcVELyA',
    avatar: 'MP'
  };

  // Mentorship data
  mentors: Mentor[] = [
    {
      id: '1',
      name: 'Sourav Kumar Manjhi',
      role: 'Senior Software Engineer',
      email: 'sourav.manjhi@amadeus.com',
      avatar: 'SM'
    }
  ];

  // Helpful contacts
  contacts: Mentor[] = [
    {
      id: '3',
      name: 'HR Support Team',
      role: 'Human Resources',
      email: 'hr.support@amadeus.com',
      avatar: 'HR'
    },
    {
      id: '4',
      name: 'IT Helpdesk',
      role: 'Technical Support',
      email: 'it.helpdesk@amadeus.com',
      avatar: 'IT'
    },
    {
      id: '5',
      name: 'Learning & Development',
      role: 'Training Resources',
      email: 'learning@amadeus.com',
      avatar: 'LD'
    }
  ];

  // Videos with lazy initialization
  get videos(): VideoCard[] {
    return [
      {
        id: 'ceo-welcome',
        title: 'Luis Maroto Says',
        speaker: 'CEO Welcome Message',
        description: "I'd like to personally welcome you to Amadeus! You have joined a great company with amazing people...",
        videoUrl: 'https://www.youtube.com/watch?v=4at6rcVELyA',
        embedUrl: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/4at6rcVELyA'),
        thumbnail: 'https://img.youtube.com/vi/4at6rcVELyA/maxresdefault.jpg'
      },
      {
        id: 'company-intro',
        title: 'We are Amadeus',
        speaker: 'Company Introduction',
        description: 'We make the experience of travel better for everyone, everywhere by inspiring innovation and reimagining...',
        videoUrl: 'https://www.youtube.com/watch?v=da3vw2MDWUU',
        embedUrl: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/da3vw2MDWUU'),
        thumbnail: 'https://img.youtube.com/vi/da3vw2MDWUU/maxresdefault.jpg'
      },
      {
        id: 'culture',
        title: 'Culture at Amadeus',
        speaker: 'Our Culture & Values',
        description: 'Learn about our values, diversity, and what makes Amadeus unique. Discover how we foster innovation...',
        videoUrl: 'https://www.youtube.com/watch?v=Z_dpzSo2ObU',
        embedUrl: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/Z_dpzSo2ObU'),
        thumbnail: 'https://img.youtube.com/vi/Z_dpzSo2ObU/maxresdefault.jpg'
      },
      {
        id: 'values',
        title: 'Amadeus Values',
        speaker: 'Future Outlook',
        description: 'Values reflect who we are, on our best days. They make us unique, drive our decisions and shape our future...',
        videoUrl: 'https://www.youtube.com/watch?v=ufYq_O_rDF0',
        embedUrl: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/ufYq_O_rDF0'),
        thumbnail: 'https://img.youtube.com/vi/ufYq_O_rDF0/maxresdefault.jpg'
      }
    ];
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  openVideo(video: VideoCard): void {
    this.selectedVideo.set(video);
  }

  closeVideo(): void {
    this.selectedVideo.set(null);
  }

  viewMore(video: VideoCard): void {
    window.open(video.videoUrl, '_blank');
  }
}
