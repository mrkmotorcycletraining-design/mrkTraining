import { Routes } from '@angular/router';
import { TrainerShellComponent } from './trainer-shell.component';

export const TRAINER_ROUTES: Routes = [
  {
    path: '',
    component: TrainerShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'schedule' },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./trainer-schedule.component').then((m) => m.TrainerScheduleComponent)
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('./trainer-availability.component').then((m) => m.TrainerAvailabilityComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./trainer-profile.component').then((m) => m.TrainerProfileComponent)
      }
    ]
  }
];
