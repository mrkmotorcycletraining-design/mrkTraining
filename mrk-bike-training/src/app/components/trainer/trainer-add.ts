import { Component, signal, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { apiGet, apiPost } from '../../services/api.service';
import { TrainerModel } from '../../models/trainer.model';
import { BranchModel } from '../../models/branch.model';

@Component({
  selector: 'trainer-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trainer-add.html',
  styleUrls: ['./trainer-add.scss']
})
export class TrainerAdd implements OnInit {
  readonly created = output<TrainerModel>();

  branches = signal<BranchModel[]>([]);

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  name = signal('');
  startDate = signal('');
  salary = signal<number | null>(null);
  branchId = signal('');

  submitting = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  async ngOnInit() {
    try {
      const data = await apiGet<BranchModel[]>('/api/branches');
      this.branches.set(data || []);
    } catch {
      // branch list is optional; form still works without it
    }
  }

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
      const trainer = await apiPost<TrainerModel>('/api/trainers', {
        emailUsername: this.email().trim(),
        passwordHash: this.password(),
        name: this.name().trim(),
        startDate: this.startDate() || null,
        salary: this.salary(),
        branchId: this.branchId() || null
      });
      this.successMsg.set(`Trainer "${trainer.name}" created successfully.`);
      this.created.emit(trainer);
      form.resetForm();
      this.email.set(''); this.password.set(''); this.confirmPassword.set('');
      this.name.set(''); this.startDate.set(''); this.salary.set(null); this.branchId.set('');
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.submitting.set(false);
    }
  }
}
