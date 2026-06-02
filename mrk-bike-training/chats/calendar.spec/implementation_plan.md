# Generic Resource & Task Scheduling Engine (TimeTree Evolution)

This document establishes the architecture for a completely domain-agnostic, highly adaptable resource-scheduling calendar component. Rather than hardcoding business-specific terms (such as "Bikes", "Trainers", "Branches"), the calendar operates on generic **Resources**, **TaskEvents**, and **Metadata-driven Filters**. This makes the component reusable in any project requiring scheduling, tracking, or timeline visual layouts.

---

## 1. Calendar Feature Registry

The calendar component provides the following features:

### A. Multi-Dimensional Layout views
- **Month Grid**: Standard calendar month grid, displaying dates, day density badges, and colored task strips.
- **Week Agenda/Timeline**: Vertical columns representing days of the week, with hourly rows.
- **Day Agenda/Timeline**: Single-day vertical hourly view, allowing high-density scheduling.
- **Resource horizontal Swimlane Timeline**: Resources are mapped vertically down the left-most column; chronological time slots (days or hours) project horizontally across the top headers.

### B. Dynamic Meta-Filter Engine
- Accepts a filter schema configuration. The calling application defines which fields (native event properties or keys inside a generic `metadata` object) can be filtered.
- Automatically generates the filter UI controls in the sidebar (multi-select checklist, dropdown select, or hierarchical tree view for resources).
- Performs reactive client-side filtering on all events, matching properties such as `resourceId` or specific `metadata` tags (e.g. instructor, branch, status).

### C. Pluggable Collision Detection
- Rather than running hardcoded check rules, the calendar uses a dynamic check strategy:
  1. **Configured Key Matching**: A string list of metadata/property keys that cannot overlap (e.g. `['resourceId']` to prevent double-booking a resource, or `['resourceId', 'metadata.trainerId']` to prevent overlapping assignments).
  2. **Custom Collision Callback**: A pluggable handler method `isCollisionAllowed(draggedEvent, targetResource, targetTimes): boolean` that the parent component provides.
- Triggers visual "Collision Overlays" (green for vacant, red for invalid/occupied slots) during drag actions.

### D. Snapping Pointer-Based Drag & Drop
- Custom mouse and touch event-handlers (avoiding heavy external dependencies for maximum styling control).
- Renders a lightweight, absolute-positioned "ghost block" under the user cursor during drag.
- Automatically snaps the ghost element to configurable time increments (e.g. 15 minutes, 30 minutes, 1 hour, or 1 day).

### E. Quick-History Action Menu
- Contextual floating menu triggered by desktop right-click or mobile long-press (600ms hold).
- Displays pre-configured quick-inject event templates provided by the calling component (e.g. name, default duration, initial metadata payload) for quick insertion at the clicked time-slot.

### F. Batch Replication Dialog (Clone Engine)
- A pop-up modal containing a 2-month compact selection grid.
- Allows operators to click non-contiguous dates (e.g. June 3rd, 5th, and 9th) to copy a source event.
- Toggle switch for maintaining identical hour-slots or creating whole-day assignments.

### G. Visual Rule Overlay & Inactive Shading
- Custom hour matrices (such as 6:00 AM to 10:00 PM operational boundaries).
- Hatch shading for non-operational hours, custom calendar slots, or maintenance blocks.
- Weekday vs Weekend adaptive layout changes (e.g. weekday hourly grid divisions vs weekend trip-sized scheduling grids).

---

## 2. Design & Functionality Layout

### Component Hierarchy (Decoupled & Standalone)

```
+----------------------------------------------------------------------------------+
|                            [Generic Calendar Canvas]                             |
|                                                                                  |
|  +--------------------+  +----------------------------------------------------+  |
|  | [Sidebar Filters]  |  |  +----------------------------------------------+  |  |
|  | - Resource Tree    |  |  | [Calendar Header: Month/Week/Day/Resource]   |  |  |
|  | - Meta Filter Form |  |  +----------------------------------------------+  |  |
|  |                    |  |  | [Active View Grid]                           |  |  |
|  +--------------------+  |  | (MonthView / WeekView / ResourceTimeline)    |  |  |
|                          |  +----------------------------------------------+  |  |
|                          |  | [Detail agenda Panel / Mobile Slide-up]       |  |  |
|                          |  +----------------------------------------------+  |  |
|                          +----------------------------------------------------+  |
|                                                                                  |
|   Overlays Layer: [BookingModal]  [CloneModal]  [QuickMenu]  [GhostDragBlock]    |
+----------------------------------------------------------------------------------+
```

### Visual Aesthetics
- **Canvas Colors**: Soft, desaturated backgrounds (light HSL warm creams vs dark HSL charcoal slate) to focus on content.
- **Glassmorphism**: Sticky headers, modals, and float panels utilizing `backdrop-filter: blur(12px)` and thin semi-transparent borders.
- **Strips & Badges**: Events render with custom-accented borders and matching theme variables defined in the resource config.

---

## 3. Data Contracts & Extensible Interfaces

To ensure high adaptability, the component works with the following data interfaces:

### A. Schedulable Resource Structure
```typescript
export interface CalendarResource {
  id: string | number;
  name: string;
  parentId?: string | number;       // For nesting/hierarchical sidebar checks
  status: 'ACTIVE' | 'MAINTENANCE' | 'DISABLED';
  colorTheme?: string;              // Base color for this resource / category
  customProperties?: Record<string, any>; // Extensible user-defined properties
}
```

### B. Calendar Event Structure
```typescript
export interface CalendarEvent {
  id: string | number;
  resourceId: string | number;       // Link to the target resource
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  status?: string;                  // e.g., 'CONFIRMED', 'PENDING'
  styleTheme?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    cssClass?: string;
  };
  metadata?: Record<string, any>;   // Domain-specific fields (e.g. trainerId, clientName)
}
```

### C. Sidebar Filter Definition
```typescript
export interface MetaFilterDefinition {
  key: string;                       // Field inside metadata, e.g. 'metadata.trainerId'
  label: string;                     // Label shown in the filter panel
  type: 'checkbox' | 'select' | 'tree'; 
  options: { value: any; label: string; count?: number }[];
}
```

---

## 4. Angular Component API (Inputs, Outputs & Templates)

The calendar component exposes a clear programmatic boundary:

### Component Inputs (`@Input` / Signal Inputs)
- `resources` (`CalendarResource[]`): Schedulable entities.
- `events` (`CalendarEvent[]`): Active schedules.
- `filters` (`MetaFilterDefinition[]`): Custom filter layout schema.
- `readOnly` (`boolean`): Disable all drags, double clicks, cloning, and quick menus.
- `viewMode` (`'month' | 'week' | 'day' | 'resource'`): The rendering view.
- `config` (`CalendarConfig`): Contains operational hour structures, dragging steps, and collision configurations:
  ```typescript
  export interface CalendarConfig {
    startHour: number;               // e.g. 6 (6:00 AM)
    endHour: number;                 // e.g. 22 (10:00 PM)
    snapMinutes: number;             // e.g. 15, 30, 60 minutes
    collisionKeys?: string[];        // Overlap checks, e.g. ['resourceId']
    enableQuickCreate?: boolean;
    enableCloning?: boolean;
    weekdayWeekendRules?: boolean;   // Enable weekend/weekday structure variations
  }
  ```
- `isCollisionAllowed`: A custom verification callback function:
  ```typescript
  @Input() isCollisionAllowed?: (
    draggedEvent: CalendarEvent, 
    targetResource: CalendarResource, 
    newStart: Date, 
    newEnd: Date
  ) => boolean;
  ```

### Component Outputs (`@Output` / Signal Outputs)
- `eventChanged` (emits `{ event: CalendarEvent, originalEvent: CalendarEvent }`): Triggered upon drag-drops or resize completions.
- `eventCreated` (emits `Partial<CalendarEvent>`): Triggered upon quick-create template injection or formal modal completion.
- `eventCloned` (emits `{ eventId: string|number, targetDates: Date[], maintainTime: boolean }`): Emits clone arrays.
- `eventDeleted` (emits `string | number`): Emits deleted ID.
- `eventSelected` (emits `CalendarEvent`): Triggered upon clicking a task block.

### Extensible Templates (Slots)
We will leverage Angular `<ng-template>` inputs so calling applications can fully customize rendering:
- `eventTemplate`: Customize event cell look (e.g. show custom icons, avatars).
- `detailsTemplate`: Customize the content rendered inside the right context panel.
- `formTemplate`: Supply a custom form for creating/editing events.

---

## 5. MRK Bike Training Implementation (Showcase Config)

To verify correctness for the bike scheduling engine, the demo dashboard (`app.ts`) will configure the generic calendar as follows:

1. **Resources**:
   - Nesting Category parent node: "Geared Motorcycles" (color `#D32F2F`) -> Child assets: "TVS Apache" (Asset ID 101), "Royal Enfield Meteor" (Asset ID 102).
   - Nesting Category parent node: "Automatic Scooters" (color `#388E3C`) -> Child asset: "Honda Activa" (Asset ID 201).
2. **Metadata**:
   - Every booking event will include `metadata: { trainerId: string, clientId: string, locationBranchId: number }`.
3. **Sidebar Filter Schema**:
   - `metadata.locationBranchId` -> "Branch Office" Dropdown
   - `metadata.trainerId` -> "Instructors" Checklist
   - `resourceId` -> Hierarchy check tree mapping Category -> Assets
4. **Collision Rule**:
   - Set collision keys to `['resourceId', 'metadata.trainerId']` to prevent an instructor from being assigned to two different tasks simultaneously, and a motorcycle from being double-booked.
5. **Interactive Controls**:
   - Dashboard options to switch between full interactive mode, read-only display, and switch mock validation rules (triggering rollback).
