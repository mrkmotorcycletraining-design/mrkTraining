import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrainingApiService } from '../core/services/training-api.service';
import { AuthService } from '../auth/auth.service';
import { TrainerAvailabilityApi } from '../core/models/api.models';

@Component({
  selector: 'app-trainer-availability',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2>My Availability</h2>
    <form (ngSubmit)="add()" class="form">
      <label>Branch ID <input [(ngModel)]="branchId" name="b" required /></label>
      <label>Days (Mo,Tu,...) <input [(ngModel)]="availableDays" name="days" required /></label>
      <label>Start <input type="time" [(ngModel)]="slotStart" name="s" required /></label>
      <label>End <input type="time" [(ngModel)]="slotEnd" name="e" required /></label>
      <label>From <input type="date" [(ngModel)]="effectiveFrom" name="f" required /></label>
      <label>To <input type="date" [(ngModel)]="effectiveTo" name="t" /></label>
      <button type="submit">Add slot</button>
      @if (conflict()) { <p class="err">{{ conflict() }}</p> }
    </form>
    <ul>
      @for (a of slots(); track a.id) {
        <li>
          {{ a.branchId }} {{ a.availableDays }} {{ a.slotStartTime }}–{{ a.slotEndTime }}
          <button type="button" (click)="remove(a.id)">Remove</button>
        </li>
      }
    </ul>
  `,
  styles: `
    .form { display: grid; gap: 0.5rem; max-width: 400px; margin-bottom: 1rem; }
    .err { color: #c62828; }
  `
})
export class TrainerAvailabilityComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly auth = inject(AuthService);
  slots = signal<TrainerAvailabilityApi[]>([]);
  conflict = signal<string | null>(null);
  branchId = '';
  availableDays = 'Mo,Tu,We,Th,Fr';
  slotStart = '09:00';
  slotEnd = '17:00';
  effectiveFrom = '';
  effectiveTo = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.listTrainerAvailability().subscribe((s) => this.slots.set(s));
  }

  add() {
    const trainerId = Number(this.auth.currentUser()?.sub);
    this.conflict.set(null);
    this.api
      .addTrainerAvailability({
        trainerId,
        branchId: this.branchId,
        availableDays: this.availableDays,
        slotStartTime: this.slotStart + ':00',
        slotEndTime: this.slotEnd + ':00',
        effectiveFrom: this.effectiveFrom,
        effectiveTo: this.effectiveTo || null
      })
      .subscribe({
        next: () => this.load(),
        error: (e) => this.conflict.set(e.error?.error ?? 'Conflict')
      });
  }

  remove(id: number) {
    this.api.removeTrainerAvailability(id).subscribe(() => this.load());
  }
}
