import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TrainingApiService } from '../core/services/training-api.service';
import { BranchApi, AssetApi, CourseApi } from '../core/models/api.models';

type TabKey = 'branches' | 'vehicles' | 'courses';

@Component({
  selector: 'app-site-management',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h2>🏢 Admin</h2>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs">
      <button class="tab-btn" [class.active]="activeTab() === 'branches'" (click)="setTab('branches')">
        🏢 Branches
        <span class="tab-badge">{{ branches().length }}</span>
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'vehicles'" (click)="setTab('vehicles')">
        🏍️ Vehicles
        <span class="tab-badge">{{ assets().length }}</span>
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'courses'" (click)="setTab('courses')">
        📚 Courses
        <span class="tab-badge">{{ courses().length }}</span>
      </button>
    </div>

    <!-- Branches Tab -->
    @if (activeTab() === 'branches') {
      <div class="section-layout">
        <!-- Add Branch Form -->
        <div class="form-card">
          <h3>Add Branch</h3>
          <form (ngSubmit)="addBranch()" #branchForm="ngForm">
            <div class="form-field">
              <label>Branch ID</label>
              <input [(ngModel)]="branchId" name="bid" placeholder="e.g., MRK-BNG-01" required />
            </div>
            <div class="form-field">
              <label>Branch Name</label>
              <input [(ngModel)]="branchName" name="bn" placeholder="e.g., MRK Bangalore Central" required />
            </div>
            <div class="form-field">
              <label>Address</label>
              <textarea [(ngModel)]="branchAddr" name="ba" rows="3" placeholder="Full address" required></textarea>
            </div>
            <button type="submit" class="btn-primary" [disabled]="!branchForm.valid">Add Branch</button>
          </form>
        </div>

        <!-- Branch List -->
        <div class="list-section">
          <h3>Branches ({{ branches().length }})</h3>
          @if (branches().length === 0) {
            <div class="empty-hint">No branches added yet.</div>
          }
          <div class="cards-grid">
            @for (b of branches(); track b.id) {
              <div class="item-card">
                <div class="item-icon branch-icon">🏢</div>
                <div class="item-info">
                  <div class="item-name">{{ b.name }}</div>
                  <div class="item-id">ID: {{ b.id }}</div>
                  @if (b.locationAddress) {
                    <div class="item-detail">📍 {{ b.locationAddress }}</div>
                  }
                </div>
                <div class="item-actions">
                  <button type="button" class="btn-secondary-sm" (click)="startEditBranch(b)" title="Edit Branch">✏️ Edit</button>
                </div>
              </div>
            }
          </div>

          <!-- Edit Branch Inline Form -->
          @if (editingBranch()) {
            <div class="form-card" style="margin-top: 1rem;">
              <h3>Update Branch: {{ editingBranch()!.id }}</h3>
              <form (ngSubmit)="saveEditBranch()">
                <div class="form-field">
                  <label>Branch Name</label>
                  <input [(ngModel)]="editBranchName" name="ebn" [placeholder]="editingBranch()!.name ?? ''" required />
                </div>
                <div class="form-field">
                  <label>Address</label>
                  <textarea [(ngModel)]="editBranchAddr" name="eba" rows="3" [placeholder]="editingBranch()!.locationAddress ?? ''" required></textarea>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <button type="submit" class="btn-primary">Save</button>
                  <button type="button" class="btn-primary" style="background: #757575;" (click)="cancelEditBranch()">Cancel</button>
                </div>
              </form>
            </div>
          }
        </div>
      </div>
    }

    <!-- Vehicles Tab -->
    @if (activeTab() === 'vehicles') {
      <div class="section-layout">
        <!-- Vehicle List -->
        <div class="list-section">
          <div class="section-header">
            <h3>Vehicles ({{ assets().length }})</h3>
            <button type="button" class="btn-primary" routerLink="/admin/vehicles-add">+ Add Vehicle</button>
          </div>
          @if (assets().length === 0) {
            <div class="empty-hint">No vehicles added yet.</div>
          }
          <div class="cards-grid">
            @for (a of assets(); track a.id) {
              <div class="item-card" [class.in-maintenance]="a.status === 'MAINTENANCE'">
                <div class="item-icon vehicle-icon">🏍️</div>
                <div class="item-info">
                  <div class="item-name">{{ a.name ?? a.id }}</div>
                  <div class="item-id">ID: {{ a.id }}</div>
                  <div class="item-detail">
                    <span class="type-badge" [class]="'type-' + (a.vehicleType?.type ?? '').toLowerCase()">{{ a.vehicleType?.label || a.vehicleType?.type }}</span>
                    @if (a.currentBranch?.name) {
                      <span class="branch-label">@ {{ a.currentBranch?.name }}</span>
                    }
                  </div>
                  @if (a.status) {
                    <div class="status-label" [class.maint]="a.status === 'MAINTENANCE'">{{ a.status }}</div>
                  }
                </div>
                <div class="item-actions">
                  <button type="button" class="btn-warning-sm" (click)="maintenance(a.id)" title="Set Maintenance">
                    🔧
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Courses Tab -->
    @if (activeTab() === 'courses') {
      <div class="section-layout">
        <!-- Add Course Form -->
        <div class="form-card">
          <h3>Add Course Template</h3>
          <form (ngSubmit)="addCourse()" #courseForm="ngForm">
            <div class="form-field">
              <label>Course ID</label>
              <input [(ngModel)]="courseId" name="cid" placeholder="e.g., COURSE-GEARED-BASIC" required />
            </div>
            <div class="form-field">
              <label>Course Name</label>
              <input [(ngModel)]="courseName" name="cn" placeholder="e.g., Basic Geared Riding" required />
            </div>
            <div class="form-field">
              <label>Category</label>
              <select [(ngModel)]="courseCategory" name="cc" required>
                <option value="">-- Select Category --</option>
                <option value="NORMAL">Normal</option>
                <option value="PREMIUM">Premium</option>
                <option value="TRIP">Trip</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Hours Per Day</label>
                <input [(ngModel)]="courseHours" name="ch" type="number" min="1" max="12" placeholder="e.g., 2" required />
              </div>
              <div class="form-field">
                <label>Total Days</label>
                <input [(ngModel)]="courseDays" name="cd" type="number" min="1" placeholder="e.g., 7" required />
              </div>
            </div>
            <button type="submit" class="btn-primary" [disabled]="!courseForm.valid">Add Course</button>
          </form>
        </div>

        <!-- Course List -->
        <div class="list-section">
          <h3>Course Templates ({{ courses().length }})</h3>
          @if (courses().length === 0) {
            <div class="empty-hint">No courses added yet.</div>
          }
          <div class="cards-grid">
            @for (c of courses(); track c.id) {
              <div class="item-card course-card">
                <div class="item-icon course-icon">📚</div>
                <div class="item-info">
                  <div class="item-name">{{ c.name }}</div>
                  <div class="item-id">ID: {{ c.id }}</div>
                  <div class="item-detail">
                    <span class="cat-badge cat-{{ (c.category ?? '').toLowerCase() }}">{{ c.category }}</span>
                    @if (c.hoursPerDay) {
                      <span class="meta-text">{{ c.hoursPerDay }}h/day &bull; {{ c.totalDays }} days</span>
                    }
                  </div>
                </div>
                <div class="item-actions">
                  <a href="/admin/courses-template" class="btn-secondary-sm" style="text-decoration: none;">🖼 Template</a>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .page-header {
      margin-bottom: 1rem;
    }
    .page-header h2 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 700;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #e0e0e0;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 0.65rem 1.25rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #666;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: #1565c0; }
    .tab-btn.active {
      color: #1565c0;
      border-bottom-color: #1565c0;
    }
    .tab-badge {
      background: #e3f2fd;
      color: #1565c0;
      padding: 0.1rem 0.45rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .tab-btn.active .tab-badge {
      background: #1565c0;
      color: #fff;
    }

    /* Layout */
    .section-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    /* Form card */
    .form-card {
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      padding: 1.5rem;
      border: 1px solid #eee;
    }
    .form-card h3 {
      margin: 0 0 1.25rem;
      font-size: 1rem;
      font-weight: 700;
      color: #333;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-bottom: 0.85rem;
    }
    .form-field label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #555;
    }
    .form-field input,
    .form-field select,
    .form-field textarea {
      padding: 0.5rem 0.65rem;
      border: 1.5px solid #ddd;
      border-radius: 6px;
      font-size: 0.9rem;
      background: #fafafa;
      transition: border-color 0.2s;
    }
    .form-field input:focus,
    .form-field select:focus,
    .form-field textarea:focus {
      outline: none;
      border-color: #1565c0;
      background: #fff;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .btn-primary {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.6rem 1rem;
      background: #1565c0;
      color: #fff;
      border: none;
      border-radius: 7px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #0d47a1; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* List section */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .section-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #333;
    }
    .list-section h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 700;
      color: #333;
    }
    .empty-hint {
      color: #aaa;
      font-size: 0.9rem;
      font-style: italic;
      padding: 1rem 0;
    }
    .cards-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .item-card {
      background: #fff;
      border: 1px solid #eee;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transition: box-shadow 0.2s;
    }
    .item-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
    .item-card.in-maintenance { border-left: 4px solid #ff9800; }

    .item-icon {
      font-size: 1.6rem;
      flex-shrink: 0;
    }
    .item-info {
      flex: 1;
      min-width: 0;
    }
    .item-name {
      font-weight: 600;
      font-size: 0.92rem;
      color: #222;
    }
    .item-id {
      font-size: 0.75rem;
      color: #888;
    }
    .item-detail {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
      flex-wrap: wrap;
    }
    .type-badge {
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .type-geared { background: #e8f5e9; color: #2e7d32; }
    .type-non_geared { background: #e3f2fd; color: #1565c0; }
    .branch-label {
      font-size: 0.78rem;
      color: #666;
    }
    .status-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #2e7d32;
    }
    .status-label.maint { color: #e65100; }

    .cat-badge {
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .cat-normal { background: #e3f2fd; color: #1565c0; }
    .cat-premium { background: #fff3e0; color: #e65100; }
    .cat-trip { background: #e8f5e9; color: #2e7d32; }
    .cat-other { background: #f3e5f5; color: #7b1fa2; }
    .meta-text {
      font-size: 0.78rem;
      color: #666;
    }

    .item-actions {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      align-items: flex-end;
    }
    .btn-warning-sm {
      background: #fff3e0;
      color: #e65100;
      border: 1.5px solid #ffcc80;
      border-radius: 6px;
      padding: 0.3rem 0.55rem;
      font-size: 0.88rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-warning-sm:hover { background: #ffe0b2; }
    .image-update {
      display: flex;
      gap: 0.35rem;
      align-items: center;
    }
    .img-input {
      padding: 0.3rem 0.5rem;
      border: 1.5px solid #ddd;
      border-radius: 5px;
      font-size: 0.8rem;
      width: 130px;
    }
    .btn-secondary-sm {
      background: #e3f2fd;
      color: #1565c0;
      border: 1.5px solid #90caf9;
      border-radius: 5px;
      padding: 0.3rem 0.55rem;
      font-size: 0.8rem;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-secondary-sm:hover { background: #bbdefb; }

    @media (max-width: 900px) {
      .section-layout { grid-template-columns: 1fr; }
    }
  `
})
export class SiteManagementComponent implements OnInit {
  private readonly api = inject(TrainingApiService);

  activeTab = signal<TabKey>('branches');
  branches = signal<BranchApi[]>([]);
  assets = signal<AssetApi[]>([]);
  courses = signal<CourseApi[]>([]);

  branchId = '';
  branchName = '';
  branchAddr = '';
  editingBranch = signal<BranchApi | null>(null);
  editBranchName = '';
  editBranchAddr = '';
  courseId = '';
  courseName = '';
  courseCategory = '';
  courseHours = 0;
  courseDays = 0;

  ngOnInit() {
    this.reload();
  }

  setTab(tab: TabKey) {
    this.activeTab.set(tab);
  }

  reload() {
    this.api.listBranches().subscribe((b) => this.branches.set(b));
    this.api.listAssets().subscribe((a) => this.assets.set(a));
    this.api.listCourses().subscribe((c) => this.courses.set(c));
  }

  addBranch() {
    this.api
      .createBranch({ id: this.branchId, name: this.branchName, locationAddress: this.branchAddr })
      .subscribe({
        next: () => {
          this.reload();
          this.branchId = '';
          this.branchName = '';
          this.branchAddr = '';
        },
        error: (e) => alert(e.error?.error ?? 'Failed to add branch')
      });
  }

  startEditBranch(branch: BranchApi) {
    this.editingBranch.set(branch);
    this.editBranchName = branch.name ?? '';
    this.editBranchAddr = branch.locationAddress ?? '';
  }

  saveEditBranch() {
    const b = this.editingBranch();
    if (!b) return;
    this.api.updateBranch(b.id, { name: this.editBranchName, locationAddress: this.editBranchAddr })
      .subscribe({
        next: () => {
          this.editingBranch.set(null);
          this.reload();
        },
        error: (e) => alert(e.error?.error ?? 'Failed to update branch')
      });
  }

  cancelEditBranch() {
    this.editingBranch.set(null);
  }

  addCourse() {
    this.api
      .createCourse({
        id: this.courseId,
        name: this.courseName,
        category: this.courseCategory,
        hoursPerDay: this.courseHours,
        totalDays: this.courseDays
      })
      .subscribe({
        next: () => {
          this.reload();
          this.courseId = '';
          this.courseName = '';
          this.courseCategory = '';
          this.courseHours = 0;
          this.courseDays = 0;
        },
        error: (e: any) => alert(e.error?.error ?? 'Failed to add course')
      });
  }

  maintenance(assetId: string) {
    if (!confirm('Mark this vehicle as under maintenance?')) return;
    this.api.setAssetMaintenance(assetId).subscribe({
      next: () => {
        alert('Vehicle marked for maintenance.');
        this.reload();
      },
      error: (e) => alert(e.error?.error ?? 'Failed')
    });
  }

  setImage(_courseId: string, _imageUrl: string) {
    // Deprecated — use courses-template page for file upload
    alert('Please use the "Add/Update Training Template" page for uploading templates.');
  }
}
