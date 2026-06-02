import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStateService } from '../services/calendar-state.service';
import { CalendarResource, MetaFilterDefinition } from '../models/calendar.types';

@Component({
  selector: 'app-sidebar-filter',
  imports: [CommonModule],
  templateUrl: './sidebar-filter.html',
  styleUrl: './sidebar-filter.scss',
  standalone: true
})
export class SidebarFilterComponent {
  private readonly state = inject(CalendarStateService);

  // Expose signals for binding
  protected readonly resources = this.state.resources;
  protected readonly checkedResourceIds = this.state.checkedResourceIds;
  protected readonly filterSchema = this.state.filterSchema;
  protected readonly activeMetaFilters = this.state.activeMetaFilters;

  // Build the hierarchical category layout
  protected readonly resourceTree = computed(() => {
    const list = this.resources();
    const parents = list.filter(r => !r.parentId);
    
    return parents.map(parent => {
      const children = list.filter(r => r.parentId === parent.id);
      return {
        parent,
        children
      };
    });
  });

  // Calculate status counts for the status bar
  protected readonly statusCounts = computed(() => {
    const list = this.resources().filter(r => r.parentId); // Count actual assets, not parent folders
    const active = list.filter(r => r.status === 'ACTIVE').length;
    const maintenance = list.filter(r => r.status === 'MAINTENANCE').length;
    const disabled = list.filter(r => r.status === 'DISABLED').length;

    return {
      active,
      maintenance,
      disabled,
      total: list.length
    };
  });

  // Get select-type filters (like Branch)
  protected readonly selectFilters = computed(() => {
    return this.filterSchema().filter(f => f.type === 'select');
  });

  // Get checkbox-type filters (like Trainers)
  protected readonly checkboxFilters = computed(() => {
    return this.filterSchema().filter(f => f.type === 'checkbox');
  });

  protected isResourceChecked(id: string | number): boolean {
    return this.checkedResourceIds().has(id);
  }

  protected toggleResource(id: string | number) {
    this.state.toggleResourceCheck(id);
  }

  protected toggleMeta(key: string, value: any) {
    this.state.toggleMetaFilterValue(key, value);
  }

  protected isMetaChecked(key: string, value: any): boolean {
    const checked = this.activeMetaFilters().get(key);
    return checked ? checked.has(value) : false;
  }

  protected getSelectedMetaValue(key: string): any {
    const checked = this.activeMetaFilters().get(key);
    if (!checked || checked.size === 0) return '';
    return Array.from(checked)[0];
  }

  protected onSelectChange(key: string, event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.state.clearMetaFilter(key);
    if (val !== '') {
      this.state.toggleMetaFilterValue(key, val);
    }
  }

  protected selectAllResources() {
    this.state.setAllResourcesChecked(true);
  }

  protected clearAllResources() {
    this.state.setAllResourcesChecked(false);
  }

  protected selectAllMeta(key: string, options: any[]) {
    this.state.clearMetaFilter(key);
    options.forEach(opt => {
      this.state.toggleMetaFilterValue(key, opt.value);
    });
  }

  protected clearAllMeta(key: string) {
    this.state.clearMetaFilter(key);
  }
}
