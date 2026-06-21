import { Component, ElementRef, forwardRef, HostListener, Input, signal, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true
    }
  ],
  template: `
    <mat-form-field appearance="outline" (click)="togglePicker()">
      <mat-label>{{ label }}</mat-label>
      <input
        matInput
        [value]="displayValue()"
        readonly
        [placeholder]="placeholder"
        [required]="required"
      />
      <mat-icon matSuffix>access_time</mat-icon>
    </mat-form-field>

    @if (isOpen()) {
      <div class="picker-backdrop" (click)="closePicker()"></div>
      <div class="picker-dropdown">
        <div class="picker-body">
          <div class="scroll-col">
            <div class="col-label">HR</div>
            <div class="scroll-list" #hourCol>
              @for (h of hours; track h) {
                <div
                  class="scroll-item"
                  [class.selected]="h === selectedHour()"
                  (click)="selectHour(h)"
                >{{ h }}</div>
              }
            </div>
          </div>
          <div class="scroll-col">
            <div class="col-label">MIN</div>
            <div class="scroll-list" #minCol>
              @for (m of minutes; track m) {
                <div
                  class="scroll-item"
                  [class.selected]="m === selectedMinute()"
                  (click)="selectMinute(m)"
                >{{ padZero(m) }}</div>
              }
            </div>
          </div>
          <div class="scroll-col period-col">
            <div class="col-label"></div>
            <div class="scroll-list period-list">
              <div
                class="scroll-item"
                [class.selected]="selectedPeriod() === 'AM'"
                (click)="selectPeriod('AM')"
              >AM</div>
              <div
                class="scroll-item"
                [class.selected]="selectedPeriod() === 'PM'"
                (click)="selectPeriod('PM')"
              >PM</div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }

    mat-form-field {
      width: 100%;
      cursor: pointer;
    }

    ::ng-deep .mat-mdc-form-field input {
      cursor: pointer !important;
    }

    .picker-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2000;
    }

    .picker-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 2001;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      min-width: 220px;
      overflow: hidden;
      animation: slideIn 0.15s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .picker-body {
      display: flex;
      padding: 0.5rem 0.25rem;
      gap: 0;
      justify-content: center;
    }

    .scroll-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 60px;
    }

    .period-col {
      width: 50px;
    }

    .col-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #999;
      text-transform: uppercase;
      padding: 0.2rem 0;
      height: 18px;
      letter-spacing: 0.5px;
    }

    .scroll-list {
      height: 180px;
      overflow-y: auto;
      scroll-behavior: smooth;
      scrollbar-width: thin;
      scrollbar-color: #ddd transparent;
    }

    .scroll-list::-webkit-scrollbar {
      width: 2px;
    }

    .scroll-list::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 2px;
    }

    .period-list {
      height: auto;
      overflow: visible;
    }

    .scroll-item {
      padding: 0.4rem 0.5rem;
      text-align: center;
      cursor: pointer;
      border-radius: 6px;
      font-size: 0.95rem;
      color: #666;
      transition: all 0.1s;
      user-select: none;
    }

    .scroll-item:hover {
      background: #f5f5f5;
    }

    .scroll-item.selected {
      color: #e91e63;
      font-weight: 700;
    }
  `
})
export class TimePickerComponent implements ControlValueAccessor {
  @Input() label = 'Time';
  @Input() placeholder = 'Select time';
  @Input() required = false;

  isOpen = signal(false);
  selectedHour = signal(12);
  selectedMinute = signal(0);
  selectedPeriod = signal<'AM' | 'PM'>('AM');
  displayValue = signal('');

  hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  minutes = Array.from({ length: 60 }, (_, i) => i);   // 0-59

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};
  private currentValue = '';

  padZero(n: number): string {
    return String(n).padStart(2, '0');
  }

  togglePicker() {
    this.onTouched();
    this.isOpen.set(!this.isOpen());
  }

  closePicker() {
    this.isOpen.set(false);
  }

  selectHour(h: number) {
    this.selectedHour.set(h);
    this.emitValue();
  }

  selectMinute(m: number) {
    this.selectedMinute.set(m);
    this.emitValue();
  }

  selectPeriod(p: 'AM' | 'PM') {
    this.selectedPeriod.set(p);
    this.emitValue();
  }

  private emitValue() {
    let hour24 = this.selectedHour();
    if (this.selectedPeriod() === 'PM' && hour24 !== 12) hour24 += 12;
    if (this.selectedPeriod() === 'AM' && hour24 === 12) hour24 = 0;

    const timeStr = `${String(hour24).padStart(2, '0')}:${this.padZero(this.selectedMinute())}`;
    this.currentValue = timeStr;
    this.displayValue.set(this.formatDisplay());
    this.onChange(timeStr);
  }

  confirm() {
    this.emitValue();
    this.isOpen.set(false);
  }

  cancel() {
    this.isOpen.set(false);
  }

  private formatDisplay(): string {
    return `${this.selectedHour()}:${this.padZero(this.selectedMinute())} ${this.selectedPeriod()}`;
  }

  // ControlValueAccessor
  writeValue(val: string): void {
    if (!val) {
      this.currentValue = '';
      this.displayValue.set('');
      return;
    }
    this.currentValue = val;
    // Parse HH:mm (24h) to 12h
    const [hStr, mStr] = val.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    this.selectedHour.set(h);
    this.selectedMinute.set(m);
    this.selectedPeriod.set(period);
    this.displayValue.set(this.formatDisplay());
  }

  registerOnChange(fn: (val: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}
