import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { CourseApi } from '../core/models/api.models';

@Component({
  selector: 'app-course-template-page',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormBgTemplateComponent
  ],
  template: `
    <app-form-bg-template>
      <form #f="ngForm" (ngSubmit)="submit()" novalidate>
        <h3 class="form-title">Add / Update Training Template</h3>

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
            required
            [(ngModel)]="selectedCourseId"
            (ngModelChange)="onCourseChange($event)"
            #courseCtrl="ngModel"
          >
            @for (c of courses(); track c.id) {
              <mat-option [value]="c.id">{{ c.name }} ({{ c.id }})</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>school</mat-icon>
          @if (courseCtrl.touched && courseCtrl.errors?.['required']) {
            <mat-error>Please select a training</mat-error>
          }
        </mat-form-field>

        @if (selectedCourse()) {
          <div class="info-card">
            <p><strong>Name:</strong> {{ selectedCourse()!.name }}</p>
            <p><strong>Category:</strong> {{ selectedCourse()!.category }}</p>
            <p><strong>Duration:</strong> {{ selectedCourse()!.hoursPerDay }}h/day × {{ selectedCourse()!.totalDays }} days</p>
            <p><strong>Status:</strong> {{ selectedCourse()!.status || 'ACTIVE' }}</p>
          </div>

          <!-- Current Template Image -->
          @if (selectedCourse()!.templateImage) {
            <div class="current-image-section">
              <div class="section-label">Current Template</div>
              <div class="image-container">
                <img [src]="'data:image/png;base64,' + selectedCourse()!.templateImage" alt="Current template" />
              </div>
            </div>
          } @else {
            <div class="no-template-hint">
              <mat-icon>image_not_supported</mat-icon>
              <span>No template image set for this training.</span>
            </div>
          }

          <!-- Upload New Template Image -->
          <div class="upload-section">
            <div class="section-label">{{ selectedCourse()!.templateImage ? 'Update' : 'Add' }} Template Image</div>
            <div class="upload-area" (click)="fileInput.click()">
              <input
                #fileInput
                type="file"
                accept="image/*"
                style="display: none"
                (change)="onFileSelected($event)"
              />
              @if (imagePreview()) {
                <img [src]="imagePreview()" alt="New template preview" class="upload-preview" />
                <button type="button" class="remove-btn" (click)="removeImage($event)">✕</button>
              } @else {
                <mat-icon>cloud_upload</mat-icon>
                <span>Click to select a new template image</span>
              }
            </div>
            @if (selectedFile()) {
              <div class="file-name">📎 {{ selectedFile()!.name }}</div>
            }
          </div>
        }

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading() || !selectedCourseId || !selectedFile()">
            {{ loading() ? 'Saving…' : (selectedCourse()?.templateImage ? 'Update Template' : 'Add Template') }}
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
      gap: 0.75rem;
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

    .alert-success {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.5);
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
    }

    .info-card {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 0.75rem;
    }

    .info-card p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
    }

    .section-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .current-image-section {
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
    }

    .image-container {
      text-align: center;
    }

    .image-container img {
      max-width: 100%;
      max-height: 250px;
      object-fit: contain;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .no-template-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .upload-section {
      margin-top: 0.25rem;
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
      max-width: 250px;
      max-height: 180px;
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
  `
})
export class CourseTemplatePageComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  courses = signal<CourseApi[]>([]);
  selectedCourseId = '';
  selectedCourse = signal<CourseApi | null>(null);

  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit() {
    this.api.listCourses('ACTIVE').subscribe(courses => this.courses.set(courses));
  }

  onCourseChange(id: string) {
    this.selectedCourse.set(this.courses().find(c => c.id === id) || null);
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.error.set(null);
    this.success.set(null);
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

  submit() {
    if (!this.selectedCourseId || !this.selectedFile()) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.api.updateCourseTemplate(this.selectedCourseId, this.selectedFile()!).subscribe({
      next: (updated) => {
        this.success.set('Template image updated successfully.');
        this.loading.set(false);
        // Refresh course data
        this.api.listCourses('ACTIVE').subscribe(courses => {
          this.courses.set(courses);
          this.selectedCourse.set(courses.find(c => c.id === this.selectedCourseId) || null);
        });
        this.selectedFile.set(null);
        this.imagePreview.set(null);
      },
      error: (e) => {
        this.error.set(e.error?.error ?? 'Failed to update template image');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/courses-view']);
  }
}
