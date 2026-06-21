import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { CourseApi } from '../core/models/api.models';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
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
          <mat-label>Select Training</mat-label>
          <mat-select
            name="course"
            [(ngModel)]="selectedCourseId"
            (ngModelChange)="onCourseChange($event)"
          >
            @for (c of courses(); track c.id) {
              <mat-option [value]="c.id">{{ c.name }} ({{ c.id }}) — {{ c.status || 'ACTIVE' }}</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>school</mat-icon>
        </mat-form-field>

        @if (selectedCourse()) {
          <div class="info-card">
            <p><strong>Name:</strong> {{ selectedCourse()!.name }}</p>
            <p><strong>Category:</strong> {{ selectedCourse()!.category }}</p>
            <p><strong>Status:</strong> {{ selectedCourse()!.status || 'ACTIVE' }}</p>
            <p><strong>Duration:</strong> {{ selectedCourse()!.hoursPerDay }}h/day × {{ selectedCourse()!.totalDays }} days</p>
          </div>
        }

        <div class="form-actions">
          @if (action() === 'deactivate') {
            <button mat-flat-button color="primary" type="button" (click)="toggleStatus()" [disabled]="loading() || !selectedCourseId">
              {{ loading() ? 'Processing…' : (isActive() ? 'Deactivate Training' : 'Activate Training') }}
            </button>
          }
          @if (action() === 'delete') {
            <button mat-flat-button color="warn" type="button" (click)="deleteCourse()" [disabled]="loading() || !selectedCourseId">
              {{ loading() ? 'Deleting…' : 'Delete Training' }}
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
    ::ng-deep .mat-mdc-select-value-text { color: #fff !important; }
    ::ng-deep .mat-mdc-select-arrow { color: rgba(255,255,255,0.8) !important; }
    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-icon-suffix { color: rgba(255,255,255,0.8); }
    ::ng-deep .mat-mdc-outlined-button:not(:disabled) { --mdc-outlined-button-outline-color: #fff; --mdc-outlined-button-label-text-color: #fff; }
  `
})
export class CourseManagementComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  courses = signal<CourseApi[]>([]);
  selectedCourseId = '';
  selectedCourse = signal<CourseApi | null>(null);
  action = signal<string>('deactivate');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  title = signal('Course Management');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const a = params['action'] || 'deactivate';
      this.action.set(a);
      this.title.set(a === 'delete' ? '🗑️ Delete Training' : '🔄 Activate / Deactivate Training');
    });
    this.api.listCourses().subscribe(c => this.courses.set(c));
  }

  onCourseChange(id: string) {
    this.selectedCourse.set(this.courses().find(c => c.id === id) || null);
    this.error.set(null);
    this.success.set(null);
  }

  isActive(): boolean {
    const status = this.selectedCourse()?.status;
    return !status || status.toUpperCase() === 'ACTIVE';
  }

  toggleStatus() {
    if (!this.selectedCourseId) return;
    const active = this.isActive();
    const msg = active ? 'Deactivate this training?' : 'Activate this training?';
    if (!confirm(msg)) return;
    this.loading.set(true);
    this.error.set(null);
    const call = active
      ? this.api.deactivateCourse(this.selectedCourseId)
      : this.api.activateCourse(this.selectedCourseId);
    call.subscribe({
      next: () => {
        this.success.set(active ? 'Training deactivated.' : 'Training activated.');
        this.loading.set(false);
        this.api.listCourses().subscribe(c => {
          this.courses.set(c);
          this.selectedCourse.set(c.find(x => x.id === this.selectedCourseId) || null);
        });
      },
      error: (e) => {
        this.error.set(e.error?.error ?? 'Failed');
        this.loading.set(false);
      }
    });
  }

  deleteCourse() {
    if (!this.selectedCourseId || !confirm('DELETE this training? This cannot be undone.')) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.deleteCourse(this.selectedCourseId).subscribe({
      next: () => {
        this.success.set('Training deleted successfully.');
        this.loading.set(false);
        this.selectedCourseId = '';
        this.selectedCourse.set(null);
        this.api.listCourses().subscribe(c => this.courses.set(c));
      },
      error: (e) => {
        this.error.set(e.error?.error ?? 'Failed to delete training');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/courses-view']);
  }
}
