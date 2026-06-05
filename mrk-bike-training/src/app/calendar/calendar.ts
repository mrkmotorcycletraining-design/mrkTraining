import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, inject, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStateService } from './services/calendar-state.service';
import { SidebarFilterComponent } from './components/sidebar-filter';
import { MonthViewComponent } from './components/month-view/month-view';
import { WeekViewComponent } from './components/week-view/week-view';
import { ResourceTimelineComponent } from './components/resource-timeline/resource-timeline';
import { HourlyAgendaComponent } from './components/hourly-agenda';
import { BookingFormModalComponent, MetadataFieldConfig } from './components/booking-form-modal';
import { CloneModalComponent } from './components/clone-modal';
import { QuickMenuComponent, QuickTemplate } from './components/quick-menu';
import { CalendarResource, CalendarEvent, MetaFilterDefinition, CalendarConfig, DragMutationEvent, CloneRequestEvent, QuickCreateEvent } from './models/calendar.types';

@Component({
  selector: 'app-calendar',
  imports: [
    CommonModule,
    SidebarFilterComponent,
    MonthViewComponent,
    WeekViewComponent,
    ResourceTimelineComponent,
    HourlyAgendaComponent,
    BookingFormModalComponent,
    CloneModalComponent,
    QuickMenuComponent
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  providers: [CalendarStateService], // Isolated state service instance per calendar component
  standalone: true
})
export class CalendarComponent implements OnInit, OnChanges {
  private readonly state = inject(CalendarStateService);
  private initialized = false; // Tracks if initial setup is done

  // Expose inputs
  @Input() resources: CalendarResource[] = [];
  @Input() events: CalendarEvent[] = [];
  @Input() filters: MetaFilterDefinition[] = [];
  @Input() readOnly = false;
  @Input() viewMode: 'month' | 'week' | 'day' | 'resource' = 'month';
  @Input() config: Partial<CalendarConfig> = {};
  @Input() isCollisionAllowed?: (draggedEvent: CalendarEvent, targetResource: CalendarResource, newStart: Date, newEnd: Date) => boolean;

  @Input() metadataFormFields: MetadataFieldConfig[] = [];
  @Input() quickTemplates: QuickTemplate[] = [];

  // When set from outside, opens the booking form for the given event id
  @Input() set editEventId(id: string | number | null) {
    if (id !== null && id !== undefined) {
      const ev = this.events.find(e => e.id === id);
      if (ev) {
        this.state.activeEditEvent.set(ev);
      }
    }
  }

  // Theme bindings
  @Input() theme: 'light' | 'dark' = 'light';
  
  @HostBinding('class.dark-theme') get isDark() {
    return this.theme === 'dark';
  }

  // Expose Outputs
  @Output() readonly eventChanged = new EventEmitter<{ event: CalendarEvent; originalEvent?: CalendarEvent } | DragMutationEvent>();
  @Output() readonly eventCreated = new EventEmitter<Partial<CalendarEvent>>();
  @Output() readonly eventCloned = new EventEmitter<CloneRequestEvent>();
  @Output() readonly eventDeleted = new EventEmitter<string | number>();
  @Output() readonly eventSelected = new EventEmitter<CalendarEvent>();
  @Output() readonly eventContextMenuRequest = new EventEmitter<{ x: number; y: number; event: CalendarEvent }>();

  // State service exposures for local bindings
  protected readonly selectedView = this.state.selectedView;
  protected readonly selectedDate = this.state.selectedDate;
  protected readonly activeEditEvent = this.state.activeEditEvent;
  protected readonly activeCreateSlot = this.state.activeCreateSlot;
  protected readonly activeCloneEvent = this.state.activeCloneEvent;
  protected readonly quickMenu = this.state.quickMenu;
  protected readonly selectedEvent = this.state.selectedEvent;

  // Mobile layout drawer toggles
  protected sidebarOpen = false;
  protected agendaOpen = false;

  ngOnInit() {
    // Initial sync (including setting the initial view)
    this.syncState(true);
    this.state.initResourceFilters(this.resources);
    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    // After first init, sync data but NEVER reset the current view - user controls the view
    this.syncState(false);
    
    if (changes['resources'] && !changes['resources'].firstChange) {
      this.state.initResourceFilters(this.resources);
    }
  }

  private syncState(isInit = false) {
    this.state.resources.set(this.resources);
    this.state.events.set(this.events);
    this.state.filterSchema.set(this.filters);
    this.state.readOnly.set(this.readOnly);
    this.state.isCollisionAllowed.set(this.isCollisionAllowed);

    // FIX Bug 2 & 4: Only set viewMode on initial load — never override the user's current view selection
    if (isInit) {
      this.state.selectedView.set(this.viewMode);
    }

    // Merge default configurations
    const defaultConfigs: CalendarConfig = {
      startHour: 6,
      endHour: 22,
      snapMinutes: 60,
      collisionKeys: ['resourceId'],
      enableQuickCreate: true,
      enableCloning: true,
      weekdayWeekendRules: true
    };
    this.state.config.set({ ...defaultConfigs, ...this.config });
  }

  // --- Header Navigation Handlers ---
  protected prev() {
    const sel = new Date(this.selectedDate());
    const view = this.selectedView();

    if (view === 'month' || view === 'resource') {
      sel.setMonth(sel.getMonth() - 1);
    } else if (view === 'week') {
      sel.setDate(sel.getDate() - 7);
    } else if (view === 'day') {
      sel.setDate(sel.getDate() - 1);
    }
    this.selectedDate.set(sel);
  }

  protected next() {
    const sel = new Date(this.selectedDate());
    const view = this.selectedView();

    if (view === 'month' || view === 'resource') {
      sel.setMonth(sel.getMonth() + 1);
    } else if (view === 'week') {
      sel.setDate(sel.getDate() + 7);
    } else if (view === 'day') {
      sel.setDate(sel.getDate() + 1);
    }
    this.selectedDate.set(sel);
  }

  protected today() {
    this.selectedDate.set(new Date());
  }

  public setView(mode: 'month' | 'week' | 'day' | 'resource') {
    this.selectedView.set(mode);
    this.closeDrawers();
  }

  // Calculate human-friendly header date label dynamically based on active dates
  protected getActiveDateLabel(): string {
    const date = this.selectedDate();
    const view = this.selectedView();

    if (view === 'month' || view === 'resource') {
      return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
    }
    if (view === 'day') {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Week View: calculate start of week (Sunday) and end of week (Saturday)
    const sun = new Date(date);
    sun.setDate(date.getDate() - date.getDay());
    const sat = new Date(sun);
    sat.setDate(sun.getDate() + 6);

    const sameMonth = sun.getMonth() === sat.getMonth();
    const sameYear = sun.getFullYear() === sat.getFullYear();

    if (sameMonth && sameYear) {
      return `${sun.toLocaleDateString([], { month: 'short' })} ${sun.getDate()} - ${sat.getDate()}, ${sun.getFullYear()}`;
    }
    if (!sameMonth && sameYear) {
      return `${sun.toLocaleDateString([], { month: 'short' })} ${sun.getDate()} - ${sat.toLocaleDateString([], { month: 'short' })} ${sat.getDate()}, ${sun.getFullYear()}`;
    }
    return `${sun.toLocaleDateString([], { month: 'short', year: 'numeric' })} ${sun.getDate()} - ${sat.toLocaleDateString([], { month: 'short', year: 'numeric' })} ${sat.getDate()}`;
  }

  // --- Sub-component Form Callbacks & Events ---
  protected onEventDragChange(mutation: DragMutationEvent) {
    this.eventChanged.emit(mutation);
  }

  protected onBookingFormSave(payload: Partial<CalendarEvent>) {
    if (payload.id !== undefined) {
      // Modify
      const original = this.events.find(e => e.id === payload.id);
      this.eventChanged.emit({
        event: { ...original, ...payload } as CalendarEvent,
        originalEvent: original
      });
    } else {
      // New
      this.eventCreated.emit(payload);
    }
  }

  protected onCloneRequest(clonePayload: CloneRequestEvent) {
    this.eventCloned.emit(clonePayload);
  }

  protected onQuickCreateTrigger(quickEvent: QuickCreateEvent) {
    // Generate simple event metadata object
    const metadata: Record<string, any> = quickEvent.metadata || {};
    
    this.eventCreated.emit({
      title: quickEvent.title,
      resourceId: quickEvent.resourceId,
      startTime: quickEvent.startTime,
      endTime: quickEvent.endTime,
      status: 'CONFIRMED',
      metadata
    });
  }

  protected onEventDeleteRequest(id: string | number) {
    this.eventDeleted.emit(id);
  }

  protected onEventContextMenu(payload: { x: number; y: number; event: CalendarEvent }) {
    this.eventContextMenuRequest.emit(payload);
    this.state.quickMenu.set({
      x: payload.x,
      y: payload.y,
      resourceId: payload.event.resourceId,
      startTime: new Date(payload.event.startTime),
      event: payload.event
    });
  }

  // --- Mobile Drawer Controls ---
  protected toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.agendaOpen = false;
  }

  protected toggleAgenda() {
    this.agendaOpen = !this.agendaOpen;
    this.sidebarOpen = false;
  }

  protected closeDrawers() {
    this.sidebarOpen = false;
    this.agendaOpen = false;
  }

  // Listen to selectEvent to fire output event selected
  protected selectTask(event: CalendarEvent) {
    this.eventSelected.emit(event);
  }
}
