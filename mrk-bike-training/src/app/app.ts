import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from './calendar/calendar';
import { MetadataFieldConfig } from './calendar/components/booking-form-modal';
import { QuickTemplate } from './calendar/components/quick-menu';
import {
  CalendarResource,
  CalendarEvent,
  MetaFilterDefinition,
  DragMutationEvent,
  CloneRequestEvent
} from './calendar/models/calendar.types';
import { ScheduleDataService } from './services/schedule-data.service';
import { BranchAdd } from './components/branch/branch-add';
import { BranchView } from './components/branch/branch-view';
import { VehicleAdd } from './components/vehicle/vehicle-add';
import { VehicleView } from './components/vehicle/vehicle-view';
import { TrainerAdd } from './components/trainer/trainer-add';
import { TrainerView } from './components/trainer/trainer-view';
import { ClientAdd } from './components/client/client-add';
import { ClientView } from './components/client/client-view';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    CalendarComponent,
    BranchAdd, BranchView,
    VehicleAdd, VehicleView,
    TrainerAdd, TrainerView,
    ClientAdd, ClientView
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
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

  // ── Theme ──────────────────────────────────────────────────────────────────
  protected readonly currentTheme = signal<'light' | 'dark'>('light');

  // ── Navbar ─────────────────────────────────────────────────────────────────
  protected readonly navOpen = signal<boolean>(false);

  // ── Context menu ───────────────────────────────────────────────────────────
  protected readonly eventContextMenu = signal<{
    x: number; y: number; event: CalendarEvent;
  } | null>(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  protected readonly showAlertMessage = signal<string | null>(null);

  // ── Modal dialog state ─────────────────────────────────────────────────────
  protected readonly dialogOpen = signal<string | null>(null);

  // ── Calendar data ──────────────────────────────────────────────────────────
  protected readonly activeBookings = this.dataService.events;

  protected readonly fleetResources = signal<CalendarResource[]>([
    { id: 'CAT_GEARED',  name: 'Geared Motorcycles',    status: 'ACTIVE',       colorTheme: '#D32F2F' },
    { id: 101,           name: 'TVS Apache RTR 200',     parentId: 'CAT_GEARED', status: 'ACTIVE' },
    { id: 102,           name: 'Royal Enfield Meteor 350', parentId: 'CAT_GEARED', status: 'ACTIVE' },
    { id: 'CAT_AUTO',    name: 'Automatic Scooters',     status: 'ACTIVE',       colorTheme: '#388E3C' },
    { id: 201,           name: 'Honda Activa 6G',        parentId: 'CAT_AUTO',   status: 'MAINTENANCE' },
    { id: 'CAT_CRUISER', name: 'Cruisers & Adventure',   status: 'ACTIVE',       colorTheme: '#1565C0' },
    { id: 301,           name: 'Royal Enfield Himalayan 450', parentId: 'CAT_CRUISER', status: 'ACTIVE' }
  ]);

  protected readonly filterSchema = signal<MetaFilterDefinition[]>([
    {
      key: 'metadata.locationBranchId',
      label: 'Branch Location',
      type: 'select',
      options: [
        { value: 501, label: 'Metro Main Training Center' },
        { value: 502, label: 'Downtown Speed Hub' }
      ]
    },
    {
      key: 'metadata.trainerId',
      label: 'Instructor Assignment',
      type: 'checkbox',
      options: [
        { value: 'Instructor Alex', label: 'Instructor Alex' },
        { value: 'Instructor Jane', label: 'Instructor Jane' },
        { value: 'Instructor Bob',  label: 'Instructor Bob' }
      ]
    }
  ]);

  protected readonly formMetadataFields: MetadataFieldConfig[] = [
    {
      key: 'locationBranchId',
      label: 'Training Branch',
      type: 'select',
      required: true,
      options: [
        { value: 501, label: 'Metro Main Training Center' },
        { value: 502, label: 'Downtown Speed Hub' }
      ]
    },
    {
      key: 'trainerId',
      label: 'Assigned Trainer',
      type: 'select',
      required: true,
      options: [
        { value: 'Instructor Alex', label: 'Instructor Alex' },
        { value: 'Instructor Jane', label: 'Instructor Jane' },
        { value: 'Instructor Bob',  label: 'Instructor Bob' }
      ]
    },
    { key: 'clientId', label: 'Client Name / Phone', type: 'text', required: true }
  ];

  protected readonly quickTemplates: QuickTemplate[] = [
    { title: 'Demo Ride Session',        durationMinutes: 90,  metadata: { locationBranchId: 501, trainerId: 'Instructor Alex' } },
    { title: 'Introductory Lesson',      durationMinutes: 60,  metadata: { locationBranchId: 501, trainerId: 'Instructor Jane' } },
    { title: 'Routine Bike Maintenance', durationMinutes: 120, metadata: { locationBranchId: 502, trainerId: 'Instructor Bob'  } },
    { title: 'Road Trip Booking',        durationMinutes: 240, metadata: { locationBranchId: 501, trainerId: 'Instructor Alex' } }
  ];

  // ── Pending edit ───────────────────────────────────────────────────────────
  protected readonly pendingEditEventId = signal<string | number | null>(null);

  // ── Event handlers ─────────────────────────────────────────────────────────

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

  protected handleEventCloned(clonePayload: CloneRequestEvent) {
    const source = this.activeBookings().find(e => e.id === clonePayload.eventId);
    if (!source) return;

    clonePayload.targetDates.forEach(dateStr => {
      const sourceStart = new Date(source.startTime);
      const sourceEnd   = new Date(source.endTime);
      const newStart    = new Date(dateStr);
      const newEnd      = new Date(dateStr);

      if (clonePayload.maintainTimeSlots) {
        newStart.setHours(sourceStart.getHours(), sourceStart.getMinutes(), 0, 0);
        newEnd.setHours(sourceEnd.getHours(),   sourceEnd.getMinutes(),   0, 0);
      } else {
        newStart.setHours(9,  0, 0, 0);
        newEnd.setHours(17, 0, 0, 0);
      }

      this.dataService.append({
        resourceId: source.resourceId,
        title:      `${source.title} (Cloned)`,
        startTime:  newStart,
        endTime:    newEnd,
        status:     source.status,
        metadata:   { ...source.metadata }
      });
    });
  }

  protected handleEventDeleted(id: string | number) {
    this.dataService.delete(id);
  }

  // ── Navbar ─────────────────────────────────────────────────────────────────

  protected toggleNav()  { this.navOpen.set(!this.navOpen()); }
  protected closeNav()   { this.navOpen.set(false); }

  // ── Theme ──────────────────────────────────────────────────────────────────

  protected toggleTheme() {
    this.currentTheme.set(this.currentTheme() === 'light' ? 'dark' : 'light');
  }

  // ── Context menu ───────────────────────────────────────────────────────────

  protected onEventContextMenuRequest(payload: { x: number; y: number; event: CalendarEvent }) {
    const menuW = 200, menuH = 110;
    const x = payload.x + menuW > window.innerWidth  ? window.innerWidth  - menuW - 8 : payload.x;
    const y = payload.y + menuH > window.innerHeight ? window.innerHeight - menuH - 8 : payload.y;
    this.eventContextMenu.set({ x, y, event: payload.event });
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
  protected closeDialog()      { this.dialogOpen.set(null); }

  // ── Nav menu actions ───────────────────────────────────────────────────────

  protected openBranchAdd()   { this.closeNav(); this.dialogOpen.set('branch-add'); }
  protected openBranchView()  { this.closeNav(); this.dialogOpen.set('branch-view'); }
  protected openVehicleAdd()  { this.closeNav(); this.dialogOpen.set('vehicle-add'); }
  protected openVehicleView() { this.closeNav(); this.dialogOpen.set('vehicle-view'); }
  protected openTrainerAdd()  { this.closeNav(); this.dialogOpen.set('trainer-add'); }
  protected openTrainerView() { this.closeNav(); this.dialogOpen.set('trainer-view'); }
  protected openClientAdd()   { this.closeNav(); this.dialogOpen.set('client-add'); }
  protected openClientView()  { this.closeNav(); this.dialogOpen.set('client-view'); }

  protected scheduleAdd()         { this.closeNav(); this.triggerAlert('Schedule: Add'); }
  protected scheduleModify()      { this.closeNav(); this.triggerAlert('Schedule: Modify'); }
  protected scheduleMarkAbsent()  { this.closeNav(); this.triggerAlert('Schedule: Mark Absent'); }
  protected openMetrics()         { this.closeNav(); this.triggerAlert('Open: Metrics'); }

  // ── Toast ──────────────────────────────────────────────────────────────────

  private triggerAlert(msg: string) {
    this.showAlertMessage.set(msg);
    setTimeout(() => this.showAlertMessage.set(null), 3000);
  }
}
