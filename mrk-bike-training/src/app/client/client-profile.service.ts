import { Injectable, inject, signal, computed } from '@angular/core';
import { TrainingApiService } from '../core/services/training-api.service';

/**
 * Tracks client profile completeness.
 * Loaded once by the client shell and checked by child pages
 * to show a persistent alert when profile info is missing.
 */
@Injectable({ providedIn: 'root' })
export class ClientProfileService {
  private readonly api = inject(TrainingApiService);

  private readonly _profilePicture = signal<string | null>(null);
  private readonly _email = signal<string | null>(null);
  private readonly _heightFt = signal<number | null>(null);
  private readonly _weightKg = signal<number | null>(null);
  private readonly _loaded = signal(false);

  /** True when we have fetched the profile at least once */
  readonly loaded = this._loaded.asReadonly();

  /** List of missing fields */
  readonly missingFields = computed<string[]>(() => {
    if (!this._loaded()) return [];
    const missing: string[] = [];
    if (!this._profilePicture()) missing.push('Profile Picture');
    if (!this._email()) missing.push('Email');
    if (!this._heightFt()) missing.push('Height');
    if (!this._weightKg()) missing.push('Weight');
    return missing;
  });

  /** True if profile is incomplete */
  readonly isIncomplete = computed(() => this.missingFields().length > 0);

  /** Load or refresh the profile data */
  refreshProfile(): void {
    this.api.getClientMe().subscribe({
      next: (p: any) => {
        this._profilePicture.set(p.profilePicture ?? null);
        this._email.set(p.email ?? null);
        this._heightFt.set(p.heightFt ?? null);
        this._weightKg.set(p.weightKg ?? null);
        this._loaded.set(true);
      },
      error: () => {
        this._loaded.set(true);
      }
    });
  }
}
