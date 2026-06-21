import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../core/components/custom-grid.component/custom-grid.component';

@Component({
  selector: 'app-vehicle-config-list-page',
  standalone: true,
  imports: [CustomGridComponent],
  template: `
    <div class="page-container">
      <h2>⚙️ Vehicle Type Configurations</h2>
      <app-custom-grid
        [apiUrl]="apiUrl"
        [columnDefs]="columnDefs"
      />
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
  `
})
export class VehicleConfigListPageComponent {
  apiUrl = '/api/vehicles/types';

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
    { field: 'isElectric', headerName: 'Electric' },
    { field: 'mileage', headerName: 'Mileage (km/l)' },
    { field: 'maintenanceIntervalKm', headerName: 'Maint. Interval (km)' },
    { field: 'status', headerName: 'Active', valueFormatter: (params) => params.value === true ? 'Yes' : params.value === false ? 'No' : '—' }
  ];
}
