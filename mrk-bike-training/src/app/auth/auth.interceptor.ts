import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Don't attach token to auth endpoints (login doesn't need it)
  const isAuthEndpoint = req.url.includes('/api/auth/');
  const token = isAuthEndpoint ? null : auth.token();

  // Debug: log whether token exists and which URL is being requested
  try {
    // avoid revealing full token in logs, show prefix
    if (token) console.debug('[authInterceptor] attaching token to', req.url, token.substring(0, 10) + '...');
    else console.debug('[authInterceptor] no token for', req.url);
  } catch (e) {
    /* ignore logging errors */
  }

  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      }
      if (err.status === 403) {
        console.warn('Access denied');
      }
      return throwError(() => err);
    })
  );
};
