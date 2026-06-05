import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../core/components/app-navbar/app-navbar.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="shell">
      <app-navbar></app-navbar>
      <main class="content-container">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .content-container {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
  `
})
export class AdminShellComponent {}
