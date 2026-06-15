import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../form-bg-template/form-bg-template';

@Component({
  selector: 'app-vehicle-config-add-page',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    FormBgTemplateComponent
  ],
  template: `
    <app-form-bg-template>
      <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
        <h3 class="form-title">Add Vehicle Config</h3>

        @if (error()) {
          <div class="alert alert-error">⚠️ {{ error() }}</div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Type Code</mat-label>
          <input
            matInput
            name="type"
            placeholder="e.g. GEARED"
            maxlength="255"
            required
            [(ngModel)]="type"
            #typeCtrl="ngModel"
          />
          <mat-icon matSuffix>code</mat-icon>
          @if (typeCtrl.touched && typeCtrl.errors?.['required']) {
            <mat-error>Type code is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Label</mat-label>
          <input
            matInput
            name="label"
            placeholder="e.g. Geared Motorcycle"
            maxlength="255"
            [(ngModel)]="label"
          />
          <mat-icon matSuffix>label</mat-icon>
        </mat-form-field>

        <div class="field-row">
          <mat-form-field appearance="outline">
            <mat-label>Min Height (cm)</mat-label>
            <input
              matInput
              name="minHt"
              type="number"
              min="0"
              placeholder="e.g. 145"
              [(ngModel)]="minHt"
            />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Max Height (cm)</mat-label>
            <input
              matInput
              name="maxHt"
              type="number"
              min="0"
              placeholder="e.g. 185"
              [(ngModel)]="maxHt"
            />
          </mat-form-field>
        </div>

        <div class="field-row">
          <mat-form-field appearance="outline">
            <mat-label>Min Weight (kg)</mat-label>
            <input
              matInput
              name="minWt"
              type="number"
              min="0"
              placeholder="e.g. 40"
              [(ngModel)]="minWt"
            />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Max Weight (kg)</mat-label>
            <input
              matInput
              name="maxWt"
              type="number"
              min="0"
              placeholder="e.g. 85"
              [(ngModel)]="maxWt"
            />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Engine CC</mat-label>
          <input
            matInput
            name="engineCc"
            type="number"
            min="0"
            placeholder="e.g. 150"
            [(ngModel)]="engineCc"
          />
          <mat-icon matSuffix>speed</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Mileage (km/l)</mat-label>
          <input
            matInput
            name="mileage"
            type="number"
            min="0"
            placeholder="e.g. 45"
            [(ngModel)]="mileage"
          />
          <mat-icon matSuffix>local_gas_station</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Maintenance Interval (km)</mat-label>
          <input
            matInput
            name="maintenanceIntervalKm"
            type="number"
            min="0"
            placeholder="e.g. 5000"
            [(ngModel)]="maintenanceIntervalKm"
          />
          <mat-icon matSuffix>build_circle</mat-icon>
        </mat-form-field>

        <div class="checkbox-row">
          <mat-checkbox name="isElectric" [(ngModel)]="isElectric" color="primary">
            Electric Vehicle
          </mat-checkbox>
        </div>

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Create Config' }}
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

    .checkbox-row {
      margin: 0.25rem 0;
    }

    ::ng-deep .mat-mdc-checkbox .mdc-label {
      color: #fff !important;
    }

    ::ng-deep .mat-mdc-checkbox .mdc-checkbox__background {
      border-color: rgba(255, 255, 255, 0.7) !important;
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
export class VehicleConfigAddPageComponent {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);

  type = '';
  label = '';
  minHt: number | null = null;
  maxHt: number | null = null;
  minWt: number | null = null;
  maxWt: number | null = null;
  engineCc: number | null = null;
  isElectric = false;
  mileage: number | null = null;
  maintenanceIntervalKm: number | null = null;

  loading = signal(false);
  error = signal<string | null>(null);

  submit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.api
      .createVehicleType({
        type: this.type.trim().toUpperCase(),
        label: this.label.trim() || undefined,
        minHt: this.minHt,
        maxHt: this.maxHt,
        minWt: this.minWt,
        maxWt: this.maxWt,
        engineCc: this.engineCc,
        isElectric: this.isElectric,
        mileage: this.mileage,
        maintenanceIntervalKm: this.maintenanceIntervalKm
      })
      .subscribe({
        next: () => this.router.navigate(['/admin/site']),
        error: (e) => {
          this.error.set(e.error?.error ?? 'Failed to create vehicle config');
          this.loading.set(false);
        }
      });
  }

  cancel() {
    this.router.navigate(['/admin/site']);
  }
}
