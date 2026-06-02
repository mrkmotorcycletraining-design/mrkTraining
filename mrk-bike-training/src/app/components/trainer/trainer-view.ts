import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { apiGet } from '../../services/api.service';

@Component({
  selector: 'trainer-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trainer-view.html',
  styleUrls: ['./trainer-view.scss']
})
export class TrainerView implements OnInit {
  trainers = signal<any[]>([]);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      const data = await apiGet<any[]>('/api/trainers');
      this.trainers.set(data || []);
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.loading.set(false);
    }
  }
}
