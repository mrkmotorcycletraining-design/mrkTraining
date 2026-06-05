import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';
import { LoginComponent } from './auth/login.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: 'client',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CLIENT'] },
    loadChildren: () => import('./client/client.routes').then((m) => m.CLIENT_ROUTES)
  },
  {
    path: 'trainer',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['TRAINER'] },
    loadChildren: () => import('./trainer/trainer.routes').then((m) => m.TRAINER_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES)
  },
  { path: '**', redirectTo: 'login' }
];
