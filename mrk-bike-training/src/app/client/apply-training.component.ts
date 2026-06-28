import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { TimeRangePickerComponent } from '../core/components/time-range-picker/time-range-picker.component';
import { CourseDetailDialogComponent } from './course-detail-dialog.component';
import { BranchApi, CourseApi } from '../core/models/api.models';
import { DAYS_OF_WEEK } from '../core/models/days.enum';

@Component({
  selector: 'app-apply-training',
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
    MatDialogModule,
    FormBgTemplateComponent,
    TimeRangePickerComponent,
  ],
  template: `
    <!-- Step 1: Course Carousel -->
    @if (!selectedCourse()) {
      <div class="carousel-page">
        <div class="hero-section">
          <h2 class="page-title">Choose a Training</h2>
          <p class="page-subtitle">Select a course to get started</p>
        </div>

        @if (!profileActive() || allowedTrainings() < 1) {
          <div class="alert-banner">
            <mat-icon>block</mat-icon>
            <span>Your profile is {{ profileActive() ? 'ACTIVE' : 'INACTIVE' }} with {{ allowedTrainings() }} allowed slots.
            You must be ACTIVE with at least 1 slot to apply.</span>
          </div>
        }

        <div class="carousel-container">
          <button class="nav-arrow" (click)="scrollLeft()" aria-label="Scroll left">
            <mat-icon>chevron_left</mat-icon>
          </button>

          <div class="carousel-track" #carouselTrack>
            @for (course of courses(); track course.id; let i = $index) {
              <div class="course-card" (click)="openCourseDialog(course)">
                <!-- Glassmorphic card content -->
                <div class="card-inner">
                  <!-- Category badge -->
                  @if (course.category) {
                    <span class="card-badge">{{ course.category }}</span>
                  }

                  <!-- Course name -->
                  <h3 class="card-title">{{ course.name ?? 'Course' }}</h3>

                  <!-- Course info pills -->
                  <div class="card-info">
                    @if (course.totalDays) {
                      <div class="info-pill">
                        <mat-icon>event</mat-icon>
                        <span>{{ course.totalDays }} Days</span>
                      </div>
                    }
                    @if (course.hoursPerDay) {
                      <div class="info-pill">
                        <mat-icon>schedule</mat-icon>
                        <span>{{ course.hoursPerDay }} Hrs/Day</span>
                      </div>
                    }
                  </div>

                  <!-- Template Image -->
                  <div class="card-image-wrapper">
                    @if (course.templateImage) {
                      <img [src]="'data:image/png;base64,' + course.templateImage" [alt]="course.name ?? 'Course'" />
                    } @else {
                      <div class="placeholder-img">
                        <mat-icon>two_wheeler</mat-icon>
                      </div>
                    }
                  </div>

                  <!-- CTA -->
                  <button class="card-cta" type="button">
                    <span>Get Started</span>
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>

          <button class="nav-arrow" (click)="scrollRight()" aria-label="Scroll right">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    }

    <!-- Step 2: Enrollment Form (after course selected) -->
    @if (selectedCourse(); as course) {
      <app-form-bg-template>
        <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
          <div class="form-header">
            <h3 class="form-title">Apply for: {{ course.name }}</h3>
            <button mat-icon-button type="button" class="back-btn" (click)="clearCourse()" aria-label="Back to courses">
              <mat-icon>arrow_back</mat-icon>
            </button>
          </div>

          @if (error()) {
            <div class="alert alert-error">⚠️ {{ error() }}</div>
          }

          <!-- Branch Selection -->
          <mat-form-field appearance="outline">
            <mat-label>Branch</mat-label>
            <mat-select name="branchId" [(ngModel)]="branchId" required #branchCtrl="ngModel">
              @for (b of branches(); track b.id) {
                <mat-option [value]="b.id">{{ b.name }} ({{ b.id }})</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>store</mat-icon>
            @if (branchCtrl.touched && branchCtrl.errors?.['required']) {
              <mat-error>Branch is required</mat-error>
            }
          </mat-form-field>

          <!-- Asset Type -->
          <mat-form-field appearance="outline">
            <mat-label>Asset Type</mat-label>
            <mat-select name="assetType" [(ngModel)]="assetType" required #assetTypeCtrl="ngModel">
              <mat-option value="GEARED">Geared Motorcycle</mat-option>
              <mat-option value="NON_GEARED">Non-Geared (Scooter/Activa)</mat-option>
              <mat-option value="CRUISER">Cruiser</mat-option>
            </mat-select>
            <mat-icon matSuffix>two_wheeler</mat-icon>
            @if (assetTypeCtrl.touched && assetTypeCtrl.errors?.['required']) {
              <mat-error>Asset type is required</mat-error>
            }
          </mat-form-field>

          <!-- Start Date (Monday) -->
          <mat-form-field appearance="outline">
            <mat-label>Start Date (must be Monday)</mat-label>
            <input matInput [matDatepicker]="startPicker" [min]="today" name="startDate" [(ngModel)]="startDate" (dateChange)="onStartDateChange()" required />
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          @if (mondayError()) {
            <div class="warning-msg">⚠️ {{ mondayError() }}</div>
          }

          <!-- Hours Per Day -->
          <mat-form-field appearance="outline">
            <mat-label>Hours Per Day</mat-label>
            <input matInput type="number" name="hoursPerDay" [(ngModel)]="hoursPerDay" required min="1" max="8" #hoursCtrl="ngModel" />
            <mat-icon matSuffix>schedule</mat-icon>
            @if (hoursCtrl.touched && hoursCtrl.errors?.['required']) {
              <mat-error>Hours per day is required</mat-error>
            }
          </mat-form-field>

          <!-- Preferred Time Range -->
          <app-time-range-picker
            #timeRangePicker
            label="Preferred Time (Start - End)"
            placeholder="Click to select preferred time"
            fromLabel="Select Start Time"
            toLabel="Select End Time"
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
          @if (timeError()) {
            <div class="alert alert-error">❌ {{ timeError() }}</div>
          }

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

          <!-- Own Vehicle (for PREMIUM courses) -->
          @if (course.category === 'PREMIUM') {
            <div class="field-section">
              <mat-checkbox [(ngModel)]="ownVehicle" name="ownVehicle" color="primary">
                Train on my own vehicle
              </mat-checkbox>
            </div>

            @if (ownVehicle) {
              <mat-form-field appearance="outline">
                <mat-label>Vehicle Number</mat-label>
                <input matInput name="vehicleNumber" [(ngModel)]="vehicleNumber" required />
                <mat-icon matSuffix>directions_car</mat-icon>
              </mat-form-field>

              <div class="field-section">
                <div class="days-row">
                  <mat-checkbox [(ngModel)]="rcAvailable" name="rcAvailable" color="primary">RC Available</mat-checkbox>
                  <mat-checkbox [(ngModel)]="insuranceAvailable" name="insuranceAvailable" color="primary">Insurance Available</mat-checkbox>
                  <mat-checkbox [(ngModel)]="pucAvailable" name="pucAvailable" color="primary">PUC Available</mat-checkbox>
                </div>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Vehicle Issues (if any)</mat-label>
                <textarea matInput name="vehicleIssues" [(ngModel)]="vehicleIssues" rows="3"></textarea>
                <mat-icon matSuffix>build</mat-icon>
              </mat-form-field>
            }
          }

          <!-- Total Amount Paid -->
          <mat-form-field appearance="outline">
            <mat-label>Total Amount Paid</mat-label>
            <input matInput type="number" name="totalAmountPaid" [(ngModel)]="totalAmountPaid" min="0" />
            <mat-icon matSuffix>currency_rupee</mat-icon>
          </mat-form-field>

          <div class="form-actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="loading() || !profileActive() || allowedTrainings() < 1">
              {{ loading() ? 'Submitting…' : 'Apply for Training' }}
            </button>
            <button mat-stroked-button type="button" (click)="clearCourse()">Back</button>
          </div>
        </form>
      </app-form-bg-template>
    }
  `,
  styles: `
    :host { display: block; }

    /* ─── Carousel Page ─── */
    .carousel-page {
      min-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 16px;
      padding: 2.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hero-section {
      text-align: center;
      margin-bottom: 2rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: #1565c0;
      margin: 0 0 0.5rem;
      letter-spacing: -0.5px;
    }
    .page-subtitle {
      font-size: 1rem;
      color: #666;
      margin: 0;
    }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      max-width: 600px;
      margin-bottom: 2rem;
      padding: 0.85rem 1.25rem;
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ef9a9a;
      border-radius: 12px;
      font-size: 0.9rem;
    }
    .alert-banner mat-icon {
      color: #c62828;
      flex-shrink: 0;
    }

    /* ─── Carousel ─── */
    .carousel-container {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      max-width: 1100px;
    }

    .nav-arrow {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2px solid #1565c0;
      background: rgba(21, 101, 192, 0.08);
      color: #1565c0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s ease;
    }
    .nav-arrow:hover {
      background: #1565c0;
      color: #fff;
      transform: scale(1.1);
    }

    .carousel-track {
      display: flex;
      gap: 1.5rem;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: 2rem 1rem;
      scrollbar-width: none;
      flex: 1;
      justify-content: center;
    }
    .carousel-track::-webkit-scrollbar {
      display: none;
    }

    /* ─── Course Card (Blue Glassmorphic) ─── */
    .course-card {
      flex-shrink: 0;
      width: 300px;
      border-radius: 20px;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .course-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 60px rgba(21, 101, 192, 0.25);
    }

    .card-inner {
      height: 100%;
      padding: 1.5rem;
      border-radius: 20px;
      background: linear-gradient(145deg, rgba(21, 101, 192, 0.9) 0%, rgba(13, 71, 161, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(21, 101, 192, 0.2);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .card-badge {
      align-self: flex-start;
      padding: 0.3rem 0.75rem;
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .card-title {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
      color: #fff;
      line-height: 1.3;
    }

    .card-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .info-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.85rem;
    }
    .info-pill mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(255, 255, 255, 0.7);
    }

    .card-image-wrapper {
      width: 100%;
      height: 140px;
      border-radius: 12px;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.15);
      margin-top: 0.25rem;
    }
    .card-image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
    }
    .placeholder-img {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.08);
    }
    .placeholder-img mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: rgba(255,255,255,0.3);
    }

    .card-cta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.7rem 1rem;
      border: none;
      border-radius: 12px;
      background: #fff;
      color: #1565c0;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: auto;
    }
    .card-cta:hover {
      background: #e3f2fd;
      box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2);
    }
    .card-cta mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ─── Form Section ─── */
    form { display: flex; flex-direction: column; gap: 0.5rem; color: #fff; }
    .form-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .form-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #fff; flex: 1; }
    .back-btn { color: #fff; }
    .alert { margin-bottom: 0.25rem; }
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

    /* ─── Responsive ─── */
    @media (max-width: 600px) {
      .carousel-page {
        padding: 1.5rem 1rem;
        border-radius: 0;
      }
      .page-title {
        font-size: 1.5rem;
      }
      .course-card {
        width: 260px;
      }
      .card-image-wrapper {
        height: 110px;
      }
      .nav-arrow {
        width: 36px;
        height: 36px;
      }
      .carousel-container {
        gap: 0.5rem;
      }
      .carousel-track {
        justify-content: flex-start;
      }
    }

    @media (min-width: 900px) {
      .course-card {
        width: 320px;
      }
      .card-image-wrapper {
        height: 160px;
      }
      .page-title {
        font-size: 2.2rem;
      }
    }
  `
})
export class ApplyTrainingComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  courses = signal<CourseApi[]>([]);
  branches = signal<BranchApi[]>([]);
  selectedCourse = signal<CourseApi | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  mondayError = signal<string | null>(null);
  timeError = signal<string | null>(null);

  // Client profile checks
  allowedTrainings = signal<number>(1);
  profileActive = signal<boolean>(true);

  courseId = '';
  branchId = '';
  assetType = 'GEARED';
  startDate: Date | null = null;
  hoursPerDay = 2;
  timeRange = '';
  totalAmountPaid = 0;
  today = new Date();
  selectedDays: string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
  allDays = DAYS_OF_WEEK;

  // Own vehicle fields (PREMIUM)
  ownVehicle = false;
  vehicleNumber = '';
  rcAvailable = false;
  insuranceAvailable = false;
  pucAvailable = false;
  vehicleIssues = '';

  @ViewChild('timeRangePicker') timeRangePicker!: TimeRangePickerComponent;
  @ViewChild('carouselTrack') carouselTrack!: any;

  ngOnInit() {
    this.api.listCourses('ACTIVE').subscribe(c => this.courses.set(c));
    this.api.listBranches().subscribe(b => this.branches.set(b));
    this.api.getClientMe().subscribe({
      next: (profile: any) => {
        this.allowedTrainings.set(profile.allowedNumOfTrainings ?? 1);
        this.profileActive.set(profile.active !== false);
      },
      error: () => {
        this.allowedTrainings.set(1);
        this.profileActive.set(true);
      }
    });
  }

  // ─── Carousel ───

  openCourseDialog(course: CourseApi): void {
    const ref = this.dialog.open(CourseDetailDialogComponent, {
      data: { course },
      width: '90vw',
      maxWidth: '480px',
      maxHeight: '90vh',
      panelClass: 'course-detail-dialog',
      autoFocus: false,
    });

    ref.afterClosed().subscribe((selected: CourseApi | null) => {
      if (selected) {
        this.selectCourse(selected);
      }
    });
  }

  scrollLeft(): void {
    const el = this.getCarouselEl();
    if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
  }

  scrollRight(): void {
    const el = this.getCarouselEl();
    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
  }

  private getCarouselEl(): HTMLElement | null {
    return document.querySelector('.carousel-track');
  }

  // ─── Course Selection ───

  selectCourse(course: CourseApi): void {
    this.selectedCourse.set(course);
    this.courseId = course.id;
    if (course.hoursPerDay) this.hoursPerDay = course.hoursPerDay;
  }

  clearCourse(): void {
    this.selectedCourse.set(null);
    this.courseId = '';
    this.error.set(null);
  }

  // ─── Form Logic ───

  onStartDateChange(): void {
    if (!this.startDate) return;
    const day = this.startDate.getDay();
    if (day !== 1) {
      this.mondayError.set('Start date must be a Monday.');
    } else {
      this.mondayError.set(null);
    }
  }

  onTimeRangeSelected(range: string) {
    this.timeRange = range;
    this.timeError.set(null);
  }

  onTimeValidationError(msg: string) {
    this.timeError.set(msg);
  }

  clearTimeRange() {
    this.timeRange = '';
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
    if (form.invalid || !this.courseId || !this.startDate) {
      form.form.markAllAsTouched();
      if (!this.startDate) this.error.set('Please select a start date');
      return;
    }

    if (this.mondayError()) {
      this.error.set('Start date must be a Monday');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const body: any = {
      courseId: this.courseId,
      branchId: this.branchId,
      assetType: this.assetType,
      startDate: this.formatDate(this.startDate),
      preferredDays: this.selectedDays,
      hoursPerDay: this.hoursPerDay,
      totalAmountPaid: this.totalAmountPaid,
      ownVehicle: this.ownVehicle,
      vehicleNumber: this.ownVehicle ? this.vehicleNumber : null,
      rcAvailable: this.ownVehicle ? this.rcAvailable : null,
      insuranceAvailable: this.ownVehicle ? this.insuranceAvailable : null,
      pucAvailable: this.ownVehicle ? this.pucAvailable : null,
      vehicleIssues: this.ownVehicle ? this.vehicleIssues : null
    };

    this.api.submitEnrollment(body).subscribe({
      next: () => this.router.navigate(['/client/trainings']),
      error: (e) => {
        this.error.set(e.error?.error ?? 'Enrollment failed');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/client/trainings']);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
