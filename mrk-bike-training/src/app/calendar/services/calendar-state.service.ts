import { Injectable, signal, computed } from '@angular/core';
import { CalendarResource, CalendarEvent, MetaFilterDefinition, CalendarConfig } from '../models/calendar.types';

@Injectable()
export class CalendarStateService {
  // Core datasets
  readonly resources = signal<CalendarResource[]>([]);
  readonly events = signal<CalendarEvent[]>([]);
  readonly filterSchema = signal<MetaFilterDefinition[]>([]);
  readonly config = signal<CalendarConfig>({
    startHour: 6,
    endHour: 22,
    snapMinutes: 60,
    collisionKeys: ['resourceId'],
    enableQuickCreate: true,
    enableCloning: true,
    weekdayWeekendRules: true
  });
  
  readonly readOnly = signal<boolean>(false);
  readonly isCollisionAllowed = signal<((event: CalendarEvent, res: CalendarResource, start: Date, end: Date) => boolean) | undefined>(undefined);

  // Layout states
  readonly selectedDate = signal<Date>(new Date());
  readonly selectedView = signal<'month' | 'week' | 'day' | 'resource'>('month');
  readonly darkTheme = signal<boolean>(false);

  // Sidebar selection filters
  readonly checkedResourceIds = signal<Set<string | number>>(new Set());
  readonly activeMetaFilters = signal<Map<string, Set<any>>>(new Map()); // Key -> Set of checked values

  // Drag & drop state machine
  readonly draggingEvent = signal<CalendarEvent | null>(null);
  readonly dragCurrentPosition = signal<{ x: number, y: number, clientX: number, clientY: number } | null>(null);
  readonly dragHoveredSlot = signal<{ resourceId: string | number; time: Date } | null>(null);

  // Selected details / overlay states
  readonly selectedEvent = signal<CalendarEvent | null>(null);
  readonly quickMenu = signal<{ x: number; y: number; resourceId: string | number; startTime: Date; event?: CalendarEvent } | null>(null);
  readonly activeCloneEvent = signal<CalendarEvent | null>(null);
  readonly activeEditEvent = signal<CalendarEvent | null>(null); // For custom booking modal
  readonly activeCreateSlot = signal<{ resourceId: string | number; time: Date; endTime?: Date; title?: string; metadata?: Record<string, any> } | null>(null); // For triggering creation from grid double-click or empty slots

  // Collision detection state during dragging
  readonly collisionStatus = computed<'vacant' | 'collision' | 'invalid' | null>(() => {
    const dragEvent = this.draggingEvent();
    const hoverSlot = this.dragHoveredSlot();
    if (!dragEvent || !hoverSlot) return null;

    const resource = this.resources().find(r => r.id === hoverSlot.resourceId);
    if (!resource || resource.status === 'MAINTENANCE' || resource.status === 'DISABLED') {
      return 'invalid';
    }

    // Determine target timeslot. Calculate end time using dragged event duration.
    const durationMs = new Date(dragEvent.endTime).getTime() - new Date(dragEvent.startTime).getTime();
    const targetStart = hoverSlot.time;
    const targetEnd = new Date(targetStart.getTime() + durationMs);

    // 1. Run custom callback if provided
    const callback = this.isCollisionAllowed();
    if (callback) {
      const allowed = callback(dragEvent, resource, targetStart, targetEnd);
      return allowed ? 'vacant' : 'collision';
    }

    // 2. Fallback to schema key-based collision validation
    const collisionKeys = this.config().collisionKeys || ['resourceId'];
    const activeEvents = this.events().filter(e => e.id !== dragEvent.id);

    const hasCollision = activeEvents.some(e => {
      const eStart = new Date(e.startTime).getTime();
      const eEnd = new Date(e.endTime).getTime();

      // Check chronological overlap
      const overlap = targetStart.getTime() < eEnd && targetEnd.getTime() > eStart;
      if (!overlap) return false;

      // Check collision keys match
      return collisionKeys.some(key => {
        if (key === 'resourceId') {
          return e.resourceId === hoverSlot.resourceId;
        }
        
        // Match metadata properties (e.g. metadata.trainerId)
        const valA = this.getNestedValue(e, key);
        const valB = this.getNestedValue({ ...dragEvent, resourceId: hoverSlot.resourceId }, key);
        return valA !== undefined && valB !== undefined && valA === valB;
      });
    });

    return hasCollision ? 'collision' : 'vacant';
  });

  // Reactive computed filter engine
  readonly filteredEvents = computed(() => {
    const allEvents = this.events();
    const checkedRes = this.checkedResourceIds();
    const metaFilters = this.activeMetaFilters();

    return allEvents.filter(e => {
      // 1. Filter by resource selection
      if (checkedRes.size > 0 && !checkedRes.has(e.resourceId)) {
        return false;
      }

      // 2. Filter by meta-keys
      for (const [key, selectedValues] of metaFilters.entries()) {
        if (selectedValues.size === 0) continue;
        const eventValue = this.getNestedValue(e, key);
        if (eventValue === undefined || !selectedValues.has(eventValue)) {
          return false;
        }
      }

      return true;
    });
  });

  // Initialize filters when resources and events load
  initResourceFilters(resourcesList: CalendarResource[]) {
    // By default, check all active resources
    const checked = new Set<string | number>();
    resourcesList.forEach(r => {
      if (r.status !== 'DISABLED') {
        checked.add(r.id);
      }
    });
    this.checkedResourceIds.set(checked);
  }

  toggleResourceCheck(id: string | number) {
    const current = new Set(this.checkedResourceIds());
    if (current.has(id)) {
      current.delete(id);
      // Recursively delete children if it's a category parent
      this.resources().forEach(r => {
        if (r.parentId === id) current.delete(r.id);
      });
    } else {
      current.add(id);
      // Recursively add children
      this.resources().forEach(r => {
        if (r.parentId === id) current.add(r.id);
      });
    }
    this.checkedResourceIds.set(current);
  }

  toggleMetaFilterValue(key: string, value: any) {
    const currentFilters = new Map(this.activeMetaFilters());
    const currentSet = new Set(currentFilters.get(key) || []);

    if (currentSet.has(value)) {
      currentSet.delete(value);
    } else {
      currentSet.add(value);
    }

    currentFilters.set(key, currentSet);
    this.activeMetaFilters.set(currentFilters);
  }

  clearMetaFilter(key: string) {
    const currentFilters = new Map(this.activeMetaFilters());
    currentFilters.delete(key);
    this.activeMetaFilters.set(currentFilters);
  }

  setAllResourcesChecked(checked: boolean) {
    if (checked) {
      const activeIds = this.resources()
        .filter(r => r.status !== 'DISABLED')
        .map(r => r.id);
      this.checkedResourceIds.set(new Set(activeIds));
    } else {
      this.checkedResourceIds.set(new Set());
    }
  }

  // Utility to extract property values dynamically
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}
