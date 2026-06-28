import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../core/components/custom-grid.component/custom-grid.component';

@Component({
  selector: 'app-trainings-list',
  standalone: true,
  imports: [RouterLink, CustomGridComponent],
  template: `
    <div class="page-container">
      <div class="head">
        <h2>📋 My Trainings</h2>
        <a routerLink="/client/trainings/apply" class="btn">Apply New Training</a>
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
export class TrainingsListComponent {
  apiUrl = '/api/enrollments/mine';

  columnDefs: ColDef[] = [
    {
      field: 'course.name',
      headerName: 'Course',
      flex: 1.5,
      valueFormatter: params => params.value ?? '—'
    },
    {
      field: 'course.category',
      headerName: 'Category',
      flex: 1,
      valueFormatter: params => params.value ?? '—'
    },
    {
      field: 'branch.name',
      headerName: 'Branch',
      flex: 1,
      valueFormatter: params => params.value ?? '—'
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      valueFormatter: params => params.value ?? '—'
    },
    {
      field: 'enrollmentDate',
      headerName: 'Enrolled',
      flex: 0.9,
      valueFormatter: params => params.value ? new Date(params.value).toLocaleDateString() : '—'
    },
    {
      field: 'totalAmountPaid',
      headerName: 'Amount Paid',
      flex: 0.8,
      valueFormatter: params => params.value != null ? `₹${params.value}` : '—'
    },
    {
      field: 'bufferDaysAllocated',
      headerName: 'Buffer Days',
      flex: 0.7,
      valueFormatter: params => params.value != null ? `${params.value}` : '—'
    }
  ];
}
