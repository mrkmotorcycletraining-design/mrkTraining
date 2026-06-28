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
          import('./client-list-page.component').then((m) => m.ClientListPageComponent)
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
          import('./trainer-list-page.component').then((m) => m.TrainerListPageComponent)
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
      {
        path: 'trainer-schedule-add',
        loadComponent: () =>
          import('./trainer-schedule-add.component').then((m) => m.TrainerScheduleAddComponent)
      },
      {
        path: 'trainer-schedule-view',
        loadComponent: () =>
          import('./trainer-schedule-view.component').then((m) => m.TrainerScheduleViewComponent)
      },

      // Admin
      {
        path: 'branches-add',
        loadComponent: () =>
          import('./branch-add-page.component').then((m) => m.BranchAddPageComponent)
      },
      {
        path: 'branches-view',
        loadComponent: () =>
          import('./branch-list-page.component').then((m) => m.BranchListPageComponent)
      },
      {
        path: 'backup-download',
        loadComponent: () =>
          import('./backup-download.component').then((m) => m.BackupDownloadComponent)
      },
      {
        path: 'backup-restore',
        loadComponent: () =>
          import('./backup-restore.component').then((m) => m.BackupRestoreComponent)
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
      },

      // Course / Training Management
      {
        path: 'courses-add',
        loadComponent: () =>
          import('./course-add-page.component').then((m) => m.CourseAddPageComponent)
      },
      {
        path: 'courses-view',
        loadComponent: () =>
          import('./course-list-page.component').then((m) => m.CourseListPageComponent)
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('./course-management.component').then((m) => m.CourseManagementComponent)
      },
      {
        path: 'courses-template',
        loadComponent: () =>
          import('./course-template-page.component').then((m) => m.CourseTemplatePageComponent)
      },

      // Vehicle Management Actions
      {
        path: 'vehicles-manage',
        loadComponent: () =>
          import('./vehicle-management.component').then((m) => m.VehicleManagementComponent)
      },

      // Assign Training
      {
        path: 'assign-training',
        loadComponent: () =>
          import('./assign-training.component').then((m) => m.AssignTrainingComponent)
      }
    ]
  }
];
