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
import { AdminClientApi, EnrollmentApi } from '../core/models/api.models';

@Component({
  selector: 'app-client-actions',
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
          <mat-label>Select Client</mat-label>
          <mat-select
            name="client"
            [(ngModel)]="selectedClientId"
            (ngModelChange)="onClientChange($event)"
          >
            @for (c of clients(); track c.id) {
              <mat-option [value]="c.id">{{ c.name }} ({{ c.username }}) — {{ c.active !== false ? 'Active' : 'Inactive' }}</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>person</mat-icon>
        </mat-form-field>

        @if (selectedClient()) {
          <div class="info-card">
            <p><strong>Name:</strong> {{ selectedClient()!.name }}</p>
            <p><strong>Username:</strong> {{ selectedClient()!.username }}</p>
            <p><strong>Active:</strong> {{ selectedClient()!.active !== false ? 'Yes' : 'No' }}</p>
            <p><strong>Trainings Allowed:</strong> {{ selectedClient()!.allowedNumOfTrainings }}</p>
          </div>
        }

        @if (action() === 'update-password') {
          <mat-form-field appearance="outline">
            <mat-label>New Password</mat-label>
            <input matInput name="password" type="password" [(ngModel)]="newPassword" placeholder="Min 6 characters" />
            <mat-icon matSuffix>lock</mat-icon>
          </mat-form-field>
        }

        @if (action() === 'mark-absent') {
          <mat-form-field appearance="outline">
            <mat-label>Select Enrollment</mat-label>
            <mat-select name="enrollment" [(ngModel)]="selectedEnrollmentId">
              @for (e of enrollments(); track e.id) {
                <mat-option [value]="e.id">{{ e.course?.name }} — {{ e.status }}</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>event_busy</mat-icon>
          </mat-form-field>
        }

        @if (action() === 'pause-training') {
          <mat-form-field appearance="outline">
            <mat-label>Select Enrollment to Pause</mat-label>
            <mat-select name="enrollment" [(ngModel)]="selectedEnrollmentId">
              @for (e of enrollments(); track e.id) {
                <mat-option [value]="e.id">{{ e.course?.name }} — {{ e.status }}</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>pause_circle</mat-icon>
          </mat-form-field>
        }

        <div class="form-actions">
          @if (action() === 'deactivate') {
            <button mat-flat-button color="primary" type="button" (click)="toggleClientStatus()" [disabled]="loading() || !selectedClientId">
              {{ loading() ? 'Processing…' : (isClientActive() ? 'Deactivate Client' : 'Activate Client') }}
            </button>
          }
          @if (action() === 'delete') {
            <button mat-flat-button color="warn" type="button" (click)="deleteClient()" [disabled]="loading() || !selectedClientId">
              {{ loading() ? 'Deleting…' : 'Delete Client' }}
            </button>
          }
          @if (action() === 'update-password') {
            <button mat-flat-button color="primary" type="button" (click)="resetPassword()" [disabled]="loading() || !selectedClientId || !newPassword">
              {{ loading() ? 'Updating…' : 'Reset Password' }}
            </button>
          }
          @if (action() === 'mark-absent') {
            <button mat-flat-button color="primary" type="button" (click)="markAbsent()" [disabled]="loading() || !selectedEnrollmentId">
              {{ loading() ? 'Processing…' : 'Mark Absent' }}
            </button>
          }
          @if (action() === 'pause-training') {
            <button mat-flat-button color="primary" type="button" (click)="pauseTraining()" [disabled]="loading() || !selectedEnrollmentId">
              {{ loading() ? 'Pausing…' : 'Pause Training' }}
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
    ::ng-deep .mat-mdc-outlined-button:not(:disabled) { --mdc-outlined-button-outline-color: #fff; --mdc-outlined-button-label-text-color: #fff; }
  `
})
export class ClientActionsComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  clients = signal<AdminClientApi[]>([]);
  enrollments = signal<EnrollmentApi[]>([]);
  selectedClientId: number | null = null;
  selectedClient = signal<AdminClientApi | null>(null);
  selectedEnrollmentId: number | null = null;
  newPassword = '';
  action = signal<string>('deactivate');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  title = signal('Client Action');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const a = params['action'] || 'deactivate';
      this.action.set(a);
      const titles: Record<string, string> = {
        'deactivate': '🔄 Activate / Deactivate Client',
        'delete': '🗑️ Delete Client',
        'update-password': '🔑 Update Client Password',
        'mark-absent': '📋 Mark Client Absent',
        'pause-training': '⏸️ Pause Client Training'
      };
      this.title.set(titles[a] || 'Client Action');
    });
    this.api.listClients().subscribe(c => this.clients.set(c));
  }

  onClientChange(id: number) {
    this.selectedClient.set(this.clients().find(c => c.id === id) || null);
    this.error.set(null);
    this.success.set(null);
    this.selectedEnrollmentId = null;
    if (this.action() === 'mark-absent' || this.action() === 'pause-training') {
      this.api.listEnrollments({ clientId: id }).subscribe(e => this.enrollments.set(e));
    }
  }

  isClientActive(): boolean {
    return this.selectedClient()?.active !== false;
  }

  toggleClientStatus() {
    if (!this.selectedClientId) return;
    const active = this.isClientActive();
    const msg = active ? 'Deactivate this client?' : 'Activate this client?';
    if (!confirm(msg)) return;
    this.loading.set(true);
    this.error.set(null);
    const call = active
      ? this.api.deactivateClient(this.selectedClientId)
      : this.api.activateClient(this.selectedClientId);
    call.subscribe({
      next: () => {
        this.success.set(active ? 'Client deactivated.' : 'Client activated.');
        this.loading.set(false);
        this.reload();
      },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed'); this.loading.set(false); }
    });
  }

  deactivate() {
    this.toggleClientStatus();
  }

  deleteClient() {
    if (!this.selectedClientId || !confirm('DELETE this client? This cannot be undone.')) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.deleteClient(this.selectedClientId).subscribe({
      next: () => {
        this.success.set('Client deleted.');
        this.loading.set(false);
        this.selectedClientId = null;
        this.selectedClient.set(null);
        this.reload();
      },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed'); this.loading.set(false); }
    });
  }

  resetPassword() {
    if (!this.selectedClientId || !this.newPassword) return;
    if (!confirm('Reset password for this client?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.resetClientPassword(this.selectedClientId, this.newPassword).subscribe({
      next: () => { this.success.set('Password updated.'); this.loading.set(false); this.newPassword = ''; },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed'); this.loading.set(false); }
    });
  }

  markAbsent() {
    if (!this.selectedEnrollmentId) return;
    // Use the slots endpoint - get the latest active slot for this enrollment and record absence
    this.loading.set(true);
    this.error.set(null);
    this.api.getEnrollmentSlots(this.selectedEnrollmentId).subscribe({
      next: (slots) => {
        const activeSlot = slots.find(s => s.status === 'ACTIVE');
        if (!activeSlot) {
          this.error.set('No active slot found for this enrollment.');
          this.loading.set(false);
          return;
        }
        this.api.recordSlotAbsence(activeSlot.id).subscribe({
          next: () => { this.success.set('Absence recorded.'); this.loading.set(false); },
          error: (e) => { this.error.set(e.error?.error ?? 'Failed to mark absent'); this.loading.set(false); }
        });
      },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed to fetch slots'); this.loading.set(false); }
    });
  }

  pauseTraining() {
    if (!this.selectedEnrollmentId || !confirm('Pause this training enrollment?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.pauseEnrollment(this.selectedEnrollmentId).subscribe({
      next: () => { this.success.set('Training paused.'); this.loading.set(false); },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed to pause'); this.loading.set(false); }
    });
  }

  cancel() {
    this.router.navigate(['/admin/clients-view']);
  }

  private reload() {
    this.api.listClients().subscribe(c => {
      this.clients.set(c);
      if (this.selectedClientId) {
        this.selectedClient.set(c.find(x => x.id === this.selectedClientId) || null);
      }
    });
  }
}
