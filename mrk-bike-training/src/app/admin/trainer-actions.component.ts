import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { TrainerApi, BranchApi } from '../core/models/api.models';

@Component({
  selector: 'app-trainer-actions',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormBgTemplateComponent
  ],
  template: `
    <app-form-bg-template>
      <div class="form-container">
        <h3 class="form-title">{{ title() }}</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }
        @if (success()) {
          <div class="alert alert-success">✅ {{ success() }}</div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Select Trainer</mat-label>
          <mat-select
            name="trainer"
            [(ngModel)]="selectedTrainerId"
            (ngModelChange)="onTrainerChange($event)"
          >
            @for (t of trainers(); track t.id) {
              <mat-option [value]="t.id">{{ t.name }} ({{ t.username }}) — {{ t.active !== false ? 'Active' : 'Inactive' }}</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>person</mat-icon>
        </mat-form-field>

        @if (selectedTrainer()) {
          <div class="info-card">
            <p><strong>Name:</strong> {{ selectedTrainer()!.name }}</p>
            <p><strong>Username:</strong> {{ selectedTrainer()!.username }}</p>
            <p><strong>Active:</strong> {{ selectedTrainer()!.active !== false ? 'Yes' : 'No' }}</p>
            <p><strong>Branch:</strong> {{ selectedTrainer()!.currentBranch?.id || '—' }}</p>
          </div>
        }

        @if (action() === 'update-password') {
          <mat-form-field appearance="outline">
            <mat-label>New Password</mat-label>
            <input matInput name="password" type="password" [(ngModel)]="newPassword" placeholder="Min 6 characters" />
            <mat-icon matSuffix>lock</mat-icon>
          </mat-form-field>
        }

        @if (action() === 'switch-branch') {
          <mat-form-field appearance="outline">
            <mat-label>New Branch</mat-label>
            <mat-select name="branch" [(ngModel)]="newBranchId">
              @for (b of branches(); track b.id) {
                <mat-option [value]="b.id">{{ b.name }} ({{ b.id }})</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>store</mat-icon>
          </mat-form-field>
        }

        @if (action() === 'mark-absence') {
          <mat-form-field appearance="outline">
            <mat-label>Absence Date</mat-label>
            <input matInput [matDatepicker]="picker" name="absenceDate" [(ngModel)]="absenceDate" />
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        }

        <div class="form-actions">
          @if (action() === 'deactivate') {
            <button mat-flat-button color="primary" type="button" (click)="toggleTrainerStatus()" [disabled]="loading() || !selectedTrainerId">
              {{ loading() ? 'Processing…' : (isTrainerActive() ? 'Deactivate Trainer' : 'Activate Trainer') }}
            </button>
          }
          @if (action() === 'delete') {
            <button mat-flat-button color="warn" type="button" (click)="deleteTrainer()" [disabled]="loading() || !selectedTrainerId">
              {{ loading() ? 'Deleting…' : 'Delete Trainer' }}
            </button>
          }
          @if (action() === 'update-password') {
            <button mat-flat-button color="primary" type="button" (click)="resetPassword()" [disabled]="loading() || !selectedTrainerId || !newPassword">
              {{ loading() ? 'Updating…' : 'Reset Password' }}
            </button>
          }
          @if (action() === 'switch-branch') {
            <button mat-flat-button color="primary" type="button" (click)="switchBranch()" [disabled]="loading() || !selectedTrainerId || !newBranchId">
              {{ loading() ? 'Switching…' : 'Switch Branch' }}
            </button>
          }
          @if (action() === 'mark-absence') {
            <button mat-flat-button color="primary" type="button" (click)="markAbsence()" [disabled]="loading() || !selectedTrainerId || !absenceDate">
              {{ loading() ? 'Processing…' : 'Mark Absence' }}
            </button>
          }
          <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
        </div>
      </div>
    </app-form-bg-template>
  `,
  styles: `
    :host { display: block; padding: 1.5rem; }
    .form-container { display: flex; flex-direction: column; gap: 0.75rem; color: #fff; }
    .form-title { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; color: #fff; }
    .alert-error { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.4); padding: 0.5rem 0.75rem; border-radius: 4px; }
    .alert-success { background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.5); padding: 0.5rem 0.75rem; border-radius: 4px; }
    .info-card { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 0.75rem; }
    .info-card p { margin: 0.25rem 0; font-size: 0.9rem; }
    .form-actions { display: flex; gap: 0.75rem; margin-top: 0.75rem; }
    ::ng-deep .mat-mdc-form-field {
      --mdc-outlined-text-field-outline-color: rgba(255,255,255,0.7);
      --mdc-outlined-text-field-hover-outline-color: #fff;
      --mdc-outlined-text-field-focus-outline-color: #fff;
      --mdc-outlined-text-field-label-text-color: #fff;
      --mdc-outlined-text-field-focus-label-text-color: #fff;
      --mdc-outlined-text-field-hover-label-text-color: #fff;
      --mdc-outlined-text-field-input-text-color: #fff;
      --mdc-outlined-text-field-input-text-placeholder-color: rgba(255,255,255,0.5);
      --mdc-outlined-text-field-caret-color: #fff;
      --mat-form-field-state-layer-color: transparent;
    }
    ::ng-deep .mat-mdc-form-field .mdc-floating-label, ::ng-deep .mat-mdc-form-field label { color: #fff !important; }
    ::ng-deep .mat-mdc-form-field input.mat-mdc-input-element { color: #fff !important; }
    ::ng-deep .mat-mdc-form-field input::placeholder { color: rgba(255,255,255,0.5) !important; }
    ::ng-deep .mat-mdc-select-value-text { color: #fff !important; }
    ::ng-deep .mat-mdc-select-arrow { color: rgba(255,255,255,0.8) !important; }
    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-icon-suffix { color: rgba(255,255,255,0.8); }
    ::ng-deep .mat-datepicker-toggle .mat-mdc-icon-button { color: rgba(255,255,255,0.8) !important; }
    ::ng-deep .mat-mdc-outlined-button:not(:disabled) { --mdc-outlined-button-outline-color: #fff; --mdc-outlined-button-label-text-color: #fff; }
  `
})
export class TrainerActionsComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  trainers = signal<TrainerApi[]>([]);
  branches = signal<BranchApi[]>([]);
  selectedTrainerId: number | null = null;
  selectedTrainer = signal<TrainerApi | null>(null);
  newPassword = '';
  newBranchId = '';
  absenceDate: Date | null = null;
  action = signal<string>('deactivate');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  title = signal('Trainer Action');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const a = params['action'] || 'deactivate';
      this.action.set(a);
      const titles: Record<string, string> = {
        'deactivate': '🔄 Activate / Deactivate Trainer',
        'delete': '🗑️ Delete Trainer',
        'update-password': '🔑 Update Trainer Password',
        'switch-branch': '🔀 Switch Trainer Branch',
        'mark-absence': '📋 Mark Trainer Absence'
      };
      this.title.set(titles[a] || 'Trainer Action');
    });
    this.api.listTrainers().subscribe(t => this.trainers.set(t));
    this.api.listBranches().subscribe(b => this.branches.set(b));
  }

  onTrainerChange(id: number) {
    this.selectedTrainer.set(this.trainers().find(t => t.id === id) || null);
    this.error.set(null);
    this.success.set(null);
  }

  isTrainerActive(): boolean {
    return this.selectedTrainer()?.active !== false;
  }

  toggleTrainerStatus() {
    if (!this.selectedTrainerId) return;
    const active = this.isTrainerActive();
    const msg = active ? 'Deactivate this trainer?' : 'Activate this trainer?';
    if (!confirm(msg)) return;
    this.loading.set(true);
    this.error.set(null);
    const call = active
      ? this.api.deactivateTrainer(this.selectedTrainerId)
      : this.api.activateTrainer(this.selectedTrainerId);
    call.subscribe({
      next: () => {
        this.success.set(active ? 'Trainer deactivated.' : 'Trainer activated.');
        this.loading.set(false);
        this.reload();
      },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed'); this.loading.set(false); }
    });
  }

  deactivate() {
    this.toggleTrainerStatus();
  }

  deleteTrainer() {
    if (!this.selectedTrainerId || !confirm('DELETE this trainer? This cannot be undone.')) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.deleteTrainer(this.selectedTrainerId).subscribe({
      next: () => {
        this.success.set('Trainer deleted.');
        this.loading.set(false);
        this.selectedTrainerId = null;
        this.selectedTrainer.set(null);
        this.reload();
      },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed'); this.loading.set(false); }
    });
  }

  resetPassword() {
    if (!this.selectedTrainerId || !this.newPassword) return;
    if (!confirm('Reset password for this trainer?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.resetTrainerPassword(this.selectedTrainerId, this.newPassword).subscribe({
      next: () => { this.success.set('Password updated.'); this.loading.set(false); this.newPassword = ''; },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed'); this.loading.set(false); }
    });
  }

  switchBranch() {
    if (!this.selectedTrainerId || !this.newBranchId || !confirm('Switch trainer branch?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.switchTrainerBranch(this.selectedTrainerId, this.newBranchId).subscribe({
      next: () => { this.success.set('Branch switched.'); this.loading.set(false); this.reload(); },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed'); this.loading.set(false); }
    });
  }

  markAbsence() {
    if (!this.selectedTrainerId || !this.absenceDate) return;
    if (!confirm('Mark absence for this trainer?')) return;
    this.loading.set(true);
    this.error.set(null);
    const dateStr = this.formatDate(this.absenceDate);
    this.api.markTrainerAbsence(this.selectedTrainerId, dateStr).subscribe({
      next: () => { this.success.set('Absence marked.'); this.loading.set(false); },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed'); this.loading.set(false); }
    });
  }

  cancel() {
    this.router.navigate(['/admin/trainers-view']);
  }

  private reload() {
    this.api.listTrainers().subscribe(t => {
      this.trainers.set(t);
      if (this.selectedTrainerId) {
        this.selectedTrainer.set(t.find(x => x.id === this.selectedTrainerId) || null);
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
