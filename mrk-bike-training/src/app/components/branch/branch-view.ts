import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { CustomGridComponent } from '../../core/components/custom-grid.component/custom-grid.component';

@Component({
  selector: 'branch-view',
  standalone: true,
  imports: [CustomGridComponent],
  templateUrl: './branch-view.html',
  styleUrls: ['./branch-view.scss']
})
export class BranchView {
  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', flex: 1 },
    { field: 'name', headerName: 'Name', flex: 1.5 },
    { field: 'locationAddress', headerName: 'Address', flex: 2, valueFormatter: params => params.value || '—' }
  ];
}
