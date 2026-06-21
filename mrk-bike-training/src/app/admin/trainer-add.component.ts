import { Component, inject, signal, OnInit } from '@angular/core';
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
import { CustomRangeDatetimeMultiselectComponent, DateTimeRange } from '../core/components/custom-range-datetime-multiselect/custom-range-datetime-multiselect.component';
import { BranchApi } from '../core/models/api.models';

@Component({
  selector: 'app-trainer-add',
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
    CustomRangeDatetimeMultiselectComponent,
    FormBgTemplateComponent
],
  template: `
    <app-form-bg-template>
      <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
        <h3 class="form-title">Add Trainer</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Full Name</mat-label>
          <input
            matInput
            name="name"
            placeholder="e.g. Alex Kumar"
            maxlength="255"
            required
            [(ngModel)]="trainerName"
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
            placeholder="e.g. trainer_alex"
            maxlength="255"
            required
            [(ngModel)]="username"
            #usernameCtrl="ngModel"
          />
          <mat-icon matSuffix>account_circle</mat-icon>
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

        <div class="field-row">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input
              matInput
              [matDatepicker]="startPicker"
              name="startDate"
              [(ngModel)]="startDate"
            />
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Monthly Salary (₹)</mat-label>
            <input
              matInput
              name="salary"
              type="number"
              min="0"
              placeholder="e.g. 25000"
              [(ngModel)]="salary"
            />
            <mat-icon matSuffix>currency_rupee</mat-icon>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Assigned Branch</mat-label>
          <mat-select
            name="branch"
            [(ngModel)]="branchId"
          >
            <mat-option value="">— None —</mat-option>
            @for (b of branches(); track b.id) {
              <mat-option [value]="b.id">{{ b.name }} ({{ b.id }})</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>store</mat-icon>
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
              >{{ day.label }}</mat-checkbox>
            }
          </div>
        </div>

        <!-- Preferred Time Ranges -->
        <app-custom-range-datetime-multiselect
          label="Preferred Time Ranges"
          placeholder="Click to add time range"
          [timeOnly]="true"
          (rangesChange)="onTimeRangesChange($event)"
        />

        <!-- Preferred Locations -->
        <mat-form-field appearance="outline">
          <mat-label>Preferred Locations</mat-label>
          <mat-select
            name="preferredLocations"
            [(ngModel)]="selectedLocations"
            multiple
          >
            @for (b of branches(); track b.id) {
              <mat-option [value]="b.id">{{ b.name }} ({{ b.id }})</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>location_on</mat-icon>
        </mat-form-field>

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Create Trainer' }}
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
      padding: 0.6rem 0.85rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
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

    /* Mat-select overrides */
    ::ng-deep .mat-mdc-select-value-text {
      color: #fff !important;
    }

    ::ng-deep .mat-mdc-select-arrow {
      color: rgba(255, 255, 255, 0.8) !important;
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

    .field-section {
      margin-bottom: 0.5rem;
    }

    .section-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: #fff;
      margin-bottom: 0.4rem;
    }

    .days-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
    }

    ::ng-deep .days-row .mat-mdc-checkbox .mdc-label {
      color: #fff !important;
    }

    ::ng-deep .days-row .mat-mdc-checkbox .mdc-checkbox__background {
      border-color: rgba(255, 255, 255, 0.7) !important;
    }
  `
})
export class TrainerAddComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  trainerName = '';
  username = '';
  password = '';
  startDate: Date | null = null;
  salary: number | null = null;
  branchId = '';
  timeRanges: DateTimeRange[] = [];
  selectedLocations: string[] = [];
  selectedDays: string[] = [];

  allDays = [
    { code: 'Mo', label: 'Monday' },
    { code: 'Tu', label: 'Tuesday' },
    { code: 'We', label: 'Wednesday' },
    { code: 'Th', label: 'Thursday' },
    { code: 'Fr', label: 'Friday' },
    { code: 'Sa', label: 'Saturday' },
    { code: 'Su', label: 'Sunday' }
  ];

  branches = signal<BranchApi[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.api.listBranches().subscribe({
      next: (branches) => this.branches.set(branches)
    });
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

  onTimeRangesChange(ranges: DateTimeRange[]) {
    this.timeRanges = ranges;
  }

  submit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Format time ranges as comma-separated "start-end" strings
    const preferredTime = this.timeRanges.length
      ? this.timeRanges.map(r => `${r.start}-${r.end}`).join(',')
      : null;

    this.api
      .createTrainer({
        username: this.username.trim(),
        password: this.password,
        name: this.trainerName.trim(),
        startDate: this.startDate ? this.formatDate(this.startDate) : null,
        salary: this.salary ?? null,
        defaultBranchId: this.branchId || null,
        preferredDays: this.selectedDays.length ? this.selectedDays.join(',') : null,
        preferredTime,
        preferredLocations: this.selectedLocations.length ? this.selectedLocations.join(',') : null
      })
      .subscribe({
        next: () => this.router.navigate(['/admin/trainers-view']),
        error: (e) => {
          this.error.set(e.error?.error ?? 'Failed to create trainer');
          this.loading.set(false);
        }
      });
  }

  cancel() {
    this.router.navigate(['/admin/trainers-view']);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
