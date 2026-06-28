import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../core/components/custom-grid.component/custom-grid.component';

@Component({
  selector: 'app-client-list-page',
  standalone: true,
  imports: [CustomGridComponent],
  template: `
    <div class="page-container">
      <h2>👤 All Clients</h2>
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
export class ClientListPageComponent {
  apiUrl = '/api/clients';

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', pinned: 'left', width: 80 },
    { field: 'name', headerName: 'Name' },
    { field: 'username', headerName: 'Username' },
    { field: 'email', headerName: 'Email' },
    { field: 'heightFt', headerName: 'Height (ft)' },
    { field: 'weightKg', headerName: 'Weight (kg)' },
    { field: 'dateOfBirth', headerName: 'Date of Birth' },
    { field: 'allowedNumOfTrainings', headerName: 'Allowed Trainings' },
    {
      field: 'active',
      headerName: 'Active',
      valueFormatter: (params) => params.value === true ? 'Yes' : params.value === false ? 'No' : ''
    }
  ];
}
