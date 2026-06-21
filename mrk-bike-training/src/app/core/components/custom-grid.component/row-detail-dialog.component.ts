import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ColDef } from 'ag-grid-community';

interface DialogData {
  row: Record<string, any>;
  columnDefs: ColDef[];
}

@Component({
  selector: 'app-row-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <h3>Row Details</h3>
      <button mat-icon-button (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div class="dialog-content">
      <!-- Images first -->
      @for (img of imageFields; track img.field) {
        @if (img.value) {
          <div class="image-section">
            <label>{{ img.header }}</label>
            <img [src]="img.value" [alt]="img.header" class="detail-image" />
          </div>
        }
      }

      <!-- Other fields -->
      <div class="fields-grid">
        @for (field of displayFields; track field.field) {
          <div class="field-item">
            <label>{{ field.header }}</label>
            <span class="field-value">{{ field.value ?? '—' }}</span>
          </div>
        }
      </div>
    </div>

    <div class="dialog-actions">
      <button mat-flat-button color="primary" (click)="close()">Close</button>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem 0.5rem;
      border-bottom: 1px solid #eee;
    }

    .dialog-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #333;
    }

    .dialog-content {
      padding: 1rem 1.5rem;
      overflow-y: auto;
      max-height: 65vh;
    }

    .image-section {
      margin-bottom: 1rem;
      text-align: center;
    }

    .image-section label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .detail-image {
      max-width: 100%;
      max-height: 300px;
      object-fit: contain;
      border-radius: 8px;
      border: 1px solid #eee;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .field-item {
      padding: 0.5rem;
      background: #f9f9f9;
      border-radius: 6px;
      border: 1px solid #eee;
    }

    .field-item label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 0.2rem;
    }

    .field-value {
      font-size: 0.9rem;
      color: #333;
      word-break: break-word;
    }

    .dialog-actions {
      padding: 0.75rem 1.5rem;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
    }

    @media (max-width: 600px) {
      .fields-grid {
        grid-template-columns: 1fr;
      }

      .detail-image {
        max-height: 200px;
      }
    }
  `
})
export class RowDetailDialogComponent {
  imageFields: { field: string; header: string; value: string }[] = [];
  displayFields: { field: string; header: string; value: any }[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private dialogRef: MatDialogRef<RowDetailDialogComponent>
  ) {
    this.processFields();
  }

  private processFields() {
    const row = this.data.row;
    const colDefs = this.data.columnDefs;

    // Build field list from column definitions
    for (const col of colDefs) {
      const field = col.field || '';
      const header = (col.headerName || field) as string;
      const value = this.getNestedValue(row, field);

      // Detect image fields by checking if value looks like a URL pointing to an image
      // or if the field name suggests it's an image (for base64 blob data)
      const isImageField = field.toLowerCase().includes('image') || field.toLowerCase().includes('photo') || field.toLowerCase().includes('picture');
      if (this.isImageUrl(value)) {
        this.imageFields.push({ field, header, value });
      } else if (isImageField && typeof value === 'string' && value.length > 100) {
        // Likely a base64 blob — prefix with data URL
        this.imageFields.push({ field, header, value: `data:image/png;base64,${value}` });
      } else {
        // Use valueFormatter if available for display
        let displayValue = value;
        if (col.valueFormatter && typeof col.valueFormatter === 'function') {
          try {
            displayValue = (col.valueFormatter as any)({ value, data: row });
          } catch {
            displayValue = value;
          }
        }
        this.displayFields.push({ field, header, value: displayValue });
      }
    }

    // If no columns matched image fields but the row has image-like keys, pick those up
    if (this.imageFields.length === 0) {
      for (const key of Object.keys(row)) {
        if (this.isImageUrl(row[key]) && !this.displayFields.some(f => f.field === key)) {
          this.imageFields.push({ field: key, header: this.toLabel(key), value: row[key] });
        }
      }
    }
  }

  private getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;
    return path.split('.').reduce((o, key) => o?.[key], obj);
  }

  private isImageUrl(value: any): boolean {
    if (typeof value !== 'string') return false;
    const lower = value.toLowerCase();
    // Detect data URLs
    if (lower.startsWith('data:image/')) return true;
    // Detect http URLs that look like images
    if ((lower.startsWith('http://') || lower.startsWith('https://')) &&
      (lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg') ||
       lower.includes('.gif') || lower.includes('.webp') || lower.includes('.svg') ||
       lower.includes('image/') || lower.includes('img') || lower.includes('photo'))) {
      return true;
    }
    return false;
  }

  private toLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  }

  close() {
    this.dialogRef.close();
  }
}
