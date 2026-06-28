import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';

@Component({
  selector: 'app-backup-download',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormBgTemplateComponent
  ],
  template: `
    <app-form-bg-template>
      <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
        <h3 class="form-title">Download Backup</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }
        @if (success()) {
          <div class="alert alert-success">✅ {{ success() }}</div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Login ID (Username)</mat-label>
          <input
            matInput
            name="username"
            placeholder="Enter your login ID"
            required
            [(ngModel)]="username"
            #usernameCtrl="ngModel"
          />
          <mat-icon matSuffix>person</mat-icon>
          @if (usernameCtrl.touched && usernameCtrl.errors?.['required']) {
            <mat-error>Username is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input
            matInput
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            [(ngModel)]="password"
            #passwordCtrl="ngModel"
          />
          <mat-icon matSuffix>lock</mat-icon>
          @if (passwordCtrl.touched && passwordCtrl.errors?.['required']) {
            <mat-error>Password is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>What color is of banana?</mat-label>
          <input
            matInput
            name="secretAnswer"
            placeholder="Enter the answer"
            required
            [(ngModel)]="secretAnswer"
            #secretCtrl="ngModel"
          />
          <mat-icon matSuffix>security</mat-icon>
          @if (secretCtrl.touched && secretCtrl.errors?.['required']) {
            <mat-error>Answer is required</mat-error>
          }
        </mat-form-field>

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Downloading…' : 'Download Backup' }}
          </button>
          <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </app-form-bg-template>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
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
      color: #d4ffd4;
      border: 1px solid rgba(200, 255, 200, 0.4);
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
    }

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

    ::ng-deep .mat-mdc-outlined-button:not(:disabled) {
      --mdc-outlined-button-outline-color: #fff;
      --mdc-outlined-button-label-text-color: #fff;
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }
  `
})
export class BackupDownloadComponent {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  secretAnswer = '';

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  submit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.api
      .downloadBackup({
        username: this.username.trim(),
        password: this.password.trim(),
        secretAnswer: this.secretAnswer.trim()
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          a.download = `mrktraining_backup_${timestamp}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.success.set('Backup downloaded successfully!');
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.error || err.message || 'Failed to download backup');
          this.loading.set(false);
        }
      });
  }

  cancel() {
    this.router.navigate(['/admin/branches-view']);
  }
}
