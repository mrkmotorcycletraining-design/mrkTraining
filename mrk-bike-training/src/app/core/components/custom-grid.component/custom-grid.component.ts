import { Component, Input, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ColDef, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  /** Optional key to extract row data from a nested API response object (e.g., 'slots') */
  @Input() rowDataPath: string | null = null;

  private readonly dialog = inject(MatDialog);

  rowData$!: Observable<any[]>;

  public defaultColDef: ColDef = {
    sortable: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    resizable: true,
    flex: 1,
    cellDataType: false,
    floatingFilterComponentParams: {
      placeholder: 'Search...'
    },
    filterParams: {
      filterPlaceholder: 'Search...'
    },
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.apiUrl) {
      if (this.rowDataPath) {
        this.rowData$ = this.http.get<any>(this.apiUrl).pipe(
          map(response => response[this.rowDataPath!] ?? [])
        );
      } else {
        this.rowData$ = this.http.get<any[]>(this.apiUrl);
      }
    }
  }

  onGridReady(_params: GridReadyEvent) {
    // Add placeholder to all floating filter inputs
    setTimeout(() => {
      const gridEl = document.querySelector('.ag-theme-quartz');
      if (gridEl) {
        const inputs = gridEl.querySelectorAll('.ag-floating-filter-body input');
        inputs.forEach(input => {
          if (!input.getAttribute('placeholder')) {
            input.setAttribute('placeholder', 'Search...');
          }
        });
      }
    }, 100);
  }

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
