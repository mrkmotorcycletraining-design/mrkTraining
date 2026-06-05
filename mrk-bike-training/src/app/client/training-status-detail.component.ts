import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TrainingApiService } from '../core/services/training-api.service';
import { EnrollmentApi, ScheduleSlotApi } from '../core/models/api.models';

@Component({
  selector: 'app-training-status-detail',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (enrollment(); as e) {
      <h2>{{ e.course?.name }} — {{ e.status }}</h2>
      @if (e.status === 'ACTIVE') {
        <button type="button" (click)="pause()">Pause Training</button>
      }
      <table>
        <thead><tr><th>When</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>
          @for (s of slots(); track s.id) {
            <tr>
              <td>{{ s.startDateTime | date: 'medium' }}</td>
              <td>{{ s.status }}</td>
              <td>@if (s.status === 'CANCELLED') { {{ s.rejectionReason ?? '—' }} }</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `table { width: 100%; border-collapse: collapse; margin-top: 1rem; } th, td { border: 1px solid #ddd; padding: 0.5rem; }`
})
export class TrainingStatusDetailComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly route = inject(ActivatedRoute);
  enrollment = signal<EnrollmentApi | null>(null);
  slots = signal<ScheduleSlotApi[]>([]);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getEnrollment(id).subscribe((e) => this.enrollment.set(e));
    this.api.getEnrollmentSlots(id).subscribe((s) => this.slots.set(s));
  }

  pause() {
    const id = this.enrollment()?.id;
    if (!id || !confirm('Pause this training?')) return;
    this.api.pauseEnrollment(id).subscribe((e) => this.enrollment.set(e));
  }
}
