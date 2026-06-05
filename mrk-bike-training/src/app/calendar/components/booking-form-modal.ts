import { Component, inject, OnInit, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarStateService } from '../services/calendar-state.service';
import { CalendarEvent } from '../models/calendar.types';

export interface MetadataFieldConfig {
  key: string;                       // Matches path inside event.metadata, e.g. 'trainerId' or 'clientId'
  label: string;
  type: 'text' | 'select';
  options?: { value: any; label: string }[];
  required?: boolean;
}

@Component({
  selector: 'app-booking-form-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form-modal.html',
  styleUrl: './booking-form-modal.scss',
  standalone: true
})
export class BookingFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly state = inject(CalendarStateService);

  @Input() metadataFields: MetadataFieldConfig[] = [];

  @Output() readonly save = new EventEmitter<Partial<CalendarEvent>>();

  // Bind signals
  protected readonly resources = this.state.resources;
  protected readonly activeEditEvent = this.state.activeEditEvent;
  protected readonly activeCreateSlot = this.state.activeCreateSlot;

  protected bookingForm!: FormGroup;
  protected isEdit = false;

  // Filter list of selectable child resources/assets (exclude folder categories)
  protected readonly selectableResources = computed(() => {
    const filtered = this.resources().filter(r => r.parentId && r.status !== 'DISABLED');
    // Get branchId from form if available
    const branchId = this.bookingForm?.get('branchId')?.value;
    // If branchId is selected, filter resources by branch
    if (branchId) {
      return filtered.filter(r => r.customProperties?.['branchId'] === branchId);
    }
    return filtered;
  });

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    const editEvent = this.activeEditEvent();
    const createSlot = this.activeCreateSlot();

    let title = '';
    let resourceId = '';
    let dateStr = '';
    let startStr = '09:00';
    let endStr = '10:00';
    let status = 'CONFIRMED';
    let notes = '';
    
    // Track dynamic metadata field initial values
    const metadataValues: Record<string, any> = {};

    if (editEvent) {
      this.isEdit = true;
      title = editEvent.title;
      resourceId = String(editEvent.resourceId);
      status = editEvent.status || 'CONFIRMED';
      notes = editEvent.metadata?.['notes'] || '';

      const start = new Date(editEvent.startTime);
      const end = new Date(editEvent.endTime);

      dateStr = this.formatDate(start);
      startStr = this.formatTime(start);
      endStr = this.formatTime(end);

      // Extract existing metadata properties
      this.metadataFields.forEach(f => {
        metadataValues[f.key] = editEvent.metadata?.[f.key] || '';
      });
    } else if (createSlot) {
      this.isEdit = false;
      resourceId = String(createSlot.resourceId);
      dateStr = this.formatDate(createSlot.time);
      startStr = this.formatTime(createSlot.time);

      const endTime = new Date(createSlot.time.getTime() + 60 * 60 * 1000); // Default 1 hour duration
      endStr = this.formatTime(endTime);

      this.metadataFields.forEach(f => {
        metadataValues[f.key] = '';
      });
    }

    // Build standard reactive form controls
    const formControls: Record<string, any> = {
      title: [title, Validators.required],
      resourceId: [resourceId, Validators.required],
      date: [dateStr, Validators.required],
      startTime: [startStr, Validators.required],
      endTime: [endStr, Validators.required],
      status: [status],
      notes: [notes]
    };

    // Append dynamic metadata controls
    this.metadataFields.forEach(f => {
      const validators = f.required ? [Validators.required] : [];
      formControls[f.key] = [metadataValues[f.key], validators];
    });

    this.bookingForm = this.fb.group(formControls);
  }

  protected close() {
    this.state.activeEditEvent.set(null);
    this.state.activeCreateSlot.set(null);
  }

  protected onSubmit() {
    if (this.bookingForm.invalid) return;

    const val = this.bookingForm.value;
    
    // Parse dates
    const startStr = `${val.date}T${val.startTime}`;
    const endStr = `${val.date}T${val.endTime}`;
    const startTime = new Date(startStr);
    const endTime = new Date(endStr);

    // Build metadata payload
    const metadata: Record<string, any> = {
      notes: val.notes
    };

    this.metadataFields.forEach(f => {
      metadata[f.key] = val[f.key];
    });

    const editEvent = this.activeEditEvent();
    
    const eventPayload: Partial<CalendarEvent> = {
      title: val.title,
      resourceId: isNaN(Number(val.resourceId)) ? val.resourceId : Number(val.resourceId),
      startTime,
      endTime,
      status: val.status,
      metadata
    };

    if (this.isEdit && editEvent) {
      eventPayload.id = editEvent.id;
    }

    this.save.emit(eventPayload);
    this.close();
  }

  // Formatting helpers
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatTime(date: Date): string {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}
