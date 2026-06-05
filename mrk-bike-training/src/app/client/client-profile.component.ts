import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrainingApiService } from '../core/services/training-api.service';
import { ClientProfileApi } from '../core/models/api.models';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2>My Profile</h2>
    @if (profile(); as p) {
      <p><strong>Name:</strong> {{ p.name }}</p>
      <p><strong>Email:</strong> {{ p.emailUsername }}</p>
      <form (ngSubmit)="save()" class="form">
        <label>Height (cm) <input type="number" [(ngModel)]="heightCm" name="height" /></label>
        <label>Weight (kg) <input type="number" [(ngModel)]="weightKg" name="weight" /></label>
        <label>Date of birth <input type="date" [(ngModel)]="dateOfBirth" name="dob" /></label>
        <label>
          Profile picture
          <input type="file" (change)="onFileSelected($event)" accept="image/*" />
        </label>
        @if (profilePicture) {
          <div class="pic-preview">
            <img [src]="profilePicture" alt="Preview" style="max-width: 100px; max-height: 100px; border-radius: 50%; object-fit: cover;" />
          </div>
        }
        <button type="submit">Save</button>
      </form>
      <hr />
      <h3>Change password</h3>
      <form (ngSubmit)="changePassword()" class="form">
        <label>Current <input type="password" [(ngModel)]="currentPassword" name="cur" required /></label>
        <label>New <input type="password" [(ngModel)]="newPassword" name="new" required /></label>
        @if (pwdError()) { <p class="err">{{ pwdError() }}</p> }
        <button type="submit">Update password</button>
      </form>
      @if (msg()) { <p class="ok">{{ msg() }}</p> }
    }
  `,
  styles: `
    .form { display: flex; flex-direction: column; gap: 0.5rem; max-width: 360px; }
    .err { color: #c62828; }
    .ok { color: #2e7d32; }
  `
})
export class ClientProfileComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  profile = signal<ClientProfileApi | null>(null);
  heightCm = 0;
  weightKg = 0;
  dateOfBirth = '';
  profilePicture = '';
  currentPassword = '';
  newPassword = '';
  pwdError = signal<string | null>(null);
  msg = signal<string | null>(null);

  ngOnInit() {
    this.api.getClientMe().subscribe((p) => {
      this.profile.set(p);
      this.heightCm = p.heightCm ?? 0;
      this.weightKg = p.weightKg ?? 0;
      this.dateOfBirth = p.dateOfBirth ?? '';
      this.profilePicture = p.profilePicture ?? '';
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.profilePicture = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    this.api
      .updateClientMe({
        heightCm: this.heightCm,
        weightKg: this.weightKg,
        dateOfBirth: this.dateOfBirth || undefined,
        profilePicture: this.profilePicture || undefined
      })
      .subscribe((p) => {
        this.profile.set(p);
        this.msg.set('Profile updated.');
      });
  }

  changePassword() {
    this.pwdError.set(null);
    this.api.changeClientPassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.msg.set('Password updated.');
        this.currentPassword = '';
        this.newPassword = '';
      },
      error: (e) => this.pwdError.set(e.error?.error ?? 'Password change failed.')
    });
  }
}
