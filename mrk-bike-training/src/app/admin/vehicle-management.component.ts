import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TrainingApiService } from '../core/services/training-api.service';
import { FormBgTemplateComponent } from '../core/form-bg-template/form-bg-template';
import { AssetApi, BranchApi } from '../core/models/api.models';

@Component({
  selector: 'app-vehicle-management',
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
          <mat-label>Select Vehicle</mat-label>
          <mat-select
            name="vehicle"
            [(ngModel)]="selectedVehicleId"
            (ngModelChange)="onVehicleChange($event)"
          >
            @for (v of vehicles(); track v.id) {
              <mat-option [value]="v.id">{{ formatVehicleLabel(v) }}</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>directions_bike</mat-icon>
        </mat-form-field>

        @if (selectedVehicle()) {
          <div class="info-card">
            <p><strong>Vehicle:</strong> {{ formatVehicleLabel(selectedVehicle()!) }}</p>
            <p><strong>Type:</strong> {{ selectedVehicle()!.vehicleType?.label || selectedVehicle()!.vehicleType?.type }}</p>
            <p><strong>Branch:</strong> {{ selectedVehicle()!.currentBranch?.name || '—' }}</p>
            <p><strong>Status:</strong> {{ selectedVehicle()!.status }}</p>
          </div>
        }

        @if (action() === 'switch-branch') {
          <mat-form-field appearance="outline">
            <mat-label>New Branch</mat-label>
            <mat-select name="branch" [(ngModel)]="newBranchId">
              @for (b of branches(); track b.id) {
                <mat-option [value]="b.id">{{ b.name }} ({{ b.id }})</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>store</mat-icon>
          </mat-form-field>
        }

        <div class="form-actions">
          @if (action() === 'deactivate') {
            <button mat-flat-button color="primary" type="button" (click)="toggleVehicleStatus()" [disabled]="loading() || !selectedVehicleId">
              {{ loading() ? 'Processing…' : (isVehicleActive() ? 'Deactivate Vehicle' : 'Activate Vehicle') }}
            </button>
          }
          @if (action() === 'delete') {
            <button mat-flat-button color="warn" type="button" (click)="deleteVehicle()" [disabled]="loading() || !selectedVehicleId">
              {{ loading() ? 'Deleting…' : 'Delete Vehicle' }}
            </button>
          }
          @if (action() === 'maintenance') {
            <button mat-flat-button color="primary" type="button" (click)="maintenance()" [disabled]="loading() || !selectedVehicleId">
              {{ loading() ? 'Processing…' : 'Set Maintenance' }}
            </button>
          }
          @if (action() === 'switch-branch') {
            <button mat-flat-button color="primary" type="button" (click)="switchBranch()" [disabled]="loading() || !selectedVehicleId || !newBranchId">
              {{ loading() ? 'Switching…' : 'Switch Branch' }}
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
export class VehicleManagementComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  vehicles = signal<AssetApi[]>([]);
  branches = signal<BranchApi[]>([]);
  selectedVehicleId = '';
  selectedVehicle = signal<AssetApi | null>(null);
  newBranchId = '';
  action = signal<string>('deactivate');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  title = signal('Vehicle Management');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const a = params['action'] || 'deactivate';
      this.action.set(a);
      const titles: Record<string, string> = {
        'deactivate': '🔄 Activate / Deactivate Vehicle',
        'delete': '🗑️ Delete Vehicle',
        'maintenance': '🔧 Set Vehicle Maintenance',
        'switch-branch': '🔀 Switch Vehicle Branch'
      };
      this.title.set(titles[a] || 'Vehicle Management');
    });
    this.api.listAssets().subscribe(v => this.vehicles.set(v));
    this.api.listBranches().subscribe(b => this.branches.set(b));
  }

  onVehicleChange(id: string) {
    this.selectedVehicle.set(this.vehicles().find(v => v.id === id) || null);
    this.error.set(null);
    this.success.set(null);
  }

  formatVehicleLabel(v: AssetApi): string {
    let label = v.id;
    if (v.name) label += ' - ' + v.name;
    if (v.color) label += ` (${v.color})`;
    else if (!v.name) return v.id;
    return label;
  }

  isVehicleActive(): boolean {
    const status = this.selectedVehicle()?.status;
    return !status || status.toUpperCase() === 'ACTIVE';
  }

  toggleVehicleStatus() {
    if (!this.selectedVehicleId) return;
    const active = this.isVehicleActive();
    const msg = active ? 'Deactivate this vehicle?' : 'Activate this vehicle?';
    if (!confirm(msg)) return;
    this.loading.set(true);
    this.error.set(null);
    const call = active
      ? this.api.deactivateVehicle(this.selectedVehicleId)
      : this.api.activateVehicle(this.selectedVehicleId);
    call.subscribe({
      next: () => {
        this.success.set(active ? 'Vehicle deactivated.' : 'Vehicle activated.');
        this.loading.set(false);
        this.reload();
      },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed'); this.loading.set(false); }
    });
  }

  deactivate() {
    this.toggleVehicleStatus();
  }

  deleteVehicle() {
    if (!this.selectedVehicleId || !confirm('DELETE this vehicle? This cannot be undone.')) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.deleteVehicle(this.selectedVehicleId).subscribe({
      next: () => {
        this.success.set('Vehicle deleted successfully.');
        this.loading.set(false);
        this.selectedVehicleId = '';
        this.selectedVehicle.set(null);
        this.reload();
      },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed to delete'); this.loading.set(false); }
    });
  }

  maintenance() {
    if (!this.selectedVehicleId || !confirm('Mark this vehicle for maintenance?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.setAssetMaintenance(this.selectedVehicleId).subscribe({
      next: () => {
        this.success.set('Vehicle marked for maintenance.');
        this.loading.set(false);
        this.reload();
      },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed'); this.loading.set(false); }
    });
  }

  switchBranch() {
    if (!this.selectedVehicleId || !this.newBranchId) return;
    const confirmed = confirm(
      '⚠️ Warning: Switching this vehicle\'s branch may affect currently scheduled trainings that use this vehicle.\n\nAny active or upcoming schedules assigned to this vehicle at the current branch could be impacted.\n\nDo you want to proceed?'
    );
    if (!confirmed) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.switchVehicleBranch(this.selectedVehicleId, this.newBranchId).subscribe({
      next: () => {
        this.success.set('Vehicle branch switched successfully.');
        this.loading.set(false);
        this.reload();
      },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed to switch branch'); this.loading.set(false); }
    });
  }

  cancel() {
    this.router.navigate(['/admin/vehicles-list']);
  }

  private reload() {
    this.api.listAssets().subscribe(v => {
      this.vehicles.set(v);
      if (this.selectedVehicleId) {
        this.selectedVehicle.set(v.find(x => x.id === this.selectedVehicleId) || null);
      }
    });
  }
}
