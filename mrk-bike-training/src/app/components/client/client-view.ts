import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { apiGet } from '../../services/api.service';

@Component({
  selector: 'client-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-view.html',
  styleUrls: ['./client-view.scss']
})
export class ClientView implements OnInit {
  clients = signal<any[]>([]);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      const data = await apiGet<any[]>('/api/clients');
      this.clients.set(data || []);
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.loading.set(false);
    }
  }
}
