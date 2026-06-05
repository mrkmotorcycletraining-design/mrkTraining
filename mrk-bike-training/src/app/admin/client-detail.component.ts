import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrainingApiService } from '../core/services/training-api.service';
import { AdminClientApi } from '../core/models/api.models';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (client(); as c) {
      <h2>{{ c.name }}</h2>
      <p>Username: {{ c.emailUsername }} | Unique ID: {{ c.uniqueId }}</p>
      <p>Trainings allowed: {{ c.allowedNumOfTrainings }} | Active: {{ c.active }}</p>
      <label>New allowance <input type="number" [(ngModel)]="allowance" name="a" /></label>
      <button type="button" (click)="saveAllowance()">Update allowance</button>
      <button type="button" (click)="deactivate()">Deactivate</button>
      <button type="button" (click)="resetPwd()">Reset password</button>
      <label>New password <input type="password" [(ngModel)]="newPassword" name="p" /></label>
    }
  `
})
export class ClientDetailComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  private readonly route = inject(ActivatedRoute);
  client = signal<AdminClientApi | null>(null);
  allowance = 1;
  newPassword = '';

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getClient(id).subscribe((c) => {
      this.client.set(c);
      this.allowance = c.allowedNumOfTrainings ?? 1;
    });
  }

  saveAllowance() {
    const id = this.client()?.id;
    if (!id) return;
    this.api.updateClientAllowance(id, this.allowance).subscribe(() => alert('Updated'));
  }

  deactivate() {
    const id = this.client()?.id;
    if (!id || !confirm('Deactivate client?')) return;
    this.api.deactivateClient(id).subscribe(() => alert('Deactivated'));
  }

  resetPwd() {
    const id = this.client()?.id;
    if (!id || !this.newPassword) return;
    this.api.resetClientPassword(id, this.newPassword).subscribe(() => alert('Password reset'));
  }
}
