import { Component, inject, computed, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStateService } from '../../services/calendar-state.service';
import { CalendarEvent, CalendarResource, DragMutationEvent } from '../../models/calendar.types';

@Component({
  selector: 'app-month-view',
  imports: [CommonModule],
  templateUrl: './month-view.html',
  styleUrl: './month-view.scss',
  standalone: true
})
export class MonthViewComponent {
  private readonly state = inject(CalendarStateService);

  @Output() readonly eventContextMenu = new EventEmitter<{ x: number; y: number; event: CalendarEvent }>();
  @Output() readonly eventChanged = new EventEmitter<DragMutationEvent>();

  // Bind properties to state service signals
  protected readonly selectedDate = this.state.selectedDate;
  protected readonly filteredEvents = this.state.filteredEvents;
  protected readonly resources = this.state.resources;
  protected readonly readOnly = this.state.readOnly;

  protected readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate the 42 days of the grid dynamically
  protected readonly gridDays = computed(() => {
    const activeDate = this.state.selectedDate();
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

    // Start Sunday: find first day of month, backtrack to Sunday
    const firstDay = new Date(year, month, 1);
    const startSunday = new Date(firstDay);
    startSunday.setDate(firstDay.getDate() - firstDay.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startSunday);
      d.setDate(startSunday.getDate() + i);
      days.push(d);
    }
    return days;
  });

  // Index events by YYYY-MM-DD for fast rendering
  protected readonly eventsByDateKey = computed(() => {
    const all = this.filteredEvents();
    const map = new Map<string, CalendarEvent[]>();

    all.forEach(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);

      // Truncate times to compare date ranges
      const curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      while (curr.getTime() <= last.getTime()) {
        const key = this.formatDateKey(curr);
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(event);
        curr.setDate(curr.getDate() + 1);
      }
    });

    return map;
  });

  protected getEventsForDate(date: Date): CalendarEvent[] {
    const key = this.formatDateKey(date);
    return this.eventsByDateKey().get(key) || [];
  }

  protected getResourceThemeColor(resourceId: string | number): string {
    const res = this.resources().find(r => r.id === resourceId);
    if (!res) return '#1976D2'; // Default blue

    // If child asset, look up its parent category color theme
    if (res.parentId) {
      const parent = this.resources().find(p => p.id === res.parentId);
      if (parent && parent.colorTheme) return parent.colorTheme;
    }

    return res.colorTheme || '#1976D2';
  }

  protected isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  protected isSelected(date: Date): boolean {
    const sel = this.selectedDate();
    return date.getDate() === sel.getDate() &&
      date.getMonth() === sel.getMonth() &&
      date.getFullYear() === sel.getFullYear();
  }

  protected isOtherMonth(date: Date): boolean {
    return date.getMonth() !== this.selectedDate().getMonth();
  }

  protected selectDate(date: Date) {
    this.selectedDate.set(date);
  }

  protected onCellRightClick(event: MouseEvent, date: Date) {
    if (this.readOnly()) return;
    event.preventDefault();
    
    // Default time is 9:00 AM on the clicked day
    const time = new Date(date);
    time.setHours(9, 0, 0, 0);

    // Pick first active resource as default if none selected or available
    const activeRes = this.resources().find(r => r.parentId && r.status === 'ACTIVE');
    const resourceId = activeRes ? activeRes.id : '';

    this.state.quickMenu.set({
      x: event.clientX,
      y: event.clientY,
      resourceId,
      startTime: new Date()
    });
  }

  // Mobile long-press handler variables
  private longPressTimeout: any;

  protected onTouchStart(event: TouchEvent, date: Date) {
    if (this.readOnly()) return;
    
    const touch = event.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    this.longPressTimeout = setTimeout(() => {
      const time = new Date(date);
      time.setHours(9, 0, 0, 0);

      const activeRes = this.resources().find(r => r.parentId && r.status === 'ACTIVE');
      const resourceId = activeRes ? activeRes.id : '';

      this.state.quickMenu.set({
        x: clientX,
        y: clientY,
        resourceId,
        startTime: new Date()
      });
    }, 600); // 600ms hold
  }

  protected onTouchEnd() {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
    }
  }

  protected selectEvent(event: MouseEvent, calEvent: CalendarEvent) {
    event.stopPropagation();
    this.state.selectedEvent.set(calEvent);
  }

  protected onEventRightClick(event: MouseEvent, calEvent: CalendarEvent) {
    if (this.readOnly()) return;
    event.preventDefault();
    event.stopPropagation();
    this.eventContextMenu.emit({ x: event.clientX, y: event.clientY, event: calEvent });
  }

  protected onDragStart(event: DragEvent, calEvent: CalendarEvent) {
    if (this.readOnly()) return;
    event.dataTransfer?.setData('text/plain', String(calEvent.id));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected onDrop(event: DragEvent, targetDate: Date) {
    if (this.readOnly()) return;
    event.preventDefault();
    const eventId = event.dataTransfer?.getData('text/plain');
    if (!eventId) return;

    const calEvent = this.filteredEvents().find(e => String(e.id) === String(eventId));
    if (!calEvent) return;

    // Shift date but maintain hours
    const originalStart = new Date(calEvent.startTime);
    const originalEnd = new Date(calEvent.endTime);
    const duration = originalEnd.getTime() - originalStart.getTime();

    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds(), originalStart.getMilliseconds());
    const newEnd = new Date(newStart.getTime() + duration);

    // Verify change and prompt user
    const formattedDate = targetDate.toLocaleDateString();
    if (confirm(`Move event "${calEvent.title}" to ${formattedDate}?`)) {
      this.eventChanged.emit({
        eventId: calEvent.id,
        targetResourceId: calEvent.resourceId,
        originalResourceId: calEvent.resourceId,
        newStartTime: newStart,
        newEndTime: newEnd
      });
    }
  }

  private formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
