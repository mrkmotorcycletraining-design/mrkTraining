import { Component, signal, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { apiGet, apiPost } from '../../services/api.service';
import { AssetModel } from '../../models/asset.model';
import { BranchModel } from '../../models/branch.model';

export interface AssetTypeConfig {
  type: string;
  label: string;
  defaultMinHeightCm: number | null;
  defaultMinWeightKg: number | null;
}

@Component({
  selector: 'vehicle-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-add.html',
  styleUrls: ['./vehicle-add.scss']
})
export class VehicleAdd implements OnInit {
  readonly created = output<AssetModel>();

  // Loaded from API
  typeConfigs = signal<AssetTypeConfig[]>([]);
  branches = signal<BranchModel[]>([]);

  // Form fields
  id = signal('');
  type = signal('');
  name = signal('');
  cc = signal<number | null>(null);
  color = signal('');
  nextMaintenanceDate = signal('');
  minHeightReq = signal<number | null>(null);
  minWeightReq = signal<number | null>(null);
  branchId = signal('');
  clientVehicle = signal(false);
  clientVehicleDetails = signal('');

  submitting = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  async ngOnInit() {
    const [typesResult, branchesResult] = await Promise.allSettled([
      apiGet<AssetTypeConfig[]>('/api/vehicles/types'),
      apiGet<BranchModel[]>('/api/branches')
    ]);

    if (typesResult.status === 'fulfilled') {
      this.typeConfigs.set(typesResult.value || []);
      // Default to first type
      if (typesResult.value?.length) {
        this.type.set(typesResult.value[0].type);
        this.applyTypeDefaults(typesResult.value[0].type);
      }
    }

    if (branchesResult.status === 'fulfilled') {
      this.branches.set(branchesResult.value || []);
    }
  }

  /** When user picks a type, pre-fill ht/wt from the config (user can still edit them) */
  onTypeChange(selectedType: string) {
    this.type.set(selectedType);
    this.applyTypeDefaults(selectedType);
  }

  private applyTypeDefaults(selectedType: string) {
    const config = this.typeConfigs().find(c => c.type === selectedType);
    if (config) {
      this.minHeightReq.set(config.defaultMinHeightCm ?? null);
      this.minWeightReq.set(config.defaultMinWeightKg ?? null);
    }
  }

  async submit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.successMsg.set(null);
    this.errorMsg.set(null);

    try {
      const asset = await apiPost<AssetModel>('/api/vehicles', {
        id: this.id().trim(),
        type: this.type(),
        name: this.name().trim() || null,
        cc: this.cc(),
        color: this.color().trim() || null,
        nextMaintenanceDate: this.nextMaintenanceDate() || null,
        minHeightReq: this.minHeightReq(),
        minWeightReq: this.minWeightReq(),
        clientVehicle: this.clientVehicle(),
        clientVehicleDetails: this.clientVehicleDetails().trim() || null,
        currentBranchId: this.branchId() || null
      });
      this.successMsg.set(`Vehicle "${asset.id}" created successfully.`);
      this.created.emit(asset);
      // Reset form but keep type configs loaded
      const firstType = this.typeConfigs()[0]?.type ?? '';
      form.resetForm();
      this.id.set(''); this.type.set(firstType); this.name.set('');
      this.cc.set(null); this.color.set(''); this.nextMaintenanceDate.set('');
      this.branchId.set(''); this.clientVehicle.set(false); this.clientVehicleDetails.set('');
      this.applyTypeDefaults(firstType);
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.submitting.set(false);
    }
  }
}
