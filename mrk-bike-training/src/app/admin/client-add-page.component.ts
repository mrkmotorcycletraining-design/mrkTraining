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
  selector: 'app-client-add-page',
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
        <h3 class="form-title">Add Client</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Full Name</mat-label>
          <input
            matInput
            name="name"
            placeholder="e.g. John Doe"
            maxlength="255"
            required
            [(ngModel)]="name"
            #nameCtrl="ngModel"
          />
          <mat-icon matSuffix>person</mat-icon>
          @if (nameCtrl.touched && nameCtrl.errors?.['required']) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input
            matInput
            name="username"
            placeholder="e.g. johndoe123"
            maxlength="255"
            required
            [(ngModel)]="username"
            #usernameCtrl="ngModel"
          />
          <mat-icon matSuffix>badge</mat-icon>
          <mat-hint>Must be unique. No character restrictions.</mat-hint>
          @if (usernameCtrl.touched && usernameCtrl.errors?.['required']) {
            <mat-error>Username is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email (optional)</mat-label>
          <input
            matInput
            name="email"
            type="email"
            placeholder="client&#64;example.com"
            maxlength="255"
            [(ngModel)]="email"
          />
          <mat-icon matSuffix>email</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input
            matInput
            name="password"
            type="password"
            placeholder="Min 6 characters"
            minlength="6"
            maxlength="255"
            required
            [(ngModel)]="password"
            #pwdCtrl="ngModel"
          />
          <mat-icon matSuffix>lock</mat-icon>
          @if (pwdCtrl.touched && pwdCtrl.errors?.['required']) {
            <mat-error>Password is required</mat-error>
          }
          @if (pwdCtrl.touched && pwdCtrl.errors?.['minlength']) {
            <mat-error>Password must be at least 6 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Height (ft)</mat-label>
          <input
            matInput
            name="heightFt"
            type="number"
            step="0.01"
            min="1"
            max="8"
            placeholder="e.g. 5.7"
            required
            [(ngModel)]="heightFt"
            #heightCtrl="ngModel"
          />
          <mat-icon matSuffix>height</mat-icon>
          <mat-hint>Height in feet (e.g. 5.7 for 5 feet 7 inches)</mat-hint>
          @if (heightCtrl.touched && heightCtrl.errors?.['required']) {
            <mat-error>Height is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Weight (kg)</mat-label>
          <input
            matInput
            name="weightKg"
            type="number"
            min="20"
            max="300"
            placeholder="e.g. 65"
            [(ngModel)]="weightKg"
          />
          <mat-icon matSuffix>monitor_weight</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Allowed Trainings</mat-label>
          <input
            matInput
            name="allowed"
            type="number"
            min="1"
            placeholder="2"
            [(ngModel)]="allowed"
          />
          <mat-icon matSuffix>fitness_center</mat-icon>
          <mat-hint>Number of training sessions this client can book</mat-hint>
        </mat-form-field>

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Create Client' }}
          </button>
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

    /* Stroked button white border */
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
export class ClientAddPageComponent {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  name = '';
  username = '';
  email = '';
  password = '';
  heightFt: number | null = null;
  weightKg: number | null = null;
  allowed = 2;

  loading = signal(false);
  error = signal<string | null>(null);

  submit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.api
      .createClient({
        name: this.name.trim(),
        username: this.username.trim(),
        email: this.email.trim() || null,
        password: this.password,
        allowedNumOfTrainings: this.allowed,
        heightFt: this.heightFt,
        weightKg: this.weightKg
      })
      .subscribe({
        next: (c) => this.router.navigate(['/admin/clients', c.id]),
        error: (e) => {
          this.error.set(e.error?.error ?? 'Failed to create client');
          this.loading.set(false);
        }
      });
  }

  cancel() {
    this.router.navigate(['/admin/clients']);
  }
}
