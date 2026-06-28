import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from '../core/components/app-navbar/app-navbar.component';
import { ClientProfileService } from './client-profile.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="shell">
      <app-navbar></app-navbar>
      <main class="content-container">
        @if (showAlert() && profileService.isIncomplete()) {
          <div class="profile-alert" (click)="goToProfile()">
            <span class="alert-icon">⚠️</span>
            <span class="alert-text">
              Your profile is incomplete. Please update: <strong>{{ profileService.missingFields().join(', ') }}</strong>
            </span>
            <span class="alert-action">Go to Profile →</span>
          </div>
        }
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .content-container {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    .profile-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1.25rem;
      background: linear-gradient(135deg, #ff9800, #f57c00);
      color: #fff;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(245, 124, 0, 0.3);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .profile-alert:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245, 124, 0, 0.4);
    }
    .alert-icon {
      font-size: 1.25rem;
    }
    .alert-text {
      flex: 1;
      font-size: 0.9rem;
    }
    .alert-action {
      font-size: 0.85rem;
      font-weight: 600;
      white-space: nowrap;
    }
  `
})
export class ClientShellComponent implements OnInit {
  readonly profileService = inject(ClientProfileService);
  private readonly router = inject(Router);

  /** Hide alert on the profile page itself */
  showAlert = signal(true);

  ngOnInit() {
    // Load the client profile on shell init
    this.profileService.refreshProfile();

    // Track route changes to hide alert on profile page
    this.updateAlertVisibility(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.updateAlertVisibility((e as NavigationEnd).urlAfterRedirects);
      });
  }

  private updateAlertVisibility(url: string): void {
    this.showAlert.set(!url.includes('/client/profile'));
  }

  goToProfile(): void {
    this.router.navigate(['/client/profile']);
  }
}
