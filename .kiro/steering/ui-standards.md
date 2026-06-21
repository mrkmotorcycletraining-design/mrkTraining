# UI Standards & Component Rules

These rules apply to all Angular components in the mrk-bike-training project.

## Theme & Colors

- The application theme is **blue and white** — consistent with the navbar.
- Primary backgrounds use blue gradients; text, icons, and form outlines are white.
- Do not introduce other accent colors unless explicitly requested.

## Single Responsibility Principle

- Every Angular component should have ONE clear responsibility.
- Split large components into smaller, focused ones (e.g., separate form logic from display logic).
- Services should handle a single domain concern.
- Functions should do one thing — if a function exceeds ~20 lines, consider extracting helpers.

## Date Fields

- All date input fields MUST use the Angular Material Datepicker (`mat-datepicker`) instead of native `<input type="date">`.
- Use `matDatepickerToggle` as a suffix with a calendar icon.
- Import `MatDatepickerModule` and `MatNativeDateModule` (or `MatMomentDateModule` if moment is used).
- Example pattern:
  ```html
  <mat-form-field appearance="outline">
    <mat-label>Date Label</mat-label>
    <input matInput [matDatepicker]="picker" name="fieldName" [(ngModel)]="fieldValue" />
    <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
    <mat-datepicker #picker></mat-datepicker>
  </mat-form-field>
  ```

## Time Fields

- All time-only input fields MUST use the PrimeNG DatePicker in time-only mode instead of native `<input type="time">` or Material time inputs.
- Example pattern:
  ```html
  <p-datepicker
    [(ngModel)]="timeValue"
    [iconDisplay]="'input'"
    [showIcon]="true"
    [timeOnly]="true"
    [hourFormat]="12"
  ></p-datepicker>
  ```

## Time/Date Range Multi-Select Fields

- For fields that store **multiple time or date ranges** (e.g., `preferred_time`, availability windows), use the reusable `<app-custom-range-datetime-multiselect>` component.
- Located at: `core/components/custom-range-datetime-multiselect/`
- UX: user clicks input → PrimeNG DatePicker opens in range mode → user selects start+end → confirms → range appears as a removable chip below the input.
- Inputs:
  - `[timeOnly]="true"` — only time picker (no calendar)
  - `[dateOnly]="true"` — only date picker (no time)
  - Neither — full datetime range
  - `[label]` — field label
  - `[placeholder]` — input placeholder
- Output: `(rangesChange)` emits `DateTimeRange[]` where each item has `{ start: string, end: string }`
- Storage format in DB: comma-separated `start-end` pairs like `07:30 AM-10:00 AM,02:00 PM-04:00 PM`
- Example usage:
  ```html
  <app-custom-range-datetime-multiselect
    label="Preferred Time Ranges"
    placeholder="Click to add time range"
    [timeOnly]="true"
    (rangesChange)="onTimeRangesChange($event)"
  />
  ```

## Form Pages (Admin Add/Edit)

- All admin form pages MUST use `<app-form-bg-template>` (`FormBgTemplateComponent`) as a wrapper for consistent blue-gradient background styling.
- Use Angular Material form fields (`mat-form-field` with `appearance="outline"`) for all inputs.
- Use `mat-select` for dropdowns instead of native `<select>`.
- Use `mat-icon` as suffix in form fields for visual context.
- Apply white-on-blue CSS overrides for Material fields (see `vehicle-add-page.component.ts` for the reference pattern).
- After a successful create/submit, navigate to the corresponding "view all" list page.
- Include a Cancel button that also navigates to the list page.

## Grid / List Pages (View All)

- All "view all" / list pages MUST use the `<app-custom-grid>` component (`CustomGridComponent`, ag-grid wrapper).
- Provide `apiUrl` and `columnDefs` as inputs.
- Do NOT build custom table markup for list pages.

## Layout

- Use `.field-row` with `display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem` for side-by-side fields.
- Form actions (submit + cancel) go in a `.form-actions` flex container.

## Data Models — Schema Alignment

- All frontend TypeScript interfaces/models MUST align with the database schema defined in:
  `D:\MrkBikeTraining\mrk-bike-training-backend\db\postgres\schema.sql`
- Field names use camelCase in TypeScript but correspond to snake_case columns in the schema.
- If the schema changes (DDL update), the corresponding frontend models MUST be updated to match.
- Frontend API models (in `core/models/api.models.ts`) must be compatible with backend DTOs for seamless JSON transfer.

## Days-of-Week Columns

- Any column storing days of the week (e.g., `preferred_days`, `available_days`) uses a **comma-separated string of 2-letter abbreviations** in the database and API:
  `Mo,Tu,We,Th,Fr,Sa,Su`
- The UI MUST display the **full day name** (Monday, Tuesday, etc.) to the user.
- When the user selects days (e.g., multi-select or checkboxes), map:
  | Stored | Displayed |
  |--------|-----------|
  | Mo | Monday |
  | Tu | Tuesday |
  | We | Wednesday |
  | Th | Thursday |
  | Fr | Friday |
  | Sa | Saturday |
  | Su | Sunday |
- Store and transmit only the 2-letter codes; UI handles display conversion.

## Vehicle Display Format

- Whenever a vehicle needs to be identified in the UI (dropdowns, selection lists, labels, chips), display it in this pattern:
  **`vehicleId - Name (Color)`**
- Examples:
  - `KA01MX1234 - Honda Activa 6G (Matte Black)`
  - `MH02AB5678 - Royal Enfield (Red)`
  - `KA03CD9999 - (Silver)` ← if name is empty, still show ID and color
- If color is not available, omit the parentheses: `KA01MX1234 - Honda Activa 6G`
- If name is also not available, show just the ID: `KA01MX1234`
- This rule applies to all `mat-select` options, ag-grid cell values, confirmation messages, and anywhere a vehicle is referenced by the user.
