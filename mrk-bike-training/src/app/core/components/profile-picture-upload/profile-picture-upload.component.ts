import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectionStrategy,
  inject,
  TemplateRef,
  ViewChild,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';

@Component({
  selector: 'app-profile-picture-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    ImageCropperComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="profile-pic-container">
      <div
        class="profile-circle"
        [class.has-image]="previewUrl()"
        (click)="fileInput.click()"
        role="button"
        tabindex="0"
        [attr.aria-label]="previewUrl() ? 'Change profile picture' : 'Upload profile picture'"
        (keydown.enter)="fileInput.click()"
        (keydown.space)="fileInput.click()"
      >
        @if (previewUrl()) {
          <img [src]="previewUrl()" alt="Profile picture preview" class="preview-img" />
        } @else {
          <mat-icon class="placeholder-icon">add_a_photo</mat-icon>
        }

        <div class="overlay">
          <mat-icon>edit</mat-icon>
        </div>
      </div>

      @if (label) {
        <span class="label">{{ label }}</span>
      }

      @if (previewUrl()) {
        <button
          type="button"
          class="remove-btn"
          (click)="removeImage(); $event.stopPropagation()"
          aria-label="Remove profile picture"
        >
          <mat-icon>close</mat-icon>
        </button>
      }

      <input
        #fileInput
        type="file"
        accept="image/*"
        hidden
        (change)="onFileSelected($event)"
      />
    </div>

    <!-- Crop Dialog Template -->
    <ng-template #cropDialog>
      <div class="crop-dialog">
        <h3 class="crop-title">Adjust Your Photo</h3>
        <p class="crop-hint">Drag to reposition. Pinch or use handles to resize.</p>

        <div class="cropper-wrapper">
          <image-cropper
            [imageChangedEvent]="imageChangedEvent"
            [maintainAspectRatio]="true"
            [aspectRatio]="1"
            [roundCropper]="true"
            [resizeToWidth]="300"
            [resizeToHeight]="300"
            output="base64"
            format="png"
            (imageCropped)="onImageCropped($event)"
            (imageLoaded)="onCropperImageLoaded($event)"
            (loadImageFailed)="onLoadImageFailed()"
          ></image-cropper>
        </div>

        <div class="crop-actions">
          <button mat-stroked-button type="button" (click)="cancelCrop()">Cancel</button>
          <button
            mat-flat-button
            color="primary"
            type="button"
            [disabled]="!croppedBase64()"
            (click)="confirmCrop()"
          >
            Apply
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styles: `
    /* === Profile Circle === */
    .profile-pic-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      position: relative;
      margin-bottom: 0.75rem;
    }

    .profile-circle {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      border: 3px dashed rgba(255, 255, 255, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.1);
      transition: border-color 0.2s, background 0.2s;
    }

    .profile-circle:hover {
      border-color: #fff;
      background: rgba(255, 255, 255, 0.15);
    }

    .profile-circle:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 3px;
    }

    .profile-circle.has-image {
      border-style: solid;
      border-color: rgba(255, 255, 255, 0.8);
    }

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    .placeholder-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: rgba(255, 255, 255, 0.7);
    }

    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .overlay mat-icon {
      color: #fff;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .profile-circle:hover .overlay {
      opacity: 1;
    }

    .label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .remove-btn {
      position: absolute;
      top: 0;
      right: calc(50% - 60px);
      background: rgba(255, 255, 255, 0.25);
      border: none;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: background 0.2s;
    }

    .remove-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #fff;
    }

    .remove-btn:hover {
      background: rgba(255, 0, 0, 0.5);
    }

    /* === Crop Dialog === */
    .crop-dialog {
      display: flex;
      flex-direction: column;
      padding: 1.25rem;
      max-width: 90vw;
      max-height: 85vh;
    }

    .crop-title {
      margin: 0 0 0.25rem;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .crop-hint {
      margin: 0 0 0.75rem;
      font-size: 0.8rem;
      color: #666;
    }

    .cropper-wrapper {
      width: 100%;
      max-height: 60vh;
      overflow: hidden;
      border-radius: 8px;
      background: #f0f0f0;
    }

    .crop-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    /* Responsive adjustments */
    @media (max-width: 480px) {
      .profile-circle {
        width: 90px;
        height: 90px;
      }

      .placeholder-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .crop-dialog {
        padding: 0.75rem;
      }

      .crop-title {
        font-size: 1rem;
      }
    }

    @media (min-width: 768px) {
      .profile-circle {
        width: 120px;
        height: 120px;
      }

      .placeholder-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
    }
  `
})
export class ProfilePictureUploadComponent implements OnChanges {
  @Input() label = 'Profile Picture (optional)';
  @Input() existingUrl: string | null = null;

  @Output() imageSelected = new EventEmitter<string | null>();

  @ViewChild('cropDialog') cropDialogTemplate!: TemplateRef<unknown>;

  private readonly dialog = inject(MatDialog);
  private dialogRef: MatDialogRef<unknown> | null = null;

  previewUrl = signal<string | null>(null);
  imageChangedEvent: Event | null = null;
  croppedBase64 = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['existingUrl'] && changes['existingUrl'].currentValue) {
      this.previewUrl.set(changes['existingUrl'].currentValue);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    // Max 5MB for cropping (final output will be smaller)
    if (file.size > 5 * 1024 * 1024) return;

    this.imageChangedEvent = event;
    this.croppedBase64.set(null);

    // Open the crop dialog
    this.dialogRef = this.dialog.open(this.cropDialogTemplate, {
      width: '90vw',
      maxWidth: '500px',
      maxHeight: '90vh',
      panelClass: 'profile-crop-dialog',
      disableClose: true
    });

    this.dialogRef.afterClosed().subscribe(() => {
      // Reset file input so same file can be re-selected
      input.value = '';
    });
  }

  onImageCropped(event: ImageCroppedEvent) {
    this.croppedBase64.set(event.base64 ?? null);
  }

  onCropperImageLoaded(_event: LoadedImage) {
    // Cropper loaded successfully
  }

  onLoadImageFailed() {
    this.dialogRef?.close();
    this.imageChangedEvent = null;
  }

  confirmCrop() {
    const cropped = this.croppedBase64();
    if (cropped) {
      this.previewUrl.set(cropped);
      this.imageSelected.emit(cropped);
    }
    this.dialogRef?.close();
  }

  cancelCrop() {
    this.croppedBase64.set(null);
    this.imageChangedEvent = null;
    this.dialogRef?.close();
  }

  removeImage() {
    this.previewUrl.set(null);
    this.imageSelected.emit(null);
  }
}
