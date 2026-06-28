import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../core/components/custom-grid.component/custom-grid.component';
import { daysCodesToShortNames } from '../core/models/days.enum';

@Component({
  selector: 'app-branch-list-page',
  standalone: true,
  imports: [CustomGridComponent],
  template: `
    <div class="page-container">
      <h2>🏢 All Branches</h2>
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
export class BranchListPageComponent {
  apiUrl = '/api/branches';

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'Branch ID', pinned: 'left' },
    { field: 'name', headerName: 'Name' },
    { field: 'locationAddress', headerName: 'Location / Address' },
    {
      field: 'operatingDays',
      headerName: 'Operating Days',
      valueFormatter: (params) => daysCodesToShortNames(params.value || '')
    },
    { field: 'operatingTime', headerName: 'Operating Time' }
  ];
}
