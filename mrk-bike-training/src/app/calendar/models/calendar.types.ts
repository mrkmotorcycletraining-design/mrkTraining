export interface CalendarResource {
  id: string | number;
  name: string;
  parentId?: string | number;       // For hierarchical category layout
  status: 'ACTIVE' | 'MAINTENANCE' | 'DISABLED';
  colorTheme?: string;              // Hex value, HSL or CSS class theme color
  customProperties?: Record<string, any>;
}

export interface UIStyles {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  cssClassName?: string;
}

export interface CalendarEvent {
  id: string | number;
  resourceId: string | number;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  status?: string;                  // e.g., 'CONFIRMED', 'PENDING'
  uiStyles?: UIStyles;
  metadata?: Record<string, any>;   // Extensible payload (trainerId, branchId, clientId, etc.)
}

export interface MetaFilterOption {
  value: any;
  label: string;
  count?: number;
}

export interface MetaFilterDefinition {
  key: string;                       // e.g., 'metadata.trainerId' or 'metadata.locationBranchId'
  label: string;                     // Label displayed in filter card
  type: 'checkbox' | 'select' | 'tree';
  options: MetaFilterOption[];
}

export interface CalendarConfig {
  startHour: number;                 // e.g., 6 (6:00 AM)
  endHour: number;                   // e.g., 22 (10:00 PM)
  snapMinutes: number;               // e.g., 15, 30, 60
  collisionKeys?: string[];          // e.g., ['resourceId', 'metadata.trainerId']
  enableQuickCreate?: boolean;
  enableCloning?: boolean;
  weekdayWeekendRules?: boolean;     // Enable weekend vs weekday rules
}

export interface DragMutationEvent {
  eventId: string | number;
  targetResourceId: string | number;
  originalResourceId: string | number;
  newStartTime: Date;
  newEndTime: Date;
}

export interface CloneRequestEvent {
  eventId: string | number;
  maintainTimeSlots: boolean;
  targetDates: string[]; // Formatted as YYYY-MM-DD
}

export interface QuickCreateEvent {
  resourceId: string | number;
  startTime: Date;
  endTime: Date;
  title: string;
  metadata?: Record<string, any>;
}
