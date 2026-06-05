import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TrainingApiService } from '../core/services/training-api.service';
import { EnrollmentApi } from '../core/models/api.models';

@Component({
  selector: 'app-trainings-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="head">
      <h2>My Trainings</h2>
      <a routerLink="/client/trainings/apply" class="btn">Apply New Training</a>
    </div>
    <table>
      <thead>
        <tr><th>Course</th><th>Status</th><th>Submitted</th><th></th></tr>
      </thead>
      <tbody>
        @for (e of enrollments(); track e.id) {
          <tr>
            <td>{{ e.course?.name ?? e.course?.id }}</td>
            <td>{{ e.status }}</td>
            <td>{{ e.enrollmentDate | date }}</td>
            <td><a [routerLink]="['/client/trainings', e.id]">Details</a></td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    .head { display: flex; justify-content: space-between; align-items: center; }
    .btn { padding: 0.4rem 0.8rem; background: #1565c0; color: #fff; text-decoration: none; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
  `
})
export class TrainingsListComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  enrollments = signal<EnrollmentApi[]>([]);

  ngOnInit() {
    this.api.listMyEnrollments().subscribe((list) => this.enrollments.set(list));
  }
}
