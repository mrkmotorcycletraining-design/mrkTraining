import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../../core/components/custom-grid.component/custom-grid.component';

@Component({
  selector: 'trainer-view',
  standalone: true,
  imports: [CustomGridComponent],
  templateUrl: './trainer-view.html',
  styleUrls: ['./trainer-view.scss']
})
export class TrainerView {
  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0.5 },
    { field: 'name', headerName: 'Name', flex: 1.5 },
    { field: 'username', headerName: 'Username', flex: 1.5 },
    { field: 'branchName', headerName: 'Branch', flex: 1, valueFormatter: params => params.value || params.data?.branchId || '—' },
    { field: 'startDate', headerName: 'Start Date', flex: 1, valueFormatter: params => params.value || '—' },
    { field: 'salary', headerName: 'Salary (₹)', flex: 1, valueFormatter: params => params.value != null ? Number(params.value).toLocaleString('en-IN') : '—' },
    { field: 'available', headerName: 'Available', flex: 0.8, valueFormatter: params => params.value ? 'Yes' : 'No' }
  ];
}
