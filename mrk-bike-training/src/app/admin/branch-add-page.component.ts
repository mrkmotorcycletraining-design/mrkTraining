import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { CustomRangeDatetimeMultiselectComponent, DateTimeRange } from '../core/components/custom-range-datetime-multiselect/custom-range-datetime-multiselect.component';
import { DAYS_OF_WEEK } from '../core/models/days.enum';

@Component({
  selector: 'app-branch-add-page',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    CustomRangeDatetimeMultiselectComponent,
    FormBgTemplateComponent
  ],
  template: `
    <app-form-bg-template>
      <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
        <h3 class="form-title">Add Branch</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Branch ID</mat-label>
          <input
            matInput
            name="branchId"
            placeholder="Pin Code"
            maxlength="6"
            required
            [(ngModel)]="branchId"
            #idCtrl="ngModel"
          />
          <mat-icon matSuffix>tag</mat-icon>
          @if (idCtrl.touched && idCtrl.errors?.['required']) {
            <mat-error>Branch ID is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Branch Name</mat-label>
          <input
            matInput
            name="branchName"
            placeholder="e.g. MRK Bangalore Central"
            maxlength="255"
            required
            [(ngModel)]="branchName"
            #nameCtrl="ngModel"
          />
          <mat-icon matSuffix>business</mat-icon>
          @if (nameCtrl.touched && nameCtrl.errors?.['required']) {
            <mat-error>Branch Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Address</mat-label>
          <textarea
            matInput
            name="branchAddress"
            placeholder="Full address"
            rows="3"
            maxlength="500"
            required
            [(ngModel)]="branchAddress"
            #addrCtrl="ngModel"
          ></textarea>
          <mat-icon matSuffix>location_on</mat-icon>
          @if (addrCtrl.touched && addrCtrl.errors?.['required']) {
            <mat-error>Address is required</mat-error>
          }
        </mat-form-field>

        <!-- Operating Days -->
        <div class="field-section">
          <label class="section-label">Operating Days</label>
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

        <!-- Operating Time Ranges -->
        <app-custom-range-datetime-multiselect
          label="Operating Time Ranges"
          placeholder="Click to add time range"
          [timeOnly]="true"
          (rangesChange)="onTimeRangesChange($event)"
        />

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Create Branch' }}
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
    ::ng-deep .mat-mdc-form-field .mat-mdc-input-element,
    ::ng-deep .mat-mdc-form-field textarea.mat-mdc-input-element {
      color: #fff !important;
    }

    ::ng-deep .mat-mdc-form-field input::placeholder,
    ::ng-deep .mat-mdc-form-field textarea::placeholder {
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
export class BranchAddPageComponent {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  branchId = '';
  branchName = '';
  branchAddress = '';
  selectedDays: string[] = [];
  timeRanges: DateTimeRange[] = [];

  allDays = DAYS_OF_WEEK;

  loading = signal(false);
  error = signal<string | null>(null);

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

    const operatingDays = this.selectedDays.length ? this.selectedDays.join(',') : undefined;
    const operatingTime = this.timeRanges.length
      ? this.timeRanges.map(r => `${r.start}-${r.end}`).join(',')
      : undefined;

    this.api
      .createBranch({
        id: this.branchId.trim(),
        name: this.branchName.trim(),
        locationAddress: this.branchAddress.trim(),
        operatingDays,
        operatingTime
      })
      .subscribe({
        next: () => this.router.navigate(['/admin/branches-view']),
        error: (e) => {
          this.error.set(e.error?.error ?? 'Failed to create branch');
          this.loading.set(false);
        }
      });
  }

  cancel() {
    this.router.navigate(['/admin/branches-view']);
  }
}
