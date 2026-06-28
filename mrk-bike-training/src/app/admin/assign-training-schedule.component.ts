import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { TrainingApiService } from '../core/services/training-api.service';
import { CustomRangeDatetimeMultiselectComponent, DateTimeRange } from '../core/components/custom-range-datetime-multiselect/custom-range-datetime-multiselect.component';
import { TrainerAvailabilityApi, TrainerAvailabilityResponse, VehicleAvailabilityResponse } from '../core/models/api.models';
import { daysCodesToShortNames } from '../core/models/days.enum';

export interface ScheduleData {
  trainerMode: 'dateFirst' | 'trainerFirst';
  scheduleRanges: DateTimeRange[];
  selectedTotalHours: number;
}

@Component({
  selector: 'app-assign-training-schedule',
  standalone: true,
  imports: [
    FormsModule,
    MatRadioModule,
    MatIconModule,
    CustomRangeDatetimeMultiselectComponent
  ],
  template: `
    <div class="section-header">Trainer & Schedule</div>

    <div class="field-section">
      <mat-radio-group [(ngModel)]="trainerMode" name="trainerMode" class="mode-radio-group"
                       (ngModelChange)="emitChange()">
        <mat-radio-button value="dateFirst" color="primary">
          Select Date/Time and see Available Trainers
        </mat-radio-button>
        <mat-radio-button value="trainerFirst" color="primary">
          Select Trainer
        </mat-radio-button>
      </mat-radio-group>
    </div>

    <!-- Option 1: Date First -->
    @if (trainerMode === 'dateFirst') {
      <div class="mode-content">
        <!-- Required hours info -->
        @if (requiredTotalHours() > 0) {
          <div class="hours-info">
            <span><strong>Required Total Hours:</strong> {{ requiredTotalHours() }}</span>
            <span class="hours-detail">({{ totalDays() }} days × {{ hoursPerDay() }} hrs/day)</span>
          </div>
        } @else {
          <div class="hours-info hint">
            Select a course and hours per day above to see required hours.
          </div>
        }

        <!-- DateTime range multi-select -->
        <app-custom-range-datetime-multiselect
          label="Training Date & Time Ranges"
          placeholder="Click to add date-time range"
          [timeOnly]="false"
          [dateOnly]="false"
          [endTimeRequired]="true"
          [priorDateAllowed]="false"
          (rangesChange)="onScheduleRangesChange($event)"
        />

        <!-- Selected hours summary & warning -->
        @if (scheduleRanges().length > 0) {
          <div class="hours-summary">
            <span><strong>Selected Total Hours:</strong> {{ selectedTotalHours() }}</span>
            @if (requiredTotalHours() > 0) {
              @if (selectedTotalHours() < requiredTotalHours()) {
                <div class="hours-warning">
                  ⚠️ Selected hours ({{ selectedTotalHours() }}) are less than required ({{ requiredTotalHours() }}). Please add more time ranges or days.
                </div>
              } @else if (selectedTotalHours() > requiredTotalHours()) {
                <div class="hours-warning over">
                  ⚠️ Selected hours ({{ selectedTotalHours() }}) exceed required ({{ requiredTotalHours() }}). You may want to reduce ranges.
                </div>
              } @else {
                <div class="hours-match">
                  ✅ Hours match the requirement.
                </div>
              }
            }
          </div>

          <!-- Availability Results -->
          @if (loadingAvailability()) {
            <div class="loading-hint">Loading availability...</div>
          }

          <!-- Trainer Availability -->
          @if (trainerResult() && trainerResult()!.groups.length > 0) {
            <div class="availability-section">
              <label class="section-label">Available Trainers</label>
              @for (group of trainerResult()!.groups; track $index) {
                <div class="trainer-card"
                     [class.selected]="selectedGroupIndex === $index"
                     [class.full]="group.fullCoverage"
                     (click)="selectTrainerGroup($index)"
                     role="button" tabindex="0"
                     (keydown.enter)="selectTrainerGroup($index)"
                     (keydown.space)="selectTrainerGroup($index)">
                  @if (group.fullCoverage) {
                    <div class="card-badge full">Full Coverage</div>
                  } @else if (group.totalDaysCovered < group.totalDaysRequested) {
                    <div class="card-badge partial">Partial ({{ group.totalDaysCovered }}/{{ group.totalDaysRequested }} days)</div>
                  } @else {
                    <div class="card-badge combo">Combination</div>
                  }
                  @for (seg of group.segments; track seg.trainerId) {
                    <div class="segment-row">
                      <mat-icon class="seg-icon">person</mat-icon>
                      <strong>{{ seg.trainerName }}</strong>
                      <span class="seg-username">({{ seg.trainerUsername }})</span>
                      <span class="seg-info">| {{ seg.coveredDates.length }} days | Capacity: {{ seg.remainingCapacity }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }

          @if (trainerResult() && trainerResult()!.groups.length === 0 && !loadingAvailability()) {
            <div class="no-data-hint">No trainers available for the selected time at this branch.</div>
          }

          <!-- Vehicle Availability -->
          @if (vehicleResult()) {
            <div class="availability-section">
              <label class="section-label">Vehicle Availability</label>
              <div class="vehicle-status" [class]="vehicleResult()!.status.toLowerCase()">
                @if (vehicleResult()!.status === 'AVAILABLE') {
                  <mat-icon>check_circle</mat-icon>
                } @else if (vehicleResult()!.status === 'PARTIAL') {
                  <mat-icon>warning</mat-icon>
                } @else {
                  <mat-icon>cancel</mat-icon>
                }
                <span>{{ vehicleResult()!.message }}</span>
              </div>
            </div>
          }
        }
      </div>
    }

    <!-- Option 2: Trainer First -->
    @if (trainerMode === 'trainerFirst') {
      <div class="mode-content">
        @if (branchId()) {
          @if (branchTrainers().length > 0) {
            <label class="section-label">Select Trainer</label>
            <div class="trainer-dropdown-list">
              @for (t of branchTrainers(); track t.id) {
                <div class="trainer-option"
                     [class.selected]="selectedTrainerAvailId === t.id"
                     (click)="selectTrainerAvail(t.id)"
                     role="button" tabindex="0"
                     (keydown.enter)="selectTrainerAvail(t.id)"
                     (keydown.space)="selectTrainerAvail(t.id)">
                  <div class="trainer-opt-header">
                    <mat-icon>person</mat-icon>
                    <strong>{{ t.trainer?.name }}</strong>
                    <span class="trainer-opt-username">({{ t.trainer?.username }})</span>
                  </div>
                  <div class="trainer-opt-details">
                    <span>{{ t.effectiveFrom }}{{ t.effectiveTo ? ' → ' + t.effectiveTo : ' onwards' }}</span>
                    <span class="sep">|</span>
                    <span>{{ t.slotStartTime }} – {{ t.slotEndTime }}</span>
                    <span class="sep">|</span>
                    <span>Cap: {{ t.numberOfTrainingCanTake }}</span>
                    @if (t.preferredDays) {
                      <span class="sep">|</span>
                      <span class="pref-days">{{ formatDays(t.preferredDays) }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="no-data-hint">No active trainer schedules for this branch.</div>
          }
        } @else {
          <div class="no-data-hint">Please select a branch first.</div>
        }
      </div>
    }
  `,
  styles: `
    :host { display: contents; }

    .section-header {
      font-size: 0.95rem; font-weight: 600; color: #fff;
      padding: 0.4rem 0; margin-top: 0.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 0.4rem;
    }
    .field-section { margin-bottom: 0.5rem; }
    .mode-radio-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .mode-content {
      padding: 0.75rem; border: 1px solid rgba(255,255,255,0.3);
      border-radius: 8px; background: rgba(255,255,255,0.05);
    }
    .mode-placeholder { font-size: 0.85rem; color: rgba(255,255,255,0.7); font-style: italic; margin: 0; }
    .hours-info { display: flex; align-items: baseline; gap: 0.5rem; padding: 0.4rem 0; font-size: 0.85rem; color: #fff; margin-bottom: 0.5rem; }
    .hours-info.hint { color: rgba(255,255,255,0.6); font-style: italic; }
    .hours-detail { font-size: 0.75rem; color: rgba(255,255,255,0.6); }
    .hours-summary { margin-top: 0.5rem; font-size: 0.85rem; color: #fff; }
    .hours-warning { margin-top: 0.3rem; padding: 0.4rem 0.6rem; background: rgba(255,200,0,0.15); border: 1px solid rgba(255,200,0,0.5); border-radius: 6px; font-size: 0.8rem; color: #fff; }
    .hours-warning.over { background: rgba(255,165,0,0.15); border-color: rgba(255,165,0,0.5); }
    .hours-match { margin-top: 0.3rem; padding: 0.4rem 0.6rem; background: rgba(0,200,100,0.15); border: 1px solid rgba(0,200,100,0.5); border-radius: 6px; font-size: 0.8rem; color: #fff; }
    .loading-hint { font-size: 0.8rem; color: rgba(255,255,255,0.6); font-style: italic; margin-top: 0.5rem; }
    .no-data-hint { font-size: 0.8rem; color: rgba(255,255,255,0.6); font-style: italic; padding: 0.25rem 0; }

    .trainer-dropdown-list { display: flex; flex-direction: column; gap: 0.4rem; max-height: 280px; overflow-y: auto; }
    .trainer-option {
      border: 2px solid rgba(255,255,255,0.35); border-radius: 8px;
      padding: 0.5rem 0.65rem; cursor: pointer;
      transition: border-color 0.2s, background 0.2s; background: rgba(255,255,255,0.03);
    }
    .trainer-option:hover { border-color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.08); }
    .trainer-option.selected { border-color: #fff; background: rgba(255,255,255,0.12); box-shadow: 0 0 0 1px #fff; }
    .trainer-option:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
    .trainer-opt-header { display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; color: #fff; }
    .trainer-opt-header mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .trainer-opt-username { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
    .trainer-opt-details { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: rgba(255,255,255,0.7); padding-left: 1.4rem; margin-top: 0.15rem; }
    .trainer-opt-details .sep { color: rgba(255,255,255,0.4); }
    .trainer-opt-details .pref-days { color: rgba(180,220,255,0.9); font-weight: 500; }

    .availability-section { margin-top: 0.75rem; }
    .section-label { display: block; font-size: 0.85rem; font-weight: 500; color: #fff; margin-bottom: 0.4rem; }

    .trainer-card {
      border: 2px solid rgba(255,255,255,0.4); border-radius: 8px;
      padding: 0.5rem 0.65rem; cursor: pointer; margin-bottom: 0.4rem;
      transition: border-color 0.2s, background 0.2s; background: rgba(255,255,255,0.05);
    }
    .trainer-card:hover { border-color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.1); }
    .trainer-card.selected { border-color: #fff; background: rgba(255,255,255,0.15); box-shadow: 0 0 0 1px #fff; }
    .trainer-card:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

    .card-badge { display: inline-block; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px; margin-bottom: 0.3rem; font-weight: 600; }
    .card-badge.full { background: rgba(0,200,100,0.3); color: #fff; }
    .card-badge.partial { background: rgba(255,200,0,0.3); color: #fff; }
    .card-badge.combo { background: rgba(100,150,255,0.3); color: #fff; }

    .segment-row { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: #fff; }
    .seg-icon { font-size: 16px; width: 16px; height: 16px; }
    .seg-username { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
    .seg-info { font-size: 0.7rem; color: rgba(255,255,255,0.6); }

    .vehicle-status { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.6rem; border-radius: 6px; font-size: 0.8rem; color: #fff; }
    .vehicle-status.available { background: rgba(0,200,100,0.15); border: 1px solid rgba(0,200,100,0.5); }
    .vehicle-status.partial { background: rgba(255,200,0,0.15); border: 1px solid rgba(255,200,0,0.5); }
    .vehicle-status.not_available { background: rgba(255,80,80,0.15); border: 1px solid rgba(255,80,80,0.5); }
    .vehicle-status mat-icon { font-size: 18px; width: 18px; height: 18px; }

    ::ng-deep .mat-mdc-radio-button .mdc-label { color: #fff !important; }
    ::ng-deep .mat-mdc-radio-button .mdc-radio__outer-circle { border-color: rgba(255,255,255,0.7) !important; }
  `
})
export class AssignTrainingScheduleComponent {
  private readonly api = inject(TrainingApiService);

  totalDays = signal<number>(0);
  hoursPerDay = signal<number>(0);
  branchId = signal<string>('');
  vehicleType = signal<string>('');
  vehicleName = signal<string | null>(null);

  @Input() set inputTotalDays(val: number | null) { this.totalDays.set(val ?? 0); }
  @Input() set inputHoursPerDay(val: number | null) { this.hoursPerDay.set(val ?? 0); }
  @Input() set inputBranchId(val: string) {
    this.branchId.set(val || '');
    this.loadBranchTrainers(val || '');
  }
  @Input() set inputVehicleType(val: string) { this.vehicleType.set(val || ''); }
  @Input() set inputVehicleName(val: string | null) { this.vehicleName.set(val); }

  @Output() scheduleChange = new EventEmitter<ScheduleData>();

  trainerMode: 'dateFirst' | 'trainerFirst' = 'dateFirst';
  scheduleRanges = signal<DateTimeRange[]>([]);
  selectedTotalHours = signal(0);
  selectedGroupIndex: number | null = null;
  selectedTrainerAvailId: number | null = null;

  // Trainer availability for Option 2
  branchTrainers = signal<TrainerAvailabilityApi[]>([]);

  // Availability results
  trainerResult = signal<TrainerAvailabilityResponse | null>(null);
  vehicleResult = signal<VehicleAvailabilityResponse | null>(null);
  loadingAvailability = signal(false);

  requiredTotalHours = computed(() => {
    const days = this.totalDays();
    const hpd = this.hoursPerDay();
    return days > 0 && hpd > 0 ? days * hpd : 0;
  });

  onScheduleRangesChange(ranges: DateTimeRange[]) {
    this.scheduleRanges.set(ranges);
    let totalHours = 0;

    for (const range of ranges) {
      const start = this.parseDateTime(range.start);
      const end = this.parseDateTime(range.end);
      if (!start || !end) continue;

      const startDateOnly = new Date(start.year, start.month - 1, start.day);
      const endDateOnly = new Date(end.year, end.month - 1, end.day);
      const diffMs = endDateOnly.getTime() - startDateOnly.getTime();
      const numDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

      const startMinutes = start.hour * 60 + start.minute;
      const endMinutes = end.hour * 60 + end.minute;
      const hpd = Math.max(0, (endMinutes - startMinutes) / 60);

      totalHours += hpd * numDays;
    }

    this.selectedTotalHours.set(Math.round(totalHours * 100) / 100);
    this.emitChange();

    // Trigger availability check
    if (ranges.length > 0) {
      this.checkAvailability(ranges);
    } else {
      this.trainerResult.set(null);
      this.vehicleResult.set(null);
    }
  }

  selectTrainerGroup(index: number) {
    this.selectedGroupIndex = index;
  }

  selectTrainerAvail(id: number) {
    this.selectedTrainerAvailId = id;
  }

  formatDays(days: string): string {
    return daysCodesToShortNames(days);
  }

  private loadBranchTrainers(branchId: string) {
    this.branchTrainers.set([]);
    this.selectedTrainerAvailId = null;
    if (!branchId) return;

    this.api.listTrainerAvailability().subscribe({
      next: (list) => {
        const filtered = list.filter(s => s.branchId === branchId && s.isActive !== false);
        this.branchTrainers.set(filtered);
      }
    });
  }

  emitChange() {
    this.scheduleChange.emit({
      trainerMode: this.trainerMode,
      scheduleRanges: this.scheduleRanges(),
      selectedTotalHours: this.selectedTotalHours()
    });
  }

  private checkAvailability(ranges: DateTimeRange[]) {
    const branch = this.branchId();
    if (!branch) return;

    this.loadingAvailability.set(true);
    this.trainerResult.set(null);
    this.vehicleResult.set(null);
    this.selectedGroupIndex = null;

    const apiRanges = ranges.map(r => this.toApiRange(r)).filter(r => r !== null);
    if (apiRanges.length === 0) {
      this.loadingAvailability.set(false);
      return;
    }

    // Call trainer availability API
    this.api.checkTrainerAvailability({ branchId: branch, ranges: apiRanges }).subscribe({
      next: (res) => this.trainerResult.set(res),
      error: () => this.trainerResult.set({ groups: [] })
    });

    // Call vehicle availability API if vehicle info is selected
    const vType = this.vehicleType();
    const vName = this.vehicleName();
    if (vType && vName) {
      this.api.checkVehicleAvailability({
        branchId: branch, vehicleType: vType, vehicleName: vName, ranges: apiRanges
      }).subscribe({
        next: (res) => {
          this.vehicleResult.set(res);
          this.loadingAvailability.set(false);
        },
        error: () => {
          this.vehicleResult.set(null);
          this.loadingAvailability.set(false);
        }
      });
    } else {
      this.loadingAvailability.set(false);
    }
  }

  /** Convert "DD/MM/YYYY HH:MM AM/PM" range to API format {startDate, endDate, startTime, endTime} */
  private toApiRange(range: DateTimeRange): { startDate: string; endDate: string; startTime: string; endTime: string } | null {
    const start = this.parseDateTime(range.start);
    const end = this.parseDateTime(range.end);
    if (!start || !end) return null;

    return {
      startDate: `${start.year}-${String(start.month).padStart(2, '0')}-${String(start.day).padStart(2, '0')}`,
      endDate: `${end.year}-${String(end.month).padStart(2, '0')}-${String(end.day).padStart(2, '0')}`,
      startTime: `${String(start.hour).padStart(2, '0')}:${String(start.minute).padStart(2, '0')}:00`,
      endTime: `${String(end.hour).padStart(2, '0')}:${String(end.minute).padStart(2, '0')}:00`
    };
  }

  private parseDateTime(dtStr: string): { year: number; month: number; day: number; hour: number; minute: number } | null {
    if (!dtStr) return null;
    const match = dtStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    const [, dayStr, monthStr, yearStr, hourStr, minStr, ampm] = match;
    let hour = parseInt(hourStr, 10);
    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return {
      year: parseInt(yearStr, 10),
      month: parseInt(monthStr, 10),
      day: parseInt(dayStr, 10),
      hour,
      minute: parseInt(minStr, 10)
    };
  }
}
