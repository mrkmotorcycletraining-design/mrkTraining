import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../../core/components/custom-grid.component/custom-grid.component';

@Component({
  selector: 'client-view',
  standalone: true,
  imports: [CustomGridComponent],
  templateUrl: './client-view.html',
  styleUrls: ['./client-view.scss']
})
export class ClientView {
  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0.5 },
    { field: 'name', headerName: 'Name', flex: 1.5 },
    { field: 'username', headerName: 'Username', flex: 1.5 },
    { field: 'heightFt', headerName: 'Height (ft)', flex: 1, valueFormatter: params => params.value ?? '—' },
    { field: 'weightKg', headerName: 'Weight (kg)', flex: 1, valueFormatter: params => params.value ?? '—' }
  ];
}
