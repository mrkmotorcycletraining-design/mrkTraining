import { Component, inject, signal, OnInit, ViewChild, computed } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { TimeRangePickerComponent } from '../core/components/time-range-picker/time-range-picker.component';
import { BranchApi, TrainerApi } from '../core/models/api.models';
import { DAYS_OF_WEEK } from '../core/models/days.enum';

@Component({
  selector: 'app-trainer-schedule-add',
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
    MatCheckboxModule,
    FormBgTemplateComponent,
    TimeRangePickerComponent,
  ],
  template: `
    <app-form-bg-template>
      <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
        <h3 class="form-title">Add Trainer Schedule</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }

        <!-- Trainer Selection -->
        <mat-form-field appearance="outline">
          <mat-label>Trainer</mat-label>
          <mat-select name="trainerId" [(ngModel)]="trainerId" (ngModelChange)="onTrainerChange()" required #trainerCtrl="ngModel">
            @for (t of trainers(); track t.id) {
              <mat-option [value]="t.id">{{ t.name }} ({{ t.username }})</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>person</mat-icon>
          @if (trainerCtrl.touched && trainerCtrl.errors?.['required']) {
            <mat-error>Trainer is required</mat-error>
          }
        </mat-form-field>

        <!-- Branch Selection -->
        <mat-form-field appearance="outline">
          <mat-label>Branch</mat-label>
          <mat-select name="branchId" [(ngModel)]="branchId" (ngModelChange)="checkBranchWarning()" required #branchCtrl="ngModel">
            @for (b of branches(); track b.id) {
              <mat-option [value]="b.id">{{ b.name }} ({{ b.id }})</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>store</mat-icon>
          @if (branchCtrl.touched && branchCtrl.errors?.['required']) {
            <mat-error>Branch is required</mat-error>
          }
        </mat-form-field>
        @if (branchWarning()) {
          <div class="warning-msg">⚠️ {{ branchWarning() }}</div>
        }

        <!-- Max Trainings Per Slot -->
        <mat-form-field appearance="outline">
          <mat-label>Max Trainings Per Slot</mat-label>
          <input matInput type="number" name="numberOfTrainingCanTake" [(ngModel)]="numberOfTrainingCanTake" required min="1" #maxTrainingsCtrl="ngModel" />
          <mat-icon matSuffix>fitness_center</mat-icon>
          @if (maxTrainingsCtrl.touched && maxTrainingsCtrl.errors?.['required']) {
            <mat-error>Max trainings is required</mat-error>
          }
        </mat-form-field>

        <!-- Time Range (Start - End) -->
        <app-time-range-picker
          #timeRangePicker
          label="Slot Time (Start - End)"
          placeholder="Click to select time range"
          fromLabel="Select Slot Start Time"
          toLabel="Select Slot End Time"
          [toTimeRequired]="true"
          (rangeSelected)="onTimeRangeSelected($event)"
          (validationError)="onTimeValidationError($event)"
        />
        @if (timeRange) {
          <div class="selected-time-display">
            <span>Selected: {{ timeRange }}</span>
            <mat-icon class="clear-time" (click)="clearTimeRange()">close</mat-icon>
          </div>
        }
        @if (timeWarning()) {
          <div class="warning-msg">⚠️ {{ timeWarning() }}</div>
        }
        @if (timeError()) {
          <div class="alert alert-error">❌ {{ timeError() }}</div>
        }

        <!-- Effective From -->
        <mat-form-field appearance="outline">
          <mat-label>Effective From</mat-label>
          <input matInput [matDatepicker]="fromPicker" [min]="today" name="effectiveFrom" [(ngModel)]="effectiveFrom" required />
          <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
          <mat-datepicker #fromPicker></mat-datepicker>
        </mat-form-field>

        <!-- Effective To (optional) -->
        <mat-form-field appearance="outline">
          <mat-label>Effective To (Optional)</mat-label>
          <input matInput [matDatepicker]="toPicker" [min]="effectiveFrom || today" name="effectiveTo" [(ngModel)]="effectiveTo" />
          <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
          <mat-datepicker #toPicker></mat-datepicker>
        </mat-form-field>

        <!-- Preferred Days -->
        <div class="field-section">
          <label class="section-label">Preferred Days</label>
          <div class="days-row">
            @for (day of allDays; track day.code) {
              <mat-checkbox
                [checked]="isDaySelected(day.code)"
                (change)="toggleDay(day.code, $event.checked)"
                color="primary"
              >{{ day.fullName }}</mat-checkbox>
            }
          </div>
        </div>

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Add Schedule' }}
          </button>
          <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </app-form-bg-template>
  `,
  styles: `
    :host { display: block; padding: 1.5rem; }
    form { display: flex; flex-direction: column; gap: 0.5rem; color: #fff; }
    .form-title { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; color: #fff; }
    .alert-error {
      padding: 0.6rem 0.85rem; border-radius: 6px; font-size: 0.85rem; font-weight: 500;
      background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.4);
    }
    .warning-msg {
      padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 500;
      background: rgba(255, 193, 7, 0.2); color: #fff; border: 1px solid rgba(255, 193, 7, 0.6);
      margin-top: -0.25rem;
    }
    .form-actions { display: flex; gap: 0.75rem; margin-top: 0.75rem; }
    .field-section { margin-bottom: 0.5rem; }
    .section-label { display: block; font-size: 0.85rem; font-weight: 500; color: #fff; margin-bottom: 0.4rem; }
    .days-row { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; }
    ::ng-deep .days-row .mat-mdc-checkbox .mdc-label { color: #fff !important; }
    ::ng-deep .days-row .mat-mdc-checkbox .mdc-checkbox__background { border-color: rgba(255,255,255,0.7) !important; }
    .selected-time-display {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.75rem; border: 1px solid rgba(255,255,255,0.5);
      border-radius: 16px; color: #fff; font-size: 0.85rem; width: fit-content;
    }
    .clear-time { font-size: 16px; width: 16px; height: 16px; cursor: pointer; opacity: 0.8; }
    .clear-time:hover { opacity: 1; }

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
    ::ng-deep .mat-mdc-form-field .mdc-floating-label,
    ::ng-deep .mat-mdc-form-field .mat-mdc-floating-label,
    ::ng-deep .mat-mdc-form-field label { color: #fff !important; }
    ::ng-deep .mat-mdc-form-field input.mat-mdc-input-element { color: #fff !important; }
    ::ng-deep .mat-mdc-form-field input::placeholder { color: rgba(255,255,255,0.5) !important; }
    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-icon-suffix { color: rgba(255,255,255,0.8); }
    ::ng-deep .mat-mdc-select-value-text { color: #fff !important; }
    ::ng-deep .mat-mdc-select-arrow { color: rgba(255,255,255,0.8) !important; }
    ::ng-deep .mat-mdc-outlined-button:not(:disabled) {
      --mdc-outlined-button-outline-color: #fff;
      --mdc-outlined-button-label-text-color: #fff;
    }
    ::ng-deep .mat-datepicker-toggle .mat-mdc-icon-button { color: rgba(255,255,255,0.8) !important; }
  `
})
export class TrainerScheduleAddComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  trainers = signal<TrainerApi[]>([]);
  branches = signal<BranchApi[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Warnings when selections don't match trainer preferences
  branchWarning = signal<string | null>(null);
  timeWarning = signal<string | null>(null);
  timeError = signal<string | null>(null);

  trainerId: number | null = null;
  branchId = '';
  numberOfTrainingCanTake: number = 1;
  timeRange = '';
  effectiveFrom: Date | null = null;
  effectiveTo: Date | null = null;
  today = new Date();
  selectedDays: string[] = [];
  allDays = DAYS_OF_WEEK;

  @ViewChild('timeRangePicker') timeRangePicker!: TimeRangePickerComponent;

  /** The currently selected trainer object */
  private get selectedTrainer(): TrainerApi | null {
    if (!this.trainerId) return null;
    return this.trainers().find(t => t.id === this.trainerId) || null;
  }

  ngOnInit() {
    this.api.listTrainers().subscribe(t => this.trainers.set(t));
    this.api.listBranches().subscribe(b => this.branches.set(b));
  }

  onTrainerChange(): void {
    // Re-check all warnings when trainer changes
    this.checkBranchWarning();
    this.checkTimeWarning();
  }

  checkBranchWarning(): void {
    const trainer = this.selectedTrainer;
    if (!trainer || !this.branchId) {
      this.branchWarning.set(null);
      return;
    }
    const preferred = trainer.preferredLocations;
    if (!preferred) {
      this.branchWarning.set(null);
      return;
    }
    const preferredList = preferred.split(',').map(s => s.trim());
    if (!preferredList.includes(this.branchId)) {
      this.branchWarning.set(`This branch is not in the trainer's preferred locations (${preferred})`);
    } else {
      this.branchWarning.set(null);
    }
  }

  onTimeRangeSelected(range: string) {
    this.timeRange = range;
    this.timeError.set(null);
    this.checkTimeWarning();
  }

  onTimeValidationError(msg: string) {
    this.timeError.set(msg);
  }

  checkTimeWarning(): void {
    const trainer = this.selectedTrainer;
    if (!trainer || !this.timeRange) {
      this.timeWarning.set(null);
      return;
    }
    const preferred = trainer.preferredTime;
    if (!preferred) {
      this.timeWarning.set(null);
      return;
    }
    // Simple check: show warning that the selected time may be outside preferred ranges
    this.timeWarning.set(`Trainer's preferred time is: ${preferred}. Please verify the selected slot falls within.`);
  }

  clearTimeRange() {
    this.timeRange = '';
    this.timeWarning.set(null);
    this.timeError.set(null);
  }

  isDaySelected(code: string): boolean {
    return this.selectedDays.includes(code);
  }

  toggleDay(code: string, checked: boolean) {
    if (checked) {
      this.selectedDays = [...this.selectedDays, code];
    } else {
      this.selectedDays = this.selectedDays.filter(d => d !== code);
    }
  }

  submit(form: NgForm) {
    if (form.invalid || !this.trainerId || !this.timeRange) {
      form.form.markAllAsTouched();
      if (!this.timeRange) this.error.set('Please select a time range');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Parse time range "HH:MM AM/PM-HH:MM AM/PM"
    const timeParts = this.timeRange.match(/^(.+\s(?:AM|PM))-(.+\s(?:AM|PM))$/i);
    if (!timeParts) {
      this.error.set('Invalid time range format');
      this.loading.set(false);
      return;
    }

    const body = {
      trainerId: this.trainerId,
      branchId: this.branchId,
      numberOfTrainingCanTake: this.numberOfTrainingCanTake,
      slotStartTime: this.to24Hour(timeParts[1].trim()),
      slotEndTime: this.to24Hour(timeParts[2].trim()),
      effectiveFrom: this.formatDate(this.effectiveFrom!),
      effectiveTo: this.effectiveTo ? this.formatDate(this.effectiveTo) : null,
      preferredDays: this.selectedDays.length ? this.selectedDays.join(',') : null
    };

    this.api.addTrainerAvailability(body).subscribe({
      next: () => this.router.navigate(['/admin/trainer-schedule-view']),
      error: (e) => {
        this.error.set(e.error?.error ?? 'Failed to add schedule');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/trainer-schedule-view']);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Convert "HH:MM AM/PM" to "HH:MM" (24-hour format for backend LocalTime) */
  private to24Hour(time12: string): string {
    const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return time12;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
}
