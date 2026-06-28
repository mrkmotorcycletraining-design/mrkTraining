import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../core/components/custom-grid.component/custom-grid.component';
import { daysCodesToShortNames } from '../core/models/days.enum';

@Component({
  selector: 'app-trainer-list-page',
  standalone: true,
  imports: [CustomGridComponent],
  template: `
    <div class="page-container">
      <h2>🧑‍🏫 All Trainers</h2>
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
export class TrainerListPageComponent {
  apiUrl = '/api/trainers';

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', pinned: 'left', width: 80 },
    { field: 'name', headerName: 'Name' },
    { field: 'username', headerName: 'Username' },
    { field: 'startDate', headerName: 'Start Date' },
    { field: 'salary', headerName: 'Salary (₹)' },
    {
      field: 'currentBranch.name',
      headerName: 'Branch',
      valueGetter: (params) => params.data?.currentBranch?.name || ''
    },
    { field: 'preferredDays', headerName: 'Preferred Days', valueFormatter: (params) => daysCodesToShortNames(params.value || '') },
    { field: 'preferredTime', headerName: 'Preferred Time' },
    {
      field: 'active',
      headerName: 'Active',
      valueFormatter: (params) => params.value === true ? 'Yes' : params.value === false ? 'No' : ''
    }
  ];
}
