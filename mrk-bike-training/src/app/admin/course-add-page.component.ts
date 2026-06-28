import { Component, inject, signal } from '@angular/core';
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
import { NgxMatTimepickerComponent, NgxMatTimepickerDirective } from 'ngx-mat-timepicker';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { CourseCategory } from '../core/models/api.models';
import { DAYS_OF_WEEK } from '../core/models/days.enum';

@Component({
  selector: 'app-course-add-page',
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
    NgxMatTimepickerComponent,
    NgxMatTimepickerDirective,
    FormBgTemplateComponent
  ],
  template: `
    <app-form-bg-template>
      <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
        <h3 class="form-title">Add Training</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Training Name</mat-label>
          <input
            matInput
            name="name"
            placeholder="e.g. Basic Motorcycle Training"
            maxlength="255"
            required
            [(ngModel)]="name"
            #nameCtrl="ngModel"
          />
          <mat-icon matSuffix>school</mat-icon>
          @if (nameCtrl.touched && nameCtrl.errors?.['required']) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select
            name="category"
            required
            [(ngModel)]="category"
            #catCtrl="ngModel"
          >
            <mat-option value="NORMAL">Normal</mat-option>
            <mat-option value="PREMIUM">Premium</mat-option>
            <mat-option value="TRIP">Trip</mat-option>
            <mat-option value="OTHER">Other</mat-option>
          </mat-select>
          <mat-icon matSuffix>category</mat-icon>
          @if (catCtrl.touched && catCtrl.errors?.['required']) {
            <mat-error>Category is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hours Per Day</mat-label>
          <input
            matInput
            name="hoursPerDay"
            type="number"
            min="1"
            max="12"
            placeholder="e.g. 2"
            required
            [(ngModel)]="hoursPerDay"
            #hpdCtrl="ngModel"
          />
          <mat-icon matSuffix>schedule</mat-icon>
          @if (hpdCtrl.touched && hpdCtrl.errors?.['required']) {
            <mat-error>Hours per day is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>No. of Training Days</mat-label>
          <input
            matInput
            name="totalDays"
            type="number"
            min="1"
            placeholder="e.g. 15"
            required
            [(ngModel)]="totalDays"
            (ngModelChange)="onTotalDaysChange($event)"
            #tdCtrl="ngModel"
          />
          <mat-icon matSuffix>date_range</mat-icon>
          @if (tdCtrl.touched && tdCtrl.errors?.['required']) {
            <mat-error>No. of Training Days is required</mat-error>
          }
        </mat-form-field>

        @if (category !== 'TRIP') {
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

          <mat-form-field appearance="outline">
            <mat-label>Buffer Days</mat-label>
            <input
              matInput
              name="bufferDays"
              type="number"
              min="0"
              placeholder="0"
              [(ngModel)]="bufferDays"
            />
            <mat-icon matSuffix>hourglass_empty</mat-icon>
            <mat-hint>Extra days allocated for missed sessions</mat-hint>
          </mat-form-field>
        }

        <!-- Date & Time Section -->
        <div class="datetime-section">
          <div class="section-label">Schedule</div>

          <div class="field-row">
            <mat-form-field appearance="outline">
              <mat-label>Start Date{{ category === 'TRIP' ? ' *' : '' }}</mat-label>
              <input
                matInput
                [matDatepicker]="startPicker"
                name="startDate"
                [(ngModel)]="startDateValue"
                [required]="category === 'TRIP'"
                #startDateCtrl="ngModel"
                placeholder="Choose a date"
              />
              <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
              @if (startDateCtrl.touched && startDateCtrl.errors?.['required']) {
                <mat-error>Start date is required for trips</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>End Date</mat-label>
              <input
                matInput
                [matDatepicker]="endPicker"
                name="endDate"
                [(ngModel)]="endDateValue"
                placeholder="Choose a date"
              />
              <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="field-row">
            <div>
              <mat-form-field appearance="outline" (click)="startTimePicker.open()">
                <mat-label>Start Time{{ category === 'TRIP' ? ' *' : '' }}</mat-label>
                <input
                  matInput
                  [ngxMatTimepicker]="startTimePicker"
                  [format]="12"
                  readonly
                  placeholder="Select start time"
                  name="startTime"
                  [(ngModel)]="startTime"
                  [required]="category === 'TRIP'"
                />
                <mat-icon matSuffix>access_time</mat-icon>
              </mat-form-field>
              <ngx-mat-timepicker #startTimePicker [format]="12" [enableKeyboardInput]="true" [editableHintTmpl]="startTimeLabel"></ngx-mat-timepicker>
              <ng-template #startTimeLabel>
                <div class="clock-dialog-title">Select Start Time</div>
              </ng-template>
            </div>

            <div>
              <mat-form-field appearance="outline" (click)="endTimePicker.open()">
                <mat-label>End Time</mat-label>
                <input
                  matInput
                  [ngxMatTimepicker]="endTimePicker"
                  [format]="12"
                  readonly
                  placeholder="Select end time"
                  name="endTime"
                  [(ngModel)]="endTime"
                />
                <mat-icon matSuffix>access_time</mat-icon>
              </mat-form-field>
              <ngx-mat-timepicker #endTimePicker [format]="12" [enableKeyboardInput]="true" [editableHintTmpl]="endTimeLabel"></ngx-mat-timepicker>
              <ng-template #endTimeLabel>
                <div class="clock-dialog-title">Select End Time</div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- Optional Template Image Upload -->
        <div class="upload-section">
          <div class="section-label">Template Image (optional)</div>
          <div class="upload-area" (click)="fileInput.click()">
            <input
              #fileInput
              type="file"
              accept="image/*"
              style="display: none"
              (change)="onFileSelected($event)"
            />
            @if (imagePreview()) {
              <img [src]="imagePreview()" alt="Template preview" class="upload-preview" />
              <button type="button" class="remove-btn" (click)="removeImage($event)">✕</button>
            } @else {
              <mat-icon>cloud_upload</mat-icon>
              <span>Click to upload template image</span>
            }
          </div>
          @if (selectedFile()) {
            <div class="file-name">📎 {{ selectedFile()!.name }}</div>
          }
        </div>

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Create Training' }}
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

    .datetime-section {
      margin-top: 0.5rem;
      padding: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
    }

    .section-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .upload-section {
      margin-top: 0.5rem;
    }

    .upload-area {
      border: 2px dashed rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      position: relative;
      min-height: 80px;
      justify-content: center;
    }

    .upload-area:hover {
      border-color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }

    .upload-area mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .upload-area span {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .upload-preview {
      max-width: 200px;
      max-height: 150px;
      object-fit: contain;
      border-radius: 6px;
    }

    .remove-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(255, 0, 0, 0.7);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 0.8rem;
      line-height: 1;
    }

    .file-name {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 0.3rem;
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

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-hint {
      color: rgba(255, 255, 255, 0.7);
    }

    ::ng-deep .mat-datepicker-toggle .mat-mdc-icon-button {
      color: rgba(255, 255, 255, 0.8) !important;
    }

    ::ng-deep .mat-mdc-select-value {
      color: #fff !important;
    }

    ::ng-deep .mat-mdc-select-arrow {
      color: rgba(255, 255, 255, 0.8) !important;
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
export class CourseAddPageComponent {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  name = '';
  category: CourseCategory = 'NORMAL';
  hoursPerDay: number | null = null;
  totalDays: number | null = null;
  selectedDays: string[] = [];
  bufferDays = 0;
  startDateValue: Date | null = null;
  startTime = '';
  endDateValue: Date | null = null;
  endTime = '';

  allDays = DAYS_OF_WEEK;

  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

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

  onTotalDaysChange(value: number | null) {
    if (value != null && value >= 0) {
      this.bufferDays = value;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  removeImage(event: Event) {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.imagePreview.set(null);
  }

  private formatDate(date: Date | null): string | undefined {
    if (!date) return undefined;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private generateId(): string {
    const prefix = this.category.substring(0, 4).toUpperCase();
    const namePart = this.name.trim().replace(/\s+/g, '_').substring(0, 20).toUpperCase();
    const ts = Date.now().toString(36).toUpperCase();
    return `${prefix}_${namePart}_${ts}`;
  }

  submit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    if (this.category === 'TRIP') {
      if (!this.startDateValue || !this.startTime) {
        this.error.set('Start date and time are required for Trip trainings.');
        return;
      }
    }

    this.loading.set(true);
    this.error.set(null);

    this.api
      .createCourse(
        {
          id: this.generateId(),
          name: this.name.trim(),
          category: this.category,
          hoursPerDay: this.hoursPerDay!,
          totalDays: this.totalDays!,
          preferredDaysOfWeek: this.category !== 'TRIP' && this.selectedDays.length ? this.selectedDays.join(',') : undefined,
          bufferDays: this.category !== 'TRIP' ? (this.bufferDays || undefined) : undefined,
          startDate: this.formatDate(this.startDateValue),
          startTime: this.startTime || undefined,
          endDate: this.formatDate(this.endDateValue),
          endTime: this.endTime || undefined
        },
        this.selectedFile() || undefined
      )
      .subscribe({
        next: () => this.router.navigate(['/admin/courses-view']),
        error: (e) => {
          this.error.set(e.error?.error ?? 'Failed to create training');
          this.loading.set(false);
        }
      });
  }

  cancel() {
    this.router.navigate(['/admin/courses-view']);
  }
}
