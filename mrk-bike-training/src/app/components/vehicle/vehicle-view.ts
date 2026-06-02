import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { apiGet } from '../../services/api.service';
import { AssetModel } from '../../models/asset.model';

@Component({
  selector: 'vehicle-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-view.html',
  styleUrls: ['./vehicle-view.scss']
})
export class VehicleView implements OnInit {
  vehicles = signal<any[]>([]);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      const data = await apiGet<any[]>('/api/vehicles');
      this.vehicles.set(data || []);
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.loading.set(false);
    }
  }
}
