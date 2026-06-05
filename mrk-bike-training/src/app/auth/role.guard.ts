import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

const defaultRouteByRole: Record<string, string> = {
  CLIENT: '/client',
  TRAINER: '/trainer',
  ADMIN: '/admin',
  SUPER_ADMIN: '/admin'
};

export const roleGuard: CanActivateFn = (route) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const allowed = (route.data['roles'] as string[]) ?? [];
  const role = session.currentRole();

  if (role && allowed.includes(role)) {
    return true;
  }
  const fallback = role ? defaultRouteByRole[role] : '/login';
  return router.createUrlTree([fallback ?? '/login']);
};
