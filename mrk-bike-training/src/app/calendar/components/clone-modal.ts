import { Component, inject, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStateService } from '../services/calendar-state.service';
import { CloneRequestEvent } from '../models/calendar.types';

@Component({
  selector: 'app-clone-modal',
  imports: [CommonModule],
  templateUrl: './clone-modal.html',
  styleUrl: './clone-modal.scss',
  standalone: true
})
export class CloneModalComponent {
  private readonly state = inject(CalendarStateService);

  @Output() readonly cloneConfirmed = new EventEmitter<CloneRequestEvent>();

  // Bind signals
  protected readonly activeCloneEvent = this.state.activeCloneEvent;

  protected readonly weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Sets to track clicked non-contiguous dates
  protected targetDates = new Set<string>();
  protected maintainTimeSlots = true;

  // Compute calendar grids for offset 0 (current month) and offset 1 (next month)
  protected readonly calendarGrids = computed(() => {
    return [
      this.getMonthData(0),
      this.getMonthData(1)
    ];
  });

  private getMonthData(offset: number) {
    const sel = this.state.selectedDate();
    const target = new Date(sel.getFullYear(), sel.getMonth() + offset, 1);
    const year = target.getFullYear();
    const month = target.getMonth();
    const monthName = target.toLocaleString([], { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const startSunday = new Date(firstDay);
    startSunday.setDate(firstDay.getDate() - firstDay.getDay());

    // Generate grid items
    const days: { date: Date; isOther: boolean }[] = [];
    
    // We can compute the correct number of rows. 6 rows (42 cells) cover all months.
    for (let i = 0; i < 42; i++) {
      const d = new Date(startSunday);
      d.setDate(startSunday.getDate() + i);
      days.push({
        date: d,
        isOther: d.getMonth() !== month
      });
    }

    return {
      monthName,
      days
    };
  }

  protected close() {
    this.targetDates.clear();
    this.maintainTimeSlots = true;
    this.state.activeCloneEvent.set(null);
  }

  protected toggleDate(date: Date) {
    const key = this.formatDateKey(date);
    if (this.targetDates.has(key)) {
      this.targetDates.delete(key);
    } else {
      this.targetDates.add(key);
    }
  }

  protected isSelected(date: Date): boolean {
    return this.targetDates.has(this.formatDateKey(date));
  }

  protected submitClone() {
    const ev = this.activeCloneEvent();
    if (!ev || this.targetDates.size === 0) return;

    this.cloneConfirmed.emit({
      eventId: ev.id,
      maintainTimeSlots: this.maintainTimeSlots,
      targetDates: Array.from(this.targetDates)
    });

    this.close();
  }

  private formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
