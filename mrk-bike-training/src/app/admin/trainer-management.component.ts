import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrainingApiService } from '../core/services/training-api.service';
import { TrainerApi } from '../core/models/api.models';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { TrainerActionsComponent } from './trainer-actions.component';

@Component({
  selector: 'app-trainer-management',
  standalone: true,
  imports: [RouterLink, AgGridAngular, TrainerActionsComponent],
  template: `
    @if (hasAction()) {
      <app-trainer-actions />
    } @else {
      <div class="head">
        <h2>Trainers</h2>
        <a routerLink="/admin/trainers-add" class="btn">Add Trainer</a>
      </div>
      
      <div class="search-container" style="margin: 1rem 0;">
        <input 
          class="search-input"
          placeholder="Search trainer name or email..." 
          [value]="q()" 
          (input)="q.set($any($event.target).value)" 
          style="width: 100%; max-width: 400px; padding: 0.5rem; border-radius: 6px; border: 1.5px solid #ccc;"
        />
      </div>

      <div style="height: 500px; width: 100%;" class="ag-theme-alpine">
        <ag-grid-angular
          style="width: 100%; height: 100%;"
          [rowData]="filtered()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="10"
        >
        </ag-grid-angular>
      </div>
    }
  `,
  styles: `
    .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .btn { background: #1565c0; color: #fff; padding: 0.5rem 1rem; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.9rem; }
  `
})
export class TrainerManagementComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly route = inject(ActivatedRoute);
  trainers = signal<TrainerApi[]>([]);
  q = signal('');
  hasAction = signal(false);

  columnDefs: ColDef[] = [
    { field: 'name', headerName: 'Name', sortable: true, filter: true, flex: 1.5 },
    { field: 'username', headerName: 'Username', sortable: true, filter: true, flex: 1.5 },
    { 
      field: 'active', 
      headerName: 'Active', 
      sortable: true, 
      filter: true,
      flex: 1,
      valueFormatter: params => params.value ? 'Yes' : 'No'
    },
    { 
      field: 'currentBranch.id', 
      headerName: 'Current Branch', 
      sortable: true, 
      filter: true, 
      flex: 1,
      valueFormatter: params => params.value || '—'
    },
    {
      headerName: 'Actions',
      flex: 1,
      cellRenderer: (params: any) => {
        const id = params.data.id;
        return `<a href="/admin/trainers/${id}" style="color: #1565c0; font-weight: 600; text-decoration: none; padding: 0.25rem 0.5rem; border: 1px solid #1565c0; border-radius: 4px; background-color: #f5fafd;">Edit Trainer</a>`;
      }
    }
  ];

  defaultColDef: ColDef = {
    resizable: true
  };

  filtered = computed(() => {
    const term = this.q().toLowerCase();
    return this.trainers().filter(
      (t) =>
        !term ||
        t.name?.toLowerCase().includes(term) ||
        t.username?.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.hasAction.set(!!params['action']);
    });
    this.api.listTrainers().subscribe((t) => this.trainers.set(t));
  }
}
