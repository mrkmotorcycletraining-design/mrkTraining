import { Component, inject, computed, ViewChild, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStateService } from '../../services/calendar-state.service';
import { CalendarEvent, CalendarResource, DragMutationEvent } from '../../models/calendar.types';

@Component({
  selector: 'app-resource-timeline',
  imports: [CommonModule],
  templateUrl: './resource-timeline.html',
  styleUrl: './resource-timeline.scss',
  standalone: true
})
export class ResourceTimelineComponent {
  private readonly state = inject(CalendarStateService);

  @Output() readonly eventChanged = new EventEmitter<DragMutationEvent>();

  @ViewChild('rowsBody') rowsBody!: ElementRef<HTMLDivElement>;

  // Bind signals
  protected readonly selectedDate = this.state.selectedDate;
  protected readonly filteredEvents = this.state.filteredEvents;
  protected readonly resources = this.state.resources;
  protected readonly checkedResourceIds = this.state.checkedResourceIds;
  protected readonly config = this.state.config;
  protected readonly readOnly = this.state.readOnly;

  protected readonly draggingEvent = this.state.draggingEvent;
  protected readonly dragCurrentPosition = this.state.dragCurrentPosition;
  protected readonly dragHoveredSlot = this.state.dragHoveredSlot;
  protected readonly collisionStatus = this.state.collisionStatus;

  protected readonly COL_WIDTH = 100; // 100px represents 1 hour
  protected readonly ROW_HEIGHT = 70; // 70px represents 1 resource lane row

  // Filter out category headings and inactive items
  protected readonly activeResources = computed(() => {
    const list = this.resources();
    const checked = this.checkedResourceIds();
    // Return only children assets that are checked
    return list.filter(r => r.parentId && checked.has(r.id) && r.status !== 'DISABLED');
  });

  // Calculate horizontal hours layout
  protected readonly timelineHours = computed(() => {
    const start = this.config().startHour;
    const end = this.config().endHour;
    const list: number[] = [];
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  });

  // Position helpers
  protected getEventLeft(event: CalendarEvent): number {
    const start = new Date(event.startTime);
    const startHour = this.config().startHour;
    
    const minutesSinceStart = (start.getHours() * 60 + start.getMinutes()) - (startHour * 60);
    return minutesSinceStart * (this.COL_WIDTH / 60);
  }

  protected getEventWidth(event: CalendarEvent): number {
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();
    const durationMins = (end - start) / (1000 * 60);
    return Math.max(durationMins * (this.COL_WIDTH / 60), 40); // Cap minimum width
  }

  protected getEventsForResource(resourceId: string | number): CalendarEvent[] {
    const events = this.filteredEvents();
    const sel = this.selectedDate();
    
    return events.filter(e => {
      if (e.resourceId !== resourceId) return false;

      // Ensure event overlaps the selected date
      const eStart = new Date(e.startTime);
      const eEnd = new Date(e.endTime);
      
      const checkStart = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), 0, 0, 0).getTime();
      const checkEnd = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), 23, 59, 59).getTime();

      return eStart.getTime() <= checkEnd && eEnd.getTime() >= checkStart;
    });
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

  // --- Rescheduling & Re-assignment Drag Mechanics ---
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
    if (!this.draggingEvent() || !this.rowsBody) return;

    this.state.dragCurrentPosition.set({ x: clientX, y: clientY, clientX, clientY });

    const rect = this.rowsBody.nativeElement.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // 1. Calculate Target Resource Swimlane (Y-axis)
    const list = this.activeResources();
    let rowIndex = Math.floor(relativeY / this.ROW_HEIGHT);
    rowIndex = Math.max(0, Math.min(list.length - 1, rowIndex));
    const targetRes = list[rowIndex];

    // 2. Calculate Target Time (X-axis)
    const startHour = this.config().startHour;
    const endHour = this.config().endHour;
    const minX = relativeX / (this.COL_WIDTH / 60);

    const snap = this.config().snapMinutes;
    let snappedMinutes = Math.round(minX / snap) * snap;
    snappedMinutes = Math.max(0, Math.min((endHour - startHour) * 60 - snap, snappedMinutes));

    const targetTime = new Date(this.selectedDate());
    targetTime.setHours(startHour + Math.floor(snappedMinutes / 60), snappedMinutes % 60, 0, 0);

    this.state.dragHoveredSlot.set({
      resourceId: targetRes.id,
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
      this.clearDragState();
      return;
    }

    const durationMs = new Date(dragEvent.endTime).getTime() - new Date(dragEvent.startTime).getTime();
    const newStart = hover.time;
    const newEnd = new Date(newStart.getTime() + durationMs);

    this.eventChanged.emit({
      eventId: dragEvent.id,
      targetResourceId: hover.resourceId,
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

  // --- Right-Click/Grid cell selection ---
  protected onGridCellClick(event: MouseEvent, resourceId: string | number, hour: number) {
    if (this.readOnly()) return;

    const clickedTime = new Date(this.selectedDate());
    clickedTime.setHours(hour, 0, 0, 0);

    this.state.activeCreateSlot.set({
      resourceId,
      time: clickedTime
    });
  }

  protected onGridCellRightClick(event: MouseEvent, resourceId: string | number, hour: number) {
    if (this.readOnly()) return;
    event.preventDefault();

    const clickedTime = new Date(this.selectedDate());
    clickedTime.setHours(hour, 0, 0, 0);

    this.state.quickMenu.set({
      x: event.clientX,
      y: event.clientY,
      resourceId,
      startTime: clickedTime
    });
  }

  protected selectEvent(event: MouseEvent, calEvent: CalendarEvent) {
    event.stopPropagation();
    this.state.selectedEvent.set(calEvent);
  }

  // --- Collision Hover Box Coordinates ---
  protected getOverlayLeft(): number {
    const hover = this.dragHoveredSlot();
    if (!hover) return 0;
    
    const startHour = this.config().startHour;
    const minsSinceStart = (hover.time.getHours() * 60 + hover.time.getMinutes()) - (startHour * 60);
    return minsSinceStart * (this.COL_WIDTH / 60);
  }

  protected getOverlayWidth(): number {
    const drag = this.draggingEvent();
    if (!drag) return 0;
    const durationMs = new Date(drag.endTime).getTime() - new Date(drag.startTime).getTime();
    return (durationMs / (1000 * 60)) * (this.COL_WIDTH / 60);
  }

  protected getOverlayTop(resourceId: string | number): number {
    const list = this.activeResources();
    const idx = list.findIndex(r => r.id === resourceId);
    return idx * this.ROW_HEIGHT;
  }

  protected isOverlayVisibleInLane(resourceId: string | number): boolean {
    const hover = this.dragHoveredSlot();
    return hover ? hover.resourceId === resourceId : false;
  }
}
