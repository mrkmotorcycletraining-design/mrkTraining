import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly auth = inject(AuthService);

  readonly currentRole = computed(() => this.auth.currentUser()?.role ?? null);

  readonly isAdmin = computed(() => {
    const role = this.currentRole();
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  });

  readonly isAuthenticated = computed(
    () => !!this.auth.token() && !this.auth.isExpired()
  );
}
