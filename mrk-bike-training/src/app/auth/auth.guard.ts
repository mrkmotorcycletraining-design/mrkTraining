import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.token()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.isExpired()) {
    auth.logout();
    return router.createUrlTree(['/login']);
  }
  return true;
};
