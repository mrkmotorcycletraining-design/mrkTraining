import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../core/components/custom-grid.component/custom-grid.component';

@Component({
  selector: 'app-course-list-page',
  standalone: true,
  imports: [RouterLink, CustomGridComponent],
  template: `
    <div class="page-container">
      <div class="head">
        <h2>📚 All Trainings</h2>
        <a routerLink="/admin/courses-add" class="btn">Add Training</a>
      </div>
      <app-custom-grid
        [apiUrl]="apiUrl"
        [columnDefs]="columnDefs"
        [enableRowClick]="true"
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
    .btn {
      background: #1565c0;
      color: #fff;
      padding: 0.5rem 1rem;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
    }
  `
})
export class CourseListPageComponent {
  apiUrl = '/api/courses';

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', flex: 1 },
    { field: 'name', headerName: 'Name', flex: 1.5 },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      valueFormatter: params => params.value ?? '—'
    },
    {
      field: 'hoursPerDay',
      headerName: 'Hrs/Day',
      flex: 0.7,
      valueFormatter: params => params.value ?? '—'
    },
    {
      field: 'totalDays',
      headerName: 'Total Days',
      flex: 0.8,
      valueFormatter: params => params.value ?? '—'
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      flex: 0.9,
      valueFormatter: params => params.value || '—'
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      valueFormatter: params => params.value || 'ACTIVE'
    },
    {
      field: 'templateImage',
      headerName: 'Template',
      flex: 0.6,
      cellRenderer: (params: any) => {
        if (params.value) {
          return `<img src="data:image/png;base64,${params.value}" alt="template" style="width:32px; height:32px; object-fit:cover; border-radius:4px; cursor:pointer;" />`;
        }
        return '—';
      }
    }
  ];
}
