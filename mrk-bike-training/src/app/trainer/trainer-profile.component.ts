import { Component, inject, OnInit, signal } from '@angular/core';
import { TrainingApiService } from '../core/services/training-api.service';
import { TrainerApi } from '../core/models/api.models';

@Component({
  selector: 'app-trainer-profile',
  standalone: true,
  template: `
    <h2>My Profile</h2>
    @if (trainer(); as t) {
      <p><strong>Name:</strong> {{ t.name }}</p>
      <p><strong>Username:</strong> {{ t.username }}</p>
      <p><strong>Available:</strong> {{ t.available ? 'Yes' : 'No' }}</p>
    }
  `
})
export class TrainerProfileComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  trainer = signal<TrainerApi | null>(null);
  ngOnInit() {
    this.api.getTrainerMe().subscribe((t) => this.trainer.set(t));
  }
}
