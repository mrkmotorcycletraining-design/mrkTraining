import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrainingApiService } from '../core/services/training-api.service';
import { TrainerApi } from '../core/models/api.models';

@Component({
  selector: 'app-trainer-detail',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (trainer()) {
      <div class="detail-container">
        <h2>{{ trainer()!.name }}</h2>
        <p class="subtitle">Trainer ID: {{ trainer()!.id }}</p>

        <div class="form-section">
          <h3>Basic Information</h3>
          <div class="form-group">
            <label>Name</label>
            <input [(ngModel)]="trainer()!.name" disabled class="disabled-input" />
          </div>
          <div class="form-group">
            <label>Email/Username</label>
            <input [(ngModel)]="trainer()!.emailUsername" disabled class="disabled-input" />
          </div>
          <div class="form-group">
            <label>Current Branch</label>
            <input [value]="trainer()!.currentBranch?.id || 'N/A'" disabled class="disabled-input" />
          </div>
        </div>

        <div class="form-section">
          <h3>Account Management</h3>
          <div class="form-group">
            <label>Status</label>
            <select [(ngModel)]="status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="button" class="btn btn-secondary" (click)="updateStatus()">
            {{ status === 'active' ? 'Keep Active' : 'Deactivate' }}
          </button>
        </div>

        <div class="form-section">
          <h3>Reset Password</h3>
          <div class="form-group">
            <label>New Password</label>
            <input [(ngModel)]="newPassword" type="password" placeholder="Enter new password" />
          </div>
          <button type="button" class="btn btn-warning" (click)="resetPassword()">
            Reset Password
          </button>
        </div>

        <div class="form-section">
          <h3>Danger Zone</h3>
          <p class="warning-text">These actions cannot be undone.</p>
          <button type="button" class="btn btn-danger" (click)="deleteTrainer()">
            Delete Trainer
          </button>
        </div>

        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="goBack()">Back</button>
        </div>
      </div>
    } @else {
      <p>Loading trainer information...</p>
    }
  `,
  styles: `
    .detail-container {
      max-width: 600px;
      margin: 0 auto;
    }

    h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      color: #333;
    }

    .subtitle {
      margin: 0 0 1.5rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .form-section {
      background: #f9f9f9;
      padding: 1.5rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      border: 1px solid #eee;
    }

    .form-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #333;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      margin-bottom: 0.4rem;
      font-weight: 500;
      color: #555;
      font-size: 0.9rem;
    }

    input[type="text"],
    input[type="password"],
    input[type="email"],
    select {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.95rem;
    }

    input:focus,
    select:focus {
      outline: none;
      border-color: #1565c0;
      box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.1);
    }

    .disabled-input {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    .btn {
      padding: 0.7rem 1.2rem;
      border: none;
      border-radius: 4px;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .btn-primary {
      background: #1565c0;
      color: #fff;
    }

    .btn-primary:hover {
      background: #1565c0dd;
    }

    .btn-secondary {
      background: #757575;
      color: #fff;
    }

    .btn-secondary:hover {
      background: #757575dd;
    }

    .btn-warning {
      background: #ff9800;
      color: #fff;
    }

    .btn-warning:hover {
      background: #ff9800dd;
    }

    .btn-danger {
      background: #c62828;
      color: #fff;
    }

    .btn-danger:hover {
      background: #c62828dd;
    }

    .warning-text {
      color: #c62828;
      font-weight: 500;
      margin-bottom: 1rem;
    }

    .actions {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #ddd;
    }
  `
})
export class TrainerDetailComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  trainer = signal<TrainerApi | null>(null);
  status = 'active';
  newPassword = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getTrainer(Number(id)).subscribe((t) => {
        this.trainer.set(t);
        this.status = t.active ? 'active' : 'inactive';
      });
    }
  }

  updateStatus() {
    const trainer = this.trainer();
    if (!trainer) return;

    if (this.status === 'inactive' && trainer.active) {
      if (!confirm('Are you sure you want to deactivate this trainer?')) return;
      this.api.deactivateTrainer(trainer.id).subscribe({
        next: () => {
          alert('Trainer deactivated successfully');
          this.goBack();
        },
        error: (e) => alert(`Error: ${e.error?.error ?? 'Failed to deactivate'}`)
      });
    }
  }

  resetPassword() {
    const trainer = this.trainer();
    if (!trainer || !this.newPassword.trim()) {
      alert('Please enter a new password');
      return;
    }

    if (!confirm(`Reset password for ${trainer.name}?`)) return;

    this.api.resetTrainerPassword(trainer.id, this.newPassword).subscribe({
      next: () => {
        alert('Password reset successfully');
        this.newPassword = '';
      },
      error: (e) => alert(`Error: ${e.error?.error ?? 'Failed to reset password'}`)
    });
  }

  deleteTrainer() {
    const trainer = this.trainer();
    if (!trainer) return;

    if (!confirm(`Are you sure you want to DELETE ${trainer.name}? This cannot be undone.`)) return;

    this.api.deleteTrainer(trainer.id).subscribe({
      next: () => {
        alert('Trainer deleted successfully');
        this.router.navigate(['/admin/trainers']);
      },
      error: (e) => alert(`Error: ${e.error?.error ?? 'Failed to delete'}`)
    });
  }

  goBack() {
    this.router.navigate(['/admin/trainers']);
  }
}
