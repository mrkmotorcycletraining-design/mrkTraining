import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <h1>MRK Bike Training</h1>
        <label>
          Username
          <input type="text" formControlName="username" autocomplete="username" />
        </label>
        <label>
          Password
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <button type="submit" [disabled]="form.invalid || loading()">Sign in</button>
      </form>
    </div>
  `,
  styles: `
    .login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f4f6f8;
    }
    form {
      width: min(400px, 92vw);
      padding: 2rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.9rem;
    }
    input {
      padding: 0.5rem 0.65rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      padding: 0.65rem;
      background: #1565c0;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error {
      color: #c62828;
      margin: 0;
      font-size: 0.9rem;
    }
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.router.navigateByUrl(this.routeForRole(res.role));
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error ?? 'Login failed. Check your credentials.');
      }
    });
  }

  private routeForRole(role: string): string {
    if (role === 'CLIENT') return '/client';
    if (role === 'TRAINER') return '/trainer';
    return '/admin';
  }
}
