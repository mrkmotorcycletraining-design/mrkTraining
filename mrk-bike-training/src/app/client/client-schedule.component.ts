import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CalendarComponent } from '../calendar/calendar';
import { TrainingApiService } from '../core/services/training-api.service';
import { slotsToEvents } from '../core/utils/calendar-mapper';
import { CalendarEvent } from '../calendar/models/calendar.types';

@Component({
  selector: 'app-client-schedule',
  standalone: true,
  imports: [CommonModule, DatePipe, CalendarComponent],
  template: `
    <h2>My Schedule</h2>
    <app-calendar [events]="events()" [resources]="[]" viewMode="week" [readOnly]="true" />
    @if (selected(); as slot) {
      <div class="actions">
        <p>{{ slot.title }} — {{ slot.startTime | date: 'medium' }}</p>
        @if (slot.status === 'ACTIVE' || slot.status === 'PENDING') {
          <button type="button" (click)="requestAbsence(slot)">Request Absence</button>
        }
      </div>
    }
  `,
  styles: `.actions { margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 6px; }`
})
export class ClientScheduleComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  events = signal<CalendarEvent[]>([]);
  selected = signal<CalendarEvent | null>(null);

  ngOnInit() {
    this.api.listSlots({ clientId: 'me' }).subscribe((response) => {
      const slots = response.slots || [];
      const active = slots.filter((s) => s.status === 'ACTIVE' || s.status === 'PENDING');
      this.events.set(slotsToEvents(active));
    });
  }

  requestAbsence(ev: CalendarEvent) {
    const id = Number(ev.id);
    if (!confirm('Request absence for this session?')) return;
    this.api.recordSlotAbsence(id).subscribe(() => {
      alert('Absence recorded.');
      this.ngOnInit();
    });
  }
}
