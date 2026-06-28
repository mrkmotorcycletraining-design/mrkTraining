import { Routes } from '@angular/router';
import { ClientShellComponent } from './client-shell.component';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: ClientShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'trainings' },
      {
        path: 'trainings',
        loadComponent: () =>
          import('./trainings-list.component').then((m) => m.TrainingsListComponent)
      },
      {
        path: 'trainings/apply',
        loadComponent: () =>
          import('./apply-training.component').then((m) => m.ApplyTrainingComponent)
      },
      {
        path: 'trainings/:id',
        loadComponent: () =>
          import('./training-status-detail.component').then((m) => m.TrainingStatusDetailComponent)
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./client-schedule.component').then((m) => m.ClientScheduleComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./client-profile.component').then((m) => m.ClientProfileComponent)
      }
    ]
  }
];
