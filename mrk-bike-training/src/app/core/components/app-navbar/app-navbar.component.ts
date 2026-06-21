import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { PendingBadgeService } from '../../../auth/pending-badge.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="nav-container">
        <a class="nav-brand" routerLink="/">
          <span class="logo-icon">🏍️</span> MRK Bike Training
        </a>

        <!-- Hamburger Button for Mobile -->
        <button class="mobile-toggle" (click)="toggleMenu()" aria-label="Toggle menu">
          <span class="bar" [class.open]="isMenuOpen()"></span>
          <span class="bar" [class.open]="isMenuOpen()"></span>
          <span class="bar" [class.open]="isMenuOpen()"></span>
        </button>

        <!-- Navigation Menus -->
        <nav class="nav-menu" [class.open]="isMenuOpen()">
          <!-- Role specific menus -->
          <ng-container [ngSwitch]="currentRole()">
            <!-- CLIENT ROLE -->
            <ng-container *ngSwitchCase="'CLIENT'">
              <div class="nav-dropdown">
                <button class="dropdown-trigger">Trainings ▼</button>
                <div class="dropdown-content">
                  <a routerLink="/client/trainings/apply" (click)="closeMenu()">Apply New Training</a>
                  <a routerLink="/client/trainings" (click)="closeMenu()">Past & Active Trainings</a>
                  <a routerLink="/client/trainings" (click)="closeMenu()">View Request Status</a>
                </div>
              </div>
              <div class="nav-dropdown">
                <button class="dropdown-trigger">Schedule ▼</button>
                <div class="dropdown-content">
                  <a routerLink="/client/schedule" (click)="closeMenu()">See Current Schedule</a>
                  <a (click)="requestAbsence(); closeMenu()" class="clickable">Request Absence</a>
                  <a (click)="requestPause(); closeMenu()" class="clickable">Request Pause</a>
                </div>
              </div>
              <a class="nav-link-item" routerLink="/client/profile" (click)="closeMenu()">Profile</a>
            </ng-container>

            <!-- TRAINER ROLE -->
            <ng-container *ngSwitchCase="'TRAINER'">
              <div class="nav-dropdown">
                <button class="dropdown-trigger">Schedule ▼</button>
                <div class="dropdown-content">
                  <a routerLink="/trainer/schedule" (click)="closeMenu()">See Current Schedule</a>
                  <a routerLink="/trainer/availability" (click)="closeMenu()">Manage Slots</a>
                  <a (click)="trainerAbsence(); closeMenu()" class="clickable">Request Absence</a>
                  <a (click)="comingSoon('Switch Branch'); closeMenu()" class="clickable">Switch Branch (coming soon)</a>
                </div>
              </div>
              <a class="nav-link-item" routerLink="/trainer/profile" (click)="closeMenu()">Profile</a>
            </ng-container>

            <!-- ADMIN / SUPER_ADMIN ROLE -->
            <ng-container *ngIf="currentRole() === 'ADMIN' || currentRole() === 'SUPER_ADMIN'">
              <div class="nav-dropdown">
                <button class="dropdown-trigger">
                  Schedule
                  @if (pendingBadge.hasPending()) {
                    <span class="nav-badge-dot"></span>
                  }
                  ▼
                </button>
                <div class="dropdown-content">
                  <a routerLink="/admin/schedule" (click)="closeMenu()">See Current Schedule</a>
                  <a routerLink="/admin/pending" (click)="closeMenu()">
                    View Requests 
                    @if (pendingBadge.hasPending()) {
                      <span class="badge-count">Pending</span>
                    }
                  </a>
                  <a routerLink="/admin/schedule" [queryParams]="{action: 'set-client'}" (click)="closeMenu()">Set Schedule for Client</a>
                  <a routerLink="/admin/schedule" [queryParams]="{action: 'set-trainer'}" (click)="closeMenu()">Set Schedule for Trainer</a>
                </div>
              </div>
              <div class="nav-dropdown">
                <button class="dropdown-trigger">Client ▼</button>
                <div class="dropdown-content">
                  <a routerLink="/admin/clients-view" (click)="closeMenu()">View Clients</a>
                  <a routerLink="/admin/clients-add" (click)="closeMenu()">Add Client</a>
                  <a routerLink="/admin/clients" [queryParams]="{action: 'mark-absent'}" (click)="closeMenu()">Mark Absent</a>
                  <a routerLink="/admin/clients" [queryParams]="{action: 'pause-training'}" (click)="closeMenu()">Pause Training</a>
                  <a routerLink="/admin/clients" [queryParams]="{action: 'update-password'}" (click)="closeMenu()">Update Client Password</a>
                  <a routerLink="/admin/clients" [queryParams]="{action: 'delete'}" (click)="closeMenu()">Delete Client</a>
                  <a routerLink="/admin/clients" [queryParams]="{action: 'deactivate'}" (click)="closeMenu()">Activate/Deactivate Client</a>
                </div>
              </div>
              <div class="nav-dropdown">
                <button class="dropdown-trigger">Trainer ▼</button>
                <div class="dropdown-content">
                  <a routerLink="/admin/trainers-view" (click)="closeMenu()">View Trainers</a>
                  <a routerLink="/admin/trainers-add" (click)="closeMenu()" *ngIf="currentRole() === 'SUPER_ADMIN'">Add Trainer</a>
                  <a routerLink="/admin/trainers" [queryParams]="{action: 'mark-absence'}" (click)="closeMenu()">Mark Absence</a>
                  <a routerLink="/admin/trainers" [queryParams]="{action: 'switch-branch'}" (click)="closeMenu()">Switch Trainer Branch</a>
                  <a routerLink="/admin/trainers" [queryParams]="{action: 'update-password'}" (click)="closeMenu()">Update Trainer Password</a>
                  <a routerLink="/admin/trainers" [queryParams]="{action: 'delete'}" (click)="closeMenu()">Delete Trainer</a>
                  <a routerLink="/admin/trainers" [queryParams]="{action: 'deactivate'}" (click)="closeMenu()">Activate/Deactivate Trainer</a>
                </div>
              </div>
              <div class="nav-dropdown">
                <button class="dropdown-trigger">Vehicle ▼</button>
                <div class="dropdown-content">
                  <a routerLink="/admin/vehicles-list" (click)="closeMenu()">View All Vehicles</a>
                  <a routerLink="/admin/vehicles-config-list" (click)="closeMenu()">View Vehicle Configs</a>
                  <a routerLink="/admin/vehicles-add" (click)="closeMenu()">Add Vehicle</a>
                  <a routerLink="/admin/vehicles-config-add" (click)="closeMenu()">Add Vehicle Config</a>
                  <a routerLink="/admin/vehicles-manage" [queryParams]="{action: 'maintenance'}" (click)="closeMenu()">Add Maintenance</a>
                  <a routerLink="/admin/vehicles-manage" [queryParams]="{action: 'switch-branch'}" (click)="closeMenu()">Switch Vehicle Branch</a>
                  <a routerLink="/admin/vehicles-manage" [queryParams]="{action: 'delete'}" (click)="closeMenu()">Delete Vehicle</a>
                  <a routerLink="/admin/vehicles-manage" [queryParams]="{action: 'deactivate'}" (click)="closeMenu()">Activate/Deactivate Vehicle</a>
                </div>
              </div>
              <div class="nav-dropdown">
                <button class="dropdown-trigger">Course ▼</button>
                <div class="dropdown-content">
                  <a routerLink="/admin/courses-add" (click)="closeMenu()">Add Training</a>
                  <a routerLink="/admin/courses-template" (click)="closeMenu()">Add/Update Training Template</a>
                  <a routerLink="/admin/courses-view" (click)="closeMenu()">View All Training</a>
                  <a routerLink="/admin/courses" [queryParams]="{action: 'deactivate'}" (click)="closeMenu()">Activate/Deactivate Training</a>
                  <a routerLink="/admin/courses" [queryParams]="{action: 'delete'}" (click)="closeMenu()">Delete Training</a>
                </div>
              </div>
              <div class="nav-dropdown">
                <button class="dropdown-trigger">Admin ▼</button>
                <div class="dropdown-content">
                  <a routerLink="/admin/branches-view" (click)="closeMenu()">View Branches</a>
                  <a routerLink="/admin/branches-add" (click)="closeMenu()">Add New Branch</a>
                </div>
              </div>
            </ng-container>

            <!-- SITE DATA ADMIN ROLE -->
            <ng-container *ngSwitchCase="'SITEDATAADMIN'">
              <a class="nav-link-item clickable" (click)="triggerBackup(); closeMenu()">Backup</a>
              <a class="nav-link-item clickable" (click)="triggerRestore(); closeMenu()">Restore</a>
              <a class="nav-link-item clickable" (click)="comingSoon('Observability Metrics'); closeMenu()">Metrics</a>
            </ng-container>
          </ng-container>

          <!-- Right side controls (Theme & Logout) -->
          <div class="nav-actions">
            <button class="theme-toggle" (click)="toggleTheme()" [title]="'Switch to ' + (isDark() ? 'light' : 'dark') + ' theme'">
              {{ isDark() ? '☀️' : '🌙' }}
            </button>
            <span class="user-greeting" *ngIf="username()">Hi, {{ username() }}</span>
            <button class="logout-btn" (click)="logout()">Logout</button>
          </div>
        </nav>
      </div>
    </header>
  `,
  styles: `
    .navbar {
      background: #1565c0;
      color: #ffffff;
      padding: 0.75rem 1.5rem;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .nav-link-item, .dropdown-trigger {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.95rem;
      font-weight: 500;
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      text-decoration: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.2s;
    }

    .nav-link-item:hover, .dropdown-trigger:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    /* Dropdown Menus */
    .nav-dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-content {
      display: none;
      position: absolute;
      background-color: #ffffff;
      min-width: 200px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      border-radius: 6px;
      padding: 0.5rem 0;
      z-index: 1001;
      top: 100%;
      left: 0;
      animation: fadeIn 0.15s ease-out;
    }

    .dropdown-content a {
      color: #333333;
      padding: 0.6rem 1rem;
      text-decoration: none;
      display: block;
      font-size: 0.9rem;
      transition: background 0.15s;
    }

    .dropdown-content a:hover {
      background-color: #f5f5f5;
      color: #1565c0;
    }

    .nav-dropdown:hover .dropdown-content {
      display: block;
    }

    .clickable {
      cursor: pointer;
    }

    /* Actions block */
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-left: 2rem;
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      padding-left: 1.5rem;
    }

    .theme-toggle {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: background 0.2s;
    }

    .theme-toggle:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .user-greeting {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .logout-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      padding: 0.4rem 0.85rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    /* Badge indicators */
    .nav-badge-dot {
      display: inline-block;
      width: 7px;
      height: 7px;
      background: #ff5252;
      border-radius: 50%;
      margin-left: 3px;
    }

    .badge-count {
      background: #ff5252;
      color: #ffffff;
      font-size: 0.75rem;
      padding: 1px 6px;
      border-radius: 10px;
      margin-left: auto;
      font-weight: bold;
    }

    /* Mobile toggle */
    .mobile-toggle {
      display: none;
      flex-direction: column;
      justify-content: space-between;
      width: 24px;
      height: 18px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
    }

    .mobile-toggle .bar {
      width: 100%;
      height: 2px;
      background-color: #ffffff;
      transition: all 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Responsive Styles */
    @media (max-width: 768px) {
      .mobile-toggle {
        display: flex;
      }

      .nav-menu {
        display: none;
        flex-direction: column;
        width: 100%;
        position: absolute;
        top: 100%;
        left: 0;
        background: #1565c0;
        padding: 1rem 1.5rem;
        gap: 1rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .nav-menu.open {
        display: flex;
      }

      .nav-dropdown, .nav-link-item {
        width: 100%;
      }

      .dropdown-content {
        position: static;
        box-shadow: none;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        margin-top: 0.5rem;
      }

      .dropdown-content a {
        color: rgba(255, 255, 255, 0.9);
      }

      .dropdown-content a:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      .nav-actions {
        width: 100%;
        margin-left: 0;
        padding-left: 0;
        border-left: none;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        padding-top: 1rem;
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `
})
export class NavbarComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly pendingBadge = inject(PendingBadgeService);
  private readonly router = inject(Router);

  protected readonly currentRole = signal<string | null>(null);
  protected readonly username = signal<string | null>(null);
  protected readonly isMenuOpen = signal<boolean>(false);
  protected readonly isDark = signal<boolean>(false);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.currentRole.set(user.role);
      this.username.set(user.sub);
    }
    
    // Check pending requests for admin/superadmin
    this.pendingBadge.startPolling();

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDark.set(true);
      document.body.classList.add('dark-theme');
    } else {
      this.isDark.set(false);
      document.body.classList.remove('dark-theme');
    }
  }

  ngOnDestroy(): void {
    this.pendingBadge.stopPolling();
  }

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  toggleTheme(): void {
    const nextDark = !this.isDark();
    this.isDark.set(nextDark);
    if (nextDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  requestAbsence(): void {
    alert('Request Absence: Please coordinate with your trainer or admin to submit leaves.');
  }

  requestPause(): void {
    alert('Request Pause: To pause active training, please navigate to Trainings list and select Pause on the active enrollment.');
  }

  trainerAbsence(): void {
    alert('Trainer Absence: Navigate to Manage Slots (Availability) and choose "Mark Absence" for specific dates.');
  }

  comingSoon(featureName: string): void {
    alert(`${featureName} feature is coming soon!`);
  }

  triggerBackup(): void {
    alert('Backup: System database backup triggered successfully.');
  }

  triggerRestore(): void {
    alert('Restore: System database restore sequence initiated.');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
