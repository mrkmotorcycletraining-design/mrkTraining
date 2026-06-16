import { Routes } from '@angular/router';
import { AdminShellComponent } from './admin-shell.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'schedule' },
      
      // Schedule
      {
        path: 'schedule',
        loadComponent: () => import('./admin-schedule.component').then((m) => m.AdminScheduleComponent)
      },

      // Pending Approvals
      {
        path: 'pending',
        loadComponent: () =>
          import('./pending-approvals.component').then((m) => m.PendingApprovalsComponent)
      },

      // Client Management
      {
        path: 'clients',
        loadComponent: () =>
          import('./client-management.component').then((m) => m.ClientManagementComponent)
      },
      {
        path: 'clients-view',
        loadComponent: () =>
          import('../components/client/client-view').then((m) => m.ClientView)
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('./client-detail.component').then((m) => m.ClientDetailComponent)
      },
      {
        path: 'clients-add',
        loadComponent: () =>
          import('./client-add-page.component').then((m) => m.ClientAddPageComponent)
      },

      // Trainer Management
      {
        path: 'trainers',
        loadComponent: () =>
          import('./trainer-management.component').then((m) => m.TrainerManagementComponent)
      },
      {
        path: 'trainers-view',
        loadComponent: () =>
          import('../components/trainer/trainer-view').then((m) => m.TrainerView)
      },
      {
        path: 'trainers/:id',
        loadComponent: () =>
          import('./trainer-detail.component').then((m) => m.TrainerDetailComponent)
      },
      {
        path: 'trainers-add',
        loadComponent: () =>
          import('./trainer-add.component').then((m) => m.TrainerAddComponent)
      },

      // Admin
      {
        path: 'branches-view',
        loadComponent: () =>
          import('../components/branch/branch-view').then((m) => m.BranchView)
      },
      {
        path: 'branches-add',
        loadComponent: () =>
          import('./branch-add-page.component').then((m) => m.BranchAddPageComponent)
      },
      {
        path: 'site',
        loadComponent: () =>
          import('./site-management.component').then((m) => m.SiteManagementComponent)
      },
      {
        path: 'vehicles-add',
        loadComponent: () =>
          import('./vehicle-add-page.component').then((m) => m.VehicleAddPageComponent)
      },
      {
        path: 'vehicles-config-add',
        loadComponent: () =>
          import('./vehicle-config-add-page.component').then((m) => m.VehicleConfigAddPageComponent)
      },
      {
        path: 'vehicles-list',
        loadComponent: () =>
          import('./vehicle-list-page.component').then((m) => m.VehicleListPageComponent)
      },
      {
        path: 'vehicles-config-list',
        loadComponent: () =>
          import('./vehicle-config-list-page.component').then((m) => m.VehicleConfigListPageComponent)
      }
    ]
  }
];
