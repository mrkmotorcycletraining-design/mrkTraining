import { Component, inject, signal, OnInit, computed, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TrainingApiService } from '../core/services/training-api.service';
import {
  AdminClientApi,
  AssetApi,
  CourseApi,
  BranchApi,
  VehicleTypeConfigApi
} from '../core/models/api.models';

export interface TrainingDetails {
  clientId: number | null;
  branchId: string;
  assetType: string;
  selectedVehicleName: string | null;
  courseId: string;
  hoursPerDay: number | null;
  totalDays: number | null;
}

@Component({
  selector: 'app-assign-training-details',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <div class="section-header">Training Details</div>

    <!-- Client -->
    <mat-form-field appearance="outline">
      <mat-label>Client</mat-label>
      <mat-select name="clientId" [(ngModel)]="clientId" required (ngModelChange)="emitChange()">
        @for (c of clients(); track c.id) {
          <mat-option [value]="c.id">{{ c.name }} ({{ c.username }})</mat-option>
        }
      </mat-select>
      <mat-icon matSuffix>person</mat-icon>
    </mat-form-field>

    <!-- Branch -->
    <mat-form-field appearance="outline">
      <mat-label>Branch</mat-label>
      <mat-select name="branchId" [(ngModel)]="branchId" required (ngModelChange)="onBranchChange()">
        @for (b of branches(); track b.id) {
          <mat-option [value]="b.id">{{ b.name }} ({{ b.id }})</mat-option>
        }
      </mat-select>
      <mat-icon matSuffix>store</mat-icon>
    </mat-form-field>

    <!-- Vehicle Type -->
    <mat-form-field appearance="outline">
      <mat-label>Vehicle Type</mat-label>
      <mat-select name="assetType" [(ngModel)]="assetType" required (ngModelChange)="onAssetTypeChange()">
        @for (vt of vehicleTypes(); track vt.typeId) {
          <mat-option [value]="vt.type">{{ vt.label || vt.type }}</mat-option>
        }
      </mat-select>
      <mat-icon matSuffix>two_wheeler</mat-icon>
    </mat-form-field>

    <!-- Vehicle Name -->
    @if (assetType) {
      <mat-form-field appearance="outline">
        <mat-label>Select Vehicle</mat-label>
        <mat-select name="selectedVehicleName" [(ngModel)]="selectedVehicleName" (ngModelChange)="emitChange()">
          @for (name of vehicleNames(); track name) {
            <mat-option [value]="name">{{ name }}</mat-option>
          }
        </mat-select>
        <mat-icon matSuffix>directions_bike</mat-icon>
      </mat-form-field>
      @if (vehicleNames().length === 0) {
        <div class="no-data-hint">No available vehicles of this type.</div>
      }
    }

    <!-- Course -->
    <mat-form-field appearance="outline">
      <mat-label>Course / Training</mat-label>
      <mat-select name="courseId" [(ngModel)]="courseId" required (ngModelChange)="onCourseChange()">
        @for (c of courses(); track c.id) {
          <mat-option [value]="c.id">{{ c.name }} ({{ c.category }})</mat-option>
        }
      </mat-select>
      <mat-icon matSuffix>school</mat-icon>
    </mat-form-field>

    <!-- Course info: Total Training Days & Hours Per Day -->
    @if (selectedCourse()) {
      <div class="field-row">
        <mat-form-field appearance="outline">
          <mat-label>Total Training Days</mat-label>
          <input matInput name="totalDaysDisplay" type="number"
                 [value]="selectedCourse()!.totalDays" readonly disabled />
          <mat-icon matSuffix>event_note</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hours Per Day</mat-label>
          <input matInput name="hoursPerDay" type="number" min="1" max="8"
                 [(ngModel)]="hoursPerDay" required (ngModelChange)="emitChange()" />
          <mat-icon matSuffix>schedule</mat-icon>
        </mat-form-field>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .section-header {
      font-size: 0.95rem;
      font-weight: 600;
      color: #fff;
      padding: 0.4rem 0;
      margin-top: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      margin-bottom: 0.4rem;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .no-data-hint {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      font-style: italic;
      padding: 0.25rem 0;
    }
  `
})
export class AssignTrainingDetailsComponent implements OnInit {
  private readonly api = inject(TrainingApiService);

  @Output() detailsChange = new EventEmitter<TrainingDetails>();

  // Dropdown data
  clients = signal<AdminClientApi[]>([]);
  courses = signal<CourseApi[]>([]);
  branches = signal<BranchApi[]>([]);
  vehicleTypes = signal<VehicleTypeConfigApi[]>([]);
  allVehicles = signal<AssetApi[]>([]);

  assetTypeSignal = signal('');

  filteredVehicles = computed(() => {
    const type = this.assetTypeSignal();
    if (!type) return [];
    const typeUpper = type.toUpperCase();
    return this.allVehicles().filter(
      v => v.vehicleType?.type?.toUpperCase() === typeUpper
    );
  });

  vehicleNameMap = computed<Map<string, AssetApi[]>>(() => {
    const vehicles = this.filteredVehicles();
    const map = new Map<string, AssetApi[]>();
    for (const v of vehicles) {
      const name = v.name || v.id;
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(v);
    }
    return map;
  });

  vehicleNames = computed<string[]>(() => Array.from(this.vehicleNameMap().keys()));

  // Form fields
  clientId: number | null = null;
  branchId = '';
  assetType = '';
  selectedVehicleName: string | null = null;
  courseId = '';
  hoursPerDay: number | null = null;
  selectedCourse = signal<CourseApi | null>(null);

  ngOnInit() {
    // Only active clients with remaining training allowance
    this.api.listClients().subscribe({
      next: (list) => this.clients.set(
        list.filter(c => c.active !== false && (c.allowedNumOfTrainings ?? 0) > 0)
      )
    });
    // Only active courses
    this.api.listCourses('ACTIVE').subscribe({ next: (list) => this.courses.set(list) });
    // All branches (no status field on branches)
    this.api.listBranches().subscribe({ next: (list) => this.branches.set(list) });
    // Only active vehicle types
    this.api.listVehicleTypes().subscribe({
      next: (list) => this.vehicleTypes.set(list.filter(vt => vt.status !== false))
    });
  }

  onBranchChange() {
    this.loadVehiclesForBranchAndType();
    this.emitChange();
  }

  onAssetTypeChange() {
    this.selectedVehicleName = null;
    this.assetTypeSignal.set(this.assetType);
    this.loadVehiclesForBranchAndType();
    this.emitChange();
  }

  /** Fetch vehicles from API filtered by branch + vehicle type */
  private loadVehiclesForBranchAndType() {
    if (this.branchId && this.assetType) {
      this.api.listAssets(this.branchId, this.assetType).subscribe({
        next: (list) => this.allVehicles.set(
          list.filter(v => v.status?.toUpperCase() !== 'INACTIVE')
        )
      });
    } else {
      this.allVehicles.set([]);
    }
  }

  onCourseChange() {
    const course = this.courses().find(c => c.id === this.courseId) ?? null;
    this.selectedCourse.set(course);
    if (course?.hoursPerDay) {
      this.hoursPerDay = course.hoursPerDay;
    }
    this.emitChange();
  }

  emitChange() {
    const course = this.selectedCourse();
    this.detailsChange.emit({
      clientId: this.clientId,
      branchId: this.branchId,
      assetType: this.assetType,
      selectedVehicleName: this.selectedVehicleName,
      courseId: this.courseId,
      hoursPerDay: this.hoursPerDay,
      totalDays: course?.totalDays ?? null
    });
  }
}
