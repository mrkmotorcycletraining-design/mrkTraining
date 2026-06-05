import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TrainingApiService } from '../core/services/training-api.service';
import { SessionService } from '../auth/session.service';
import { CourseApi, TimeIntervalApi } from '../core/models/api.models';
import { CalendarComponent } from '../calendar/calendar';
import { slotsToEvents } from '../core/utils/calendar-mapper';

const DAY_OPTS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

@Component({
  selector: 'app-enrollment-stepper',
  standalone: true,
  imports: [FormsModule, DatePipe, CalendarComponent],
  template: `
    <h2>Apply for Training</h2>
    
    @if (!profileActive() || allowedTrainings() < 1) {
      <div class="alert alert-error" style="margin-bottom: 1.5rem; border: 1.5px solid #d32f2f; background: #ffebee; color: #c62828; padding: 1rem; border-radius: 8px;">
        🚫 <strong>Enrollment Restricted:</strong> Your profile status is <strong>{{ profileActive() ? 'ACTIVE' : 'INACTIVE' }}</strong> and you have <strong>{{ allowedTrainings() }}</strong> allowed training slots.
        You must be ACTIVE and have at least 1 allowance slot to apply for new training. Please contact Rohan Matre to resolve this.
      </div>
    }

    <p class="steps">Step {{ step() }} of 5</p>

    @if (step() === 1) {
      <div class="tiles">
        @for (c of courses(); track c.id) {
          <button type="button" class="tile" (click)="selectCourse(c)" [disabled]="!profileActive() || allowedTrainings() < 1">
            @if (c.imageUrl) { <img [src]="c.imageUrl" alt="" /> }
            <span>{{ c.name }}</span>
            <small>{{ c.category }}</small>
          </button>
        }
      </div>
    }

    @if (step() === 2 && selectedCourse(); as course) {
      @if (course.category === 'TRIP') {
        <label>Trip <select [(ngModel)]="courseId" name="trip">
          @for (t of tripCourses(); track t.id) {
            <option [value]="t.id">{{ t.name }}</option>
          }
        </select></label>
      } @else {
        <label>Asset type <input [(ngModel)]="assetType" name="atype" /></label>
        <label>Branch
          <select [(ngModel)]="branchId" name="branch">
            <option value="">Select branch</option>
            @for (b of branches(); track b.id) {
              <option [value]="b.id">{{ b.name }}</option>
            }
          </select>
        </label>
        @if (course.category === 'PREMIUM') {
          <label><input type="checkbox" [(ngModel)]="ownVehicle" name="own" /> Train on own vehicle</label>
          @if (ownVehicle) {
            <label>Vehicle number <input [(ngModel)]="vehicleNumber" /></label>
            <label><input type="checkbox" [(ngModel)]="rcAvailable" name="rc" /> Registration Certificate (RC) available</label>
            <label><input type="checkbox" [(ngModel)]="insuranceAvailable" name="ins" /> Insurance available</label>
            <label><input type="checkbox" [(ngModel)]="pucAvailable" name="puc" /> PUC available</label>
            <label>Issues note <textarea [(ngModel)]="vehicleIssues"></textarea></label>
          }
        }
      }
      <button type="button" (click)="step.set(3)">Next</button>
    }

    @if (step() === 3) {
      <p class="note">Training must start on a Monday.</p>
      <label>Start date (Monday)
        <input type="date" [(ngModel)]="startDate" name="start" (change)="onStartDateChange()" />
      </label>
      @if (mondayError()) { <p class="err">{{ mondayError() }}</p> }
      <fieldset>
        <legend>Preferred days</legend>
        @for (d of dayOpts; track d) {
          <label><input type="checkbox" [checked]="preferredDays().includes(d)" (change)="toggleDay(d)" /> {{ d }}</label>
        }
      </fieldset>
      <label>Hours per day <input type="number" min="1" [(ngModel)]="hoursPerDay" /></label>
      <p>Total days (from course): <strong>{{ selectedCourse()?.totalDays }}</strong></p>
      <button type="button" (click)="goStep4()" [disabled]="!!mondayError() && !isAdmin()">Next</button>
    }

    @if (step() === 4) {
      <p class="note">Trainer names are not shown for clients.</p>
      <button type="button" (click)="loadIntervals()">Load available windows</button>
      @if (intervals().length) {
        <app-calendar [events]="previewEvents()" [resources]="[]" viewMode="week" [readOnly]="true" />
        <ul class="interval-list">
          @for (i of intervals(); track i.start) {
            <li>{{ i.start | date: 'medium' }} – {{ i.end | date: 'shortTime' }}</li>
          }
        </ul>
      }
      <button type="button" (click)="step.set(5)">Next</button>
    }

    @if (step() === 5) {
      <h3>Review & submit</h3>
      <ul>
        <li>Course: {{ selectedCourse()?.name }}</li>
        <li>Branch: {{ branchId }}</li>
        <li>Start: {{ startDate }}</li>
        <li>Amount paid: <input type="number" [(ngModel)]="totalAmountPaid" /></li>
      </ul>
      <button type="button" (click)="submit()" [disabled]="submitting()">Confirm enrollment</button>
      @if (error()) { <p class="err">{{ error() }}</p> }
    }
  `,
  styles: `
    .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
    .tile { display: flex; flex-direction: column; align-items: center; padding: 0.75rem; border: 1px solid #ccc; cursor: pointer; }
    .tile img { max-width: 100px; max-height: 80px; object-fit: cover; }
    .note { font-size: 0.9rem; color: #555; }
    .err { color: #c62828; }
    .interval-list { max-height: 200px; overflow: auto; }
    fieldset { border: none; display: flex; flex-wrap: wrap; gap: 0.5rem; }
  `
})
export class EnrollmentStepperComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  step = signal(1);
  courses = signal<CourseApi[]>([]);
  branches = signal<{ id: string; name?: string }[]>([]);
  selectedCourse = signal<CourseApi | null>(null);
  intervals = signal<TimeIntervalApi[]>([]);
  preferredDays = signal<string[]>(['Mo', 'Tu', 'We', 'Th', 'Fr']);
  mondayError = signal<string | null>(null);
  error = signal<string | null>(null);
  submitting = signal(false);
  dayOpts = DAY_OPTS;
  isAdmin = computed(() => this.session.isAdmin());

  allowedTrainings = signal<number>(0);
  profileActive = signal<boolean>(true);

  rcAvailable = false;
  insuranceAvailable = false;
  pucAvailable = false;

  courseId = '';
  assetType = 'GEARED';
  branchId = '';
  ownVehicle = false;
  vehicleNumber = '';
  vehicleIssues = '';
  startDate = '';
  hoursPerDay = 2;
  totalAmountPaid = 0;

  tripCourses = computed(() => this.courses().filter((c) => c.category === 'TRIP'));

  previewEvents = computed(() =>
    slotsToEvents(
      this.intervals().map((i, idx) => ({
        id: idx,
        title: 'Available',
        startDateTime: i.start,
        endDateTime: i.end,
        status: 'PENDING' as const
      }))
    )
  );

  ngOnInit() {
    this.api.listCourses().subscribe((c) => this.courses.set(c));
    this.api.listBranches().subscribe((b) => this.branches.set(b));
    this.api.getClientMe().subscribe({
      next: (profile: any) => {
        this.allowedTrainings.set(profile.allowedNumOfTrainings ?? 1);
        this.profileActive.set(profile.active !== false);
      },
      error: () => {
        // Fallback or non-client
        this.allowedTrainings.set(1);
        this.profileActive.set(true);
      }
    });
  }

  selectCourse(c: CourseApi) {
    this.selectedCourse.set(c);
    this.courseId = c.id;
    this.hoursPerDay = c.hoursPerDay ?? 2;
    this.step.set(2);
  }

  onStartDateChange() {
    if (!this.startDate) return;
    const d = new Date(this.startDate + 'T12:00:00');
    const isMonday = d.getDay() === 1;
    if (!isMonday && !this.isAdmin()) {
      this.mondayError.set('Start date must be a Monday.');
    } else if (!isMonday && this.isAdmin()) {
      this.mondayError.set('Warning: not a Monday (admin override).');
    } else {
      this.mondayError.set(null);
    }
  }

  toggleDay(d: string) {
    const set = new Set(this.preferredDays());
    if (set.has(d)) set.delete(d);
    else set.add(d);
    this.preferredDays.set([...set]);
  }

  goStep4() {
    this.onStartDateChange();
    if (this.mondayError()?.startsWith('Start date must') && !this.isAdmin()) return;
    this.step.set(4);
  }

  loadIntervals() {
    const course = this.selectedCourse();
    if (!course || !this.startDate) return;
    this.api
      .availableIntervals({
        branchId: this.branchId,
        assetType: this.assetType,
        startDate: this.startDate,
        preferredDays: this.preferredDays(),
        hoursPerDay: this.hoursPerDay,
        totalDays: course.totalDays ?? 1
      })
      .subscribe((r) => this.intervals.set(r.intervals));
  }

  submit() {
    const course = this.selectedCourse();
    if (!course) return;
    this.submitting.set(true);
    this.error.set(null);
    this.api
      .submitEnrollment({
        courseId: this.courseId,
        branchId: this.branchId,
        assetType: this.assetType,
        startDate: this.startDate,
        preferredDays: this.preferredDays(),
        hoursPerDay: this.hoursPerDay,
        totalAmountPaid: this.totalAmountPaid,
        ownVehicle: this.ownVehicle,
        vehicleNumber: this.ownVehicle ? this.vehicleNumber : null,
        rcAvailable: this.ownVehicle ? this.rcAvailable : null,
        insuranceAvailable: this.ownVehicle ? this.insuranceAvailable : null,
        pucAvailable: this.ownVehicle ? this.pucAvailable : null,
        vehicleIssues: this.ownVehicle ? this.vehicleIssues : null
      })
      .subscribe({
        next: () => this.router.navigate(['/client/trainings']),
        error: (e) => {
          this.error.set(e.error?.error ?? 'Enrollment failed');
          this.submitting.set(false);
        }
      });
  }
}
