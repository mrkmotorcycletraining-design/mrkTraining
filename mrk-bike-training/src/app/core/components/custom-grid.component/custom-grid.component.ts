import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'app-custom-grid',
  standalone: true,
  templateUrl: './custom-grid.component.html',
  styleUrls: ['./custom-grid.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [AgGridAngular, AsyncPipe]
})
export class CustomGridComponent implements OnInit {
  @Input() apiUrl!: string;
  @Input() columnDefs: ColDef[] = [];
  @Input() theme = 'ag-theme-alpine';

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
}
