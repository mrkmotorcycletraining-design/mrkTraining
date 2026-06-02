import { Component, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStateService } from '../services/calendar-state.service';
import { QuickCreateEvent } from '../models/calendar.types';

export interface QuickTemplate {
  title: string;
  durationMinutes: number;
  metadata?: Record<string, any>;
}

@Component({
  selector: 'app-quick-menu',
  imports: [CommonModule],
  templateUrl: './quick-menu.html',
  styleUrl: './quick-menu.scss',
  standalone: true
})
export class QuickMenuComponent {
  private readonly state = inject(CalendarStateService);

  @Input() templates: QuickTemplate[] = [
    { title: 'Quick Task', durationMinutes: 60 },
    { title: 'Routine Check', durationMinutes: 30 },
    { title: 'Block Time / Reservation', durationMinutes: 120 },
    { title: 'Standard Booking', durationMinutes: 90 }
  ];

  @Output() readonly quickCreate = new EventEmitter<QuickCreateEvent>();

  protected readonly menuState = this.state.quickMenu;

  protected getMenuStyles() {
    const s = this.menuState();
    if (!s) return {};
    
    // Check viewport boundaries to prevent menu overflow
    const x = s.x;
    const y = s.y;
    const bufferX = 200; 
    const bufferY = 220; 
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const left = (x + bufferX > windowWidth) ? `${windowWidth - bufferX}px` : `${x}px`;
    const top = (y + bufferY > windowHeight) ? `${windowHeight - bufferY}px` : `${y}px`;

    return {
      left,
      top
    };
  }

  protected closeMenu() {
    this.state.quickMenu.set(null);
  }

  protected selectTemplate(template: QuickTemplate) {
    const s = this.menuState();
    if (!s) return;

    const startTime = s.time;
    const endTime = new Date(startTime.getTime() + template.durationMinutes * 60 * 1000);

    this.quickCreate.emit({
      resourceId: s.resourceId,
      startTime,
      endTime,
      title: template.title,
      metadata: template.metadata || {}
    });

    this.closeMenu();
  }

  protected triggerFullCreate() {
    const s = this.menuState();
    if (!s) return;

    // Set active create slot to trigger the formal creation form modal
    this.state.activeCreateSlot.set({
      resourceId: s.resourceId,
      time: s.time
    });

    this.closeMenu();
  }
}
