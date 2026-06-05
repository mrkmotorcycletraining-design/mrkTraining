# Design Document — MRK Bike Training Platform

## Overview

The MRK Bike Training Platform is a full-stack scheduling and operations system for a motorcycle training school. It is built on **PostgreSQL 15**, **Spring Boot 3.4 / Java 21** (`mrk-bike-training-backend`), and **Angular 21** (`mrk-bike-training`).

The system serves four roles — `CLIENT`, `TRAINER`, `ADMIN`, `SUPER_ADMIN` — each with a dedicated UI surface. The core new-build work covers:

1. **JWT / Spring Security** — stateless auth filter chain with BCrypt password hashing.
2. **Angular lazy-loaded role modules** — route guards, role-based navigation, session management.
3. **Trainer Availability** — new `trainer_availability` table + management API.
4. **Scheduling Computation Engine (Scheduler)** — in-memory interval computation for available slots.
5. **Enrollment Engine** — multi-step enrollment creation, admin approval workflow.
6. **Reconciliation Protocols** — Buffer Exhaustion, Morning Sickness, Retroactive Asset Maintenance.
7. **Notification Service** — in-app (DB-backed) + optional email (SMTP).
8. **Client Self-Service Profile** — password, picture, physical data.
9. **Site Management** — branches, assets, course templates.
10. **Financial Ledger** — auto-logged income rows, manual expense entries.

---

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        Angular 21 SPA                           │
│  ┌───────────┐ ┌───────────┐ ┌────────────┐ ┌───────────────┐  │
│  │ AuthModule│ │ClientModule│ │TrainerModule│ │  AdminModule  │  │
│  │ (shared)  │ │(lazy)     │ │(lazy)       │ │(lazy)         │  │
│  └─────┬─────┘ └─────┬─────┘ └─────┬───────┘ └───────┬───────┘  │
│        └─────────────┴─────────────┴─────────────────┘          │
│                        HTTP / JWT Bearer                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                    Spring Boot 3.4 (Java 21)                     │
│  ┌────────────┐  ┌──────────────────────────────────────────┐   │
│  │ JWT Filter │→ │  Spring Security Role Guards (@Secured)  │   │
│  └────────────┘  └──────────────────────────────────────────┘   │
│                                                                  │
│  Controllers → Services → Repositories (Spring Data JPA)        │
│                                                                  │
│  ┌───────────┐ ┌─────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │AuthService│ │   Scheduler │ │ Enrollment │ │  Reconciler │  │
│  │           │ │  (Engine)   │ │  Engine    │ │             │  │
│  └───────────┘ └─────────────┘ └────────────┘ └─────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Notification Service                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ JDBC / HikariCP
┌────────────────────────────▼────────────────────────────────────┐
│                      PostgreSQL 15                               │
│  users · trainer_profiles · client_profiles · branches          │
│  assets · courses · client_course_enrollments · schedule_slots  │
│  attendance_logs · financial_ledger                             │
│  trainer_availability (NEW) · notifications (NEW)               │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **Stateless JWT**: No server-side session. The JWT contains `userId`, `role`, and `isActive`. Every request is self-contained.
- **In-Memory Scheduler**: Available-slot computation loads a rolling 3-month window of `schedule_slots` + `trainer_availability` into Java objects and runs pure interval arithmetic — no iterative SQL queries inside the loop.
- **Soft Deletes Only**: Assets, clients, and availability slots are never hard-deleted; `isActive` / `is_active` flags preserve audit trails.
- **Angular Lazy Modules**: Each role's feature set is a separate lazy-loaded Angular feature module. The shell app bootstraps with only `AuthModule` loaded eagerly.
- **JWT in Angular Memory**: The token is stored in a service signal — never `localStorage` or `sessionStorage` — to reduce XSS exposure.

---

## Components and Interfaces

### Backend Service Layer

#### `AuthService`
Handles login, JWT generation, and password hashing.
- `login(LoginRequest) → JwtResponse`
- `generateToken(User) → String`
- `validateToken(String) → JwtClaims`

#### `SchedulerService` (Computation Engine)
Pure computation; no writes.
- `computeAvailableIntervals(ScheduleQuery) → List<TimeInterval>`
  - Loads occupied slots (PENDING + ACTIVE) and trainer availability for a 3-month window.
  - Builds an in-memory interval tree.
  - Returns free 30-minute aligned windows.

#### `EnrollmentEngine`
Orchestrates enrollment creation and approval workflow.
- `submitEnrollment(EnrollmentRequest, userId) → EnrollmentResult` — creates enrollment + slots + decrements allowance atomically.
- `approveSlot(slotId, adminId, assetId, trainerId) → ScheduleSlot`
- `rejectSlot(slotId, adminId, reason) → ScheduleSlot`

#### `ReconcilerService`
Triggered by attendance / asset status events.
- `handleAbsence(AttendanceLog) → ReconciliationResult` — runs Protocol A.
- `handleTrainerAbsence(trainerId, date) → ReconciliationResult` — runs Protocol B.
- `handleAssetMaintenance(assetId) → ReconciliationResult` — runs Protocol C.

#### `NotificationService`
- `notify(NotificationRequest)` — persists in-app notification; optionally sends email via SMTP.
- `getUnread(userId) → List<Notification>`
- `markRead(notificationId, userId)`

#### `TrainerAvailabilityService`
- `addSlot(TrainerAvailabilityRequest) → TrainerAvailability`
- `removeSlot(availabilityId)` — soft delete
- `getActiveSlots(trainerId) → List<TrainerAvailability>`

#### `FinancialLedgerService`
- `autoLogIncome(ClientCourseEnrollment)` — called from `EnrollmentEngine` via Spring event.
- `addExpense(ExpenseRequest, adminId) → FinancialLedger`
- `getSummary(branchId, from, to) → LedgerSummary`

### Angular Module Structure

```
AppModule (eager)
 ├── AuthModule (eager) — login page, session service, auth guard
 └── (lazy routes loaded on demand)
      ├── ClientModule     — /client/**
      ├── TrainerModule    — /trainer/**
      └── AdminModule      — /admin/**   (also covers SUPER_ADMIN)
```

Each module exposes its own routing sub-tree and is gated by `RoleGuard`.

### Angular Services

| Service | Responsibility |
|---|---|
| `AuthService` | Holds JWT signal, login/logout, expiry check |
| `SessionService` | Derived signals: currentUser, currentRole, isAdmin |
| `EnrollmentApiService` | HTTP calls for enrollment flow |
| `ScheduleApiService` | HTTP calls for calendar data |
| `NotificationApiService` | Poll/fetch notifications, mark-read |
| `SiteManagementApiService` | Branch, asset, course CRUD |
| `TrainerAvailabilityApiService` | Availability CRUD |

---

## Data Models

### New Table: `trainer_availability`

```sql
CREATE TABLE IF NOT EXISTS trainer_availability (
    id                  BIGSERIAL PRIMARY KEY,
    trainer_id          BIGINT NOT NULL,
    branch_id           VARCHAR(255) NOT NULL,
    available_days      VARCHAR(50) NOT NULL,   -- CSV: Mo,Tu,We,Th,Fr,Sa,Su
    slot_start_time     TIME NOT NULL,
    slot_end_time       TIME NOT NULL,
    effective_from      DATE NOT NULL,
    effective_to        DATE,                   -- NULL means open-ended
    is_active           BOOLEAN DEFAULT TRUE,
    audit_start_date_time TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_avail_trainer FOREIGN KEY (trainer_id)
        REFERENCES trainer_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_avail_trainer_branch
    ON trainer_availability(trainer_id, branch_id, is_active);
```

### New Table: `notifications`

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread
    ON notifications(user_id, is_read, created_at DESC);
```

### Schema Changes to Existing Tables

**`client_profiles`** — add missing columns:
```sql
ALTER TABLE client_profiles
    ADD COLUMN IF NOT EXISTS unique_id       VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS date_of_birth   DATE,
    ADD COLUMN IF NOT EXISTS profile_picture TEXT;   -- URL / path to stored image

ALTER TABLE client_profiles
    ADD COLUMN IF NOT EXISTS allowed_num_of_trainings INTEGER DEFAULT 1;
```
*(The `unique_id` and `allowed_num_of_trainings` columns appear in the schema DDL but are missing from the JPA `ClientProfile` entity — both must be added.)*

**`schedule_slots`** — add `rejection_reason` column (mentioned in requirements, missing from schema):
```sql
ALTER TABLE schedule_slots
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
```
*(Already present in schema DDL; verify entity mapping.)*

**`courses`** — add `buffer_days` column:
```sql
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS buffer_days INTEGER DEFAULT 0;
```

**`schedule_slots`** — fix JPA entity: `branch_id` is stored as plain text (no FK), but the current entity maps it as a `@ManyToOne Branch` — this must be changed to `@Column String branchId`.

### Java Entity Updates

| Entity | Change |
|---|---|
| `ClientProfile` | Add `uniqueId`, `dateOfBirth`, `profilePicture`, `allowedNumOfTrainings` fields |
| `ScheduleSlot` | Change `Branch branch` → `String branchId`; add `String rejectionReason` |
| `Course` | Add `Integer bufferDays` |
| **New**: `TrainerAvailability` | New JPA entity for `trainer_availability` table |
| **New**: `Notification` | New JPA entity for `notifications` table |

### Core Java DTOs / Records (New)

```java
// Auth
record LoginRequest(String emailUsername, String password) {}
record JwtResponse(String token, String role, Long userId) {}

// Scheduler
record ScheduleQuery(String branchId, String assetType, LocalDate startDate,
                     List<String> preferredDays, int hoursPerDay, int totalDays) {}
record TimeInterval(LocalDateTime start, LocalDateTime end) {}

// Enrollment
record EnrollmentRequest(Long clientId, String courseId, String branchId,
                         String assetType, LocalDate startDate,
                         List<String> preferredDays, int hoursPerDay,
                         BigDecimal totalAmountPaid) {}

// Reconciliation
record ReconciliationResult(List<Long> reassignedSlotIds,
                             List<Long> cancelledSlotIds,
                             List<Long> newBufferSlotIds) {}
```

---

## API Endpoint Design

All endpoints are prefixed with `/api`. JWT Bearer token is required on all endpoints except `/api/auth/login`. Role annotations are enforced by Spring Security method security.

### Authentication — `/api/auth`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login; returns `JwtResponse` |

**`POST /api/auth/login`** request:
```json
{ "emailUsername": "user@example.com", "password": "secret" }
```
**Response 200:**
```json
{ "token": "<jwt>", "role": "CLIENT", "userId": 42 }
```
**Response 401:** `{ "error": "Invalid credentials" }`
**Response 403:** `{ "error": "Account is deactivated." }`

---

### Client Profile — `/api/clients`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/clients` | ADMIN, SUPER_ADMIN | Create client account |
| `GET` | `/api/clients` | ADMIN, SUPER_ADMIN | List all clients |
| `GET` | `/api/clients/{id}` | ADMIN, SUPER_ADMIN | Get client by id |
| `PUT` | `/api/clients/{id}/trainings-allowance` | ADMIN, SUPER_ADMIN | Update `allowedNumOfTrainings` |
| `PUT` | `/api/clients/{id}/deactivate` | ADMIN, SUPER_ADMIN | Set `isActive = false` |
| `DELETE` | `/api/clients/{id}` | ADMIN, SUPER_ADMIN | Soft-delete client |
| `PUT` | `/api/clients/{id}/reset-password` | ADMIN, SUPER_ADMIN | Admin resets client password |
| `GET` | `/api/clients/me` | CLIENT | Get own profile (no uniqueId/allowances) |
| `PUT` | `/api/clients/me` | CLIENT | Update own profile (height, weight, DOB, picture) |
| `PUT` | `/api/clients/me/password` | CLIENT | Change own password (requires currentPassword) |

---

### Trainer — `/api/trainers`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/trainers` | ADMIN, SUPER_ADMIN | Create trainer account |
| `GET` | `/api/trainers` | ADMIN, SUPER_ADMIN | List all trainers |
| `GET` | `/api/trainers/{id}` | ADMIN, SUPER_ADMIN, TRAINER (own only) | Get trainer |
| `GET` | `/api/trainers/me` | TRAINER | Get own profile |

---

### Trainer Availability — `/api/trainer-availability`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/trainer-availability` | TRAINER, ADMIN, SUPER_ADMIN | Add availability slot |
| `GET` | `/api/trainer-availability` | TRAINER (own), ADMIN, SUPER_ADMIN | List active slots (query param `trainerId`) |
| `DELETE` | `/api/trainer-availability/{id}` | TRAINER (own), ADMIN, SUPER_ADMIN | Soft-delete slot |
| `POST` | `/api/trainer-availability/absence` | TRAINER, ADMIN, SUPER_ADMIN | Mark absence (zero-duration sentinel) |

**`POST /api/trainer-availability`** request:
```json
{
  "trainerId": 7,
  "branchId": "400001_MumbaiFort",
  "availableDays": "Mo,Tu,We,Th,Fr",
  "slotStartTime": "09:00",
  "slotEndTime": "17:00",
  "effectiveFrom": "2025-08-01",
  "effectiveTo": "2025-12-31"
}
```

---

### Branches — `/api/branches`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/branches` | ADMIN, SUPER_ADMIN | Create branch |
| `GET` | `/api/branches` | All authenticated | List branches |
| `GET` | `/api/branches/{id}` | All authenticated | Get branch |

---

### Assets — `/api/assets`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/assets` | ADMIN, SUPER_ADMIN | Create asset |
| `GET` | `/api/assets` | All authenticated | List assets (query: `branchId`, `type`) |
| `GET` | `/api/assets/{id}` | All authenticated | Get asset |
| `PUT` | `/api/assets/{id}` | ADMIN, SUPER_ADMIN | Update asset |
| `PUT` | `/api/assets/{id}/maintenance` | ADMIN, SUPER_ADMIN | Set `IN_MAINTENANCE` → triggers Protocol C |

---

### Courses — `/api/courses`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/courses` | ADMIN, SUPER_ADMIN | Create course template |
| `GET` | `/api/courses` | All authenticated | List courses |
| `PUT` | `/api/courses/{id}` | ADMIN, SUPER_ADMIN | Update course template |
| `PUT` | `/api/courses/{id}/image` | ADMIN, SUPER_ADMIN | Upload/replace category image |

---

### Scheduler — `/api/scheduler`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/scheduler/available-intervals` | CLIENT, ADMIN, SUPER_ADMIN | Compute free 30-min intervals |

**`POST /api/scheduler/available-intervals`** request:
```json
{
  "branchId": "400001_MumbaiFort",
  "assetType": "ACTIVA",
  "startDate": "2025-09-01",
  "preferredDays": ["Mo", "Tu", "We"],
  "hoursPerDay": 2,
  "totalDays": 5
}
```
**Response 200:**
```json
{
  "intervals": [
    { "start": "2025-09-01T09:00:00", "end": "2025-09-01T11:00:00" },
    { "start": "2025-09-02T09:00:00", "end": "2025-09-02T11:00:00" }
  ]
}
```
*Trainer names are never included in this response. Asset IDs are only included for ADMIN/SUPER_ADMIN callers.*

---

### Enrollments — `/api/enrollments`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/enrollments` | CLIENT, ADMIN, SUPER_ADMIN | Submit new enrollment |
| `GET` | `/api/enrollments` | ADMIN, SUPER_ADMIN | List all enrollments (with filters) |
| `GET` | `/api/enrollments/mine` | CLIENT | List own enrollments |
| `GET` | `/api/enrollments/{id}` | CLIENT (own), ADMIN, SUPER_ADMIN | Get enrollment details |
| `PUT` | `/api/enrollments/{id}/pause` | CLIENT, ADMIN, SUPER_ADMIN | Pause enrollment |

---

### Schedule Slots — `/api/slots`

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/api/slots` | All authenticated | List slots (query params: `clientId`, `trainerId`, `branchId`, `status`, `from`, `to`) |
| `GET` | `/api/slots/pending` | ADMIN, SUPER_ADMIN | List all PENDING slots (for approval grid) |
| `PUT` | `/api/slots/{id}/approve` | ADMIN, SUPER_ADMIN | Approve PENDING slot (assign asset + trainer) |
| `PUT` | `/api/slots/{id}/reject` | ADMIN, SUPER_ADMIN | Reject PENDING slot (optionally with reason) |
| `POST` | `/api/slots/{id}/absence` | CLIENT, TRAINER, ADMIN | Record absence for a slot |

---

### Attendance — `/api/attendance`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/attendance` | ADMIN, SUPER_ADMIN | Record attendance log (triggers Reconciler) |
| `GET` | `/api/attendance` | ADMIN, SUPER_ADMIN | List logs (query: `slotId`, `personId`) |

---

### Notifications — `/api/notifications`

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | All authenticated | Get notifications (unread first) |
| `PUT` | `/api/notifications/{id}/read` | All authenticated | Mark notification as read |

---

### Financial Ledger — `/api/ledger`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/ledger/expense` | ADMIN, SUPER_ADMIN | Manually log an expense |
| `GET` | `/api/ledger/summary` | ADMIN, SUPER_ADMIN | Income vs expense by branch (query: `branchId`, `from`, `to`) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invalid credentials always return 401

*For any* (username, password) pair that does not match a stored user's credentials, the Auth_Service SHALL return HTTP 401.

**Validates: Requirements 1.2**

---

### Property 2: JWT validation rejects malformed and expired tokens

*For any* JWT string that is expired, uses an invalid signature, or has been tampered with, the JWT filter SHALL reject the request and return HTTP 401.

**Validates: Requirements 1.4, 1.5**

---

### Property 3: Role guard rejects under-privileged roles

*For any* request to an endpoint annotated for `ADMIN` or `SUPER_ADMIN`, a JWT carrying role `CLIENT` or `TRAINER` SHALL receive HTTP 403.

**Validates: Requirements 1.6**

---

### Property 4: Computed free intervals never overlap with occupied slots

*For any* set of `PENDING` or `ACTIVE` schedule slots and any set of trainer availability records loaded into the Scheduler, every interval returned by `computeAvailableIntervals` SHALL be disjoint from all occupied windows (including each slot's appended buffer time).

**Validates: Requirements 7.6, 7.7**

---

### Property 5: Asset-level buffer isolation — same type, different assets

*For any* two schedule slots assigned to different assets that share the same `type` and `branchId`, the presence of one slot SHALL NOT mark the other asset's overlapping time window as occupied in the Scheduler's output.

**Validates: Requirements 7.8**

---

### Property 6: Enrollment start date must be Monday

*For any* enrollment request whose `startDate` is not a Monday, the Enrollment Engine SHALL reject the request.

**Validates: Requirements 7.9**

---

### Property 7: Trainer availability resolution — latest audit timestamp wins

*For any* set of overlapping `trainer_availability` records for the same `(trainer_id, branch_id)` and overlapping date range, `SchedulerService` SHALL use only the record with the highest `audit_start_date_time` when determining availability for any point in that period.

**Validates: Requirements 6.3**

---

### Property 8: Inter-branch gap enforcement

*For any* trainer and any pair of availability records assigned to different branches, if the end time of one record plus 30 minutes exceeds the start time of the other on the same day, the system SHALL reject the newer record with HTTP 409.

**Validates: Requirements 6.5, 6.6**

---

### Property 9: Buffer Exhaustion — absence always consumes or creates a slot

*For any* enrollment with `buffer_days_allocated > buffer_days_used`, recording an absence SHALL increment `buffer_days_used` by exactly 1 and SHALL create exactly one new `PENDING` schedule slot (either a buffer-day slot or an overflow slot) so that the total scheduled session count is preserved.

**Validates: Requirements 13.A.1, 13.A.2**

---

### Property 10: Morning Sickness — every impacted slot is either reassigned or cancelled

*For any* trainer absence on a given date, for every `ACTIVE` schedule slot assigned to that trainer on that date, the Reconciler SHALL either assign the slot to a qualified replacement trainer or set its status to `CANCELLED`. No slot SHALL remain assigned to the absent trainer with status `ACTIVE`.

**Validates: Requirements 13.B.4, 13.B.5, 13.B.6, 13.B.7**

---

### Property 11: Retroactive Asset Maintenance — all future slots resolved

*For any* asset set to `IN_MAINTENANCE`, for every future `ACTIVE` schedule slot referencing that asset's `resource_id`, the Reconciler SHALL either update the slot's `resource_id` to a non-conflicting replacement asset of the same type and branch, or set its status to `CANCELLED`. No future `ACTIVE` slot SHALL reference an asset that is `IN_MAINTENANCE`.

**Validates: Requirements 13.C.8, 13.C.9, 13.C.10, 13.C.11**

---

### Property 12: Trainer data not exposed to CLIENT role

*For any* API response returned to a user with role `CLIENT` — including schedule slots, availability windows, and enrollment responses — no field SHALL contain a `trainerId`, `trainerName`, or any trainer-identifying information.

**Validates: Requirements 7.14**

---

## Frontend Design

### Angular Routing Structure

```
/                         → redirect to /login (unauthenticated) or role dashboard
/login                    → LoginComponent (eager, public)

/client                   → ClientModule (lazy, RoleGuard: CLIENT)
  /client/trainings         → TrainingsListComponent
  /client/trainings/apply   → EnrollmentStepperComponent
  /client/trainings/:id     → TrainingStatusDetailComponent
  /client/schedule          → ClientScheduleComponent (CalendarComponent)
  /client/profile           → ClientProfileComponent

/trainer                  → TrainerModule (lazy, RoleGuard: TRAINER)
  /trainer/profile          → TrainerProfileComponent
  /trainer/schedule         → TrainerScheduleComponent (CalendarComponent)
  /trainer/availability     → TrainerAvailabilityComponent

/admin                    → AdminModule (lazy, RoleGuard: ADMIN | SUPER_ADMIN)
  /admin/schedule           → AdminScheduleComponent (CalendarComponent, resource-timeline)
  /admin/schedule/pending   → PendingApprovalsComponent (ag-grid or table)
  /admin/clients            → ClientManagementComponent
  /admin/clients/new        → ClientAddComponent (existing stub)
  /admin/clients/:id        → ClientDetailComponent
  /admin/site               → SiteManagementComponent
  /admin/site/branches      → BranchListComponent
  /admin/site/branches/new  → BranchAddComponent (existing stub)
  /admin/site/assets        → AssetListComponent
  /admin/site/assets/new    → VehicleAddComponent (existing stub)
  /admin/site/courses       → CourseListComponent
  /admin/site/courses/:id   → CourseEditComponent
  /admin/ledger             → LedgerSummaryComponent

** → redirect (unauthenticated → /login; wrong role → role dashboard)
```

### Auth Guard Strategy

**`AuthGuard`** (functional guard, `canActivate` / `canActivateChild`):
- Reads JWT from `AuthService.token` signal.
- If absent → redirect `/login`.
- If present but expired → call `AuthService.logout()` → redirect `/login`.

**`RoleGuard`** (functional guard, data-driven):
```typescript
// Route definition example
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.module'),
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ADMIN', 'SUPER_ADMIN'] }
}
```
- Reads `currentRole` from `SessionService`.
- If role not in `data.roles` → redirect to role default dashboard.

**`PendingBadgeService`**:
- Polls `GET /api/slots/pending` every 60 seconds for ADMIN/SUPER_ADMIN users.
- Exposes `hasPending` signal; the shell nav template binds a red badge to it.

### AuthService (Angular)

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // JWT stored ONLY in memory — never localStorage/sessionStorage
  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<JwtPayload | null>(null);

  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();

  login(credentials: LoginRequest): Observable<void> { /* POST /api/auth/login */ }
  logout(): void { this._token.set(null); this._user.set(null); }
  isExpired(): boolean { /* check exp claim */ }
}
```

### HTTP Interceptor

A single `AuthInterceptor` (functional interceptor, Angular 21 style):
1. Attaches `Authorization: Bearer <token>` to every outbound request.
2. On 401 response → calls `authService.logout()` and navigates to `/login`.
3. On 403 response → dispatches a toast notification (access denied).

### Enrollment Multi-Step Stepper (`EnrollmentStepperComponent`)

```
Step 1: Select Course Category
  └── Display category image tiles (NORMAL / PREMIUM / TRIP / OTHER)

Step 2: Course Details
  ├── NORMAL/PREMIUM → Training Type + Asset Type + Branch (or free-text for PREMIUM)
  ├── PREMIUM + own vehicle → upload RC / Insurance / PUC documents
  └── TRIP → dropdown of available trips

Step 3: Schedule Preferences
  ├── Start Date (Monday picker — non-Mondays disabled)
  ├── Preferred Days (multi-select: Mo–Su)
  ├── Hours per Day (number input)
  └── Total Days (auto-calculated from course template, display-only)

Step 4: Availability Preview
  ├── Calls POST /api/scheduler/available-intervals
  ├── Renders available windows in CalendarComponent (read-only)
  └── "No trainer name" note displayed

Step 5: Confirm & Submit
  └── Calls POST /api/enrollments → success → navigate to /client/trainings
```

**Admin override differences** (same stepper used in `AdminModule`):
- Non-Monday start dates produce a warning toast instead of blocking step progression.
- Step 4 shows asset IDs and trainer names (resolved via `SessionService.isAdmin`).
- Calendar conflicts show warnings not hard errors.

### Admin Schedule (`AdminScheduleComponent`)

- Mounts `CalendarComponent` with `viewMode="resource"` (resource-timeline).
- Resources = assets filtered by primary branch.
- Sidebar filters: Client multi-select, Asset Type dropdown, Trainer multi-select.
- Color coding: `PENDING` → amber class, `ACTIVE` → green class, `CANCELLED` → grey class.
- Clicking a `PENDING` slot opens `PendingApprovalsComponent` pre-filtered to that slot.

### Component Breakdown per Feature Module

**ClientModule components:**
| Component | Description |
|---|---|
| `TrainingsListComponent` | Lists enrollments, links to status/detail |
| `EnrollmentStepperComponent` | 5-step booking form |
| `TrainingStatusDetailComponent` | Single enrollment detail + rejection reason |
| `ClientScheduleComponent` | CalendarComponent wrapper (ACTIVE + PENDING slots) |
| `ClientProfileComponent` | View/edit profile, change password |

**TrainerModule components:**
| Component | Description |
|---|---|
| `TrainerProfileComponent` | View trainer profile |
| `TrainerScheduleComponent` | CalendarComponent wrapper (ACTIVE slots) |
| `TrainerAvailabilityComponent` | Add / remove / list availability slots; mark absence |

**AdminModule components:**
| Component | Description |
|---|---|
| `AdminScheduleComponent` | Resource-timeline calendar with filters + pending badge |
| `PendingApprovalsComponent` | Table of PENDING slots with Approve / Reject actions |
| `ClientManagementComponent` | Client list with search; links to detail |
| `ClientDetailComponent` | Client operations: pause, reset password, deactivate, delete |
| `SiteManagementComponent` | Hub for branches / assets / courses |
| `CourseEditComponent` | Edit course template + upload category image |
| `LedgerSummaryComponent` | Income vs expense summary by branch + date range |

---

## Error Handling

### Backend Error Strategy

All exceptions are handled by the existing `GlobalExceptionHandler` which will be extended with:

| Exception | HTTP Status | Message |
|---|---|---|
| `BadCredentialsException` | 401 | "Invalid credentials" |
| `AccountDisabledException` | 403 | "Account is deactivated." |
| `JwtExpiredException` | 401 | "Session expired." |
| `JwtInvalidException` | 401 | "Invalid token." |
| `AccessDeniedException` (Spring Security) | 403 | "Access denied." |
| `DuplicateUsernameException` | 409 | "Username already taken." |
| `DuplicateUniqueIdException` | 409 | "Unique ID already in use." |
| `AvailabilityConflictException` | 409 | Descriptive inter-branch gap message |
| `EnrollmentLimitException` | 422 | "No training allowances remaining." |
| `ScheduleContinuityException` | 422 | "No continuous assignment found for the selected days." |
| `InvalidStartDateException` | 422 | "Training must start on a Monday." |

### Frontend Error Strategy

- HTTP interceptor catches 401 responses and triggers `AuthService.logout()` → redirects to `/login`.
- HTTP interceptor catches 403 and displays a toast notification.
- Form-level validation errors are displayed inline using Angular reactive forms.
- The enrollment multi-step form uses a guard on each step transition to prevent progression on error.

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are used.

**Unit tests** cover:
- `AuthService`: login with valid/invalid/deactivated accounts (example-based).
- `EnrollmentEngine`: enrollment creation atomicity (mock repositories).
- `NotificationService`: notification creation per trigger event.
- Angular components: form validation, routing guard behavior.
- Angular `AuthService`: JWT memory storage, logout clears state.

**Property-based tests** cover the Scheduler computation engine and Reconciliation protocols — the 12 Correctness Properties listed above.

### Property-Based Testing

The property testing library for Java is **[jqwik](https://jqwik.net/)** (version 1.9.x, integrates with JUnit 5 and the existing Gradle/JUnit Platform setup).

Add to `build.gradle`:
```groovy
testImplementation 'net.jqwik:jqwik:1.9.1'
```

Each property test runs a **minimum of 100 iterations** (`tries = 100` or higher where generator space is large).

Tag format used on each test class/method:
```java
// Feature: bike-training-platform, Property N: <property_text>
```

#### Example: Property 4 (Scheduler free intervals)

```java
@Property(tries = 200)
// Feature: bike-training-platform, Property 4: Computed free intervals never overlap with occupied slots
void computedIntervalsAreDisjointFromOccupied(
    @ForAll @Size(min = 0, max = 20) List<@From("occupiedSlots") TimeInterval> occupied) {

    SchedulerService scheduler = new SchedulerService();
    List<TimeInterval> free = scheduler.computeAvailableIntervals(/* query from occupied */);

    for (TimeInterval f : free) {
        for (TimeInterval o : occupied) {
            assertThat(f.overlaps(o)).isFalse();
        }
    }
}
```

#### Example: Property 9 (Buffer Exhaustion)

```java
@Property(tries = 150)
// Feature: bike-training-platform, Property 9: Absence always consumes or creates a slot
void absencePreservesSessionCount(
    @ForAll @IntRange(min = 1, max = 10) int bufferAllocated,
    @ForAll @IntRange(min = 0, max = 9) int bufferUsed) {

    Assume.that(bufferUsed < bufferAllocated);
    // build enrollment with given buffer state
    // record absence
    // verify bufferDaysUsed incremented by 1
    // verify exactly one new slot created
}
```

### Integration Tests

The following are integration tests (not property-based), executed against an in-memory H2 or a Testcontainers PostgreSQL instance:

- `AuthController` login/logout flow (end-to-end HTTP).
- `EnrollmentController` full multi-step enrollment (end-to-end HTTP).
- `ReconcilerService` all three protocols with real DB state.
- `NotificationService` in-app notification persistence.

### Angular Tests

- Unit tests with **Jasmine/Karma** (existing setup):
  - `AuthService`: token storage and expiry.
  - `RoleGuard`: redirect behavior.
  - Enrollment stepper: step validation.
- E2E tests with **Cypress** (recommended, not currently installed): login → enrollment → approval flow.

### API Documentation

Swagger/OpenAPI UI is already available via `springdoc-openapi` at `/swagger-ui.html`. All new endpoints will be annotated with `@Operation` and `@SecurityRequirement`.
