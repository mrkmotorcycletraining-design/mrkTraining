import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { BranchApi, VehicleTypeConfigApi } from '../core/models/api.models';

@Component({
  selector: 'app-vehicle-add-page',
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
      <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
        <h3 class="form-title">Add Vehicle</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Vehicle ID</mat-label>
          <input
            matInput
            name="id"
            placeholder="e.g. KA01MX1234"
            maxlength="255"
            required
            [(ngModel)]="vehicleId"
            #idCtrl="ngModel"
          />
          <mat-icon matSuffix>directions_bike</mat-icon>
          @if (idCtrl.touched && idCtrl.errors?.['required']) {
            <mat-error>Vehicle ID is required (e.g. bike plate number)</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Vehicle Type</mat-label>
          <mat-select
            name="typeId"
            required
            [(ngModel)]="selectedTypeId"
            (ngModelChange)="onTypeChange($event)"
            #typeCtrl="ngModel"
          >
            @for (t of vehicleTypes(); track t.typeId) {
              <mat-option [value]="t.typeId">{{ t.label || t.type }}</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>category</mat-icon>
          @if (typeCtrl.touched && typeCtrl.errors?.['required']) {
            <mat-error>Vehicle type is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Vehicle Name</mat-label>
          <input
            matInput
            name="name"
            placeholder="e.g. Honda Activa 6G"
            maxlength="255"
            [(ngModel)]="vehicleName"
          />
          <mat-icon matSuffix>label</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <input
            matInput
            name="color"
            placeholder="e.g. Matte Black"
            maxlength="100"
            [(ngModel)]="color"
          />
          <mat-icon matSuffix>palette</mat-icon>
        </mat-form-field>

        <div class="field-row">
          <mat-form-field appearance="outline">
            <mat-label>Min Height</mat-label>
            <input
              matInput
              name="minHt"
              type="text"
              [value]="formatFeet(selectedType()?.minHtFt)"
              disabled
            />
            <mat-hint>From type config</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Max Height</mat-label>
            <input
              matInput
              name="maxHt"
              type="text"
              [value]="formatFeet(selectedType()?.maxHtFt)"
              disabled
            />
            <mat-hint>From type config</mat-hint>
          </mat-form-field>
        </div>

        <div class="field-row">
          <mat-form-field appearance="outline">
            <mat-label>Min Weight (kg)</mat-label>
            <input
              matInput
              name="minWt"
              type="number"
              [value]="selectedType()?.minWt ?? ''"
              disabled
            />
            <mat-hint>From type config</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Max Weight (kg)</mat-label>
            <input
              matInput
              name="maxWt"
              type="number"
              [value]="selectedType()?.maxWt ?? ''"
              disabled
            />
            <mat-hint>From type config</mat-hint>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Next Maintenance Date</mat-label>
          <input
            matInput
            name="nextMaintenanceDate"
            type="date"
            [(ngModel)]="nextMaintenanceDate"
          />
          <mat-icon matSuffix>build</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Assigned Branch</mat-label>
          <mat-select
            name="branch"
            required
            [(ngModel)]="branchId"
            #branchCtrl="ngModel"
          >
            @for (b of branches(); track b.id) {
              <mat-option [value]="b.id">{{ b.name }} ({{ b.id }})</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>store</mat-icon>
          @if (branchCtrl.touched && branchCtrl.errors?.['required']) {
            <mat-error>Branch is required</mat-error>
          }
        </mat-form-field>

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Create Vehicle' }}
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

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
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
      --mdc-outlined-text-field-disabled-outline-color: rgba(255, 255, 255, 0.4);
      --mdc-outlined-text-field-disabled-label-text-color: rgba(255, 255, 255, 0.6);
      --mdc-outlined-text-field-disabled-input-text-color: rgba(255, 255, 255, 0.7);
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

    /* Mat-select overrides */
    ::ng-deep .mat-mdc-select-value-text {
      color: #fff !important;
    }

    ::ng-deep .mat-mdc-select-arrow {
      color: rgba(255, 255, 255, 0.8) !important;
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
  `
})
export class VehicleAddPageComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  vehicleId = '';
  selectedTypeId: number | null = null;
  vehicleName = '';
  color = '';
  nextMaintenanceDate = '';
  branchId = '';

  vehicleTypes = signal<VehicleTypeConfigApi[]>([]);
  selectedType = signal<VehicleTypeConfigApi | null>(null);
  branches = signal<BranchApi[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.api.listVehicleTypes().subscribe({
      next: (types) => {
        this.vehicleTypes.set(types);
        if (types.length) {
          this.selectedTypeId = types[0].typeId;
          this.selectedType.set(types[0]);
        }
      }
    });

    this.api.listBranches().subscribe({
      next: (branches) => this.branches.set(branches)
    });
  }

  onTypeChange(typeId: number) {
    const selected = this.vehicleTypes().find(t => t.typeId === typeId) ?? null;
    this.selectedType.set(selected);
  }

  /**
   * Formats a decimal feet value (e.g. 4.09) to display as "4' 9\""
   */
  formatFeet(value?: number | null): string {
    if (value == null) return '';
    const feet = Math.floor(value);
    const inches = Math.round((value - feet) * 100);
    return `${feet}' ${inches}"`;
  }

  submit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.api
      .createAsset({
        id: this.vehicleId.trim(),
        typeId: this.selectedTypeId!,
        name: this.vehicleName.trim() || undefined,
        currentBranchId: this.branchId,
        color: this.color.trim() || null,
        nextMaintenanceDate: this.nextMaintenanceDate || null
      })
      .subscribe({
        next: () => this.router.navigate(['/admin/site']),
        error: (e) => {
          this.error.set(e.error?.error ?? 'Failed to create vehicle');
          this.loading.set(false);
        }
      });
  }

  cancel() {
    this.router.navigate(['/admin/site']);
  }
}
