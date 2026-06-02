import { Injectable, signal } from '@angular/core';
import { CalendarEvent } from '../calendar/models/calendar.types';

/**
 * ScheduleDataService
 *
 * Manages schedule data with separate read / append / update / delete methods.
 * These methods are designed to be swapped out for real HTTP API calls in the future.
 */
@Injectable({ providedIn: 'root' })
export class ScheduleDataService {
  // In-memory store seeded from testData.json (imported at build time)
  private readonly _events = signal<CalendarEvent[]>([]);

  /** Expose events as a readonly signal */
  readonly events = this._events.asReadonly();

  private nextId = 9000;

  constructor() {
    // --- REPLACE THIS with: GET /api/schedules ---
    this.loadFromJson();
  }

  // ---------------------------------------------------------------------------
  // READ  — fetch all schedules
  // Replace body with: return this.http.get<CalendarEvent[]>('/api/schedules')
  // ---------------------------------------------------------------------------
  readAll(): CalendarEvent[] {
    return this._events();
  }

  // ---------------------------------------------------------------------------
  // APPEND  — add a new schedule
  // Replace body with: return this.http.post<CalendarEvent>('/api/schedules', payload)
  // ---------------------------------------------------------------------------
  append(payload: Partial<CalendarEvent>): CalendarEvent {
    const newEvent: CalendarEvent = {
      id: this.nextId++,
      resourceId: payload.resourceId!,
      title: payload.title!,
      startTime: payload.startTime!,
      endTime: payload.endTime!,
      status: payload.status || 'CONFIRMED',
      metadata: payload.metadata || {}
    };
    this._events.set([...this._events(), newEvent]);
    return newEvent;
  }

  // ---------------------------------------------------------------------------
  // UPDATE  — modify an existing schedule by id
  // Replace body with: return this.http.put<CalendarEvent>(`/api/schedules/${id}`, changes)
  // ---------------------------------------------------------------------------
  update(id: string | number, changes: Partial<CalendarEvent>): CalendarEvent | null {
    const list = [...this._events()];
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...changes };
    this._events.set(list);
    return list[idx];
  }

  // ---------------------------------------------------------------------------
  // DELETE  — remove a schedule by id
  // Replace body with: return this.http.delete(`/api/schedules/${id}`)
  // ---------------------------------------------------------------------------
  delete(id: string | number): boolean {
    const before = this._events().length;
    this._events.set(this._events().filter(e => e.id !== id));
    return this._events().length < before;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Seed in-memory store from the bundled testData.json */
  private loadFromJson(): void {
    // Static import — replace with HTTP call when connecting to a real backend
    const raw: CalendarEvent[] = [
      {
        id: 7081,
        resourceId: 101,
        title: 'Demo Ride - Rohan Sharma',
        startTime: '2026-06-01T08:30:00',
        endTime: '2026-06-01T10:00:00',
        status: 'CONFIRMED',
        metadata: { locationBranchId: 501, trainerId: 'Instructor Alex', clientId: 'Rohan Sharma', notes: 'Client requested size-L riding jacket.' }
      },
      {
        id: 7082,
        resourceId: 102,
        title: 'Cruiser Training - Priya Sen',
        startTime: '2026-06-01T11:00:00',
        endTime: '2026-06-01T12:30:00',
        status: 'CONFIRMED',
        metadata: { locationBranchId: 501, trainerId: 'Instructor Jane', clientId: 'Priya Sen', notes: 'First off-road session.' }
      },
      {
        id: 7083,
        resourceId: 201,
        title: 'Engine Refitting Service',
        startTime: '2026-06-02T09:00:00',
        endTime: '2026-06-02T15:00:00',
        status: 'PENDING',
        metadata: { locationBranchId: 502, trainerId: 'Instructor Bob', clientId: 'Internal Workshop', notes: 'Requires custom piston valves replacement.' }
      },
      {
        id: 7084,
        resourceId: 101,
        title: 'Introductory Lesson - Kabir Dev',
        startTime: '2026-06-03T14:00:00',
        endTime: '2026-06-03T15:30:00',
        status: 'CONFIRMED',
        metadata: { locationBranchId: 501, trainerId: 'Instructor Alex', clientId: 'Kabir Dev', notes: 'Brand new rider.' }
      },
      {
        id: 7085,
        resourceId: 301,
        title: 'Off-Road Session - Amit Roy',
        startTime: '2026-06-04T12:00:00',
        endTime: '2026-06-04T15:00:00',
        status: 'CONFIRMED',
        metadata: { locationBranchId: 502, trainerId: 'Instructor Jane', clientId: 'Amit Roy', notes: 'Provide heavy knee guards.' }
      }
    ];

    this._events.set(raw);
    // Seed next id above the highest existing id
    const maxId = raw.reduce((m, e) => Math.max(m, Number(e.id)), 0);
    this.nextId = maxId + 1;
  }
}
