import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CourseApi } from '../core/models/api.models';
import { daysCodesToFullNames } from '../core/models/days.enum';

@Component({
  selector: 'app-course-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-wrapper">
      <!-- Close button -->
      <button class="close-btn" (click)="close()" aria-label="Close">
        <mat-icon>close</mat-icon>
      </button>

      <!-- Template Image -->
      <div class="image-section">
        @if (data.course.templateImage) {
          <img
            [src]="'data:image/png;base64,' + data.course.templateImage"
            [alt]="data.course.name ?? 'Course'"
            class="course-image"
          />
        } @else {
          <div class="no-image">
            <mat-icon>two_wheeler</mat-icon>
          </div>
        }
        <div class="image-overlay">
          @if (data.course.category) {
            <span class="dialog-badge">{{ data.course.category }}</span>
          }
        </div>
      </div>

      <!-- Course Details -->
      <div class="details-section">
        <h2 class="course-name">{{ data.course.name ?? 'Unnamed Course' }}</h2>

        <div class="info-list">
          <div class="info-row">
            <div class="info-icon-wrap">
              <mat-icon>calendar_today</mat-icon>
            </div>
            <div class="info-content">
              <span class="info-label">Total Days</span>
              <span class="info-value">{{ data.course.totalDays ?? '—' }} days</span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-icon-wrap">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="info-content">
              <span class="info-label">Hours Per Day</span>
              <span class="info-value">{{ data.course.hoursPerDay ?? '—' }} hours</span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-icon-wrap">
              <mat-icon>event_available</mat-icon>
            </div>
            <div class="info-content">
              <span class="info-label">Training Days</span>
              <span class="info-value">{{ trainingDays }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Apply Button -->
      <div class="action-section">
        <button class="apply-btn" (click)="apply()">
          <span>Apply Now</span>
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: `
    .dialog-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #0d2847 0%, #1a3a5c 100%);
      color: #fff;
      max-height: 85vh;
      overflow-y: auto;
      border-radius: 16px;
    }

    .close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 10;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.3);
      background: rgba(0, 0, 0, 0.4);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      transition: all 0.2s;
    }
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255,255,255,0.6);
    }
    .close-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .image-section {
      position: relative;
      width: 100%;
      height: 220px;
      overflow: hidden;
      background: linear-gradient(135deg, #0a1628, #1a3a5c);
    }
    .course-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .no-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(21,101,192,0.2), rgba(13,71,161,0.4));
    }
    .no-image mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: rgba(255,255,255,0.2);
    }

    .image-overlay {
      position: absolute;
      bottom: 12px;
      left: 16px;
    }
    .dialog-badge {
      padding: 0.3rem 0.85rem;
      background: rgba(33, 150, 243, 0.4);
      color: #90caf9;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(144, 202, 249, 0.3);
    }

    .details-section {
      padding: 1.5rem;
    }

    .course-name {
      margin: 0 0 1.25rem;
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.3px;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .info-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(33, 150, 243, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .info-icon-wrap mat-icon {
      color: #4fc3f7;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .info-content {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .info-value {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }

    .action-section {
      padding: 0 1.5rem 1.75rem;
    }

    .apply-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.85rem 1.5rem;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #1565c0, #0d47a1);
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 20px rgba(21, 101, 192, 0.4);
    }
    .apply-btn:hover {
      background: linear-gradient(135deg, #1976d2, #1565c0);
      box-shadow: 0 6px 28px rgba(21, 101, 192, 0.5);
      transform: translateY(-2px);
    }
    .apply-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .image-section {
        height: 160px;
      }
      .course-name {
        font-size: 1.25rem;
      }
      .details-section {
        padding: 1.25rem;
      }
      .action-section {
        padding: 0 1.25rem 1.25rem;
      }
    }
  `
})
export class CourseDetailDialogComponent {
  readonly data = inject<{ course: CourseApi }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CourseDetailDialogComponent>);

  get trainingDays(): string {
    const days = this.data.course.preferredDaysOfWeek;
    if (!days) return 'Mon – Fri';
    return daysCodesToFullNames(days);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  apply(): void {
    this.dialogRef.close(this.data.course);
  }
}
