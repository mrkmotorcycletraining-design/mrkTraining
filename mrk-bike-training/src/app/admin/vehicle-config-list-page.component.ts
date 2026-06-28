import { Component, inject, signal } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../core/components/custom-grid.component/custom-grid.component';
import { TrainingApiService } from '../core/services/training-api.service';
import { VehicleTypeConfigApi } from '../core/models/api.models';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'app-vehicle-config-list-page',
  standalone: true,
  imports: [CustomGridComponent, MatButtonModule, MatIconModule, AgGridAngular],
  template: `
    <div class="page-container">
      <h2>⚙️ Vehicle Type Configurations</h2>
      <app-custom-grid
        [apiUrl]="apiUrl"
        [columnDefs]="columnDefs"
      />

      <!-- Actions Section -->
      <div class="actions-section">
        <h3>Actions</h3>
        <div class="type-cards">
          @for (cfg of typeConfigs(); track cfg.typeId) {
            <div class="type-card" [class.inactive]="cfg.status === false">
              <div class="card-info">
                <strong>{{ cfg.label || cfg.type }}</strong>
                <span class="card-type-code">({{ cfg.type }})</span>
                <span class="status-badge" [class.active]="cfg.status !== false" [class.inactive-badge]="cfg.status === false">
                  {{ cfg.status === false ? 'Inactive' : 'Active' }}
                </span>
              </div>
              <div class="card-actions">
                @if (cfg.status !== false) {
                  <button mat-stroked-button color="warn" (click)="confirmDeactivate(cfg)">
                    <mat-icon>block</mat-icon> Deactivate
                  </button>
                } @else {
                  <button mat-stroked-button color="primary" (click)="activate(cfg)">
                    <mat-icon>check_circle</mat-icon> Activate
                  </button>
                }
                <button mat-stroked-button color="warn" (click)="confirmDelete(cfg)">
                  <mat-icon>delete</mat-icon> Delete
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Deactivated Vehicles Grid (shown after deactivation) -->
      @if (deactivatedVehicles().length > 0) {
        <div class="deactivated-section">
          <h3>🚫 Deactivated Vehicles ({{ deactivatedTypeName() }})</h3>
          <ag-grid-angular
            class="ag-theme-quartz"
            [rowData]="deactivatedVehicles()"
            [columnDefs]="deactivatedColDefs"
            [defaultColDef]="defaultColDef"
            [domLayout]="'autoHeight'"
          />
        </div>
      }

      @if (message()) {
        <div class="toast-message" [class.error]="isError()">{{ message() }}</div>
      }
    </div>
  `,
  styles: `
    .page-container {
      padding: 1.5rem;
    }
    h2 {
      margin: 0 0 1rem;
      font-size: 1.2rem;
      font-weight: 700;
    }
    h3 {
      margin: 1.5rem 0 0.75rem;
      font-size: 1rem;
      font-weight: 600;
    }
    .actions-section {
      margin-top: 1rem;
    }
    .type-cards {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .type-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
    }
    .type-card.inactive {
      background: #f5f5f5;
      opacity: 0.8;
    }
    .card-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .card-type-code {
      color: #888;
      font-size: 0.85rem;
    }
    .status-badge {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-badge.active {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status-badge.inactive-badge {
      background: #fbe9e7;
      color: #c62828;
    }
    .card-actions {
      display: flex;
      gap: 0.5rem;
    }
    .card-actions button {
      font-size: 0.8rem;
    }
    .card-actions mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      margin-right: 4px;
    }
    .deactivated-section {
      margin-top: 1.5rem;
    }
    .deactivated-section ag-grid-angular {
      width: 100%;
    }
    .toast-message {
      margin-top: 1rem;
      padding: 0.6rem 1rem;
      border-radius: 6px;
      background: #e8f5e9;
      color: #2e7d32;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .toast-message.error {
      background: #fbe9e7;
      color: #c62828;
    }
  `
})
export class VehicleConfigListPageComponent {
  private readonly api = inject(TrainingApiService);

  apiUrl = '/api/vehicles/types';

  typeConfigs = signal<VehicleTypeConfigApi[]>([]);
  deactivatedVehicles = signal<any[]>([]);
  deactivatedTypeName = signal('');
  message = signal('');
  isError = signal(false);

  columnDefs: ColDef[] = [
    { field: 'typeId', headerName: 'ID', width: 80 },
    { field: 'type', headerName: 'Type Code' },
    { field: 'label', headerName: 'Label' },
    {
      field: 'minHtFt',
      headerName: 'Min Height',
      valueFormatter: (params) => params.value != null ? `${Math.floor(params.value)}' ${Math.round((params.value - Math.floor(params.value)) * 100)}"` : ''
    },
    {
      field: 'maxHtFt',
      headerName: 'Max Height',
      valueFormatter: (params) => params.value != null ? `${Math.floor(params.value)}' ${Math.round((params.value - Math.floor(params.value)) * 100)}"` : ''
    },
    { field: 'minWt', headerName: 'Min Wt (kg)' },
    { field: 'maxWt', headerName: 'Max Wt (kg)' },
    { field: 'engineCc', headerName: 'Engine CC' },
    { field: 'isElectric', headerName: 'Electric', valueFormatter: (params) => params.value === true ? 'Yes' : params.value === false ? 'No' : '—' },
    { field: 'mileage', headerName: 'Mileage (km/l)' },
    { field: 'maintenanceIntervalKm', headerName: 'Maint. Interval (km)' },
    { field: 'status', headerName: 'Active', valueFormatter: (params) => params.value === true ? 'Yes' : params.value === false ? 'No' : '—' }
  ];

  deactivatedColDefs: ColDef[] = [
    { field: 'id', headerName: 'Vehicle ID' },
    { field: 'name', headerName: 'Name' },
    { field: 'color', headerName: 'Color' },
    { field: 'status', headerName: 'Status' }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1
  };

  ngOnInit() {
    this.loadTypes();
  }

  private loadTypes() {
    this.api.listVehicleTypes().subscribe({
      next: (types) => this.typeConfigs.set(types)
    });
  }

  confirmDeactivate(cfg: VehicleTypeConfigApi) {
    const confirmed = confirm(
      `⚠️ Deactivating "${cfg.label || cfg.type}" will also deactivate ALL linked vehicles in this category.\n\nAre you sure you want to proceed?`
    );
    if (!confirmed) return;

    this.api.deactivateVehicleType(cfg.typeId).subscribe({
      next: (deactivatedList) => {
        this.showMessage(`"${cfg.label || cfg.type}" deactivated along with ${deactivatedList.length} vehicle(s).`);
        this.deactivatedVehicles.set(deactivatedList);
        this.deactivatedTypeName.set(cfg.label || cfg.type);
        this.loadTypes();
      },
      error: (e) => this.showMessage(e.error?.error ?? 'Failed to deactivate', true)
    });
  }

  activate(cfg: VehicleTypeConfigApi) {
    this.api.activateVehicleType(cfg.typeId).subscribe({
      next: () => {
        this.showMessage(`"${cfg.label || cfg.type}" activated.`);
        this.deactivatedVehicles.set([]);
        this.loadTypes();
      },
      error: (e) => this.showMessage(e.error?.error ?? 'Failed to activate', true)
    });
  }

  confirmDelete(cfg: VehicleTypeConfigApi) {
    const confirmed = confirm(
      `🗑️ To delete "${cfg.label || cfg.type}", all vehicles of this type must first be deactivated or deleted.\n\nDo you want to proceed with deletion?`
    );
    if (!confirmed) return;

    this.api.deleteVehicleType(cfg.typeId).subscribe({
      next: () => {
        this.showMessage(`"${cfg.label || cfg.type}" deleted successfully.`);
        this.deactivatedVehicles.set([]);
        this.loadTypes();
      },
      error: (e) => this.showMessage(e.error?.error ?? e.error?.message ?? 'Failed to delete. Ensure all vehicles of this type are removed first.', true)
    });
  }

  private showMessage(msg: string, error = false) {
    this.message.set(msg);
    this.isError.set(error);
    setTimeout(() => this.message.set(''), 5000);
  }
}
