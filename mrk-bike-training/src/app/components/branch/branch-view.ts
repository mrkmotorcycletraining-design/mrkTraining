import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { apiGet } from '../../services/api.service';
import { BranchModel } from '../../models/branch.model';

@Component({
  selector: 'branch-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './branch-view.html',
  styleUrls: ['./branch-view.scss']
})
export class BranchView implements OnInit {
  branches = signal<BranchModel[]>([]);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      const data = await apiGet<BranchModel[]>('/api/branches');
      this.branches.set(data || []);
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.loading.set(false);
    }
  }
}
