import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../calendar/calendar';
import { MetadataFieldConfig } from '../calendar/components/booking-form-modal';
import { QuickTemplate } from '../calendar/components/quick-menu';
import {
  CalendarResource,
  CalendarEvent,
  MetaFilterDefinition,
  DragMutationEvent,
  CloneRequestEvent
} from '../calendar/models/calendar.types';
import { ScheduleDataService } from '../services/schedule-data.service';
import { BranchAdd } from '../components/branch/branch-add';
import { BranchView } from '../components/branch/branch-view';
import { VehicleAdd } from '../components/vehicle/vehicle-add';
import { VehicleView } from '../components/vehicle/vehicle-view';
import { TrainerAdd } from '../components/trainer/trainer-add';
import { TrainerView } from '../components/trainer/trainer-view';
import { ClientAdd } from '../components/client/client-add';
import { ClientView } from '../components/client/client-view';

/** Pre-auth calendar demo preserved under /admin/calendar */
@Component({
  selector: 'app-legacy-calendar-demo',
  standalone: true,
  imports: [
    CommonModule,
    CalendarComponent,
    BranchAdd, BranchView,
    VehicleAdd, VehicleView,
    TrainerAdd, TrainerView,
    ClientAdd, ClientView
  ],
  templateUrl: './legacy-calendar-demo.html',
  styleUrl: './legacy-calendar-demo.scss'
})
export class LegacyCalendarDemoComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(ScheduleDataService);

  private readonly keyDownListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.dialogOpen()) {
      this.closeDialog();
    }
  };

  ngOnInit() {
    window.addEventListener('keydown', this.keyDownListener);
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.keyDownListener);
  }

  protected readonly currentTheme = signal<'light' | 'dark'>('light');
  protected readonly navOpen = signal<boolean>(false);
  protected readonly eventContextMenu = signal<{ x: number; y: number; event: CalendarEvent } | null>(null);
  protected readonly showAlertMessage = signal<string | null>(null);
  protected readonly dialogOpen = signal<string | null>(null);
  protected readonly activeBookings = this.dataService.events;
  protected readonly fleetResources = signal<CalendarResource[]>([
    { id: 'CAT_GEARED', name: 'Geared Motorcycles', status: 'ACTIVE', colorTheme: '#D32F2F' },
    { id: 101, name: 'TVS Apache RTR 200', parentId: 'CAT_GEARED', status: 'ACTIVE' }
  ]);
  protected readonly filterSchema = signal<MetaFilterDefinition[]>([]);
  protected readonly formMetadataFields: MetadataFieldConfig[] = [];
  protected readonly quickTemplates: QuickTemplate[] = [];
  protected readonly pendingEditEventId = signal<string | number | null>(null);

  protected handleEventChanged(change: DragMutationEvent | { event: CalendarEvent; originalEvent?: CalendarEvent }) {
    if ('eventId' in change) {
      this.dataService.update(change.eventId, {
        resourceId: change.targetResourceId,
        startTime: change.newStartTime,
        endTime: change.newEndTime
      });
    } else {
      this.dataService.update(change.event.id, change.event);
    }
  }

  protected handleEventCreated(payload: Partial<CalendarEvent>) {
    this.dataService.append(payload);
  }

  protected handleEventCloned(_clonePayload: CloneRequestEvent) {}

  protected handleEventDeleted(id: string | number) {
    this.dataService.delete(id);
  }

  protected toggleNav() { this.navOpen.set(!this.navOpen()); }
  protected closeNav() { this.navOpen.set(false); }
  protected toggleTheme() {
    this.currentTheme.set(this.currentTheme() === 'light' ? 'dark' : 'light');
  }

  protected onEventContextMenuRequest(payload: { x: number; y: number; event: CalendarEvent }) {
    this.eventContextMenu.set(payload);
  }

  protected onContextEdit(event: CalendarEvent) {
    this.eventContextMenu.set(null);
    this.pendingEditEventId.set(event.id);
  }

  protected onContextDelete(event: CalendarEvent) {
    this.eventContextMenu.set(null);
    if (confirm(`Delete "${event.title}"?`)) {
      this.handleEventDeleted(event.id);
    }
  }

  protected closeContextMenu() { this.eventContextMenu.set(null); }
  protected closeDialog() { this.dialogOpen.set(null); }
  protected openBranchAdd() { this.closeNav(); this.dialogOpen.set('branch-add'); }
  protected openBranchView() { this.closeNav(); this.dialogOpen.set('branch-view'); }
  protected openVehicleAdd() { this.closeNav(); this.dialogOpen.set('vehicle-add'); }
  protected openVehicleView() { this.closeNav(); this.dialogOpen.set('vehicle-view'); }
  protected openTrainerAdd() { this.closeNav(); this.dialogOpen.set('trainer-add'); }
  protected openTrainerView() { this.closeNav(); this.dialogOpen.set('trainer-view'); }
  protected openClientAdd() { this.closeNav(); this.dialogOpen.set('client-add'); }
  protected openClientView() { this.closeNav(); this.dialogOpen.set('client-view'); }
  protected scheduleAdd() { this.closeNav(); this.dialogOpen.set('branch-add'); }
  protected scheduleModify() { this.closeNav(); this.dialogOpen.set('branch-view'); }
  protected scheduleMarkAbsent() { this.closeNav(); this.showAlertMessage.set('Mark absent action not implemented in demo'); setTimeout(() => this.showAlertMessage.set(null), 3000); }
  protected openMetrics() { this.closeNav(); this.showAlertMessage.set('Metrics panel is not available in demo'); setTimeout(() => this.showAlertMessage.set(null), 3000); }
}
