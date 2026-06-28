import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../core/components/custom-grid.component/custom-grid.component';

@Component({
  selector: 'app-trainer-schedule-view',
  standalone: true,
  imports: [CustomGridComponent],
  template: `
    <div class="page-container">
      <h2>📅 Trainer Schedules</h2>
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
export class TrainerScheduleViewComponent {
  apiUrl = '/api/trainer-availability';

  columnDefs: ColDef[] = [
    {
      field: 'trainer.username',
      headerName: 'Trainer',
      pinned: 'left',
      valueGetter: (params) => {
        const t = params.data?.trainer;
        return t ? `${t.name || ''} (${t.username || ''})` : '';
      }
    },
    { field: 'branchId', headerName: 'Branch' },
    { field: 'numberOfTrainingCanTake', headerName: 'Max Trainings' },
    { field: 'slotStartTime', headerName: 'Start Time' },
    { field: 'slotEndTime', headerName: 'End Time' },
    { field: 'effectiveFrom', headerName: 'Effective From' },
    { field: 'effectiveTo', headerName: 'Effective To' },
    {
      field: 'isActive',
      headerName: 'Active',
      valueFormatter: (params) => params.value === true ? 'Yes' : params.value === false ? 'No' : ''
    }
  ];
}
