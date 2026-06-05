import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarComponent } from '../calendar/calendar';
import { TrainingApiService } from '../core/services/training-api.service';
import { AuthService } from '../auth/auth.service';
import { slotsToEvents } from '../core/utils/calendar-mapper';
import { CalendarEvent } from '../calendar/models/calendar.types';

@Component({
  selector: 'app-trainer-schedule',
  standalone: true,
  imports: [CalendarComponent, FormsModule],
  template: `
    <h2>My Schedule</h2>
    <app-calendar [events]="events()" viewMode="week" [readOnly]="true" [resources]="[]" />
    <div class="absence">
      <h3>Request absence</h3>
      <input type="date" [(ngModel)]="absenceDate" name="abs" />
      <button type="button" (click)="markAbsence()">Mark absence for date</button>
    </div>
  `,
  styles: `.absence { margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center; }`
})
export class TrainerScheduleComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly auth = inject(AuthService);
  events = signal<CalendarEvent[]>([]);
  absenceDate = '';

  ngOnInit() {
    this.api.listSlots({ trainerId: 'me', status: 'ACTIVE' }).subscribe((response) => {
      const slots = response.slots || [];
      this.events.set(slotsToEvents(slots));
    });
  }

  markAbsence() {
    const userId = this.auth.currentUser();
    const sub = userId?.sub;
    const trainerId = sub ? Number(sub) : 0;
    if (!this.absenceDate || !trainerId) return;
    this.api.markTrainerAbsence(trainerId, this.absenceDate).subscribe(() => {
      alert('Absence recorded.');
      this.ngOnInit();
    });
  }
}
