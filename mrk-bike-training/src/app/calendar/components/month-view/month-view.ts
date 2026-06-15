import { Component, inject, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStateService } from '../../services/calendar-state.service';
import { CalendarEvent, CalendarResource, DragMutationEvent } from '../../models/calendar.types';

/**
 * Color palette for unique event groupings.
 * Each unique combination of (clientId + trainerId + resourceId) gets a distinct color.
 * Inspired by Google Calendar's event color scheme.
 */
const EVENT_COLOR_PALETTE = [
  { bg: '#D1E8FF', border: '#1A73E8', text: '#174EA6' },  // Blue (Google Calendar default)
  { bg: '#E8F5E9', border: '#34A853', text: '#1E7E34' },  // Green
  { bg: '#FFF3E0', border: '#F57C00', text: '#E65100' },  // Orange
  { bg: '#F3E5F5', border: '#8E24AA', text: '#6A1B9A' },  // Purple
  { bg: '#FCE4EC', border: '#E91E63', text: '#AD1457' },  // Pink
  { bg: '#E0F7FA', border: '#00ACC1', text: '#006064' },  // Cyan
  { bg: '#FFF9C4', border: '#F9A825', text: '#F57F17' },  // Yellow
  { bg: '#EFEBE9', border: '#795548', text: '#4E342E' },  // Brown
  { bg: '#E8EAF6', border: '#3F51B5', text: '#283593' },  // Indigo
  { bg: '#E0F2F1', border: '#009688', text: '#00695C' },  // Teal
  { bg: '#FBE9E7', border: '#FF5722', text: '#BF360C' },  // Deep Orange
  { bg: '#F1F8E9', border: '#689F38', text: '#33691E' },  // Light Green
];

export interface EventColorConfig {
  /** Keys from event metadata + resourceId used to generate unique color groupings */
  groupingKeys: string[];
}

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

  /**
   * Configurable grouping keys for color assignment.
   * Default: clientId + trainerId + resourceId (vehicle).
   * This can be changed per role in the future.
   */
  @Input() colorGroupingKeys: string[] = ['metadata.clientId', 'metadata.trainerId', 'resourceId'];

  // Bind properties to state service signals
  protected readonly selectedDate = this.state.selectedDate;
  protected readonly filteredEvents = this.state.filteredEvents;
  protected readonly resources = this.state.resources;
  protected readonly readOnly = this.state.readOnly;

  protected readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Color assignment cache: maps composite key -> palette index
  private colorAssignmentMap = new Map<string, number>();
  private nextColorIndex = 0;

  // Calculate the 42 days of the grid dynamically
  protected readonly gridDays = computed(() => {
    const activeDate = this.state.selectedDate();
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

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

    // Reset color assignments when events change to keep consistent coloring
    this.colorAssignmentMap.clear();
    this.nextColorIndex = 0;

    all.forEach(event => {
      // Pre-assign color for each event's grouping key
      this.getEventColor(event);

      const start = new Date(event.startTime);
      const end = new Date(event.endTime);

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

  /**
   * Get a unique color for an event based on its composite grouping key.
   * The grouping key is built from configurable fields (default: clientId + trainerId + resourceId).
   */
  protected getEventColor(event: CalendarEvent): { bg: string; border: string; text: string } {
    const compositeKey = this.buildCompositeKey(event);
    
    if (!this.colorAssignmentMap.has(compositeKey)) {
      this.colorAssignmentMap.set(compositeKey, this.nextColorIndex);
      this.nextColorIndex = (this.nextColorIndex + 1) % EVENT_COLOR_PALETTE.length;
    }

    const idx = this.colorAssignmentMap.get(compositeKey)!;
    return EVENT_COLOR_PALETTE[idx];
  }

  /**
   * Build composite key from configurable grouping keys.
   * Supports nested paths like 'metadata.clientId'.
   */
  private buildCompositeKey(event: CalendarEvent): string {
    return this.colorGroupingKeys
      .map(key => {
        const value = this.getNestedValue(event, key);
        return value !== undefined && value !== null ? String(value) : '_';
      })
      .join('|');
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  protected getResourceThemeColor(resourceId: string | number): string {
    const res = this.resources().find(r => r.id === resourceId);
    if (!res) return '#1976D2';

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

    const time = new Date(date);
    time.setHours(9, 0, 0, 0);

    const activeRes = this.resources().find(r => r.parentId && r.status === 'ACTIVE');
    const resourceId = activeRes ? activeRes.id : '';

    // Show context menu with "Add New Schedule" option
    this.state.quickMenu.set({
      x: event.clientX,
      y: event.clientY,
      resourceId,
      startTime: time
    });
  }

  // Mobile long-press handler
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

      // Show context menu with "Add New Schedule" option on long-press
      this.state.quickMenu.set({
        x: clientX,
        y: clientY,
        resourceId,
        startTime: time
      });
    }, 600);
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

    const originalStart = new Date(calEvent.startTime);
    const originalEnd = new Date(calEvent.endTime);
    const duration = originalEnd.getTime() - originalStart.getTime();

    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds(), originalStart.getMilliseconds());
    const newEnd = new Date(newStart.getTime() + duration);

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

  /** Format time as compact string like "9a", "2:30p" */
  protected formatEventTime(event: CalendarEvent): string {
    const start = new Date(event.startTime);
    const hours = start.getHours();
    const minutes = start.getMinutes();
    const ampm = hours >= 12 ? 'p' : 'a';
    const h = hours % 12 || 12;
    return minutes === 0 ? `${h}${ampm}` : `${h}:${String(minutes).padStart(2, '0')}${ampm}`;
  }

  /** Get resource/vehicle name for display */
  protected getResourceName(resourceId: string | number): string {
    const res = this.resources().find(r => r.id === resourceId);
    return res ? res.name : '';
  }

  private formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
