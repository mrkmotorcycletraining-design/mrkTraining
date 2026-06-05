import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { JwtPayload, JwtResponse, LoginRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly TOKEN_KEY = 'auth_token';

  private readonly _token = signal<string | null>(this.loadTokenFromStorage());
  private readonly _user = signal<JwtPayload | null>(this._token() ? decodeJwt(this._token()!) : null);

  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();

  constructor() {
    // Sync token changes to localStorage
    effect(() => {
      const token = this._token();
      if (token) {
        localStorage.setItem(this.TOKEN_KEY, token);
      } else {
        localStorage.removeItem(this.TOKEN_KEY);
      }
    });
  }

  private loadTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(credentials: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>('/api/auth/login', credentials).pipe(
      tap((res) => {
        this._token.set(res.token);
        this._user.set(decodeJwt(res.token));
      })
    );
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
  }

  isExpired(): boolean {
    const user = this._user();
    if (!user?.exp) return true;
    return Date.now() >= user.exp * 1000;
  }
}

function decodeJwt(token: string): JwtPayload {
  const part = token.split('.')[1];
  const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json) as JwtPayload;
}
