import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { AssignTrainingDetailsComponent, TrainingDetails } from './assign-training-details.component';
import { AssignTrainingScheduleComponent, ScheduleData } from './assign-training-schedule.component';

@Component({
  selector: 'app-assign-training',
  standalone: true,
  imports: [
    MatButtonModule,
    FormBgTemplateComponent,
    AssignTrainingDetailsComponent,
    AssignTrainingScheduleComponent
  ],
  template: `
    <app-form-bg-template>
      <div class="assign-form">
        <h3 class="form-title">Assign Training to Client</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }

        <!-- Section 1: Training Details -->
        <app-assign-training-details
          (detailsChange)="onDetailsChange($event)"
        />

        <!-- Section 2: Trainer & Schedule -->
        <app-assign-training-schedule
          [inputTotalDays]="totalDays()"
          [inputHoursPerDay]="hoursPerDay()"
          [inputBranchId]="branchId()"
          [inputVehicleType]="vehicleType()"
          [inputVehicleName]="vehicleName()"
          (scheduleChange)="onScheduleChange($event)"
        />

        <div class="form-actions">
          <button mat-flat-button color="primary" [disabled]="loading()" (click)="submit()">
            {{ loading() ? 'Assigning…' : 'Assign Training' }}
          </button>
          <button mat-stroked-button (click)="cancel()">Cancel</button>
        </div>
      </div>
    </app-form-bg-template>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .assign-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      color: #fff;
    }

    .form-title {
      margin: 0 0 0.75rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
    }

    .alert-error {
      padding: 0.6rem 0.85rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    /* Stroked button white border */
    ::ng-deep .mat-mdc-outlined-button:not(:disabled) {
      --mdc-outlined-button-outline-color: #fff;
      --mdc-outlined-button-label-text-color: #fff;
    }

    /* Material form field overrides for white-on-blue (inherited by children via ::ng-deep) */
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
      --mdc-outlined-text-field-disabled-outline-color: rgba(255, 255, 255, 0.4);
      --mdc-outlined-text-field-disabled-label-text-color: rgba(255, 255, 255, 0.6);
      --mdc-outlined-text-field-disabled-input-text-color: rgba(255, 255, 255, 0.7);
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

    ::ng-deep .mat-mdc-select-value-text {
      color: #fff !important;
    }

    ::ng-deep .mat-mdc-select-arrow {
      color: rgba(255, 255, 255, 0.8) !important;
    }
  `
})
export class AssignTrainingComponent {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  // Signals passed down to schedule component
  totalDays = signal<number | null>(null);
  hoursPerDay = signal<number | null>(null);
  branchId = signal<string>('');
  vehicleType = signal<string>('');
  vehicleName = signal<string | null>(null);

  // State from child components
  private details: TrainingDetails | null = null;
  private schedule: ScheduleData | null = null;

  loading = signal(false);
  error = signal<string | null>(null);

  onDetailsChange(details: TrainingDetails) {
    this.details = details;
    this.totalDays.set(details.totalDays);
    this.hoursPerDay.set(details.hoursPerDay);
    this.branchId.set(details.branchId || '');
    this.vehicleType.set(details.assetType || '');
    this.vehicleName.set(details.selectedVehicleName);
  }

  onScheduleChange(schedule: ScheduleData) {
    this.schedule = schedule;
  }

  submit() {
    if (!this.details?.clientId || !this.details?.courseId || !this.details?.branchId || !this.details?.assetType) {
      this.error.set('Please fill all required fields in Training Details.');
      return;
    }
    if (!this.details.hoursPerDay) {
      this.error.set('Please specify hours per day.');
      return;
    }
    if (!this.schedule?.scheduleRanges?.length) {
      this.error.set('Please add at least one date-time range in Trainer & Schedule section.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Build slots from schedule ranges (convert DD/MM/YYYY HH:MM AM to ISO formats)
    const slots = this.schedule.scheduleRanges
      .map(r => this.rangeToSlot(r))
      .filter(s => s !== null);

    if (slots.length === 0) {
      this.error.set('Invalid date-time ranges. Please re-select.');
      this.loading.set(false);
      return;
    }

    const body = {
      clientId: this.details.clientId,
      courseId: this.details.courseId,
      branchId: this.details.branchId,
      assetType: this.details.assetType,
      vehicleId: null as string | null, // Can be wired from vehicle selection later
      trainerId: null as number | null, // Can be wired from trainer card selection later
      hoursPerDay: this.details.hoursPerDay,
      totalAmountPaid: null,
      slots
    };

    this.api.adminAssignTraining(body).subscribe({
      next: () => this.router.navigate(['/admin/schedule']),
      error: (e) => {
        this.error.set(e.error?.error ?? e.error?.message ?? 'Failed to assign training');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/schedule']);
  }

  /**
   * Convert a "DD/MM/YYYY HH:MM AM/PM-DD/MM/YYYY HH:MM AM/PM" range
   * to {startDate, endDate, startTime, endTime} in ISO format for the backend.
   */
  private rangeToSlot(range: { start: string; end: string }): { startDate: string; endDate: string; startTime: string; endTime: string } | null {
    const start = this.parseDt(range.start);
    const end = this.parseDt(range.end);
    if (!start || !end) return null;

    return {
      startDate: `${start.year}-${String(start.month).padStart(2, '0')}-${String(start.day).padStart(2, '0')}`,
      endDate: `${end.year}-${String(end.month).padStart(2, '0')}-${String(end.day).padStart(2, '0')}`,
      startTime: `${String(start.hour).padStart(2, '0')}:${String(start.minute).padStart(2, '0')}:00`,
      endTime: `${String(end.hour).padStart(2, '0')}:${String(end.minute).padStart(2, '0')}:00`
    };
  }

  private parseDt(dtStr: string): { year: number; month: number; day: number; hour: number; minute: number } | null {
    if (!dtStr) return null;
    const match = dtStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    const [, dayStr, monthStr, yearStr, hourStr, minStr, ampm] = match;
    let hour = parseInt(hourStr, 10);
    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return { year: parseInt(yearStr), month: parseInt(monthStr), day: parseInt(dayStr), hour, minute: parseInt(minStr) };
  }
}
