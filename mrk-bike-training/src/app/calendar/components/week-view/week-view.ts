import { Component, inject, computed, Input, ViewChild, ElementRef, Output, EventEmitter, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStateService } from '../../services/calendar-state.service';
import { CalendarEvent, DragMutationEvent } from '../../models/calendar.types';

@Component({
  selector: 'app-week-view',
  imports: [CommonModule],
  templateUrl: './week-view.html',
  styleUrl: './week-view.scss',
  standalone: true
})
export class WeekViewComponent implements AfterViewInit {
  private readonly state = inject(CalendarStateService);

  @Input() isSingleDay = false; // Toggles between Day (1-col) and Week (7-col) modes

  @Output() readonly eventChanged = new EventEmitter<DragMutationEvent>();
  @Output() readonly cloneRequest = new EventEmitter<CalendarEvent>();
  @Output() readonly eventContextMenu = new EventEmitter<{ x: number; y: number; event: CalendarEvent }>();

  @ViewChild('columnsContainer') columnsContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  // Bind signals
  protected readonly selectedDate = this.state.selectedDate;
  protected readonly filteredEvents = this.state.filteredEvents;
  protected readonly resources = this.state.resources;
  protected readonly config = this.state.config;
  protected readonly readOnly = this.state.readOnly;
  
  protected readonly draggingEvent = this.state.draggingEvent;
  protected readonly dragCurrentPosition = this.state.dragCurrentPosition;
  protected readonly dragHoveredSlot = this.state.dragHoveredSlot;
  protected readonly collisionStatus = this.state.collisionStatus;

  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);
  protected readonly HOUR_HEIGHT = 60; // 60px represents 1 hour

  ngAfterViewInit() {
    // Scroll to the configured start hour (default 6 AM) so the view opens there
    const startHour = this.config().startHour ?? 6;
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTop = startHour * this.HOUR_HEIGHT;
    }
  }

  // Calculate the column dates (either 7 dates for the week, or 1 date for single-day)
  protected readonly columnsList = computed(() => {
    const sel = this.selectedDate();
    if (this.isSingleDay) {
      return [new Date(sel)];
    }

    // Week view: calculate current Sunday and generate 7 days
    const sunday = new Date(sel);
    sunday.setDate(sel.getDate() - sel.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      days.push(d);
    }
    return days;
  });

  // Event height/position utilities
  protected getEventTop(event: CalendarEvent): number {
    const start = new Date(event.startTime);
    const hrs = start.getHours();
    const mins = start.getMinutes();
    return (hrs + mins / 60) * this.HOUR_HEIGHT;
  }

  protected getEventHeight(event: CalendarEvent): number {
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();
    const durationHrs = (end - start) / (1000 * 60 * 60);
    return Math.max(durationHrs * this.HOUR_HEIGHT, 24); // Cap minimum height at 24px so text fits
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

  protected getEventsForColumn(date: Date): CalendarEvent[] {
    const events = this.filteredEvents();
    return events.filter(e => {
      const eStart = new Date(e.startTime);
      const eEnd = new Date(e.endTime);
      
      // Check if event falls on this date
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const startDay = new Date(eStart.getFullYear(), eStart.getMonth(), eStart.getDate()).getTime();
      const endDay = new Date(eEnd.getFullYear(), eEnd.getMonth(), eEnd.getDate()).getTime();

      return checkDate >= startDay && checkDate <= endDay;
    });
  }

  /**
   * FIX Bug 3: Calculate overlap layout for events in a single day column.
   * Returns a map of eventId -> { leftPercent, widthPercent } for side-by-side rendering.
   */
  protected getColumnOverlapLayout(events: CalendarEvent[]): Map<string | number, { leftPercent: number; widthPercent: number }> {
    const layout = new Map<string | number, { leftPercent: number; widthPercent: number }>();
    if (events.length === 0) return layout;

    // Build overlap groups: each group is a set of events that overlap with at least one other in the group
    const groups: CalendarEvent[][] = [];

    const sorted = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    for (const event of sorted) {
      let placed = false;
      for (const group of groups) {
        // Check if this event overlaps with any event already in this group
        const overlapsGroup = group.some(ge => {
          const aStart = new Date(event.startTime).getTime();
          const aEnd = new Date(event.endTime).getTime();
          const bStart = new Date(ge.startTime).getTime();
          const bEnd = new Date(ge.endTime).getTime();
          return aStart < bEnd && aEnd > bStart;
        });
        if (overlapsGroup) {
          group.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) {
        groups.push([event]);
      }
    }

    // Assign positions within each group
    for (const group of groups) {
      // Re-sort group by start time
      group.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      const count = group.length;
      const widthPercent = 100 / count;
      group.forEach((ev, idx) => {
        layout.set(ev.id, {
          leftPercent: idx * widthPercent,
          widthPercent
        });
      });
    }

    return layout;
  }

  protected isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  protected isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  // Check if a specific hour slot is shaded (non-operational)
  protected isShadedHour(hour: number): boolean {
    const start = this.config().startHour;
    const end = this.config().endHour;
    return hour < start || hour >= end;
  }

  // Render non-operational shade block positions
  protected getShadeBlocks(): { top: number; height: number }[] {
    const start = this.config().startHour;
    const end = this.config().endHour;

    return [
      { top: 0, height: start * this.HOUR_HEIGHT },
      { top: end * this.HOUR_HEIGHT, height: (24 - end) * this.HOUR_HEIGHT }
    ];
  }

  // --- Drag & Drop Mechanics ---
  private originalEventData: CalendarEvent | null = null;

  protected onDragStart(event: MouseEvent | TouchEvent, calEvent: CalendarEvent) {
    if (this.readOnly()) return;
    event.stopPropagation();
    
    this.originalEventData = { ...calEvent };
    this.state.draggingEvent.set(calEvent);

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    this.state.dragCurrentPosition.set({ x: clientX, y: clientY, clientX, clientY });
  }

  // Binds document move events for fluid absolute ghost dragging and snap checking
  @HostListener('document:mousemove', ['$event'])
  protected onMove(event: MouseEvent) {
    this.handleMove(event.clientX, event.clientY);
  }

  @HostListener('document:touchmove', ['$event'])
  protected onTouchMove(event: TouchEvent) {
    if (event.touches.length > 0) {
      this.handleMove(event.touches[0].clientX, event.touches[0].clientY);
    }
  }

  private handleMove(clientX: number, clientY: number) {
    if (!this.draggingEvent() || !this.columnsContainer) return;

    this.state.dragCurrentPosition.set({ x: clientX, y: clientY, clientX, clientY });

    const rect = this.columnsContainer.nativeElement.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const cols = this.columnsList();
    const columnWidth = rect.width / cols.length;
    let colIndex = Math.floor(relativeX / columnWidth);
    colIndex = Math.max(0, Math.min(cols.length - 1, colIndex));

    const targetDate = cols[colIndex];
    const hourY = relativeY / this.HOUR_HEIGHT;
    const totalMinutes = hourY * 60;
    
    // Snap to grid divisions
    const snap = this.config().snapMinutes;
    let snappedMinutes = Math.round(totalMinutes / snap) * snap;
    snappedMinutes = Math.max(0, Math.min(1440 - snap, snappedMinutes));

    const targetTime = new Date(targetDate);
    targetTime.setHours(Math.floor(snappedMinutes / 60), snappedMinutes % 60, 0, 0);

    this.state.dragHoveredSlot.set({
      resourceId: this.draggingEvent()!.resourceId, // Maintain original resource
      time: targetTime
    });
  }

  @HostListener('document:mouseup')
  protected onDrop() {
    this.handleDrop();
  }

  @HostListener('document:touchend')
  protected onTouchEnd() {
    this.handleDrop();
  }

  private handleDrop() {
    const dragEvent = this.draggingEvent();
    const hover = this.dragHoveredSlot();
    const collision = this.collisionStatus();

    if (!dragEvent || !hover) {
      this.clearDragState();
      return;
    }

    if (collision === 'collision' || collision === 'invalid') {
      // Revert drag (visual snapback happens since we clear dragging signal and restore state)
      this.clearDragState();
      return;
    }

    const durationMs = new Date(dragEvent.endTime).getTime() - new Date(dragEvent.startTime).getTime();
    const newStart = hover.time;
    const newEnd = new Date(newStart.getTime() + durationMs);

    // Trigger update
    this.eventChanged.emit({
      eventId: dragEvent.id,
      targetResourceId: dragEvent.resourceId,
      originalResourceId: this.originalEventData!.resourceId,
      newStartTime: newStart,
      newEndTime: newEnd
    });

    this.clearDragState();
  }

  private clearDragState() {
    this.state.draggingEvent.set(null);
    this.state.dragCurrentPosition.set(null);
    this.state.dragHoveredSlot.set(null);
    this.originalEventData = null;
  }

  // --- Grid Click Creation & Quick Menu ---
  protected onGridCellClick(event: MouseEvent, date: Date, hour: number) {
    if (this.readOnly()) return;
    
    // Check if clicked cell falls inside operational bounds.
    if (this.isShadedHour(hour)) return;

    const clickedTime = new Date(date);
    clickedTime.setHours(hour, 0, 0, 0);

    // Pick first active resource as default if none selected or available
    const activeRes = this.resources().find(r => r.parentId && r.status === 'ACTIVE');
    const resourceId = activeRes ? activeRes.id : '';

    this.state.activeCreateSlot.set({
      resourceId,
      time: clickedTime
    });
  }

  protected onGridCellRightClick(event: MouseEvent, date: Date, hour: number) {
    if (this.readOnly()) return;
    event.preventDefault();

    const clickedTime = new Date(date);
    clickedTime.setHours(hour, 0, 0, 0);

    const activeRes = this.resources().find(r => r.parentId && r.status === 'ACTIVE');
    const resourceId = activeRes ? activeRes.id : '';

    this.state.quickMenu.set({
      x: event.clientX,
      y: event.clientY,
      resourceId,
      time: clickedTime
    });
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

  protected triggerClone(event: MouseEvent, calEvent: CalendarEvent) {
    event.stopPropagation();
    this.state.activeCloneEvent.set(calEvent);
  }

  // --- Dynamic Layout Coordinates (Collision Highlight Overlay) ---
  protected getOverlayTop(): number {
    const hover = this.dragHoveredSlot();
    if (!hover) return 0;
    const start = hover.time;
    return (start.getHours() + start.getMinutes() / 60) * this.HOUR_HEIGHT;
  }

  protected getOverlayHeight(): number {
    const drag = this.draggingEvent();
    if (!drag) return 0;
    const durationMs = new Date(drag.endTime).getTime() - new Date(drag.startTime).getTime();
    return (durationMs / (1000 * 60 * 60)) * this.HOUR_HEIGHT;
  }

  protected isOverlayVisibleInColumn(colDate: Date): boolean {
    const hover = this.dragHoveredSlot();
    if (!hover || !this.draggingEvent()) return false;
    
    return hover.time.getDate() === colDate.getDate() &&
      hover.time.getMonth() === colDate.getMonth() &&
      hover.time.getFullYear() === colDate.getFullYear();
  }
}
