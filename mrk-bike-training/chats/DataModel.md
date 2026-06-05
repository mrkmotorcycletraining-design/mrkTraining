### Handling Ad-hoc & Custom Requirements

Creating a new `Course` for every single minor client request (e.g., "only weekends") will quickly clutter your database with hundreds of redundant records.

* 
**The Solution:** Treat `Course` as a reusable blueprint (template). When a client signs up, copy those details into the `ClientCourseMapping` session. Any custom variations (like modifying it to weekend-only) can be altered directly on that client's specific mapping record without touching the master course template.



---

## 2. Optimized & Normalized Data Models

Here is the refined relational model structure, designed to be scalable, clean, and ready to export into standard Spring Boot JPA entities.

### Module A: Unified Identity & Access Control

#### 1. User (The Master Auth Table)

> Unified entry point for authentication. SuperAdmins, Admins, Trainers, and Clients live here.

* `id`: UUID or Auto-Increment Long
* `email_username`: String (Unique)
* `password_hash`: String (BCrypt encoded)
* `role`: Enum (`SUPER_ADMIN`, `ADMIN`, `TRAINER`, `CLIENT`)
* `isActive`: Boolean

#### 2. TrainerProfile

> One-to-One relationship with the `User` table where `role == TRAINER`.

* `id`: AlphaNumeric (Shared/FK to User ID)
* `name`: String
* `startDate`: Date
* `salary`: Decimal
* `isAvailable`: Boolean

#### 3. ClientProfile

> One-to-One relationship with the `User` table where `role == CLIENT`.

* `id`: AlphaNumeric (Shared/FK to User ID)
* `name`: String
* `uniqueId`: String (Admin-assigned, must be unique across all clients — can be an email or any custom value)
* `allowedNumOfTrainings`: Integer (Max number of concurrent active/pending trainings; set and updated only by Admin/SuperAdmin; **not visible to the client**)
* `heightCm`: Integer (Used to match `HtRangeReq` on bikes)
* `weightKg`: Integer (Used to match `WtRangeReq` on bikes)

---

### Module B: Core Business Infrastructure

#### 4. Branch

* `id`: String (PinCode + Name slug, e.g., `"400001_MumbaiFort"`)
* `name`: String
* `locationAddress`: String

#### 5. AssetInfo (Vehicles & Classrooms)

* `id`: String (Bike Plate Number, e.g., `"MH051234"`)
* 
`type`: Enum (`NON_GEARED`, `CRUISER`, `SPORTS`, `GEARED`, `OWN_ASSET`, `CLASSROOM`) 


* `name`: String
* `cc`: Integer
* 
`color`: String 


* `nextMaintenanceDate`: Date
* `minHeightReq`: Integer
* `minWeightReq`: Integer
* 
`currentBranchId`: FK to Branch 



#### 6. Course (Templates)

> Acts strictly as a reusable business product blueprint.
> 
> 

* `id`: User-Defined String (e.g., `"MOTO_PREMIUM"`)
* `name`: String
* `category`: Enum (`NORMAL`, `PREMIUM`, `TRIP`, `OTHER`)
* `hoursPerDay`: Integer
* `totalDays`: Integer
* `preferredDaysOfWeek`: String (Comma-separated values or JSON Array, e.g., `["SAT", "SUN"]` for weekends)

---

### Module C: Scheduling Engine & Operational Logs

#### 7. ClientCourseEnrollment (Replaces Mapping)

> This controls the overarching agreement. It handles custom overrides, billing records, and tracking buffer days.

* `id`: Long (PK)
* `clientId`: FK to ClientProfile
* `courseId`: FK to Course
* `branchId`: FK to Branch
* `trainerId`: FK to TrainerProfile
* `assetId`: FK to AssetInfo (Can point to `OWN_ASSET` placeholder id)
* `totalAmountPaid`: Decimal
* `enrollmentDate`: Date
* `status`: Enum (`ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`)
* `bufferDaysAllocated`: Integer (e.g., 3 extra days added automatically to accommodate absences)
* `bufferDaysUsed`: Integer

#### 8. ScheduleSlot (The Calendar Core)

> **Crucial Addition:** This acts as the single source of truth for your Angular Calendar Component. Every single calendar block maps cleanly to a row here. By checking conflicts on this table, you instantly prevent double-bookings across clients, trainers, and assets.
> 
> 

* `id`: Long (PK)
* `enrollmentId`: FK to ClientCourseEnrollment (Null for ad-hoc/one-off entries)
* 
`resourceId`: String (Points to `AssetId` to map horizontal lanes dynamically) 


* 
`trainerId`: FK to TrainerProfile 


* 
`clientId`: FK to ClientProfile 


* `branchId`: String — **intentionally NOT a foreign key**. This field stores different types of location identifiers depending on the course category:
  * **Regular courses** → a valid `branches.id` value (e.g. `"400001_MumbaiFort"`)
  * **Premium courses** → the client's location pincode (e.g. `"400050"`)
  * **Trip courses** → a Trip ID string

  > Referential integrity for regular branches is enforced at the application layer. Adding a hard FK here would require inserting a dummy `branches` row for every pincode and trip ID, which pollutes the `branches` table.

* 
`title`: String 


* 
`startDateTime`: LocalDateTime 


* 
`endDateTime`: LocalDateTime 


* `type`: Enum (`REGULAR_TRAINING`, `BUFFER_SESSION`, `TRIP`, `MAINTENANCE`)
* `status`: Enum (`PENDING`, `ACTIVE`, `CANCELLED`)
  * `PENDING` — client has submitted the request; awaiting Admin/SuperAdmin approval
  * `ACTIVE` — Admin/SuperAdmin has approved the slot
  * `CANCELLED` — slot was rejected or cancelled; optional `rejectionReason` text populated by admin
* `rejectionReason`: String (Optional — populated by Admin/SuperAdmin on `CANCELLED`)

#### 9. AttendanceLog

> Combined attendance tracking for both clients and trainers into a single table structure.

* `id`: Long (PK)
* `slotId`: FK to ScheduleSlot (Links attendance to a specific calendar event)
* `personId`: String (Can be a Client ID or Trainer ID via User reference)
* `personType`: Enum (`CLIENT`, `TRAINER`)
* `dateTime`: LocalDateTime
* `status`: Enum (`PRESENT`, `ABSENT`)

---

## 3. Upselling Business Intelligence: Basic Metrics Schema

To set up the feature expansion hooks you mentioned without over-complicating your early design stages, add a basic **Financial Transaction Ledger** and an **Asset Status Log**. This simple framework provides all the historical data points needed to populate the following frontend charts later:

```
                  ┌─────────────────────────────────┐
                  │   FINANCIAL LEDGER LOG ENTRIES  │
                  └────────────────┬────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
 📊 Asset Yield Chart      💼 Trainer Cost ROI      🏢 Branch Efficiency
(Revenue vs. Maintenance) (Salary vs. Hours Taught)   (Enrollment Volume)

```

### 10. FinancialLedger (The Metrics Engine)

Every time money changes hands (client pay-ins, trainer salary pay-outs, bike maintenance costs), log an entry here.

* `id`: Long (PK)
* `branchId`: FK to Branch (Tracks **Branch Performance**)
* `assetId`: FK to AssetInfo (Null if not applicable; tracks **Asset Profitability**)
* `trainerId`: FK to TrainerProfile (Null if not applicable; tracks **Trainer Spend**)
* `type`: Enum (`INCOME_ENROLLMENT`, `EXPENSE_TRAINER_SALARY`, `EXPENSE_ASSET_MAINTENANCE`, `EXPENSE_MISC`)
* `amount`: Decimal
* `transactionDate`: Date

### How These Tables Handle Your Future Graphs Easily:

* **Asset Revenue vs. Expense:** `SUM(amount) WHERE asset_id = X AND type = INCOME_ENROLLMENT` minus `SUM(amount) WHERE asset_id = X AND type = EXPENSE_ASSET_MAINTENANCE`.
* **Trainer Performance / Utilization:** Count total `PRESENT` rows in `AttendanceLog` where `personId = TrainerX` relative to their base monthly cost found in the `FinancialLedger`.
* **Branch Performance:** Group by `branchId` inside the `FinancialLedger` to isolate and highlight your most profitable locations instantly.