import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { apiPost } from '../../services/api.service';
import { BranchModel } from '../../models/branch.model';

@Component({
  selector: 'branch-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './branch-add.html',
  styleUrls: ['./branch-add.scss']
})
export class BranchAdd {
  /** Emits the newly created branch so the parent can refresh the list */
  readonly created = output<BranchModel>();

  id = signal('');
  name = signal('');
  location = signal('');

  submitting = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  async submit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.successMsg.set(null);
    this.errorMsg.set(null);

    try {
      const branch = await apiPost<BranchModel>('/api/branches', {
        id: this.id().trim(),
        name: this.name().trim(),
        locationAddress: this.location().trim() || null
      });
      this.successMsg.set(`Branch "${branch.name}" created successfully.`);
      this.created.emit(branch);
      form.resetForm();
      this.id.set(''); this.name.set(''); this.location.set('');
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.submitting.set(false);
    }
  }
}
