import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../core/components/custom-grid.component/custom-grid.component';

@Component({
  selector: 'app-vehicle-list-page',
  standalone: true,
  imports: [CustomGridComponent],
  template: `
    <div class="page-container">
      <h2>🏍️ All Vehicles</h2>
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
export class VehicleListPageComponent {
  apiUrl = '/api/vehicles';

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'Vehicle ID', pinned: 'left' },
    { field: 'name', headerName: 'Name' },
    {
      field: 'vehicleType.label',
      headerName: 'Type',
      valueGetter: (params) => params.data?.vehicleType?.label || params.data?.vehicleType?.type || ''
    },
    { field: 'color', headerName: 'Color' },
    {
      field: 'vehicleType.engineCc',
      headerName: 'Engine CC',
      valueGetter: (params) => params.data?.vehicleType?.engineCc ?? ''
    },
    {
      field: 'vehicleType.minHtFt',
      headerName: 'Min Height',
      valueGetter: (params) => params.data?.vehicleType?.minHtFt,
      valueFormatter: (params) => params.value != null ? `${Math.floor(params.value)}' ${Math.round((params.value - Math.floor(params.value)) * 100)}"` : ''
    },
    {
      field: 'vehicleType.maxHtFt',
      headerName: 'Max Height',
      valueGetter: (params) => params.data?.vehicleType?.maxHtFt,
      valueFormatter: (params) => params.value != null ? `${Math.floor(params.value)}' ${Math.round((params.value - Math.floor(params.value)) * 100)}"` : ''
    },
    {
      field: 'currentBranch.name',
      headerName: 'Branch',
      valueGetter: (params) => params.data?.currentBranch?.name || ''
    },
    { field: 'isActive', headerName: 'Active' },
    { field: 'nextMaintenanceDate', headerName: 'Next Maintenance' }
  ];
}
