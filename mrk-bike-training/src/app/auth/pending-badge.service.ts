import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class PendingBadgeService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  readonly hasPending = signal(false);
  private timer: ReturnType<typeof setInterval> | null = null;

  startPolling(): void {
    this.stopPolling();
    if (!this.session.isAdmin()) return;
    this.poll();
    this.timer = setInterval(() => this.poll(), 60_000);
  }

  stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private poll(): void {
    if (!this.session.isAdmin()) return;
    this.http.get<unknown[]>('/api/slots/pending').subscribe({
      next: (slots) => this.hasPending.set(slots.length > 0),
      error: () => this.hasPending.set(false)
    });
  }
}
