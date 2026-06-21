import { Component, Input, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ColDef, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RowDetailDialogComponent } from './row-detail-dialog.component';

@Component({
  selector: 'app-custom-grid',
  standalone: true,
  templateUrl: './custom-grid.component.html',
  styleUrls: ['./custom-grid.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [AgGridAngular, AsyncPipe, MatDialogModule]
})
export class CustomGridComponent implements OnInit {
  @Input() apiUrl!: string;
  @Input() columnDefs: ColDef[] = [];
  @Input() theme = 'ag-theme-alpine';
  @Input() enableRowClick = false;

  private readonly dialog = inject(MatDialog);

  rowData$!: Observable<any[]>;

  public defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.apiUrl) {
      this.rowData$ = this.http.get<any[]>(this.apiUrl);
    }
  }

  onGridReady(_params: GridReadyEvent) {}

  onRowClicked(event: RowClickedEvent) {
    if (!this.enableRowClick || !event.data) return;

    this.dialog.open(RowDetailDialogComponent, {
      data: { row: event.data, columnDefs: this.columnDefs },
      width: '90vw',
      maxWidth: '700px',
      maxHeight: '90vh',
      panelClass: 'row-detail-dialog'
    });
  }
}
