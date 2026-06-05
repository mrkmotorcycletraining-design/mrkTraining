# Requirements Specification

## 1. System Overview

We have our database in PostgreSQL, backend on Spring Boot(mrk-bike-training-backend), and frontend on Angular(mrk-bike-training). The logic dictates that Admin and trainer have rights to schedule or confirm the schedule the client requested. Every Trainer can take more than one client on the same branch with a different asset at the same time. Admins can also function as trainers.

Our first landing page should be a login page. Based upon the login type, UI functionalities differ.

---

## 2. User Roles & Menus

### Client Login

* **Profile** (New Separate future spec)


* View/Update Profile




* **Trainings**

* Apply New Training


* View Past Trainings


* View Training Request Status




* **Schedule**

* See current schedule


* Request Absence


* Request Pause on current training





### Trainer Login

*(Every tab is a Separate future spec)*

* **Profile**: View/Update Profile


* **Schedule**

* See current schedule


* Request Absence


* Add new slots


* Remove Existing slots





### Admin and SuperAdmin Login

* **Schedule**

* See current schedule


* View Requests


* Set schedule for Client


* Set schedule for Trainer




* **Client**

* Add client


* Mark Absent


* Pause Training


* Update client password


* Delete client


* Deactivate client




* **Trainer** (Future Spec)


* Add Trainer (Only Super Admin, will be in different Spec)


* Mark Absence


* Switch Trainer branch


* Update Trainer password


* Delete Trainer


* Deactivate Trainer




* **Site Management**

* Add New Branch


* Update Training Template


* Add New Training





---

## 3. Core Logic & Operational Workflows

### Training Requirements

Every training has a Category: Regular/Premium/Trip/Other.

* Regular and Premium have type: Basic/Advance/Traffic/Other (User/AdminInput Optional).


* Other: This is custom training. Admin or SuperAdmin can design questions for this. (This will be a separate spec).


* Each category-type comb, trip and other will have a template, which is an image type.


* For each training, we have an optional column, `BufferDays`. Mostly it applies to Regular/Premium to have a cushion in case a client or trainer took a leave, while booking these many slots we overbooked for the same client, trainer, and vehicle.



### Trainer Branch Availability

Trainer can handle different branches at different times. Constraint: Same trainer cannot be part of 2 branches at the same time and there should be at least 30 mins difference in slots for trainer for different branch.

* In case of premium courses, `BranchId` can be the client's location pincode.


* For Trip course, it can be trip id.


* Trainer/Admin/SuperAdmin can add slots for trainer in branch.


* Available slots are time ranges, example 01:00PM-03:00PM.


* Available Days: comma separated Mo, Tu, WE, Th, Fr, Sa, Su.


* If a trainer selects 1st May to 30th June 1PM-4PM but later adds a schedule for 20th May-21st May 4PM-6PM, the latest `auditStartDateTime` one should always get priority.


* If a trainer requests absence for 1st June, add an entry for that whole day with AvailableSlots 0.



### Client Onboarding Logic

Only Admin and SuperAdmin has right to onboard new client.

* Admin can provide client name, userName, uniqueId, allowedNumOfTrainings and password. Admin will share these details via separate channels for the client to login.


* `UniqueId` and `Username` should have a uniqueness check. Admin decides what the unique id is (e.g., email).


* Only Admin and SuperAdmin can provide/update how many trainings a client can opt for (`allowedNumOfTrainings`).


* Once logged in, clients can see their profile and update their password, picture, height, weight, and DOB. Name, UserName, `allowedNumOfTrainings`, and `UniqueId` are admin-provided only and read-only for clients. `UniqueId` and `allowedNumOfTrainings` are not visible to the client.



### Client Apply New Training

Client can only apply for training if their profile status is ACTIVE and `allowedNumOfTrainings` > 1.

* Client fetches all Training category templates (image types).


* **Form Flow:**
* Choose Training Category.


* If Category == Regular/Premium:
* Choose Training type and Vehicle type (Asset Type).


* In case of premium: Train on your own vehicle: Yes/No. If Yes: Provide vehicle Number, RC, Insurance, PUC, and note any issues.


* Choose Location: Branch dropDown for Regular, complete address for Premium.




* **Calendar Selection (Optimized Java Computation):**
* Shows restricted month view for selected vehicle and branch.


* *Computation Engine:* To optimize performance and avoid heavy SQL computations, the Spring Boot backend will fetch only *occupied* schedules and trainer availabilities, calculating available 30-minute intervals in Java memory for a rolling 3-month period.


* Buffered time for existing trainings is considered already occupied. `PENDING` statuses are also considered occupied.


* For the same bike, we require a 30-minute buffer time between separate sessions. (e.g., if booked 1-2, next available is 2:30-4). If the branch has multiple identical assets, the slot remains open.




* **Date & Time Selection:**
* Select start date: Should always start from Monday. Note is displayed regarding Monday starts. Admin/SuperAdmin can override on confirmation.


* Select start/end Time: Uses the computed `ScheduleDetail` to prevent double booking. Client should not see individual trainer details, only time slot availability.


* Number of Training days, hours per day, and preferred days (Mo, Tu, We...).




* **Client Validation & Checkout:**
* *Buffer Obfuscation:* Calculate buffer days added to the schedule, but this is hidden from the client UI.


* If not a weekend training, prompt error if not starting on a Monday.


* If trainer/vehicle continuity fails across the selected days, show an error.


* If successful, create an entry in `scheduleSlot` with `PENDING` status, reduce `allowedNumOfTrainings` by 1 immediately, and notify admins/client.




* **Rollback Protocol:** If an Admin rejects the request, `allowedNumOfTrainings` must be rolled back (incremented by 1) automatically.
* If Category == Trip: Choose trip dropdown. Creates an entry in `trainingRequest` and sends notifications.





### Admin/SuperAdmin Scheduling

* The process remains identical to the client flow, except calendar conflicts or Monday-start violations trigger *warnings* instead of hard errors.


* Admins can view specific trainer names and vehicle infos during this override.


* When logged in, Admins see a default branch calendar with robust filters (Client dropdown, vehicle type, trainer schedule).


* Pending requests show as a red dot on the Schedule menu item. Clicking routes to an ag-grid view of pending requests with dropdowns to assign available bikes and trainers.


* Upon Approval, status becomes `ACTIVE`. Upon rejection, an optional reason is provided, visible to the client in their "View Training Request Status" grid.



---

## 4. Automated Schedule Reconciliation Protocols

To handle real-world operational chaos, the Spring Boot engine must listen for specific operational events and automatically adjust the `schedule_slots`:

### A. Buffer Exhaustion Protocol

* If a client or trainer is marked ABSENT for a day, the system automatically consumes the next available Buffer Day on the client's schedule. The client UI is updated to reflect this shift.
* If continuous absences exhaust the buffer (0 days remaining), the system auto-schedules the missed session to the next closest date matching the preferred days, time slot, and branch. Trainer continuity is ignored for overflow. Clients, Trainers, and Admins are notified.

### B. "Morning Sickness" Protocol (Trainer Absence)

* If an Admin marks a Trainer absent for a specific date (e.g., sick leave), the system attempts to auto-reassign all confirmed slots for that trainer that day to another available trainer at the exact same branch and time.
* If no replacement trainer is available, the slot is cancelled, triggering Protocol A (Buffer Exhaustion) for all impacted clients.

### C. Retroactive Asset Maintenance

* Vehicles are never deleted from the database.
* If an Admin marks an Asset's status as `IN_MAINTENANCE` (due to breakdown), the system automatically queries for an identical asset type (e.g., another Meteor) at the same branch.
* If an identical asset is available, all future slots tied to the broken asset are hot-swapped to the new asset.
* If no replacement asset is available, the slot is cancelled, triggering Protocol A (Buffer Exhaustion) for the impacted client.