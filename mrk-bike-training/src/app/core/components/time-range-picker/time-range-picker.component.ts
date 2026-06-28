import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatTimepickerComponent, NgxMatTimepickerDirective } from 'ngx-mat-timepicker';

/**
 * A single time range picker component.
 *
 * Shows one input field. When clicked, opens a "From" clock picker,
 * then (if toTimeRequired) opens a "To" clock picker.
 * Validates that from time < to time before emitting.
 *
 * Usage:
 * ```html
 * <app-time-range-picker
 *   label="Select Time Range"
 *   placeholder="Click to pick time range"
 *   [toTimeRequired]="true"
 *   (rangeSelected)="onTimeRange($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-time-range-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    NgxMatTimepickerComponent,
    NgxMatTimepickerDirective,
  ],
  templateUrl: './time-range-picker.component.html',
  styleUrls: ['./time-range-picker.component.scss']
})
export class TimeRangePickerComponent {
  @Input() label = 'Select Time Range';
  @Input() placeholder = 'Click to pick time range';
  @Input() fromLabel = 'Select From Time';
  @Input() toLabel = 'Select To Time';

  /** If true (default), requires both from and to time selection. If false, emits only the from time. */
  @Input() toTimeRequired = true;

  /** Minimum selectable time (12-hour format, e.g., "5:00 AM"). Applied to "from" picker. */
  @Input() minTime = '5:00 AM';

  /** Maximum selectable time (12-hour format, e.g., "10:00 PM"). Applied to both pickers. */
  @Input() maxTime = '10:00 PM';

  /** Emits the selected range "HH:MM AM/PM-HH:MM AM/PM" or just "HH:MM AM/PM" if toTimeRequired=false */
  @Output() rangeSelected = new EventEmitter<string>();

  /** Emits validation error messages (e.g., from time >= to time) */
  @Output() validationError = new EventEmitter<string>();

  @ViewChild('fromTimePicker') fromTimePicker!: NgxMatTimepickerComponent;
  @ViewChild('toTimePicker') toTimePicker!: NgxMatTimepickerComponent;

  private pendingFromTime = '';

  /** Exposes the from time as min for the "to" picker */
  get pendingFromTimeForMin(): string {
    return this.pendingFromTime || this.minTime;
  }

  /** Opens the from-time picker */
  open(): void {
    setTimeout(() => this.fromTimePicker.open(), 0);
  }

  onInputClick(): void {
    this.open();
  }

  onFromTimeSet(time: string): void {
    this.pendingFromTime = time;
    if (this.toTimeRequired) {
      setTimeout(() => this.toTimePicker.open(), 0);
    } else {
      // Only from time needed
      this.rangeSelected.emit(time);
      this.pendingFromTime = '';
    }
  }

  onToTimeSet(time: string): void {
    // Validate: from time must be less than to time
    if (!this.isTimeBefore(this.pendingFromTime, time)) {
      this.validationError.emit('From time must be earlier than To time');
      // Re-open the to picker so user can correct
      setTimeout(() => this.toTimePicker.open(), 300);
      return;
    }

    const range = `${this.pendingFromTime}-${time}`;
    this.pendingFromTime = '';
    this.rangeSelected.emit(range);
  }

  /** Returns true if time1 is strictly before time2 (12-hour format) */
  private isTimeBefore(time1: string, time2: string): boolean {
    const d1 = this.parseTo24(time1);
    const d2 = this.parseTo24(time2);
    return d1 < d2;
  }

  /** Parse "HH:MM AM/PM" to minutes since midnight for comparison */
  private parseTo24(time: string): number {
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    return hours * 60 + minutes;
  }
}
