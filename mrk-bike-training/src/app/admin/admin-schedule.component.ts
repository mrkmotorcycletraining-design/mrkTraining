import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CalendarComponent } from '../calendar/calendar';
import { TrainingApiService } from '../core/services/training-api.service';
import { assetsToResources, slotsToEvents } from '../core/utils/calendar-mapper';
import { CalendarEvent, CalendarResource, DragMutationEvent } from '../calendar/models/calendar.types';
import { AdminClientApi } from '../core/models/api.models';
import { MetadataFieldConfig } from '../calendar/components/booking-form-modal';
import { QuickTemplate } from '../calendar/components/quick-menu';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CalendarComponent, FormsModule],
  template: `
    <div class="admin-schedule-container">
      <div class="admin-schedule-header">
        <h2>Branch schedule</h2>
        <div class="admin-filters">
          <label>Branch
            <select [(ngModel)]="branchId" (ngModelChange)="reload()" name="branch">
              @for (b of branches(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
            </select>
          </label>
          <label>Trainer
            <select [(ngModel)]="trainerFilter" (ngModelChange)="reload()" name="trainer">
              <option value="">All</option>
              @for (t of trainers(); track t.id) { <option [value]="t.id">{{ t.name }}</option> }
            </select>
          </label>
          <label>Asset Type
            <select [(ngModel)]="assetTypeFilter" (ngModelChange)="reload()" name="assetType">
              <option value="">All</option>
              @for (a of assetTypes(); track a) { <option [value]="a">{{ a }}</option> }
            </select>
          </label>
          <label>Client
            <select [(ngModel)]="clientFilter" (ngModelChange)="reload()" name="client">
              <option value="">All</option>
              @for (c of clients(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </label>
        </div>
      </div>
      
      <div class="calendar-full-container">
        <app-calendar
          #cal
          [resources]="resources()"
          [events]="events()"
          viewMode="month"
          [readOnly]="false"
          [metadataFormFields]="metadataFields"
          [quickTemplates]="quickTemplates"
          (eventSelected)="onSelect($event)"
          (eventCreated)="onEventCreated($event)"
          (eventChanged)="onEventChanged($event)"
          (eventDeleted)="onEventDeleted($event)"
        ></app-calendar>
      </div>
    </div>
  `,
  styles: `
    .admin-schedule-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 120px);
      gap: 1rem;
    }
    
    .admin-schedule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      flex-shrink: 0;
    }
    
    .admin-schedule-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .admin-filters {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    
    .admin-filters label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .admin-filters select {
      padding: 0.4rem 0.6rem;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 0.875rem;
      min-width: 120px;
    }
    
    .calendar-full-container {
      flex: 1;
      min-height: 0;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }
  `
})
export class AdminScheduleComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);
  events = signal<CalendarEvent[]>([]);
  resources = signal<CalendarResource[]>([]);
  branches = signal<{ id: string; name?: string }[]>([]);
  clients = signal<AdminClientApi[]>([]);
  trainers = signal<any[]>([]);
  assetTypes = signal<string[]>([]);
  branchId = '';
  clientFilter = '';
  trainerFilter = '';
  assetTypeFilter = '';

  // Configure metadata fields for schedule creation
  metadataFields: MetadataFieldConfig[] = [
    { key: 'trainerId', label: 'Trainer', type: 'select', options: [] },
    { key: 'clientId', label: 'Client', type: 'select', options: [] },
    { key: 'branchId', label: 'Branch', type: 'select', options: [] }
  ];

  // Quick templates for common schedule types
  quickTemplates: QuickTemplate[] = [
    {
      title: 'Regular Training',
      durationMinutes: 120,
      metadata: { type: 'REGULAR_TRAINING' }
    },
    {
      title: 'Premium Training',
      durationMinutes: 90,
      metadata: { type: 'PREMIUM_TRAINING' }
    },
    {
      title: 'Buffer Session',
      durationMinutes: 60,
      metadata: { type: 'BUFFER_SESSION' }
    }
  ];

  ngOnInit() {
    this.api.listBranches().subscribe((b) => {
      this.branches.set(b);
      // Update metadata fields with branch options
      this.metadataFields = this.metadataFields.map(field => {
        if (field.key === 'branchId') {
          return { ...field, options: b.map(branch => ({ value: branch.id, label: branch.name || branch.id })) };
        }
        return field;
      });
      if (b.length) {
        this.branchId = b[0].id;
        this.reload();
      }
    });
    this.api.listClients().subscribe((c) => {
      this.clients.set(c);
      // Update metadata fields with client options
      this.metadataFields = this.metadataFields.map(field => {
        if (field.key === 'clientId') {
          return { ...field, options: c.map(client => ({ value: client.id, label: client.name || client.id.toString() })) };
        }
        return field;
      });
    });
    this.api.listTrainers().subscribe((t) => {
      this.trainers.set(t);
      // Update metadata fields with trainer options
      this.metadataFields = this.metadataFields.map(field => {
        if (field.key === 'trainerId') {
          return { ...field, options: t.map(trainer => ({ value: trainer.id, label: trainer.name || trainer.id.toString() })) };
        }
        return field;
      });
    });
    // Derive asset types from assets endpoint for filter options
    this.api.listAssets().subscribe((a) => {
      const types = Array.from(new Set(a.map((x) => x.vehicleType?.type).filter(Boolean)));
      this.assetTypes.set(types as string[]);
    });
  }

  reload() {
    if (!this.branchId) return;
    console.log('Loading assets for branch:', this.branchId);
    this.api.listAssets(this.branchId).subscribe({
      next: (a) => {
        console.log('Assets loaded:', a);
        const resources = assetsToResources(a);
        console.log('Converted to resources:', resources);
        this.resources.set(resources);
      },
      error: (err) => console.error('Error loading assets:', err)
    });
    const opts: { branchId: string; clientId?: string; trainerId?: string; assetType?: string } = { branchId: this.branchId };
    if (this.clientFilter) opts.clientId = this.clientFilter;
    if (this.trainerFilter) opts.trainerId = this.trainerFilter;
    if (this.assetTypeFilter) opts.assetType = this.assetTypeFilter;
    console.log('Loading slots with opts:', opts);
    this.api.listSlots(opts).subscribe({
      next: (response) => {
        console.log('Slots response:', response);
        const slots = response.slots || [];
        console.log('Converted slots:', slots);
        this.events.set(slotsToEvents(slots));
      },
      error: (err) => console.error('Error loading slots:', err)
    });
  }

  onSelect(ev: CalendarEvent) {
    if (ev.status === 'PENDING') {
      this.router.navigate(['/admin/pending']);
    }
  }

  onEventCreated(event: Partial<CalendarEvent>) {
    console.log('Event created:', event);
    // Convert to API format and send to backend
    // For now, just add to local events
    const newEvent: CalendarEvent = {
      id: Date.now(), // Temporary ID
      resourceId: event.resourceId || '',
      title: event.title || 'New Schedule',
      startTime: event.startTime || new Date(),
      endTime: event.endTime || new Date(),
      status: 'PENDING',
      metadata: event.metadata || {}
    };
    this.events.set([...this.events(), newEvent]);
  }

  onEventChanged(change: DragMutationEvent | { event: CalendarEvent; originalEvent?: CalendarEvent }) {
    console.log('Event changed:', change);
    // Handle both DragMutationEvent and regular event change
    if ('eventId' in change) {
      // This is a DragMutationEvent - handle drag/drop
      const event = this.events().find(e => e.id === change.eventId);
      if (event) {
        const updatedEvent = {
          ...event,
          resourceId: change.targetResourceId,
          startTime: change.newStartTime,
          endTime: change.newEndTime
        };
        this.events.set(this.events().map(e => e.id === change.eventId ? updatedEvent : e));
      }
    } else {
      // This is a regular event change
      this.events.set(this.events().map(e => e.id === change.event.id ? change.event : e));
    }
  }

  onEventDeleted(id: string | number) {
    console.log('Event deleted:', id);
    // Remove from local events
    this.events.set(this.events().filter(e => e.id !== id));
  }
}
