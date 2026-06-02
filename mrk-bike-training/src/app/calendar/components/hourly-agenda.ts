import { Component, inject, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStateService } from '../services/calendar-state.service';
import { CalendarEvent, CalendarResource } from '../models/calendar.types';

interface AgendaGap {
  start: Date;
  end: Date;
  label: string;
}

@Component({
  selector: 'app-hourly-agenda',
  imports: [CommonModule],
  templateUrl: './hourly-agenda.html',
  styleUrl: './hourly-agenda.scss',
  standalone: true
})
export class HourlyAgendaComponent {
  private readonly state = inject(CalendarStateService);

  @Output() readonly eventDeleted = new EventEmitter<string | number>();

  // Bind signals
  protected readonly selectedDate = this.state.selectedDate;
  protected readonly filteredEvents = this.state.filteredEvents;
  protected readonly selectedEvent = this.state.selectedEvent;
  protected readonly resources = this.state.resources;
  protected readonly config = this.state.config;
  protected readonly readOnly = this.state.readOnly;

  // Filter and sort events chronologically for the selected date
  protected readonly dateEvents = computed(() => {
    const sel = this.selectedDate();
    const all = this.filteredEvents();

    const startOfDay = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), 0, 0, 0).getTime();
    const endOfDay = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), 23, 59, 59).getTime();

    return all.filter((e: CalendarEvent) => {
      const eStart = new Date(e.startTime).getTime();
      return eStart >= startOfDay && eStart <= endOfDay;
    }).sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  });

  // Calculate gaps/free slots in the timeline
  protected readonly timelineGaps = computed<AgendaGap[]>(() => {
    const events = this.dateEvents();
    const sel = this.selectedDate();
    const startHour = this.config().startHour;
    const endHour = this.config().endHour;

    const gaps: AgendaGap[] = [];
    
    // Convert operational bounds to absolute Date objects
    let lastEnd = new Date(sel);
    lastEnd.setHours(startHour, 0, 0, 0);

    const operationalEnd = new Date(sel);
    operationalEnd.setHours(endHour, 0, 0, 0);

    events.forEach((e: CalendarEvent) => {
      const eStart = new Date(e.startTime);
      const eEnd = new Date(e.endTime);

      if (eStart.getTime() > lastEnd.getTime()) {
        gaps.push({
          start: new Date(lastEnd),
          end: new Date(eStart),
          label: `${this.formatTime(lastEnd)} - ${this.formatTime(eStart)}`
        });
      }
      if (eEnd.getTime() > lastEnd.getTime()) {
        lastEnd = new Date(eEnd);
      }
    });

    if (operationalEnd.getTime() > lastEnd.getTime()) {
      gaps.push({
        start: new Date(lastEnd),
        end: new Date(operationalEnd),
        label: `${this.formatTime(lastEnd)} - ${this.formatTime(operationalEnd)}`
      });
    }

    return gaps.filter(gap => (gap.end.getTime() - gap.start.getTime()) >= 15 * 60 * 1000); // Filter out gaps smaller than 15 mins
  });

  protected getResourceName(resourceId: string | number): string {
    const res = this.resources().find((r: CalendarResource) => r.id === resourceId);
    return res ? res.name : 'Unknown Asset';
  }

  protected getResourceThemeColor(resourceId: string | number): string {
    const res = this.resources().find((r: CalendarResource) => r.id === resourceId);
    if (!res) return '#1976D2';

    if (res.parentId) {
      const parent = this.resources().find((p: CalendarResource) => p.id === res.parentId);
      if (parent && parent.colorTheme) return parent.colorTheme;
    }
    return res.colorTheme || '#1976D2';
  }

  protected selectEvent(calEvent: CalendarEvent) {
    this.selectedEvent.set(calEvent);
  }

  protected clearEventSelection() {
    this.selectedEvent.set(null);
  }

  protected closePanel() {
    // Toggles details view back to agenda view by resetting selection
    this.clearEventSelection();
  }

  protected triggerEdit() {
    const ev = this.selectedEvent();
    if (ev) {
      this.state.activeEditEvent.set(ev);
    }
  }

  protected triggerDelete() {
    const ev = this.selectedEvent();
    if (ev && confirm('Are you sure you want to delete this event?')) {
      this.eventDeleted.emit(ev.id);
      this.clearEventSelection();
    }
  }

  protected triggerCreateInGap(gap: AgendaGap) {
    if (this.readOnly()) return;

    // Pick first active resource as default if none selected or available
    const activeRes = this.resources().find((r: CalendarResource) => r.parentId && r.status === 'ACTIVE');
    const resourceId = activeRes ? activeRes.id : '';

    this.state.activeCreateSlot.set({
      resourceId,
      time: gap.start
    });
  }

  // Generic utility to render metadata as labels/values dynamically
  protected getMetadataList(event: CalendarEvent) {
    if (!event.metadata) return [];
    
    // Resolve keys nicely: camelCase or snake_case key strings translated to Title Case
    return Object.entries(event.metadata).map(([key, value]) => {
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^[a-z]/, char => char.toUpperCase())
        .trim();
      return {
        key: formattedKey,
        value: typeof value === 'object' ? JSON.stringify(value) : value
      };
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
