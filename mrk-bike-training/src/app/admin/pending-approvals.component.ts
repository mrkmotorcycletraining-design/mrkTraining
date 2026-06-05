import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrainingApiService } from '../core/services/training-api.service';
import { ScheduleSlotApi, TrainerApi, AssetApi } from '../core/models/api.models';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>🕐 Pending Approvals</h2>
      <span class="badge-count" *ngIf="slots().length > 0">{{ slots().length }} pending</span>
    </div>

    @if (slots().length === 0) {
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>All clear!</h3>
        <p>No pending schedule approvals at the moment.</p>
      </div>
    }

    @if (slots().length > 0) {
      <div class="approvals-grid">
        @for (s of slots(); track s.id) {
          <div class="approval-card">
            <div class="card-header">
              <div class="client-info">
                <span class="client-avatar">{{ (s.client?.name || 'C')[0].toUpperCase() }}</span>
                <div>
                  <div class="client-name">{{ s.client?.name || 'Unknown Client' }}</div>
                  <div class="slot-id">Slot #{{ s.id }}</div>
                </div>
              </div>
              <span class="status-badge pending">PENDING</span>
            </div>

            <div class="card-details">
              <div class="detail-row">
                <span class="detail-label">📅 Start</span>
                <span>{{ s.startDateTime | date: 'medium' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏱️ End</span>
                <span>{{ s.endDateTime | date: 'shortTime' }}</span>
              </div>
              @if (s.branchId) {
                <div class="detail-row">
                  <span class="detail-label">🏢 Branch</span>
                  <span>{{ s.branchId }}</span>
                </div>
              }
            </div>

            <div class="card-actions">
              <div class="selector-row">
                <div class="selector-group">
                  <label>Assign Vehicle</label>
                  <select [(ngModel)]="selectedAsset[s.id]" class="action-select">
                    <option value="">-- Select Vehicle --</option>
                    @for (a of assets(); track a.id) {
                      <option [value]="a.id">{{ a.name ?? a.id }} ({{ a.type }})</option>
                    }
                  </select>
                </div>
                <div class="selector-group">
                  <label>Assign Trainer</label>
                  <select [(ngModel)]="selectedTrainer[s.id]" class="action-select">
                    <option value="">-- Select Trainer --</option>
                    @for (t of trainers(); track t.id) {
                      <option [value]="t.id">{{ t.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="button-row">
                <button 
                  type="button" 
                  class="btn-approve" 
                  (click)="approve(s.id)"
                  [disabled]="!selectedAsset[s.id] || !selectedTrainer[s.id]"
                >
                  ✓ Approve
                </button>
                <button 
                  type="button" 
                  class="btn-reject" 
                  (click)="reject(s.id)"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .page-header h2 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 700;
    }
    .badge-count {
      background: #ff5252;
      color: #fff;
      padding: 0.2rem 0.7rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #888;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .empty-state h3 {
      font-size: 1.2rem;
      color: #555;
      margin: 0 0 0.5rem;
    }
    .approvals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.25rem;
    }
    .approval-card {
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border: 1px solid #eee;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .approval-card:hover {
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #fafafa;
      border-bottom: 1px solid #eee;
    }
    .client-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .client-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1565c0;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 700;
    }
    .client-name {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .slot-id {
      font-size: 0.78rem;
      color: #888;
    }
    .status-badge.pending {
      background: #fff3e0;
      color: #e65100;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .card-details {
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .detail-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.35rem;
      font-size: 0.88rem;
      color: #333;
    }
    .detail-label {
      color: #888;
      width: 80px;
      flex-shrink: 0;
    }
    .card-actions {
      padding: 1rem 1.25rem;
    }
    .selector-row {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-bottom: 0.85rem;
    }
    .selector-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .selector-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #555;
    }
    .action-select {
      padding: 0.4rem 0.6rem;
      border: 1.5px solid #ccc;
      border-radius: 6px;
      font-size: 0.88rem;
      background: #fafafa;
    }
    .button-row {
      display: flex;
      gap: 0.75rem;
    }
    .btn-approve {
      flex: 1;
      padding: 0.5rem 1rem;
      background: #1565c0;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-approve:hover:not(:disabled) {
      background: #0d47a1;
    }
    .btn-approve:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-reject {
      flex: 1;
      padding: 0.5rem 1rem;
      background: #fff;
      color: #c62828;
      border: 1.5px solid #c62828;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-reject:hover {
      background: #ffebee;
    }
  `
})
export class PendingApprovalsComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  slots = signal<ScheduleSlotApi[]>([]);
  trainers = signal<TrainerApi[]>([]);
  assets = signal<AssetApi[]>([]);

  selectedAsset: Record<number, string> = {};
  selectedTrainer: Record<number, string> = {};

  ngOnInit() {
    this.refresh();
    this.api.listTrainers().subscribe((t) => this.trainers.set(t));
    this.api.listAssets().subscribe((a) => this.assets.set(a));
  }

  refresh() {
    this.api.listPendingSlots().subscribe((s) => {
      this.slots.set(s);
      // Initialize selections for each slot
      s.forEach(slot => {
        if (!this.selectedAsset[slot.id]) this.selectedAsset[slot.id] = '';
        if (!this.selectedTrainer[slot.id]) this.selectedTrainer[slot.id] = '';
      });
    });
  }

  approve(slotId: number) {
    const assetId = this.selectedAsset[slotId];
    const trainerId = this.selectedTrainer[slotId];
    if (!assetId || !trainerId) {
      alert('Please select both a vehicle and a trainer before approving.');
      return;
    }
    this.api.approveSlot(slotId, assetId, Number(trainerId)).subscribe({
      next: () => {
        alert('Schedule approved successfully!');
        this.refresh();
      },
      error: (e) => alert(e.error?.error ?? 'Failed to approve.')
    });
  }

  reject(slotId: number) {
    const reason = prompt('Rejection reason (optional):') ?? undefined;
    this.api.rejectSlot(slotId, reason).subscribe({
      next: () => {
        alert('Schedule rejected.');
        this.refresh();
      },
      error: (e) => alert(e.error?.error ?? 'Failed to reject.')
    });
  }
}
