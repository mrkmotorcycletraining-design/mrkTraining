import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { apiPost } from '../../services/api.service';
import { ClientModel } from '../../models/client.model';

@Component({
  selector: 'client-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-add.html',
  styleUrls: ['./client-add.scss']
})
export class ClientAdd {
  readonly created = output<ClientModel>();

  username = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  name = signal('');
  height = signal<number | null>(null);
  weight = signal<number | null>(null);

  submitting = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  get passwordMismatch(): boolean {
    return this.password() !== this.confirmPassword() && this.confirmPassword().length > 0;
  }

  async submit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    if (this.passwordMismatch) {
      this.errorMsg.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.successMsg.set(null);
    this.errorMsg.set(null);

    try {
      const client = await apiPost<ClientModel>('/api/clients', {
        username: this.username().trim(),
        email: this.email().trim() || null,
        password: this.password(),
        name: this.name().trim(),
        heightFt: this.height(),
        weightKg: this.weight(),
        allowedNumOfTrainings: 1
      });
      this.successMsg.set(`Client "${client.name}" created successfully.`);
      this.created.emit(client);
      form.resetForm();
      this.username.set(''); this.email.set(''); this.password.set(''); this.confirmPassword.set('');
      this.name.set(''); this.height.set(null); this.weight.set(null);
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.submitting.set(false);
    }
  }
}
