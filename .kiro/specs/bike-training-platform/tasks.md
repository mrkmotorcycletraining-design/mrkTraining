# Implementation Plan: MRK Bike Training Platform

## Overview

This plan converts the full design into incremental coding tasks ordered so that foundational layers are built first: DB schema migrations → Spring Security / JWT → core domain services → REST controllers → Angular auth shell → role-based lazy modules → enrollment flow → reconciliation protocols → notifications → site management → financial ledger. Each top-level task builds on the previous ones. All twelve correctness properties from the design document have a dedicated jqwik property-test sub-task placed immediately after the implementation sub-task it validates.

Tasks marked with `*` are optional (test sub-tasks) and can be skipped for a faster MVP. Core implementation tasks are never optional.

---

## Implementation status (last updated: 2026-06-03)

| Area | Status | Notes |
|------|--------|-------|
| DB schema (`schema.sql`) | Done | `trainer_availability`, `notifications`, client/course/slot columns |
| JPA entities & repos | Done | Includes `ScheduleSlot.branchId` as plain text |
| DTOs & exceptions | Done | Auth, scheduler, enrollment, client, ledger, slot |
| JWT / Spring Security | Done | BCrypt, filter chain, `GlobalExceptionHandler` |
| Trainer availability API | Done | Gap validation, absence sentinel |
| Scheduler API | Done | In-memory interval computation (MVP) |
| Enrollment engine API | Done | Submit, approve, reject, pause |
| Reconciler | Done (MVP) | Protocols A/B/C — refine edge cases when testing |
| Notifications & ledger | Done | Event listeners, optional SMTP |
| Client / trainer REST | Done | Admin client CRUD + `/me`; trainer `/me` |
| Angular auth shell | Done (MVP) | Login, guards, interceptor, proxy, lazy route stubs |
| Angular feature UIs | Done (MVP) | Tasks 15–17 — shells wired to APIs; polish as needed |
| Property & integration tests | Skipped | Per user request — tasks 4.8+, 6.3+, 7.3+, 8.7+, 10.5+, 19–20 |
| Checkpoints 5, 9, 13, 18, 21 | Skipped | Verify manually when compiling |

**Apply schema:** run `mrk-bike-training-backend/db/postgres/schema.sql` against your Postgres DB before starting the backend (`ddl-auto=validate`).

---

## Tasks

- [x] 1. Database schema migrations
  - [x] 1.1 Create `trainer_availability` table and index
    - Write a Flyway (or plain SQL `schema.sql`) migration that executes the `CREATE TABLE IF NOT EXISTS trainer_availability` and `CREATE INDEX IF NOT EXISTS idx_avail_trainer_branch` DDL from the design document
    - _Requirements: 6.1_
  - [x] 1.2 Create `notifications` table and index
    - Write migration for `CREATE TABLE IF NOT EXISTS notifications` and `CREATE INDEX IF NOT EXISTS idx_notif_user_unread`
    - _Requirements: 12.2_
  - [x] 1.3 Alter `client_profiles` — add missing columns
    - Write migration: `ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS unique_id VARCHAR(255) UNIQUE, ADD COLUMN IF NOT EXISTS date_of_birth DATE, ADD COLUMN IF NOT EXISTS profile_picture TEXT, ADD COLUMN IF NOT EXISTS allowed_num_of_trainings INTEGER DEFAULT 1`
    - _Requirements: 3.2, 4.1_
  - [x] 1.4 Alter `schedule_slots` — add `rejection_reason` column
    - Write migration: `ALTER TABLE schedule_slots ADD COLUMN IF NOT EXISTS rejection_reason TEXT`
    - _Requirements: 8.8_
  - [x] 1.5 Alter `courses` — add `buffer_days` column
    - Write migration: `ALTER TABLE courses ADD COLUMN IF NOT EXISTS buffer_days INTEGER DEFAULT 0`
    - _Requirements: 5.5, 7.11_

- [x] 2. JPA entity updates and new entities
  - [x] 2.1 Update `ClientProfile` entity
    - Add fields `uniqueId` (`@Column(name="unique_id")`), `dateOfBirth`, `profilePicture`, `allowedNumOfTrainings` with proper column mappings
    - _Requirements: 3.2, 4.1_
  - [x] 2.2 Update `ScheduleSlot` entity
    - Change `@ManyToOne Branch branch` to `@Column String branchId`; add `String rejectionReason` field
    - _Requirements: 8.8_
  - [x] 2.3 Update `Course` entity
    - Add `Integer bufferDays` field mapped to `buffer_days` column
    - _Requirements: 5.5_
  - [x] 2.4 Create `TrainerAvailability` JPA entity
    - New entity class mapping `trainer_availability` table; include all columns from the design DDL; add `@ManyToOne TrainerProfile trainer` and plain `String branchId` field
    - _Requirements: 6.1_
  - [x] 2.5 Create `Notification` JPA entity
    - New entity class mapping `notifications` table; fields: `id`, `userId`, `message`, `isRead`, `createdAt`
    - _Requirements: 12.2_
  - [x] 2.6 Create Spring Data JPA repositories for new entities
    - `TrainerAvailabilityRepository` — custom queries: `findActiveByTrainerIdAndBranchId`, `findOverlappingRecords`
    - `NotificationRepository` — custom query: `findByUserIdOrderByIsReadAscCreatedAtDesc`
    - _Requirements: 6.1, 12.2_

- [x] 3. Core Java DTOs and records
  - [x] 3.1 Create Auth DTOs
    - `record LoginRequest(String emailUsername, String password)`
    - `record JwtResponse(String token, String role, Long userId)`
    - _Requirements: 1.1_
  - [x] 3.2 Create Scheduler DTOs
    - `record ScheduleQuery(String branchId, String assetType, LocalDate startDate, List<String> preferredDays, int hoursPerDay, int totalDays)`
    - `record TimeInterval(LocalDateTime start, LocalDateTime end)` with an `overlaps(TimeInterval other)` helper method
    - _Requirements: 7.6_
  - [x] 3.3 Create Enrollment and Reconciliation DTOs
    - `record EnrollmentRequest(Long clientId, String courseId, String branchId, String assetType, LocalDate startDate, List<String> preferredDays, int hoursPerDay, BigDecimal totalAmountPaid)`
    - `record ReconciliationResult(List<Long> reassignedSlotIds, List<Long> cancelledSlotIds, List<Long> newBufferSlotIds)`
    - _Requirements: 7.12, 13.A_
  - [x] 3.4 Create client-facing and admin DTOs for request/response bodies
    - `ClientCreateRequest`, `ClientUpdateRequest`, `ClientProfileResponse` (excludes `uniqueId` and `allowedNumOfTrainings`), `AdminClientProfileResponse` (includes all fields), `TrainerAvailabilityRequest`, `ExpenseRequest`, `NotificationResponse`, `LedgerSummaryResponse`
    - _Requirements: 3.2, 4.3, 6.1, 12.1, 15.3_

- [x] 4. JWT and Spring Security foundation
  - [x] 4.1 Add Spring Security and JJWT dependencies to `build.gradle`
    - Add `spring-boot-starter-security`, `io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson` (pinned versions); add `net.jqwik:jqwik:1.9.1` for property tests
    - _Requirements: 1.1_
  - [x] 4.2 Implement `JwtUtil` helper class
    - Methods: `generateToken(User user) → String`, `validateToken(String token) → JwtClaims`, `extractUserId`, `extractRole`, `isExpired`
    - Use a secret key loaded from `application.properties` / environment variable; sign with HS256
    - _Requirements: 1.1, 1.4, 1.5_
  - [x] 4.3 Implement `JwtAuthenticationFilter`
    - `OncePerRequestFilter` subclass; extracts Bearer token from `Authorization` header; calls `JwtUtil.validateToken`; sets `SecurityContextHolder` on success; returns 401 on failure
    - _Requirements: 1.4, 1.5_
  - [x] 4.4 Implement `AuthService` (backend)
    - `login(LoginRequest) → JwtResponse`: loads user by `emailUsername`, validates BCrypt hash via `PasswordEncoder`, checks `isActive`, generates JWT
    - Returns 401 for bad credentials, 403 for inactive account
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 4.5 Configure `SecurityFilterChain`
    - Disable CSRF, set stateless session policy, permit `/api/auth/login`, add `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`, enable method security (`@EnableMethodSecurity`)
    - _Requirements: 1.4, 1.6_
  - [x] 4.6 Implement `AuthController`
    - `POST /api/auth/login` — calls `AuthService.login`, returns `JwtResponse`; map `BadCredentialsException → 401`, `AccountDisabledException → 403`
    - Annotate with `@Operation` and no `@SecurityRequirement` (public endpoint)
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 4.7 Extend `GlobalExceptionHandler`
    - Add handlers for: `BadCredentialsException (401)`, `AccountDisabledException (403)`, `JwtExpiredException (401)`, `JwtInvalidException (401)`, `AccessDeniedException (403)`, `DuplicateUsernameException (409)`, `DuplicateUniqueIdException (409)`, `AvailabilityConflictException (409)`, `EnrollmentLimitException (422)`, `ScheduleContinuityException (422)`, `InvalidStartDateException (422)`
    - _Requirements: 1.2, 1.3, 3.3, 6.6, 7.1, 7.9, 7.10_
  - [ ]* 4.8 Write property test — Property 1: Invalid credentials always return 401
    - **Property 1: Invalid credentials always return 401**
    - Use jqwik `@ForAll String` generators for email and password; ensure no generator produces the stored test user's credentials; assert response is 401
    - **Validates: Requirements 1.2**
  - [ ]* 4.9 Write property test — Property 2: JWT validation rejects malformed/expired tokens
    - **Property 2: JWT validation rejects malformed and expired tokens**
    - Generate arbitrary JWT strings (random base64 segments, expired tokens, tampered signatures); assert `JwtUtil.validateToken` throws or `JwtAuthenticationFilter` returns 401
    - **Validates: Requirements 1.4, 1.5**
  - [ ]* 4.10 Write property test — Property 3: Role guard rejects under-privileged roles
    - **Property 3: Role guard rejects under-privileged roles**
    - Generate valid JWTs with role drawn from `{CLIENT, TRAINER}`; call ADMIN-annotated endpoint; assert HTTP 403
    - **Validates: Requirements 1.6**

- [~] 5. Checkpoint — Auth foundation _(skipped — verify at compile time)_
  - Ensure Spring Boot starts without error, `POST /api/auth/login` returns a valid JWT, and a request with a bad token returns 401. Ask the user if questions arise.

- [x] 6. Core domain services — Trainer Availability
  - [x] 6.1 Implement `TrainerAvailabilityService`
    - `addSlot(TrainerAvailabilityRequest) → TrainerAvailability`: validate 30-minute inter-branch gap (query overlapping records in different branches on same days); set `auditStartDateTime = now()`; save
    - `removeSlot(availabilityId)`: set `isActive = false`
    - `getActiveSlots(trainerId) → List<TrainerAvailability>`
    - `markAbsence(trainerId, date)`: insert zero-duration record (`slotStartTime = 00:00`, `slotEndTime = 00:00`) for the given date
    - Throw `AvailabilityConflictException` on gap violation
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 6.2 Implement `TrainerAvailabilityController`
    - `POST /api/trainer-availability` — roles: TRAINER, ADMIN, SUPER_ADMIN
    - `GET /api/trainer-availability` — roles: TRAINER (own), ADMIN, SUPER_ADMIN; accept `trainerId` query param
    - `DELETE /api/trainer-availability/{id}` — roles: TRAINER (own), ADMIN, SUPER_ADMIN
    - `POST /api/trainer-availability/absence` — roles: TRAINER, ADMIN, SUPER_ADMIN
    - Enforce ownership check: TRAINER may only manage their own records
    - _Requirements: 6.1, 6.2, 6.4, 6.7_
  - [ ]* 6.3 Write property test — Property 7: Latest audit timestamp wins
    - **Property 7: Trainer availability resolution — latest audit timestamp wins**
    - Generate overlapping availability records for the same `(trainer_id, branch_id)` with different `audit_start_date_time` values; call `SchedulerService.computeAvailableIntervals`; assert only the record with the highest timestamp is used
    - **Validates: Requirements 6.3**
  - [ ]* 6.4 Write property test — Property 8: Inter-branch gap enforcement
    - **Property 8: Inter-branch gap enforcement**
    - Generate pairs of availability records for two different branches where end-time + 30 min > start-time of the other; assert `TrainerAvailabilityService.addSlot` throws `AvailabilityConflictException` (mapped to HTTP 409)
    - **Validates: Requirements 6.5, 6.6**

- [x] 7. Scheduling Computation Engine
  - [x] 7.1 Implement `SchedulerService.computeAvailableIntervals`
    - Load `PENDING` and `ACTIVE` schedule slots + trainer availability records for the rolling 3-month window into Java objects (single bulk queries, no loop SQL)
    - Build an in-memory interval tree / sorted list
    - Apply per-asset 30-minute buffer after each slot
    - Apply 30-minute inter-asset gap rule: different assets of the same type at the same branch are independent
    - Return free 30-minute-aligned windows matching `preferredDays`
    - Implement `TimeInterval.overlaps` used by tests
    - _Requirements: 7.6, 7.7, 7.8_
  - [x] 7.2 Implement `SchedulerController`
    - `POST /api/scheduler/available-intervals` — roles: CLIENT, ADMIN, SUPER_ADMIN
    - Strip trainer/asset info from response when caller role is CLIENT (Property 12)
    - _Requirements: 7.6, 7.14_
  - [ ]* 7.3 Write property test — Property 4: Computed free intervals never overlap with occupied slots
    - **Property 4: Computed free intervals never overlap with occupied slots**
    - Use jqwik to generate arbitrary lists of `TimeInterval` as occupied slots (0–20 items); call `computeAvailableIntervals`; assert every returned interval is disjoint from all occupied windows
    - **Validates: Requirements 7.6, 7.7**
  - [ ]* 7.4 Write property test — Property 5: Asset-level buffer isolation
    - **Property 5: Asset-level buffer isolation — same type, different assets**
    - Generate two slots on different assets of the same type and branch; assert the scheduler returns the overlapping time window as available on the second asset
    - **Validates: Requirements 7.8**
  - [ ]* 7.5 Write property test — Property 12: Trainer data not exposed to CLIENT role
    - **Property 12: Trainer data not exposed to CLIENT role**
    - Generate a valid `ScheduleQuery` and call `SchedulerController` with a CLIENT-role JWT; assert no `trainerId`, `trainerName`, or trainer-identifying field appears in any item of the response
    - **Validates: Requirements 7.14**

- [x] 8. Enrollment Engine
  - [x] 8.1 Implement enrollment validation logic
    - Check `allowedNumOfTrainings > 0` and `isActive = true` for the client; throw `EnrollmentLimitException` otherwise
    - Validate `startDate` is a Monday; throw `InvalidStartDateException` otherwise
    - Validate schedule continuity across preferred days; throw `ScheduleContinuityException` if no continuous assignment exists
    - _Requirements: 7.1, 7.9, 7.10_
  - [x] 8.2 Implement `EnrollmentEngine.submitEnrollment`
    - Transactional method: call scheduler to resolve slots, create one `ClientCourseEnrollment` with `status = ACTIVE`, create individual `ScheduleSlot` rows with `status = PENDING` (including buffer-day slots), atomically decrement `allowedNumOfTrainings` by 1
    - Publish `EnrollmentCreatedEvent` (Spring application event) at end of transaction
    - _Requirements: 7.12_
  - [x] 8.3 Implement `EnrollmentEngine.approveSlot` and `rejectSlot`
    - `approveSlot(slotId, adminId, assetId, trainerId)`: set slot `status = ACTIVE`, assign `resourceId = assetId`, `trainerId`
    - `rejectSlot(slotId, adminId, reason)`: set slot `status = CANCELLED`, store `rejectionReason`, atomically increment client `allowedNumOfTrainings` by 1 (rollback)
    - Publish `SlotApprovedEvent` / `SlotRejectedEvent`
    - _Requirements: 8.7, 8.8_
  - [x] 8.4 Implement enrollment pause / unpause
    - `pauseEnrollment(enrollmentId, requesterId)`: set `client_course_enrollments.status = PAUSED`
    - Enforce CLIENT can only pause own enrollment; ADMIN/SUPER_ADMIN can pause any
    - _Requirements: 9.3, 11.3_
  - [x] 8.5 Implement `EnrollmentController`
    - `POST /api/enrollments` — roles: CLIENT, ADMIN, SUPER_ADMIN
    - `GET /api/enrollments` — roles: ADMIN, SUPER_ADMIN (all); with `clientId`, `status`, date-range query params
    - `GET /api/enrollments/mine` — role: CLIENT
    - `GET /api/enrollments/{id}` — CLIENT (own), ADMIN, SUPER_ADMIN
    - `PUT /api/enrollments/{id}/pause` — CLIENT, ADMIN, SUPER_ADMIN
    - _Requirements: 7.12, 9.3_
  - [x] 8.6 Implement `ScheduleSlotController`
    - `GET /api/slots` — all authenticated; query params: `clientId`, `trainerId`, `branchId`, `status`, `from`, `to`
    - `GET /api/slots/pending` — ADMIN, SUPER_ADMIN
    - `PUT /api/slots/{id}/approve` — ADMIN, SUPER_ADMIN; body: `{ assetId, trainerId }`
    - `PUT /api/slots/{id}/reject` — ADMIN, SUPER_ADMIN; body: `{ reason? }`
    - `POST /api/slots/{id}/absence` — CLIENT, TRAINER, ADMIN (records AttendanceLog, triggers Reconciler)
    - _Requirements: 8.6, 8.7, 8.8, 9.2_
  - [ ]* 8.7 Write property test — Property 6: Enrollment start date must be Monday
    - **Property 6: Enrollment start date must be Monday**
    - Generate random `LocalDate` values where `dayOfWeek != MONDAY`; call `EnrollmentEngine.submitEnrollment` (or validator); assert `InvalidStartDateException` is thrown every time
    - **Validates: Requirements 7.9**

- [~] 9. Checkpoint — Backend core _(skipped — verify at compile time)_
  - Ensure all unit tests pass, `POST /api/enrollments` creates slots, and `PUT /api/slots/{id}/approve` transitions status correctly. Ask the user if questions arise.

- [x] 10. Reconciliation Protocols
  - [x] 10.1 Implement Protocol A — Buffer Exhaustion
    - `ReconcilerService.handleAbsence(AttendanceLog)`:
      - Decrement `buffer_days_used` by 1
      - If `buffer_days_allocated - buffer_days_used > 0`: advance to next BufferDay slot; update that slot to `ACTIVE`
      - If buffer pool exhausted: create a new `PENDING` overflow slot on the next available date matching `preferredDaysOfWeek` and time, ignoring trainer continuity
      - Publish `BufferExhaustedEvent` when overflow slot is created
    - _Requirements: 13.A.1, 13.A.2, 13.A.3_
  - [x] 10.2 Implement Protocol B — Morning Sickness (Trainer Absence)
    - `ReconcilerService.handleTrainerAbsence(trainerId, date)`:
      - Find all `ACTIVE` slots for trainer on that date
      - For each: find replacement trainer with valid `trainer_availability` on same branch and time
      - If found: reassign slot to replacement trainer; publish `SlotReassignedEvent`
      - If not found: cancel slot (`status = CANCELLED`); trigger Protocol A for the impacted client
    - _Requirements: 13.B.4, 13.B.5, 13.B.6, 13.B.7_
  - [x] 10.3 Implement Protocol C — Retroactive Asset Maintenance
    - `ReconcilerService.handleAssetMaintenance(assetId)`:
      - Query all future `ACTIVE` slots referencing `resource_id = assetId`
      - For each: find replacement asset of same type and branch with no conflicting slots
      - If found: update `resource_id` to replacement asset; publish `AssetSwappedEvent`
      - If not found: cancel slot; trigger Protocol A for the impacted client
    - _Requirements: 13.C.8, 13.C.9, 13.C.10, 13.C.11_
  - [x] 10.4 Wire reconciler to `AttendanceController`
    - `POST /api/attendance` — ADMIN, SUPER_ADMIN: persist `AttendanceLog` row; if `status = ABSENT` call `ReconcilerService.handleAbsence` (or `handleTrainerAbsence` based on person type)
    - `GET /api/attendance` — ADMIN, SUPER_ADMIN: list logs with `slotId`, `personId` query params
    - Wire `PUT /api/assets/{id}/maintenance` in `AssetController` to call `ReconcilerService.handleAssetMaintenance`
    - _Requirements: 11.2, 13.A.1, 13.B.4, 13.C.8_
  - [ ]* 10.5 Write property test — Property 9: Buffer Exhaustion preserves session count
    - **Property 9: Buffer Exhaustion — absence always consumes or creates a slot**
    - Use jqwik `@IntRange(min=1, max=10)` for `bufferAllocated` and `@IntRange(min=0, max=9)` for `bufferUsed` with `Assume.that(bufferUsed < bufferAllocated)`; record absence; assert `bufferDaysUsed` incremented by exactly 1 and exactly one new PENDING slot created
    - **Validates: Requirements 13.A.1, 13.A.2**
  - [ ]* 10.6 Write property test — Property 10: Morning Sickness resolves every impacted slot
    - **Property 10: Morning Sickness — every impacted slot is either reassigned or cancelled**
    - Generate arbitrary sets of ACTIVE slots for a trainer on a date and a pool of available replacement trainers; call `handleTrainerAbsence`; assert no slot remains assigned to the absent trainer with status ACTIVE
    - **Validates: Requirements 13.B.4, 13.B.5, 13.B.6, 13.B.7**
  - [ ]* 10.7 Write property test — Property 11: Retroactive Asset Maintenance resolves all future slots
    - **Property 11: Retroactive Asset Maintenance — all future slots resolved**
    - Generate arbitrary sets of future ACTIVE slots referencing an asset; set that asset to IN_MAINTENANCE; call `handleAssetMaintenance`; assert no remaining ACTIVE slot references that asset's `resource_id`
    - **Validates: Requirements 13.C.8, 13.C.9, 13.C.10, 13.C.11**

- [x] 11. Notification Service
  - [x] 11.1 Implement `NotificationService`
    - `notify(userId, message)`: persist row in `notifications`; if SMTP env vars present, send email via `JavaMailSender`
    - `getUnread(userId) → List<Notification>`: query ordered by `is_read ASC`, `created_at DESC`
    - `markRead(notificationId, userId)`: set `is_read = true` (verify ownership)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 11.2 Wire notification triggers via Spring application events
    - Listen for `EnrollmentCreatedEvent` → notify client + all admins (Req 12.1 — new enrollment)
    - Listen for `SlotApprovedEvent` → notify client (enrollment approved)
    - Listen for `SlotRejectedEvent` → notify client with reason (enrollment rejected)
    - Listen for `TrainerAbsenceEvent` → notify admins (trainer absence marked)
    - Listen for `SlotReassignedEvent` / slot cancelled by reconciler → notify client, trainer, admins
    - Listen for `AssetSwappedEvent` → notify client and admins
    - Listen for `BufferExhaustedEvent` → notify client, trainer, admins with new slot date/time
    - _Requirements: 12.1_
  - [x] 11.3 Implement `NotificationController`
    - `GET /api/notifications` — all authenticated; returns unread first
    - `PUT /api/notifications/{id}/read` — all authenticated; verifies ownership
    - _Requirements: 12.3, 12.4_

- [x] 12. Client and Trainer management controllers (backend)
  - [x] 12.1 Implement / update `ClientService` and `ClientController`
    - `POST /api/clients` — ADMIN, SUPER_ADMIN: create `users` row + `client_profiles` row; BCrypt hash password (cost 12); check duplicate `emailUsername` (409) and `uniqueId` (409); set `isActive = true`
    - `GET /api/clients` — ADMIN, SUPER_ADMIN: list all with name, username, status, training count
    - `GET /api/clients/{id}` — ADMIN, SUPER_ADMIN: full profile including `uniqueId` and `allowedNumOfTrainings`
    - `PUT /api/clients/{id}/trainings-allowance` — ADMIN, SUPER_ADMIN
    - `PUT /api/clients/{id}/deactivate` — ADMIN, SUPER_ADMIN: set `isActive = false`; cancel all PENDING slots
    - `DELETE /api/clients/{id}` — ADMIN, SUPER_ADMIN: soft-delete (set `isActive = false`; cancel all slots and enrollments)
    - `PUT /api/clients/{id}/reset-password` — ADMIN, SUPER_ADMIN: BCrypt hash new password
    - `GET /api/clients/me` — CLIENT: return profile excluding `uniqueId` and `allowedNumOfTrainings`
    - `PUT /api/clients/me` — CLIENT: update `heightCm`, `weightKg`, `dateOfBirth`, `profilePicture`
    - `PUT /api/clients/me/password` — CLIENT: require `currentPassword`; return 400 if incorrect; hash and store new password
    - _Requirements: 3.1–3.10, 4.1–4.5, 11.1–11.6_
  - [x] 12.2 Implement / update `TrainerController`
    - `POST /api/trainers` — ADMIN, SUPER_ADMIN
    - `GET /api/trainers` — ADMIN, SUPER_ADMIN
    - `GET /api/trainers/{id}` — ADMIN, SUPER_ADMIN, TRAINER (own only)
    - `GET /api/trainers/me` — TRAINER
    - _Requirements: (trainer management foundations for scheduling)_
  - [x] 12.3 Implement Site Management controllers
    - `BranchController`: `POST`, `GET /api/branches`, `GET /api/branches/{id}` — all authenticated for GET; ADMIN/SUPER_ADMIN for POST; 409 on duplicate branch ID
    - `AssetController`: full CRUD as per API table; `PUT /api/assets/{id}/maintenance` calls `ReconcilerService.handleAssetMaintenance`
    - `CourseController`: `POST`, `GET`, `PUT /api/courses`, `PUT /api/courses/{id}/image` — image stored as URL/path in `profile_picture`-style column
    - _Requirements: 5.1–5.7_
  - [x] 12.4 Implement `FinancialLedgerService` and `LedgerController`
    - `autoLogIncome`: listen for `EnrollmentCreatedEvent`; persist row with `type = INCOME_ENROLLMENT`, `branchId`, `assetId`, `trainerId`, `totalAmountPaid`
    - `addExpense(ExpenseRequest, adminId)`: persist expense row
    - `getSummary(branchId, from, to)`: return income vs expense totals grouped by branch
    - `POST /api/ledger/expense` — ADMIN, SUPER_ADMIN
    - `GET /api/ledger/summary` — ADMIN, SUPER_ADMIN; query params `branchId`, `from`, `to`
    - _Requirements: 15.1, 15.2, 15.3_

- [~] 13. Checkpoint — Full backend _(skipped)_
  - Run `./gradlew test`; ensure all unit and property tests pass; verify Swagger UI lists all new endpoints at `/swagger-ui.html`. Ask the user if questions arise.

- [x] 14. Angular — Auth module and shell setup
  - [x] 14.1 Add Spring Security and routing dependencies / configure Angular proxy
    - Confirm `angular.json` proxy config forwards `/api/**` to `http://localhost:8080`; add proxy config file if missing
    - _Requirements: 1.7_
  - [x] 14.2 Implement Angular `AuthService`
    - In `mrk-bike-training/src/app/auth/auth.service.ts`:
      - Hold `_token = signal<string | null>(null)` and `_user = signal<JwtPayload | null>(null)` — never `localStorage`
      - `login(credentials: LoginRequest): Observable<void>` — POST to `/api/auth/login`, decode JWT payload, store in signals
      - `logout(): void` — clear signals
      - `isExpired(): boolean` — check `exp` claim against `Date.now()`
      - Export `token`, `currentUser` as readonly signals
    - _Requirements: 1.7_
  - [x] 14.3 Implement Angular `SessionService`
    - Derived signals: `currentRole`, `isAdmin` (true for ADMIN or SUPER_ADMIN), `isAuthenticated`
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 14.4 Implement `AuthInterceptor` (functional interceptor)
    - Attach `Authorization: Bearer <token>` to every outbound request
    - On 401 response: call `authService.logout()` and `router.navigate(['/login'])`
    - On 403 response: display toast notification "Access denied"
    - Register in `app.config.ts` with `provideHttpClient(withInterceptors([authInterceptor]))`
    - _Requirements: 1.9_
  - [x] 14.5 Implement `AuthGuard` and `RoleGuard` (functional guards)
    - `AuthGuard`: read `AuthService.token`; absent → redirect `/login`; expired → `logout()` + redirect `/login`
    - `RoleGuard`: read `SessionService.currentRole`; if role not in `data.roles` → redirect to role default dashboard
    - _Requirements: 2.4, 1.9_
  - [x] 14.6 Implement `LoginComponent` and login page
    - Reactive form with `emailUsername` and `password` fields
    - On submit: call `AuthService.login`; on success redirect to role-appropriate default route; on failure display inline error
    - Route: `/login` (eager, public)
    - _Requirements: 1.7, 1.8_
  - [x] 14.7 Wire top-level `app.routes.ts` with lazy module routes
    - `/` → redirect to `/login` if unauthenticated; else to role dashboard
    - `/login` → `LoginComponent` (eager)
    - `/client/**` → lazy-load `ClientModule`; `canActivate: [AuthGuard, RoleGuard]`, `data: { roles: ['CLIENT'] }`
    - `/trainer/**` → lazy-load `TrainerModule`; `canActivate: [AuthGuard, RoleGuard]`, `data: { roles: ['TRAINER'] }`
    - `/admin/**` → lazy-load `AdminModule`; `canActivate: [AuthGuard, RoleGuard]`, `data: { roles: ['ADMIN', 'SUPER_ADMIN'] }`
    - _Requirements: 2.4_
  - [x] 14.8 Implement `PendingBadgeService`
    - Poll `GET /api/slots/pending` every 60 seconds (only active when `isAdmin` signal is true)
    - Expose `hasPending` signal; bind red badge to Schedule nav item in admin shell template
    - _Requirements: 2.5, 8.5_

- [x] 15. Angular — Client module
  - [x] 15.1 Create `ClientModule` with routing sub-tree
    - Lazy-loaded module at `/client`; define child routes for all client views
    - _Requirements: 2.1_
  - [x] 15.2 Implement `ClientScheduleComponent`
    - Wrap existing `CalendarComponent` in `viewMode="week"` (or month); feed `GET /api/slots?clientId=me&status=ACTIVE,PENDING` data
    - Add "Request Absence" button per slot that calls `POST /api/slots/{id}/absence`
    - _Requirements: 9.1, 9.2_
  - [x] 15.3 Implement `ClientProfileComponent`
    - Display `name`, `emailUsername`, `heightCm`, `weightKg`, `dateOfBirth`, `profilePicture`
    - "Edit" form for `heightCm`, `weightKg`, `dateOfBirth`, `profilePicture` — calls `PUT /api/clients/me`
    - "Change Password" sub-form — requires `currentPassword`; calls `PUT /api/clients/me/password`; show 400 error inline
    - _Requirements: 4.1, 4.2, 4.5_
  - [x] 15.4 Implement `TrainingsListComponent`
    - Fetch `GET /api/enrollments/mine`; display list with status, submitted date; link to `TrainingStatusDetailComponent`
    - "Apply New Training" button navigates to `/client/trainings/apply`
    - _Requirements: 9.4_
  - [x] 15.5 Implement `TrainingStatusDetailComponent`
    - Fetch `GET /api/enrollments/{id}`; display all slots with status; show `rejectionReason` for CANCELLED slots
    - "Pause" button calls `PUT /api/enrollments/{id}/pause`
    - _Requirements: 9.3, 9.4_
  - [x] 15.6 Implement `EnrollmentStepperComponent` — Steps 1 and 2 (course selection)
    - Step 1: fetch `GET /api/courses`; render category image tiles (NORMAL / PREMIUM / TRIP / OTHER)
    - Step 2 (NORMAL/PREMIUM): Training Type dropdown, Asset Type dropdown, Branch dropdown (`GET /api/branches`)
    - Step 2 (PREMIUM + own vehicle): file upload fields for RC, Insurance, PUC documents plus issues note
    - Step 2 (TRIP): dropdown of available trips from courses API
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  - [x] 15.7 Implement `EnrollmentStepperComponent` — Steps 3, 4, and 5 (schedule and submit)
    - Step 3: Monday-picker for start date (non-Mondays disabled for CLIENT role); preferred days multi-select; hours/day input; total days display (read-only, from course template); display Monday rule note
    - Step 4: call `POST /api/scheduler/available-intervals`; render available windows in `CalendarComponent` (read-only); display "trainer name is not shown" note
    - Step 5: summary review; call `POST /api/enrollments` on confirm; navigate to `/client/trainings` on success
    - _Requirements: 7.9, 7.11, 7.6, 7.14, 7.12, 7.13_

- [x] 16. Angular — Trainer module
  - [x] 16.1 Create `TrainerModule` with routing sub-tree
    - Lazy-loaded module at `/trainer`; define child routes
    - _Requirements: 2.2_
  - [x] 16.2 Implement `TrainerProfileComponent`
    - Fetch `GET /api/trainers/me`; display trainer profile fields; read-only view
    - _Requirements: 2.2_
  - [x] 16.3 Implement `TrainerScheduleComponent`
    - Wrap `CalendarComponent` with ACTIVE slots for the current and next month; feed `GET /api/slots?trainerId=me&status=ACTIVE`
    - "Request Absence" button opens date-picker; on confirm calls `POST /api/trainer-availability/absence` + `POST /api/slots/{id}/absence`
    - _Requirements: 10.1, 10.2_
  - [x] 16.4 Implement `TrainerAvailabilityComponent`
    - Fetch and display `GET /api/trainer-availability` (own slots)
    - "Add Slot" form: branch, available days checkboxes, start/end time, effective date range; calls `POST /api/trainer-availability`; show 409 conflict error inline
    - "Remove" button per slot calls `DELETE /api/trainer-availability/{id}`
    - _Requirements: 10.3, 10.4, 6.5_

- [x] 17. Angular — Admin module
  - [x] 17.1 Create `AdminModule` with routing sub-tree
    - Lazy-loaded module at `/admin`; define child routes; use same stepper and calendar components with admin-mode flags
    - _Requirements: 2.3_
  - [x] 17.2 Implement `AdminScheduleComponent`
    - Mount `CalendarComponent` with `viewMode="resource"` (resource-timeline); resources = assets for primary branch
    - Sidebar filters: Client multi-select, Asset Type dropdown, Trainer multi-select; reactive update on filter change
    - Color-code slots: PENDING → amber, ACTIVE → green, CANCELLED → grey
    - Clicking a PENDING slot navigates to `PendingApprovalsComponent` pre-filtered to that slot
    - Show `PendingBadgeService.hasPending` badge on Schedule nav item
    - _Requirements: 8.3, 8.4, 14.1, 14.2, 14.3, 14.4_
  - [x] 17.3 Implement `PendingApprovalsComponent`
    - Fetch `GET /api/slots/pending`; render in a table (client name, course, requested date/time, asset dropdown, trainer dropdown)
    - "Approve" button calls `PUT /api/slots/{id}/approve` with selected asset and trainer; "Reject" button opens reason text input then calls `PUT /api/slots/{id}/reject`
    - Refresh list after each action
    - _Requirements: 8.6, 8.7, 8.8_
  - [x] 17.4 Implement `ClientManagementComponent` and `ClientDetailComponent`
    - `ClientManagementComponent`: searchable list (name, username, status, training count); "Add Client" button navigates to existing `client-add` stub updated to call `POST /api/clients`
    - `ClientDetailComponent`: display all fields; action buttons: Pause Training, Reset Password, Deactivate, Delete (each calls the corresponding API endpoint)
    - _Requirements: 11.1–11.6_
  - [x] 17.5 Implement `SiteManagementComponent` hub and sub-components
    - `SiteManagementComponent`: navigation hub for branches, assets, courses
    - `BranchListComponent` + `BranchAddComponent` stub: list and create branches via `/api/branches`; show 409 on duplicate ID
    - `AssetListComponent` + `VehicleAddComponent` stub: list, create, edit assets; "Set Maintenance" button calls `PUT /api/assets/{id}/maintenance`
    - `CourseListComponent` + `CourseEditComponent`: list and edit course templates; image upload calls `PUT /api/courses/{id}/image`
    - _Requirements: 5.1–5.7_
  - [x] 17.6 Implement `LedgerSummaryComponent`
    - Branch dropdown + date-range picker; on change calls `GET /api/ledger/summary`
    - Displays income vs expense table grouped by branch
    - "Add Expense" form with type dropdown, amount, date, description; calls `POST /api/ledger/expense`
    - _Requirements: 15.2, 15.3_
  - [x] 17.7 Implement admin override in `EnrollmentStepperComponent`
    - When `SessionService.isAdmin` is true: non-Monday start dates show a warning toast instead of blocking; Step 4 shows asset IDs and trainer names; calendar conflicts show warnings not hard errors
    - _Requirements: 8.1, 8.2_

- [~] 18. Checkpoint — Frontend integration _(skipped)_
  - Run `ng build --configuration production` to confirm no TypeScript or template errors; run Jasmine unit tests (`ng test --watch=false`); manually verify login → client flow → enrollment stepper → admin pending-approval flow. Ask the user if questions arise.

- [ ] 19. Angular unit tests
  - [ ]* 19.1 Write Angular unit tests for `AuthService`
    - Test: token stored in signal (not localStorage); `isExpired` returns true for past `exp`; `logout` clears both signals
    - _Requirements: 1.7_
  - [ ]* 19.2 Write Angular unit tests for `RoleGuard` and `AuthGuard`
    - Test: missing token redirects to `/login`; wrong role redirects to role dashboard; correct role allows navigation
    - _Requirements: 2.4_
  - [ ]* 19.3 Write Angular unit tests for `EnrollmentStepperComponent` validation
    - Test: non-Monday start date shows error for CLIENT; non-Monday shows warning (not block) for ADMIN; Step 5 disabled until all previous steps valid
    - _Requirements: 7.9, 8.1_

- [ ] 20. Integration tests (backend)
  - [ ]* 20.1 Write `AuthController` integration test
    - Use `@SpringBootTest` + `MockMvc`; test valid login returns JWT, invalid login returns 401, inactive user returns 403
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 20.2 Write `EnrollmentController` integration test
    - Full HTTP flow: create client → login → submit enrollment → approve slot → verify slot status ACTIVE
    - _Requirements: 7.12, 8.7_
  - [ ]* 20.3 Write `ReconcilerService` integration test
    - Tests for all three protocols with real DB state (Testcontainers PostgreSQL or H2)
    - _Requirements: 13.A, 13.B, 13.C_
  - [ ]* 20.4 Write `NotificationService` integration test
    - Verify notification rows created for each trigger event; verify `markRead` updates `is_read`
    - _Requirements: 12.1–12.4_

- [~] 21. Final checkpoint — Full system _(skipped)_
  - Run `./gradlew test` (backend); run `ng test --watch=false` (frontend); ensure Swagger UI is reachable; verify at least one happy-path flow end-to-end via automated tests. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The ordering (DB → entities → DTOs → security → services → controllers → Angular) ensures no task depends on a component not yet built
- Each task references specific requirements for traceability; use the references to cross-check coverage during code review
- Property tests use **jqwik 1.9.1** (add to `build.gradle`); each property tag format: `// Feature: bike-training-platform, Property N: <description>`
- The 12 correctness properties are distributed across tasks 4, 6, 7, 8, and 10 — close to the code they validate
- All twelve correctness properties are covered:
  - Properties 1–3: Task 4 (Auth/JWT)
  - Properties 7–8: Task 6 (Trainer Availability)
  - Properties 4–5, 12: Task 7 (Scheduler)
  - Property 6: Task 8 (Enrollment Engine)
  - Properties 9–11: Task 10 (Reconciliation)
- If work stops mid-way, unchecked boxes clearly indicate the resume point; checked boxes indicate completed work
