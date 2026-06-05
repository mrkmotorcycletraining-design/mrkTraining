import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TrainingApiService } from '../core/services/training-api.service';

@Component({
  selector: 'app-client-add-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2>Add client</h2>
    <form (ngSubmit)="submit()" class="form">
      <label>Name <input [(ngModel)]="name" name="name" required /></label>
      <label>Email / username <input [(ngModel)]="email" name="email" required /></label>
      <label>Unique ID <input [(ngModel)]="uniqueId" name="uid" required /></label>
      <label>Password <input type="password" [(ngModel)]="password" name="pwd" required /></label>
      <label>Allowed trainings <input type="number" [(ngModel)]="allowed" name="al" min="1" /></label>
      <button type="submit">Create</button>
      @if (error()) { <p class="err">{{ error() }}</p> }
    </form>
  `,
  styles: `.form { display: flex; flex-direction: column; gap: 0.5rem; max-width: 360px; } .err { color: red; }`
})
export class ClientAddPageComponent {
  private readonly api = inject(TrainingApiService);
  private readonly router = inject(Router);
  name = '';
  email = '';
  uniqueId = '';
  password = '';
  allowed = 1;
  error = signal<string | null>(null);

  submit() {
    this.api
      .createClient({
        name: this.name,
        emailUsername: this.email,
        uniqueId: this.uniqueId,
        password: this.password,
        allowedNumOfTrainings: this.allowed
      })
      .subscribe({
        next: (c) => this.router.navigate(['/admin/clients', c.id]),
        error: (e) => this.error.set(e.error?.error ?? 'Failed')
      });
  }
}
