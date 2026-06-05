# Requirements Document

## Introduction

The MRK Bike Training Platform is a full-stack scheduling and operations system for a motorcycle training school. It is built on PostgreSQL, Spring Boot (`mrk-bike-training-backend`), and Angular 21 (`mrk-bike-training`).

The system supports four user roles — CLIENT, TRAINER, ADMIN, and SUPER_ADMIN — each with a tailored UI and distinct operational permissions. Core capabilities include role-based authentication, client onboarding, multi-step training enrollment with a conflict-free calendar engine, automated schedule reconciliation (buffer exhaustion, trainer absence substitution, asset hot-swap), and admin override workflows. The platform also covers site management (branches, assets, training templates) and financial ledger tracking.

**What is already built:**
- PostgreSQL schema with all core tables (`users`, `trainer_profiles`, `client_profiles`, `branches`, `assets`, `asset_type_config`, `courses`, `client_course_enrollments`, `schedule_slots`, `attendance_logs`, `financial_ledger`)
- JPA entity models for all the above tables
- Basic CRUD services and REST controllers for Branch, Client, Trainer, and Asset
- A generic, fully-featured Angular calendar component (`CalendarComponent`) supporting month/week/day/resource-timeline views, drag-drop, sidebar filters, and collision detection
- Stub Angular components for `branch-add`, `branch-view`, `client-add`, `client-view`, `trainer-add`, `trainer-view`, `vehicle-add`, `vehicle-view` (wired to backend APIs, no auth guard yet)

**What needs to be built:**
- JWT-based authentication and Spring Security role guards
- Angular routing with role-based lazy-loaded modules and auth guards
- Trainer availability management (slot ranges, priority override, absence entries)
- Training enrollment multi-step form with the Java computation engine for available slots
- Admin scheduling override and pending-request approval workflow
- Automated reconciliation protocols (Buffer Exhaustion, Morning Sickness, Retroactive Asset Maintenance)
- Notification service (in-app + optional email/SMS)
- Client profile self-service (password, picture, height, weight, DOB)
- Site management module (new branch, training template updates, new training)

---

## Glossary

- **System**: The MRK Bike Training Platform as a whole
- **Auth_Service**: Spring Security + JWT authentication and authorisation layer
- **Scheduler**: Spring Boot scheduling computation engine that calculates available time intervals
- **Enrollment_Engine**: Spring Boot service that creates, validates, and manages `ClientCourseEnrollment` and associated `ScheduleSlot` records
- **Reconciler**: Spring Boot service that handles Buffer Exhaustion, Morning Sickness, and Retroactive Asset Maintenance protocols
- **Notification_Service**: Component responsible for sending in-app, email, or push notifications to users
- **Client**: A user with role `CLIENT`
- **Trainer**: A user with role `TRAINER`
- **Admin**: A user with role `ADMIN`
- **SuperAdmin**: A user with role `SUPER_ADMIN`
- **Branch**: A physical training location, identified by a composite string key (e.g. `"400001_MumbaiFort"`)
- **Asset**: A vehicle or classroom used during training, stored in the `assets` table; never deleted
- **Course**: A reusable training template (blueprint) with a category (`NORMAL`, `PREMIUM`, `TRIP`, `OTHER`), hours per day, total days, and preferred days
- **Enrollment**: A `client_course_enrollments` record linking a Client to a Course at a Branch with a Trainer and Asset
- **ScheduleSlot**: A calendar event row in `schedule_slots`; status is `PENDING`, `ACTIVE`, or `CANCELLED`
- **BufferDay**: An extra session booked beyond the course total to absorb absences; tracked in `buffer_days_allocated` and `buffer_days_used`
- **TrainerAvailability**: A time-range record declaring when a Trainer is available at a specific Branch (to be modelled as a new `trainer_availability` table)
- **AttendanceLog**: A row in `attendance_logs` recording whether a Client or Trainer was `PRESENT` or `ABSENT` for a ScheduleSlot
- **FinancialLedger**: The `financial_ledger` table tracking income and expense transactions

---

## Requirements

---

### Requirement 1: Authentication and Role-Based Access

**User Story:** As any user, I want to log in with my credentials, so that I am granted access only to the features my role permits.

#### Acceptance Criteria

1. WHEN a user submits a valid `emailUsername` and `password`, THE Auth_Service SHALL authenticate the user, generate a signed JWT containing the user's `id`, `role`, and `isActive` flag, and return it in the response.
2. WHEN a user submits an invalid `emailUsername` or incorrect `password`, THE Auth_Service SHALL return HTTP 401 with a generic "Invalid credentials" message and SHALL NOT reveal which field was incorrect.
3. WHEN a user whose `isActive` is `false` attempts to log in, THE Auth_Service SHALL return HTTP 403 with the message "Account is deactivated."
4. WHEN a JWT is included in a request to a protected endpoint, THE Auth_Service SHALL validate the token signature and expiry before forwarding the request.
5. WHEN a JWT is absent, expired, or tampered with on a protected endpoint, THE Auth_Service SHALL return HTTP 401.
6. THE System SHALL enforce role-based access: endpoints annotated for `ADMIN`/`SUPER_ADMIN` SHALL reject requests from `CLIENT` or `TRAINER` roles with HTTP 403.
7. WHEN a user logs in successfully, THE Angular application SHALL store the JWT in memory (not `localStorage`) and redirect the user to the role-appropriate default view.
8. THE Angular application SHALL display a login page as the first landing page; no other page SHALL be accessible without a valid session.
9. WHEN a session expires, THE Angular application SHALL redirect the user to the login page and clear all stored session data.

---

### Requirement 2: Role-Based Navigation and Menu Structure

**User Story:** As any authenticated user, I want to see only the menus and actions that apply to my role, so that the UI is clear and I cannot accidentally trigger operations outside my permissions.

#### Acceptance Criteria

1. WHEN a CLIENT logs in, THE System SHALL display the following top-level navigation items: **Trainings** (Apply New Training, View Past Trainings, View Training Request Status) and **Schedule** (See Current Schedule, Request Absence, Request Pause).
2. WHEN a TRAINER logs in, THE System SHALL display the following top-level navigation items: **Profile** (view/update) and **Schedule** (See Current Schedule, Request Absence, Add New Slots, Remove Existing Slots).
3. WHEN an ADMIN or SUPER_ADMIN logs in, THE System SHALL display the following top-level navigation items: **Schedule**, **Client**, **Trainer** (future spec placeholder, visible but disabled), and **Site Management**.
4. THE Angular application SHALL use route guards so that navigating directly to a role-restricted URL redirects the user to the login page if unauthenticated or to their default dashboard if unauthorised.
5. WHEN there are one or more `PENDING` ScheduleSlots awaiting approval, THE System SHALL display a red badge on the **Schedule** menu item for ADMIN and SUPER_ADMIN users.

---

### Requirement 3: Client Onboarding (Admin/SuperAdmin)

**User Story:** As an Admin or SuperAdmin, I want to create a new client account with a pre-assigned username and password, so that the client can log in and begin booking trainings.

#### Acceptance Criteria

1. THE System SHALL restrict client creation to users with role `ADMIN` or `SUPER_ADMIN`; all other roles SHALL receive HTTP 403.
2. WHEN an Admin submits a new client with a `name`, `emailUsername`, `uniqueId`, `allowedNumOfTrainings`, and `password`, THE System SHALL create a `users` row with `role = CLIENT` and a corresponding `client_profiles` row.
3. IF the submitted `emailUsername` already exists in the `users` table, THEN THE System SHALL return HTTP 409 with the message "Username already taken."
4. IF the submitted `uniqueId` already exists in the `client_profiles` table, THEN THE System SHALL return HTTP 409 with the message "Unique ID already in use."
5. THE System SHALL store `password` as a BCrypt hash using a minimum cost factor of 12; no plain-text password SHALL be persisted.
6. WHEN a client account is created, THE System SHALL set `isActive = true` by default and `allowedNumOfTrainings` to the Admin-supplied integer.
7. THE System SHALL allow ADMIN and SUPER_ADMIN to update `allowedNumOfTrainings` for an existing client at any time; no other role SHALL be able to modify this field.
8. THE System SHALL allow ADMIN and SUPER_ADMIN to deactivate a client by setting `isActive = false`; this SHALL prevent the client from logging in (Requirement 1.3).
9. THE System SHALL allow ADMIN and SUPER_ADMIN to delete a client, which SHALL cascade-delete the `client_profiles` row and set `users.is_active = false` rather than hard-deleting the `users` row.
10. THE System SHALL allow ADMIN and SUPER_ADMIN to reset a client's password by updating the BCrypt hash.

---

### Requirement 4: Client Self-Service Profile Update

**User Story:** As a Client, I want to update my personal profile details, so that my training records reflect accurate physical data.

#### Acceptance Criteria

1. WHEN a CLIENT is authenticated, THE System SHALL allow the client to view their `name`, `emailUsername`, `heightCm`, `weightKg`, `dateOfBirth`, and profile picture.
2. THE System SHALL allow the CLIENT to update `password`, `heightCm`, `weightKg`, `dateOfBirth`, and profile picture.
3. THE System SHALL NOT expose `uniqueId` or `allowedNumOfTrainings` in any client-facing API response.
4. THE System SHALL NOT allow a CLIENT to modify `name`, `emailUsername`, or `uniqueId` through any client-facing endpoint; HTTP 403 SHALL be returned for such attempts.
5. WHEN a CLIENT submits a password update, THE System SHALL require the current password to be provided and SHALL return HTTP 400 if the current password is incorrect.

---

### Requirement 5: Branch and Asset Management (Site Management)

**User Story:** As an Admin or SuperAdmin, I want to manage branches and assets, so that the system always reflects the current operational infrastructure.

#### Acceptance Criteria

1. THE System SHALL allow ADMIN and SUPER_ADMIN to create a new Branch with a user-defined `id` (e.g. `"400001_MumbaiFort"`), `name`, and `locationAddress`; IF the `id` already exists, THE System SHALL return HTTP 409.
2. THE System SHALL allow ADMIN and SUPER_ADMIN to add an Asset with an `id` (vehicle plate or classroom code), `type`, `name`, `cc`, `color`, `nextMaintenanceDate`, `minHeightReq`, `minWeightReq`, and `currentBranchId`.
3. THE System SHALL allow ADMIN and SUPER_ADMIN to update any editable field on an existing Asset.
4. WHEN an Admin marks an Asset's status as `IN_MAINTENANCE`, THE System SHALL NOT delete the Asset record; the asset SHALL remain in the database with a maintenance status flag.
5. THE System SHALL allow ADMIN and SUPER_ADMIN to update a Course template (name, `hoursPerDay`, `totalDays`, `preferredDaysOfWeek`, `bufferDays`).
6. THE System SHALL allow ADMIN and SUPER_ADMIN to create a new Course template with a `category` of `NORMAL`, `PREMIUM`, `TRIP`, or `OTHER`.
7. THE System SHALL allow ADMIN and SUPER_ADMIN to upload or replace the image template associated with a Course category-type combination.

---

### Requirement 6: Trainer Availability Management

**User Story:** As a Trainer, Admin, or SuperAdmin, I want to define and manage a trainer's available time slots at specific branches, so that the scheduling engine can accurately compute open booking windows.

#### Acceptance Criteria

1. THE System SHALL maintain a `trainer_availability` table with columns: `id`, `trainer_id` (FK to `trainer_profiles`), `branch_id` (plain text, same convention as `schedule_slots.branch_id`), `available_days` (comma-separated day codes: Mo, Tu, We, Th, Fr, Sa, Su), `slot_start_time` (time), `slot_end_time` (time), `effective_from` (date), `effective_to` (date), and `audit_start_date_time` (timestamp of record creation).
2. WHEN a TRAINER, ADMIN, or SUPER_ADMIN adds a new availability record for a trainer at a branch, THE System SHALL insert a row in `trainer_availability` with the current timestamp in `audit_start_date_time`.
3. WHEN multiple availability records overlap in date range for the same trainer and branch, THE Scheduler SHALL use the record with the latest `audit_start_date_time` as the authoritative slot for that period.
4. IF a trainer requests absence for a specific date, THEN THE System SHALL insert an availability record for that date with `slot_start_time = 00:00` and `slot_end_time = 00:00` (zero-duration sentinel), signalling no availability.
5. THE System SHALL enforce the constraint that the same Trainer cannot have two overlapping active availability slots across different branches at the same time; a minimum 30-minute gap between different-branch slots SHALL be required.
6. IF adding a new availability record would violate the 30-minute inter-branch gap rule, THEN THE System SHALL return HTTP 409 with a descriptive conflict message.
7. WHEN a Trainer, Admin, or SuperAdmin removes an existing availability slot, THE System SHALL mark the record as inactive rather than hard-deleting it, preserving the audit history.

---

### Requirement 7: Training Enrollment — Client Application Flow

**User Story:** As a Client, I want to apply for a training course through a multi-step form, so that my preferred schedule is submitted for admin approval without creating conflicts.

#### Acceptance Criteria

1. WHEN a CLIENT attempts to apply for a new training, THE System SHALL verify that `client_profiles.allowed_num_of_trainings > 0` and `users.is_active = true`; IF either condition fails, THE System SHALL return an error and prevent form progression.
2. THE System SHALL present the client with all available Course category image templates as the first step.
3. WHEN the Client selects a `NORMAL` or `PREMIUM` category, THE System SHALL prompt for: Training Type (Basic/Advance/Traffic/Other), Asset Type (vehicle category), and Location (Branch dropdown for NORMAL; free-text address for PREMIUM).
4. WHERE the category is `PREMIUM` and the client opts to train on their own vehicle, THE System SHALL collect: vehicle number, RC document upload, Insurance document upload, PUC document upload, and a free-text issues note.
5. WHEN the Client selects a `TRIP` category, THE System SHALL display a dropdown of available trips; selection SHALL create a `trainingRequest` record and trigger notifications to Admins.
6. THE Scheduler SHALL compute available 30-minute intervals for the selected Asset type and Branch by loading only occupied ScheduleSlots and TrainerAvailability into memory for a rolling 3-month window; this computation SHALL occur in the Java backend, not via iterative SQL queries.
7. WHEN calculating occupied intervals, THE Scheduler SHALL treat ScheduleSlots with status `PENDING` or `ACTIVE` as occupied and SHALL include the configured `BufferDays` buffer time appended to each existing booking window.
8. FOR the same Asset ID, THE Scheduler SHALL apply a 30-minute buffer gap between consecutive sessions; IF the branch holds multiple Assets of the same type, a session on one asset SHALL NOT block the same time slot on another asset of the same type at that branch.
9. WHEN the Client selects a start date, THE System SHALL require it to be a Monday; THE System SHALL display a note explaining this rule.
10. WHEN the Client specifies preferred days, session hours per day, and total training days, THE System SHALL compute whether a continuous trainer-and-asset assignment exists across all selected days; IF continuity fails, THE System SHALL display an error and prevent submission.
11. THE System SHALL calculate and add the course's `BufferDays` to the schedule automatically; the buffer day count SHALL NOT be shown to the client.
12. IF the computed schedule passes all validation checks, THEN THE Enrollment_Engine SHALL create one `client_course_enrollments` record with `status = ACTIVE` (pending admin approval is tracked at slot level), create individual `schedule_slots` rows for each session with `status = PENDING`, and atomically decrement `allowed_num_of_trainings` by 1.
13. WHEN an enrollment is created, THE Notification_Service SHALL notify the client and all Admins.
14. THE System SHALL NOT display individual trainer names or trainer schedules to the CLIENT during the booking flow; only slot availability (open/occupied) SHALL be visible.

---

### Requirement 8: Admin / SuperAdmin Scheduling Override

**User Story:** As an Admin or SuperAdmin, I want to create and approve training schedules on behalf of clients, with full visibility into trainer and asset details, so that I can resolve conflicts and exceptions that clients cannot handle.

#### Acceptance Criteria

1. WHEN an ADMIN or SUPER_ADMIN initiates a scheduling action, THE System SHALL follow the same multi-step flow as the client enrollment (Requirement 7) with the following differences: calendar conflicts and Monday-start violations SHALL produce warnings rather than hard errors, and the Admin SHALL be able to proceed.
2. THE System SHALL display trainer names, trainer schedules, and specific asset identifiers (plate numbers) to ADMIN and SUPER_ADMIN during the scheduling flow.
3. WHEN an ADMIN or SUPER_ADMIN logs in, THE System SHALL default to the calendar view for their primary branch, showing all active and pending ScheduleSlots filtered by the branch.
4. THE System SHALL provide filter controls on the admin calendar for: client name dropdown, asset type, and trainer schedule.
5. WHEN one or more ScheduleSlots have `status = PENDING`, THE System SHALL display a red indicator on the Schedule menu item for ADMIN and SUPER_ADMIN.
6. WHEN an ADMIN or SUPER_ADMIN opens the pending-requests view, THE System SHALL display all `PENDING` slots in an ag-grid table with columns for client name, course, requested dates/times, and dropdowns to assign an available Asset and Trainer.
7. WHEN an ADMIN or SUPER_ADMIN approves a pending ScheduleSlot, THE Enrollment_Engine SHALL update the slot's `status` to `ACTIVE`.
8. WHEN an ADMIN or SUPER_ADMIN rejects a pending ScheduleSlot, THE Enrollment_Engine SHALL set the slot's `status` to `CANCELLED`, store the optional rejection reason in `rejection_reason`, and atomically increment the client's `allowed_num_of_trainings` by 1 (rollback).
9. WHEN a ScheduleSlot is approved or rejected, THE Notification_Service SHALL notify the client with the outcome; a rejected notification SHALL include the rejection reason if one was provided.

---

### Requirement 9: Client Schedule View, Absence, and Pause

**User Story:** As a Client, I want to see my current training schedule and request absences or pauses, so that I can manage my attendance transparently.

#### Acceptance Criteria

1. WHEN a CLIENT views their schedule, THE System SHALL display all `ACTIVE` and `PENDING` ScheduleSlots associated with their `client_id`, presented using the Angular CalendarComponent.
2. WHEN a CLIENT requests absence for a specific ScheduleSlot, THE System SHALL create an `AttendanceLog` row with `status = ABSENT` for that slot and notify the assigned Trainer and Admins.
3. WHEN a CLIENT requests a pause on their current enrollment, THE System SHALL set the associated `client_course_enrollments.status` to `PAUSED` and notify Admins; future sessions SHALL remain in their current status until an Admin resumes or cancels the enrollment.
4. WHEN a CLIENT views the "View Training Request Status" page, THE System SHALL display all their enrollments with status, submitted date, and — for `CANCELLED` slots — the rejection reason provided by the Admin.

---

### Requirement 10: Trainer Schedule Management

**User Story:** As a Trainer, I want to manage my schedule slots and record absences, so that the platform stays synchronized with my actual availability.

#### Acceptance Criteria

1. WHEN a TRAINER views their schedule, THE System SHALL display all `ACTIVE` ScheduleSlots assigned to their `trainer_id` for the current and next month using the Angular CalendarComponent.
2. WHEN a TRAINER requests absence for a date, THE System SHALL create a zero-duration `trainer_availability` record (per Requirement 6.4) and an `AttendanceLog` row of `status = ABSENT` for all ScheduleSlots on that date assigned to the Trainer; THE Notification_Service SHALL notify Admins.
3. WHEN a TRAINER adds a new availability slot, THE System SHALL validate the 30-minute inter-branch gap rule (Requirement 6.5) and save the record if valid.
4. WHEN a TRAINER removes an availability slot, THE System SHALL soft-delete the record (mark inactive) and SHALL NOT affect already-confirmed ScheduleSlots.

---

### Requirement 11: Admin Client Management Panel

**User Story:** As an Admin or SuperAdmin, I want a dedicated client management panel to perform operational actions on client accounts, so that I can keep client data accurate and enforce access policies.

#### Acceptance Criteria

1. THE System SHALL provide an ADMIN/SUPER_ADMIN-only view listing all clients with their name, username, status, and current training count.
2. WHEN an ADMIN marks a client as absent for a specific ScheduleSlot, THE System SHALL create an `AttendanceLog` row of `status = ABSENT` for that slot and trigger the Buffer Exhaustion Protocol (Requirement 13.A).
3. WHEN an ADMIN pauses a client's training, THE System SHALL set the relevant `client_course_enrollments.status` to `PAUSED`.
4. WHEN an ADMIN resets a client's password, THE System SHALL hash the new password with BCrypt and update the `users.password_hash` field.
5. WHEN an ADMIN deactivates a client, THE System SHALL set `users.is_active = false`; the client SHALL be unable to log in and all their `PENDING` ScheduleSlots SHALL be cancelled automatically.
6. WHEN an ADMIN deletes a client, THE System SHALL soft-delete the record by setting `users.is_active = false` and SHALL NOT physically remove the `users` row; all linked `schedule_slots` and `client_course_enrollments` SHALL be set to `CANCELLED`.

---

### Requirement 12: Notification Service

**User Story:** As any user, I want to receive timely notifications when relevant events occur on my schedule, so that I am never caught off-guard by changes.

#### Acceptance Criteria

1. THE Notification_Service SHALL send notifications for the following trigger events: new enrollment submitted (to Client and Admins), enrollment approved (to Client), enrollment rejected with reason (to Client), trainer absence marked (to Admins), slot cancelled by reconciliation (to Client, Trainer, and Admins), and asset swapped by maintenance protocol (to Client and Admins).
2. THE System SHALL support in-app notifications stored in a `notifications` table with columns: `id`, `user_id`, `message`, `is_read`, `created_at`.
3. WHEN a user views their notification list, THE System SHALL return all unread notifications first, ordered by `created_at` descending.
4. WHEN a user marks a notification as read, THE System SHALL update `is_read = true` for that record.
5. WHERE email configuration is provided via environment variable, THE Notification_Service SHALL also send email notifications using the configured SMTP relay.

---

### Requirement 13: Automated Schedule Reconciliation

**User Story:** As an Admin, I want the system to automatically handle absences and asset failures, so that disruptions to client schedules are minimised with minimal manual intervention.

#### Acceptance Criteria

**Protocol A — Buffer Exhaustion:**

1. WHEN an absence is recorded (either a CLIENT or TRAINER `AttendanceLog` row with `status = ABSENT`), THE Reconciler SHALL decrement `buffer_days_used` by 1 from the associated `client_course_enrollments` buffer pool and advance the session to the next unused BufferDay slot on the calendar.
2. WHEN `buffer_days_allocated - buffer_days_used == 0` after an absence, THE Reconciler SHALL auto-schedule the missed session to the next available date matching the enrollment's `preferredDaysOfWeek`, time slot, and `branchId`; trainer continuity SHALL be ignored for this overflow slot.
3. WHEN a Buffer Exhaustion overflow slot is created, THE Notification_Service SHALL notify the Client, Trainer, and Admins with the new date and time.

**Protocol B — Morning Sickness (Trainer Absence):**

4. WHEN an ADMIN marks a Trainer absent for a specific date by creating an `AttendanceLog` row of `status = ABSENT` for a Trainer, THE Reconciler SHALL identify all `ACTIVE` ScheduleSlots assigned to that Trainer on that date.
5. FOR each impacted slot, THE Reconciler SHALL search for another Trainer who has a valid `trainer_availability` record covering the same branch and time window on that date.
6. IF a replacement Trainer is found, THEN THE Reconciler SHALL reassign the slot to the replacement Trainer and SHALL notify the Client, original Trainer, replacement Trainer, and Admins.
7. IF no replacement Trainer is available, THEN THE Reconciler SHALL cancel the slot (`status = CANCELLED`) and trigger Protocol A for each impacted Client.

**Protocol C — Retroactive Asset Maintenance:**

8. WHEN an ADMIN sets an Asset's maintenance status to `IN_MAINTENANCE`, THE Reconciler SHALL query all future `ACTIVE` ScheduleSlots referencing that Asset's `resource_id`.
9. THE Reconciler SHALL search for another Asset of the identical `type` assigned to the same `branchId` that has no conflicting ScheduleSlots in the same time windows.
10. IF a replacement Asset is found, THEN THE Reconciler SHALL update the `resource_id` on all affected future ScheduleSlots to the replacement Asset's ID and SHALL notify the Client and Admins.
11. IF no replacement Asset is available, THEN THE Reconciler SHALL cancel the affected ScheduleSlots and trigger Protocol A for each impacted Client.

---

### Requirement 14: Admin Schedule Calendar and Filters

**User Story:** As an Admin or SuperAdmin, I want a comprehensive calendar view with filters, so that I can quickly see all sessions across clients, trainers, and assets for operational oversight.

#### Acceptance Criteria

1. WHEN an ADMIN or SUPER_ADMIN opens the Schedule view, THE System SHALL render all ScheduleSlots for the current month using the Angular CalendarComponent in resource-timeline view by default, with assets as resources.
2. THE System SHALL provide the following sidebar filters on the admin schedule: Client (dropdown, multi-select), Asset Type (dropdown), and Trainer (dropdown, multi-select).
3. WHEN a filter is applied, THE System SHALL reactively update the calendar to show only matching ScheduleSlots without a full page reload.
4. THE System SHALL display `PENDING` slots in a visually distinct color (e.g. amber) compared to `ACTIVE` (green) and `CANCELLED` (grey) slots.
5. WHEN an ADMIN clicks a `PENDING` slot in the calendar, THE System SHALL open the pending-request approval panel (Requirement 8.6) pre-filtered to that slot.

---

### Requirement 15: Financial Ledger (Metrics Foundation)

**User Story:** As an Admin or SuperAdmin, I want income and expenses logged automatically, so that future analytics dashboards have accurate historical data without manual entry.

#### Acceptance Criteria

1. WHEN a new `client_course_enrollments` record is created with a non-null `total_amount_paid`, THE System SHALL automatically create a `financial_ledger` row with `type = INCOME_ENROLLMENT`, the appropriate `branch_id`, `asset_id`, and `trainer_id`, and the amount paid.
2. THE System SHALL allow ADMIN and SUPER_ADMIN to manually log expense entries of type `EXPENSE_TRAINER_SALARY`, `EXPENSE_ASSET_MAINTENANCE`, or `EXPENSE_MISC` with a date, amount, and optional description.
3. THE System SHALL expose a read-only summary endpoint (accessible to ADMIN and SUPER_ADMIN) returning total income vs. total expenses grouped by branch for a given date range.
