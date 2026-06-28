import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../core/components/custom-grid.component/custom-grid.component';

@Component({
  selector: 'app-client-schedule',
  standalone: true,
  imports: [CustomGridComponent],
  template: `
    <div class="page-container">
      <div class="head">
        <h2>📅 My Schedule</h2>
      </div>
      <app-custom-grid
        [apiUrl]="apiUrl"
        [columnDefs]="columnDefs"
        [enableRowClick]="true"
        rowDataPath="slots"
      />
    </div>
  `,
  styles: `
    .page-container {
      padding: 1.5rem;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
    }
  `
})
export class ClientScheduleComponent {
  apiUrl = '/api/slots?clientId=me';

  columnDefs: ColDef[] = [
    {
      field: 'title',
      headerName: 'Session',
      flex: 1.5,
      valueFormatter: params => params.value ?? '—'
    },
    {
      field: 'startDateTime',
      headerName: 'Start',
      flex: 1.2,
      valueFormatter: params => params.value ? new Date(params.value).toLocaleString() : '—'
    },
    {
      field: 'endDateTime',
      headerName: 'End',
      flex: 1.2,
      valueFormatter: params => params.value ? new Date(params.value).toLocaleString() : '—'
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.9,
      valueFormatter: params => {
        const val = params.value;
        if (!val) return '—';
        return val.replace(/_/g, ' ');
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      valueFormatter: params => params.value ?? '—'
    },
    {
      field: 'branchId',
      headerName: 'Branch',
      flex: 1,
      valueFormatter: params => params.value ?? '—'
    }
  ];
}
