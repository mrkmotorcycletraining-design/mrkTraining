import { Component, Input, Output, EventEmitter, signal, ViewChild, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxMatTimepickerComponent, NgxMatTimepickerDirective } from 'ngx-mat-timepicker';

export interface DateTimeRange {
  start: string;
  end: string;
}

@Component({
  selector: 'app-custom-range-datetime-multiselect',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxMatTimepickerComponent,
    NgxMatTimepickerDirective,
  ],
  templateUrl: './custom-range-datetime-multiselect.component.html',
  styleUrls: ['./custom-range-datetime-multiselect.component.scss']
})
export class CustomRangeDatetimeMultiselectComponent {
  @Input() label = 'Select Range';
  @Input() placeholder = 'Click to add range';
  @Input() timeOnly = false;
  @Input() dateOnly = false;
  @Input() endTimeRequired = false;
  @Input() priorDateAllowed = true;

  /** Minimum date for the date picker (set to today when priorDateAllowed is false) */
  get minDate(): Date | null {
    return this.priorDateAllowed ? null : new Date();
  }

  /** Two-way binding for selectedRanges */
  selectedRanges = model<string[]>([]);
  @Output() rangesChange = new EventEmitter<DateTimeRange[]>();

  @ViewChild('rangePicker') rangePicker!: MatDateRangePicker<Date>;
  @ViewChild('fromTimePicker') fromTimePicker!: NgxMatTimepickerComponent;
  @ViewChild('toTimePicker') toTimePicker!: NgxMatTimepickerComponent;

  ranges = signal<string[]>([]);

  // Internal state for building a range step-by-step
  private pendingDateStart: Date | null = null;
  private pendingDateEnd: Date | null = null;
  private pendingFromTime: string = '';

  // Hidden date range fields
  dateRangeStart: Date | null = null;
  dateRangeEnd: Date | null = null;

  onInputClick(): void {
    if (this.dateOnly) {
      this.openDateRangePicker();
    } else if (this.timeOnly) {
      this.openFromTimePicker();
    } else {
      // Datetime mode: open date range picker first
      this.openDateRangePicker();
    }
  }

  private openDateRangePicker(): void {
    // Reset date inputs
    this.dateRangeStart = null;
    this.dateRangeEnd = null;
    setTimeout(() => this.rangePicker.open(), 0);
  }

  private openFromTimePicker(): void {
    setTimeout(() => this.fromTimePicker.open(), 0);
  }

  private openToTimePicker(): void {
    setTimeout(() => this.toTimePicker.open(), 0);
  }

  /** Called when date range picker is closed */
  onDateRangeClosed(): void {
    if (!this.dateRangeStart || !this.dateRangeEnd) return;

    this.pendingDateStart = this.dateRangeStart;
    this.pendingDateEnd = this.dateRangeEnd;

    // Reset the date inputs so picker looks clean next time
    this.dateRangeStart = null;
    this.dateRangeEnd = null;

    if (this.dateOnly) {
      // Finalize immediately with date format
      const formatted = `${this.formatDate(this.pendingDateStart)}-${this.formatDate(this.pendingDateEnd)}`;
      this.addChip(formatted);
      this.pendingDateStart = null;
      this.pendingDateEnd = null;
    } else {
      // Datetime mode: now open from time picker
      this.openFromTimePicker();
    }
  }

  /** Called when "from" time picker sets a value */
  onFromTimeSet(time: string): void {
    if (this.timeOnly) {
      this.pendingFromTime = time;
      // Now open the "to" picker
      this.openToTimePicker();
    } else {
      // Datetime mode: we have the date range + from time
      this.pendingFromTime = time;
      if (this.endTimeRequired) {
        this.openToTimePicker();
      } else {
        // Format: DD/MM/YYYY-DD/MM/YYYY HH:MM AM/PM
        const formatted = `${this.formatDate(this.pendingDateStart!)}-${this.formatDate(this.pendingDateEnd!)} ${time}`;
        this.addChip(formatted);
        this.resetPending();
      }
    }
  }

  /** Called when "to" time picker sets a value */
  onToTimeSet(time: string): void {
    if (this.timeOnly) {
      // Format: HH:MM AM/PM-HH:MM AM/PM
      const formatted = `${this.pendingFromTime}-${time}`;
      this.addChip(formatted);
      this.pendingFromTime = '';
    } else {
      // Datetime with endTimeRequired
      // Format: DD/MM/YYYY HH:MM AM/PM-DD/MM/YYYY HH:MM AM/PM
      const formatted = `${this.formatDate(this.pendingDateStart!)} ${this.pendingFromTime}-${this.formatDate(this.pendingDateEnd!)} ${time}`;
      this.addChip(formatted);
      this.resetPending();
    }
  }

  removeChip(index: number): void {
    const updated = this.ranges().filter((_, i) => i !== index);
    this.ranges.set(updated);
    this.selectedRanges.set(updated);
    this.emitRanges(updated);
  }

  private addChip(value: string): void {
    const updated = [...this.ranges(), value];
    this.ranges.set(updated);
    this.selectedRanges.set(updated);
    this.emitRanges(updated);
  }

  private emitRanges(chips: string[]): void {
    const parsed: DateTimeRange[] = chips.map(chip => {
      const parts = chip.split('-');
      if (this.timeOnly) {
        // HH:MM AM/PM-HH:MM AM/PM — split on first hyphen between the two time parts
        const match = chip.match(/^(.+\s(?:AM|PM))-(.+\s(?:AM|PM))$/i);
        if (match) {
          return { start: match[1], end: match[2] };
        }
      }
      if (this.dateOnly) {
        // DD/MM/YYYY-DD/MM/YYYY
        const mid = 10; // length of DD/MM/YYYY
        return { start: chip.substring(0, mid), end: chip.substring(mid + 1) };
      }
      // Datetime modes - emit the full string as start-end
      if (this.endTimeRequired) {
        // DD/MM/YYYY HH:MM AM/PM-DD/MM/YYYY HH:MM AM/PM
        const match = chip.match(/^(.+\s(?:AM|PM))-(.+\s(?:AM|PM))$/i);
        if (match) {
          return { start: match[1], end: match[2] };
        }
      } else {
        // DD/MM/YYYY-DD/MM/YYYY HH:MM AM/PM
        // Find the second date after the first hyphen at position 10
        const mid = 10;
        return { start: chip.substring(0, mid), end: chip.substring(mid + 1) };
      }
      return { start: chip, end: '' };
    });
    this.rangesChange.emit(parsed);
  }

  private formatDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  private resetPending(): void {
    this.pendingDateStart = null;
    this.pendingDateEnd = null;
    this.pendingFromTime = '';
  }
}
