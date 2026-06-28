import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-backup-restore',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    FormBgTemplateComponent
  ],
  template: `
    <app-form-bg-template>
      <div class="restore-container">
        <h3 class="form-title">Restore Backup</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }
        @if (success()) {
          <div class="alert alert-success">✅ {{ success() }}</div>
        }

        <!-- Step 1: File Upload -->
        @if (step() === 'upload') {
          <div class="upload-section">
            <p class="instruction-text">
              Upload a <strong>.sql</strong> backup file containing INSERT statements only.
              The file will be validated against the database schema before execution.
            </p>

            <div
              class="drop-zone"
              [class.drag-over]="isDragOver()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave()"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
            >
              <mat-icon class="upload-icon">cloud_upload</mat-icon>
              <p>Drag & drop your .sql file here<br>or click to browse</p>
              @if (selectedFile()) {
                <p class="file-name">📄 {{ selectedFile()!.name }} ({{ formatSize(selectedFile()!.size) }})</p>
              }
            </div>

            <input
              #fileInput
              type="file"
              accept=".sql"
              hidden
              (change)="onFileSelected($event)"
            />

            <div class="form-actions">
              <button
                mat-flat-button
                color="primary"
                [disabled]="!selectedFile() || validating()"
                (click)="validateFile()"
              >
                {{ validating() ? 'Validating…' : 'Validate & Continue' }}
              </button>
              <button mat-stroked-button (click)="cancel()">Cancel</button>
            </div>
          </div>
        }

        <!-- Step 2: Validation Results + Confirm -->
        @if (step() === 'confirm') {
          <div class="confirm-section">
            @if (validationErrors().length > 0) {
              <div class="validation-errors">
                <h4>❌ Validation Failed</h4>
                <ul>
                  @for (err of validationErrors(); track err) {
                    <li>{{ err }}</li>
                  }
                </ul>
                <div class="form-actions">
                  <button mat-flat-button color="primary" (click)="resetToUpload()">Upload Different File</button>
                  <button mat-stroked-button (click)="cancel()">Cancel</button>
                </div>
              </div>
            } @else {
              <div class="warning-box">
                <mat-icon class="warning-icon">warning</mat-icon>
                <div>
                  <h4>⚠️ WARNING: This action will modify your database</h4>
                  <p>
                    Restoring from <strong>{{ selectedFile()!.name }}</strong> will insert data into the database.
                    This action cannot be easily undone.
                  </p>
                  <p>The file has been validated and contains only INSERT statements for allowed tables.</p>
                </div>
              </div>

              <div class="form-actions">
                <button
                  mat-flat-button
                  color="warn"
                  [disabled]="restoring()"
                  (click)="confirmRestore()"
                >
                  {{ restoring() ? 'Restoring…' : 'Confirm & Restore' }}
                </button>
                <button mat-stroked-button (click)="resetToUpload()">Upload Different File</button>
                <button mat-stroked-button (click)="cancel()">Cancel</button>
              </div>
            }
          </div>
        }

        <!-- Step 3: Success -->
        @if (step() === 'done') {
          <div class="done-section">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h4>Database restored successfully!</h4>
            <div class="form-actions">
              <button mat-flat-button color="primary" (click)="cancel()">Back to Admin</button>
            </div>
          </div>
        }
      </div>
    </app-form-bg-template>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .restore-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: #fff;
    }

    .form-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
    }

    .instruction-text {
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .alert-error {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
    }

    .alert-success {
      background: rgba(255, 255, 255, 0.15);
      color: #d4ffd4;
      border: 1px solid rgba(200, 255, 200, 0.4);
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
    }

    .drop-zone {
      border: 2px dashed rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .drop-zone:hover,
    .drop-zone.drag-over {
      border-color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: rgba(255, 255, 255, 0.7);
    }

    .drop-zone p {
      margin: 0.5rem 0 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .file-name {
      margin-top: 0.75rem !important;
      color: #fff !important;
      font-weight: 600;
    }

    .warning-box {
      display: flex;
      gap: 1rem;
      background: rgba(255, 200, 0, 0.15);
      border: 1px solid rgba(255, 200, 0, 0.5);
      border-radius: 8px;
      padding: 1rem;
    }

    .warning-box h4 {
      margin: 0 0 0.5rem;
      color: #ffd700;
    }

    .warning-box p {
      margin: 0.25rem 0;
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.9rem;
    }

    .warning-icon {
      color: #ffd700;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .validation-errors h4 {
      color: #ff6b6b;
      margin: 0 0 0.5rem;
    }

    .validation-errors ul {
      padding-left: 1.25rem;
      margin: 0;
    }

    .validation-errors li {
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.85rem;
      margin-bottom: 0.25rem;
    }

    .done-section {
      text-align: center;
      padding: 2rem 0;
    }

    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
    }

    .done-section h4 {
      margin: 1rem 0;
      color: #d4ffd4;
    }

    ::ng-deep .mat-mdc-outlined-button:not(:disabled) {
      --mdc-outlined-button-outline-color: #fff;
      --mdc-outlined-button-label-text-color: #fff;
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }
  `
})
export class BackupRestoreComponent {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  step = signal<'upload' | 'confirm' | 'done'>('upload');
  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);
  validating = signal(false);
  restoring = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  validationErrors = signal<string[]>([]);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave() {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.sql')) {
        this.selectedFile.set(file);
        this.error.set(null);
      } else {
        this.error.set('Only .sql files are accepted');
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (file.name.endsWith('.sql')) {
        this.selectedFile.set(file);
        this.error.set(null);
      } else {
        this.error.set('Only .sql files are accepted');
      }
    }
  }

  validateFile() {
    const file = this.selectedFile();
    if (!file) return;

    this.validating.set(true);
    this.error.set(null);

    this.api.validateBackupSql(file).subscribe({
      next: (res) => {
        this.validating.set(false);
        if (res.valid) {
          this.validationErrors.set([]);
        } else {
          this.validationErrors.set(res.errors || []);
        }
        this.step.set('confirm');
      },
      error: (err) => {
        this.validating.set(false);
        this.error.set(err.error?.error || 'Validation request failed');
      }
    });
  }

  confirmRestore() {
    const file = this.selectedFile();
    if (!file) return;

    this.restoring.set(true);
    this.error.set(null);

    this.api.restoreBackup(file).subscribe({
      next: () => {
        this.restoring.set(false);
        this.step.set('done');
      },
      error: (err) => {
        this.restoring.set(false);
        const errorBody = err.error;
        if (errorBody?.details) {
          this.validationErrors.set(errorBody.details);
          this.step.set('confirm');
        } else {
          this.error.set(errorBody?.error || 'Restore failed');
        }
      }
    });
  }

  resetToUpload() {
    this.step.set('upload');
    this.selectedFile.set(null);
    this.validationErrors.set([]);
    this.error.set(null);
    this.success.set(null);
  }

  cancel() {
    this.router.navigate(['/admin/branches-view']);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
