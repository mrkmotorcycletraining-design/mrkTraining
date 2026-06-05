import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrainingApiService } from '../core/services/training-api.service';

@Component({
  selector: 'app-trainer-add',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="add-container">
      <h2>Add New Trainer</h2>
      <form (ngSubmit)="addTrainer()" class="add-form">
        <div class="form-group">
          <label>Name *</label>
          <input 
            [(ngModel)]="form.name" 
            name="name" 
            type="text" 
            placeholder="Full name" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Email/Username *</label>
          <input 
            [(ngModel)]="form.emailUsername" 
            name="emailUsername" 
            type="email" 
            placeholder="trainer@example.com" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Password *</label>
          <input 
            [(ngModel)]="form.password" 
            name="password" 
            type="password" 
            placeholder="Secure password" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Default Branch</label>
          <input 
            [(ngModel)]="form.defaultBranchId" 
            name="defaultBranchId" 
            type="text" 
            placeholder="Branch ID (optional)" 
          />
        </div>

        <div class="form-group">
          <label>Active</label>
          <input 
            [(ngModel)]="form.active" 
            name="active" 
            type="checkbox" 
          />
          <span>Check to activate immediately</span>
        </div>

        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="loading()">
            {{ loading() ? 'Adding...' : 'Add Trainer' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
        </div>

        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }
      </form>
    </div>
  `,
  styles: `
    .add-container {
      max-width: 500px;
      margin: 0 auto;
    }

    h2 {
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      color: #333;
    }

    .add-form {
      background: #f9f9f9;
      padding: 2rem;
      border-radius: 4px;
      border: 1px solid #eee;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group:last-of-type {
      margin-bottom: 2rem;
    }

    label {
      display: block;
      margin-bottom: 0.4rem;
      font-weight: 500;
      color: #555;
      font-size: 0.9rem;
    }

    input[type="text"],
    input[type="email"],
    input[type="password"] {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.95rem;
      box-sizing: border-box;
    }

    input[type="text"]:focus,
    input[type="email"]:focus,
    input[type="password"]:focus {
      outline: none;
      border-color: #1565c0;
      box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.1);
    }

    input[type="checkbox"] {
      margin-right: 0.5rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.7rem 1.2rem;
      border: none;
      border-radius: 4px;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #1565c0;
      color: #fff;
      flex: 1;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1565c0dd;
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #757575;
      color: #fff;
      flex: 0.5;
    }

    .btn-secondary:hover {
      background: #757575dd;
    }

    .error-message {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #ffebee;
      border: 1px solid #f5a5a5;
      border-radius: 4px;
      color: #c62828;
      font-size: 0.9rem;
    }
  `
})
export class TrainerAddComponent {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = {
    name: '',
    emailUsername: '',
    password: '',
    defaultBranchId: '',
    active: true
  };

  addTrainer() {
    this.error.set('');

    if (!this.form.name.trim() || !this.form.emailUsername.trim() || !this.form.password.trim()) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);

    const payload = {
      name: this.form.name.trim(),
      emailUsername: this.form.emailUsername.trim(),
      password: this.form.password,
      defaultBranchId: this.form.defaultBranchId.trim() || null,
      active: this.form.active
    };

    this.api.createTrainer(payload).subscribe({
      next: () => {
        this.router.navigate(['/admin/trainers']);
      },
      error: (e) => {
        this.error.set(e.error?.error ?? 'Failed to add trainer');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/trainers']);
  }
}
