import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TrainingApiService } from '../core/services/training-api.service';
import { ClientProfileApi } from '../core/models/api.models';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { ProfilePictureUploadComponent } from '../core/components/profile-picture-upload/profile-picture-upload.component';
import { ClientProfileService } from './client-profile.service';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormBgTemplateComponent,
    ProfilePictureUploadComponent,
  ],
  template: `
    <app-form-bg-template>
      <form #f="ngForm" (ngSubmit)="save(f)" novalidate>
        <h3 class="form-title">My Profile</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }
        @if (msg()) {
          <div class="alert alert-success">✅ {{ msg() }}</div>
        }

        <!-- Profile Picture -->
        <app-profile-picture-upload
          label="Profile Picture"
          [existingUrl]="profilePicture"
          (imageSelected)="onProfilePicChange($event)"
        />

        <!-- Name (readonly) -->
        <mat-form-field appearance="outline">
          <mat-label>Full Name</mat-label>
          <input matInput name="name" [value]="profile()?.name ?? ''" readonly />
          <mat-icon matSuffix>person</mat-icon>
        </mat-form-field>

        <!-- Username (readonly) -->
        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input matInput name="username" [value]="profile()?.username ?? ''" readonly />
          <mat-icon matSuffix>badge</mat-icon>
        </mat-form-field>

        <!-- Email -->
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput name="email" type="email" placeholder="your@email.com" [(ngModel)]="email" required #emailCtrl="ngModel" />
          <mat-icon matSuffix>email</mat-icon>
          @if (emailCtrl.touched && emailCtrl.errors?.['required']) {
            <mat-error>Email is required</mat-error>
          }
        </mat-form-field>

        <div class="field-row">
          <!-- Height -->
          <mat-form-field appearance="outline">
            <mat-label>Height (ft)</mat-label>
            <input matInput name="heightFt" type="number" step="0.01" min="1" max="8" placeholder="e.g. 5.7" [(ngModel)]="heightFt" required #htCtrl="ngModel" />
            <mat-icon matSuffix>height</mat-icon>
            <mat-hint>Height in feet (e.g. 5.7 for 5′7″)</mat-hint>
            @if (htCtrl.touched && htCtrl.errors?.['required']) {
              <mat-error>Height is required</mat-error>
            }
          </mat-form-field>

          <!-- Weight -->
          <mat-form-field appearance="outline">
            <mat-label>Weight (kg)</mat-label>
            <input matInput name="weightKg" type="number" min="20" max="300" placeholder="e.g. 65" [(ngModel)]="weightKg" required #wtCtrl="ngModel" />
            <mat-icon matSuffix>monitor_weight</mat-icon>
            @if (wtCtrl.touched && wtCtrl.errors?.['required']) {
              <mat-error>Weight is required</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Date of Birth -->
        <mat-form-field appearance="outline">
          <mat-label>Date of Birth</mat-label>
          <input matInput [matDatepicker]="dobPicker" [max]="maxDob" name="dateOfBirth" [(ngModel)]="dateOfBirth" />
          <mat-datepicker-toggle matIconSuffix [for]="dobPicker"></mat-datepicker-toggle>
          <mat-datepicker #dobPicker></mat-datepicker>
          <mat-hint>Must be at least 10 years old</mat-hint>
        </mat-form-field>

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Saving…' : 'Save Profile' }}
          </button>
        </div>
      </form>
    </app-form-bg-template>

    <!-- Change Password Section -->
    <app-form-bg-template>
      <form #pwdForm="ngForm" (ngSubmit)="changePassword(pwdForm)" novalidate>
        <h3 class="form-title">Change Password</h3>

        @if (pwdError()) {
          <div class="alert alert-error">⚠️ {{ pwdError() }}</div>
        }
        @if (pwdSuccess()) {
          <div class="alert alert-success">✅ {{ pwdSuccess() }}</div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Current Password</mat-label>
          <input matInput name="currentPassword" type="password" [(ngModel)]="currentPassword" required #curPwdCtrl="ngModel" />
          <mat-icon matSuffix>lock</mat-icon>
          @if (curPwdCtrl.touched && curPwdCtrl.errors?.['required']) {
            <mat-error>Current password is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>New Password</mat-label>
          <input matInput name="newPassword" type="password" minlength="6" [(ngModel)]="newPassword" required #newPwdCtrl="ngModel" />
          <mat-icon matSuffix>lock_open</mat-icon>
          @if (newPwdCtrl.touched && newPwdCtrl.errors?.['required']) {
            <mat-error>New password is required</mat-error>
          }
          @if (newPwdCtrl.touched && newPwdCtrl.errors?.['minlength']) {
            <mat-error>Must be at least 6 characters</mat-error>
          }
        </mat-form-field>

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="pwdLoading()">
            {{ pwdLoading() ? 'Updating…' : 'Update Password' }}
          </button>
        </div>
      </form>
    </app-form-bg-template>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      color: #fff;
    }

    .form-title {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
    }

    .alert-error {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
    }

    .alert-success {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border: 1px solid rgba(76, 175, 80, 0.6);
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    /* Material form field overrides for white-on-blue */
    ::ng-deep .mat-mdc-form-field {
      --mdc-outlined-text-field-outline-color: rgba(255, 255, 255, 0.7);
      --mdc-outlined-text-field-hover-outline-color: #fff;
      --mdc-outlined-text-field-focus-outline-color: #fff;
      --mdc-outlined-text-field-label-text-color: #fff;
      --mdc-outlined-text-field-focus-label-text-color: #fff;
      --mdc-outlined-text-field-hover-label-text-color: #fff;
      --mdc-outlined-text-field-input-text-color: #fff;
      --mdc-outlined-text-field-input-text-placeholder-color: rgba(255, 255, 255, 0.5);
      --mdc-outlined-text-field-caret-color: #fff;
      --mat-form-field-state-layer-color: transparent;
    }

    ::ng-deep .mat-mdc-form-field .mdc-floating-label,
    ::ng-deep .mat-mdc-form-field .mdc-floating-label--float-above,
    ::ng-deep .mat-mdc-form-field .mat-mdc-floating-label,
    ::ng-deep .mat-mdc-form-field label {
      color: #fff !important;
    }

    ::ng-deep .mat-mdc-form-field input.mat-mdc-input-element,
    ::ng-deep .mat-mdc-form-field .mat-mdc-input-element {
      color: #fff !important;
    }

    ::ng-deep .mat-mdc-form-field input::placeholder {
      color: rgba(255, 255, 255, 0.5) !important;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-icon-suffix {
      color: rgba(255, 255, 255, 0.8);
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-hint {
      color: rgba(255, 255, 255, 0.7);
    }

    ::ng-deep .mat-mdc-outlined-button:not(:disabled) {
      --mdc-outlined-button-outline-color: #fff;
      --mdc-outlined-button-label-text-color: #fff;
    }

    ::ng-deep .mat-datepicker-toggle .mat-mdc-icon-button {
      color: rgba(255, 255, 255, 0.8) !important;
    }
  `
})
export class ClientProfileComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly profileService = inject(ClientProfileService);

  profile = signal<ClientProfileApi | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  msg = signal<string | null>(null);

  // Profile fields
  email = '';
  heightFt: number | null = null;
  weightKg: number | null = null;
  dateOfBirth: Date | null = null;
  profilePicture: string | null = null;

  /** Max selectable DOB = 10 years before today */
  maxDob: Date = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 10);
    return d;
  })();

  // Password fields
  currentPassword = '';
  newPassword = '';
  pwdLoading = signal(false);
  pwdError = signal<string | null>(null);
  pwdSuccess = signal<string | null>(null);

  ngOnInit() {
    this.api.getClientMe().subscribe((p) => {
      this.profile.set(p);
      this.email = p.email ?? '';
      this.heightFt = p.heightFt ?? null;
      this.weightKg = p.weightKg ?? null;
      this.dateOfBirth = p.dateOfBirth ? new Date(p.dateOfBirth) : null;
      this.profilePicture = p.profilePicture ?? null;
    });
  }

  onProfilePicChange(base64: string | null) {
    this.profilePicture = base64;
  }

  save(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    // Validate DOB is at least 10 years ago
    if (this.dateOfBirth) {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      if (this.dateOfBirth > tenYearsAgo) {
        this.error.set('Date of Birth must be at least 10 years before today.');
        return;
      }
    }

    this.loading.set(true);
    this.error.set(null);
    this.msg.set(null);

    this.api
      .updateClientMe({
        email: this.email || undefined,
        heightFt: this.heightFt ?? undefined,
        weightKg: this.weightKg ?? undefined,
        dateOfBirth: this.dateOfBirth ? this.formatDate(this.dateOfBirth) : undefined,
        profilePicture: this.profilePicture || undefined
      })
      .subscribe({
        next: (p) => {
          this.profile.set(p);
          this.msg.set('Profile updated successfully.');
          this.loading.set(false);
          // Refresh the profile completeness check
          this.profileService.refreshProfile();
        },
        error: (e) => {
          this.error.set(e.error?.error ?? 'Failed to update profile');
          this.loading.set(false);
        }
      });
  }

  changePassword(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.pwdLoading.set(true);
    this.pwdError.set(null);
    this.pwdSuccess.set(null);

    this.api.changeClientPassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.pwdSuccess.set('Password updated successfully.');
        this.pwdLoading.set(false);
        this.currentPassword = '';
        this.newPassword = '';
      },
      error: (e) => {
        this.pwdError.set(e.error?.error ?? 'Password change failed.');
        this.pwdLoading.set(false);
      }
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
