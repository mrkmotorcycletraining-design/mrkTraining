# System Requirements & UI/UX Specification Document
## Project: Custom B2C/B2B Resource Scheduling Engine (TimeTree Evolution)
### Targeted Stack: Angular Frontend (Standalone Architecture)

---

## 1. Executive Summary & Core Intent

This document establishes the comprehensive UI/UX requirements, architectural layout rules, and interactive interface patterns for a specialized asset-scheduling platform. Inspired by the collaborative, multi-layered environment of TimeTree, this application is engineered explicitly as a **B2C/B2B resource scheduling engine** rather than a rigid corporate organizer. 

The primary business objective is mapping dynamic entities (**Customers/Clients, Trainers/Instructors**) against static physical assets (**Vehicles, Fleet Inventory, Training Equipment**) across **multiple business branches**. The application must run as a fully standalone, highly responsive Angular front-end. To ensure immediate testability and clear operational isolation, all data layers must adhere to strict **Input and Output data contracts (Mock JSON structures)**, allowing seamless toggling between local testing payloads and live REST/GraphQL APIs at a later developmental stage.

---

## 2. Platform Look, Feel, & Visual Design Language

The application must shed the uninspiring, high-density look of traditional enterprise calendars (e.g., Outlook) in favor of an intuitive, social-first, time-centric user experience. 

### A. Color Palette & Dark/Light Theming
* **Background Spaces:** Soft, desaturated canvas tones (e.g., warm cream or cool slate gray depending on the workspace theme) to mitigate eye strain during prolonged administrative sessions.
* **Theming Options:** Dynamic switching between Light Mode (clean, high-contrast, professional) and Dark Mode (low-emission, optimized for indoor dispatch stations).
* **System Borders:** Light-gray dividers (`#E0E0E0` or dark-mode equivalents) to maintain separation without creating harsh visual breaks.

### B. Inline Multi-Label Color Coding (Asset-Centric Visuals)
* **The Principle of Asset Ownership:** Visual color assignment belongs to the **Asset/Vehicle Category**, not the individual user or client profile.
* **Persistent Inline Strips:** When bookings are clustered tightly inside a monthly grid or timeline, individual text blocks must retain a bold, fixed, color-coded accent strip (hex value or CSS `className`) bound to the respective asset.
* **Cognitive Loading Reduction:** A coordinator looking at a macro view must instantly identify which slot belongs to a Cruiser (e.g., Meteor 350, deep blue), a Geared Bike (e.g., Apache RTR, crimson red), or an Automatic Scooter (e.g., Activa, emerald green) purely via immediate visual pattern recognition.

### C. Typography & Content Density
* **Scale Rules:** Strict typographic hierarchy tailored for print and digital data layouts (Title elements: `18–22pt`, section headers: `13–15pt`, inline details/sub-labels: `10–11pt`).
* **Overflow Rules:** Clean truncation handling (`text-overflow: ellipsis`) for dense multi-booking days, expanding smoothly into detailed popovers upon hovering or selection.

---

## 3. Screen Layouts & Responsive Cross-Platform Adaptation

Managing complex asset fleets on variable screens demands smart layout adaptation. The UI must transition seamlessly from high-density multi-lane configurations on desktop monitors to vertical chronological feeds on mobile screens without stripping essential features.


```

```text
File generated successfully.


```

+-----------------------------------------------------------------------------------+
|  [Logo/Branch]              [GLOBAL MACRO CONTROLS & VIEWS]                       |
+-----------------------------------------------------------------------------------+
| [X] Fleet Filter  |                  MAIN CONTENT STAGE (70%)                      |
|   [-] Geared Bike |  +----------------------------------------------------------+  |
|     [X] Apache    |  | Mon       | Tue       | Wed       | Thu       | Fri      |  |
|     [X] Meteor    |  |-----------+-----------+-----------+-----------+----------|  |
|   [-] Automatic   |  |           | [Apache]  |           | [Activa]  |          |  |
|     [X] Activa    |  |           | Booking A |           | Booking C |          |  |
|                   |  |           |           |           |           |          |  |
| [X] Trainers      |  |           |           |           |           |          |  |
|   [X] Instructor1 |  |           |           |           |           |          |  |
|                   |  |           |           |           |           |          |  |
| [Button: New]     |  +----------------------------------------------------------+  |
+-------------------+---------------------------------------------------------------+
| [StatusBar: 3 Active, 1 Maintenance] | [Selected Day Detail Panel - Right 30%]     |
+--------------------------------------+--------------------------------------------+

```

### A. Desktop Workspace Layout (Split-Screen Dashboard UI)
* **The 20% Left Sidebar Panel:** * Dedicated entirely to fleet execution states, branch selectors, and core parameter filters.
    * Contains reactive multi-tier category checkboxes and quick-action utility hooks.
    * Features persistent status counts at the bottom edge (e.g., "*3 Bikes Active, 1 In Maintenance*").
* **The 50%-70% Central Content Stage:**
    * Houses the core instance container for the calendar rendering engine.
    * Features top-bar view selectors supporting **Month Grid, Week Timeline, Day Schedule, and Resource-Horizontal Timeline** configurations.
* **The 30% Right-Hand Contextual Panel:**
    * Instead of opening obtrusive pop-up forms that blind the user to surrounding days, clicking a day square or booking block dynamically streams context into this side channel.
    * Displays a vertical, high-density **Hourly Agenda Lane** (6:00 AM to 10:00 PM) showing precise availability gaps for that selected date, along with recent action trails, internal group notes, and attachment hubs.

### B. Mobile & Tablet Optimization Layout
* **The Multi-Calendar Overlay Paradigm:** Because a horizontal resource grid cannot scale down to a 5-inch mobile screen, the mobile view transforms into a **Unified Master Overlay Feed**. Individual asset data silos are stacked dynamically over a single calendar canvas.
* **Sliding Vertical Chronological Breakdown:** Tapping any date box inside the compact monthly grid gracefully slides open a sleek, scrollable hourly breakdown directly beneath the grid view. This layout element lets the field coordinator see morning vs. afternoon asset vacancies instantly on the move.
* **Off-Canvas Triggers:** The left navigation panel and filter criteria slide smoothly from the screen margins via touch gestures (swipes) or dedicated header icon triggers.

---

## 4. Advanced Filter Architecture & Fleet State Engine

Rather than executing slow backend database queries every time an administrative box is toggled, the filter module must manipulate a stateful, client-side data service.

### A. Hierarchical Tree-Filter Selection
* **Multi-Tier Categorization:** The UI must manage entities in a clear hierarchy:
    * **Level 1:** Branch Location Selector (e.g., Downtown Hub vs. Uptown Training Center).
    * **Level 2:** Asset Macro Category (e.g., Geared Motorcycles, Automatic Scooters, Theoretical Classrooms).
    * **Level 3:** Specific Asset Track Profile (e.g., TVS Apache, Meteor 350, Honda Activa).
* **Entity Intersect Toggles:** Secondary matching branches for **Trainers/Instructors** and **Client Tiers**, allowing coordinators to isolate views by specific combinations (e.g., "*Show me only Geared Bikes managed by Instructor Alex*").

### B. Control Micro-Interactions
* **Instant Macro Toggles:** A reactive "**Select All / Clear All**" fast-action shortcut must be anchored above each asset category block. This is vital for high-speed dispatcher operations when a user needs to immediately isolate a single vehicle's availability without unchecking dozens of individual checkboxes.
* **Color-Coded Status Badges:** Every item in the sidebar filter configuration must feature an active visual preview badge showing its color-coding signature, matching the exact color profile of the bounding blocks rendered across the scheduling board.

---

## 5. High-Fidelity Calendar Views & Core Engine Specs

The interactive interface must wrap a professional timeline layout structure, giving coordinators full control over asset tracking.

### A. View Modes & Behavioral Mechanics
1.  **Month View Grid:** A comprehensive macro view showing overlapping, multi-colored strips representing allocated blocks. Must explicitly flag daily totals and asset allocation densities.
2.  **Vertical/Agenda Timeline View:** An hourly chronological tracker that visually maps structural gaps and empty time windows between active client bookings on a selected day.
3.  **Resource-Timeline view:** Maps assets horizontally across the left-most column while projecting chronological hours/days along the horizontal top header. This allows users to see multiple vehicles as independent lanes running concurrently on a single screen.

### B. Operational Rules Template Engine (Weekday vs. Weekend Matrices)
* **The TimeTree Flaw:** Standard calendar apps treat every entry as a flat, generic, unconstrained object, forcing operators to manually organize varying scheduling templates across different calendar days.
* **The Operational Solution:** The visual UI must adapt structurally to pre-configured business rule templates.
* **Visual Formats By Rule Presets:**
    * When the operator views a **Weekday** date, the interface must automatically format itself into fixed 1-hour schedule slots starting precisely from 6:00 AM.
    * When a **Weekend** date is active, the system changes its visual grid to display long-distance road trip allocation blocks.
    * **Non-Operational Hour Shading:** Hours falling outside a branch’s operating window or asset-maintenance intervals must be rendered with an inactive, dark-diagonal cross-hatch pattern, preventing illegal entry creation by the coordinator.

---

## 6. Smart Drag-and-Drop Mutation with Optimistic UI Controls

The drag-and-drop mechanism handles two critical coordination workflows: **Rescheduling** (altering date/time parameters) and **Asset Re-assignment** (moving a booking block across lanes when a vehicle experiences a breakdown).

### A. Ghost Block Feedback Mechanics
* **Visual Snapping Trail:** While an active drag gesture is performed, a semi-transparent, low-opacity "ghost" representation of the booking block must trail the user's cursor.
* **Grid Alignment:** The ghost block must snap cleanly to exact increment boundaries (e.g., snapping precisely to hourly lines in the Day/Timeline layout or locking into specific date boxes in the Month view).

### B. Real-Time Collision Overlays & Client-Side Safety Rails
* **Visual Availability Previews:** The moment an event block is lifted via a drag-and-drop gesture, the system must project a visual overlay across the calendar grid *before the user drops the item*.
* **Green/Red Status Mapping:** Non-conflicting, vacant slots must immediately light up with a subtle green tint. Overlapping hours or days where that specific asset is already reserved must turn a distinct desaturated red. This provides immediate visual validation, preventing human-error scheduling overlap.
* **Optimistic UI Interceptor with State Rollback:**
    1.  The instant the operator drops the event block into an open slot, the front-end state engine must update its client-side position *immediately* on screen to maintain a fast, lag-free user experience.
    2.  Simultaneously, the framework triggers an outbound tracking data dispatch.
    3.  If the operational validation layer rejects the modification (e.g., due to an asset collision or business constraint violation), the front-end interceptor must catch the error, **seamlessly snap the booking block back to its original slot**, and trigger a clear, floating alert: `Collision Detected: Asset is already allocated at this time.`

---

## 7. High-Velocity Booking Creation & Replication Tools

Administrative efficiency relies on reducing repetitive text entry and streamlining mass replication workflows.

### A. Quick-History "Long-Press" Injection Menu
* **The Challenge:** Operators waste valuable time filling out identical data payload forms (e.g., typing "Demo Ride," "Routine Maintenance," "Introductory Lesson") across hundreds of separate booking blocks.
* **The Quick-Action Interface:** Long-pressing a mobile date card or right-clicking a desktop calendar square must bypass the empty creation form and directly open a compact, floating contextual pop-up next to the cursor.
* **Local State Cache Integration:** This menu displays a small array of the top 5 most frequently used or recently deployed booking titles. Tapping an item from this fast-access list instantly spins up a complete booking on that date, using pre-saved metadata payloads.

### B. Multi-Date Multi-Select Cloning Engine
* **Non-Contiguous Replication Flow:** To clone an established slot across non-sequential dates, the user selects the "Replicate/Clone" action icon on a booking block.
* **Secondary Calendar Overlay:** This action launches a compact, secondary modal calendar overlay.
* **Multi-Select Date Matrix:** The operator freely clicks multiple scattered dates (e.g., selecting June 12th, 14th, and 19th in a single session) without the interface closing or navigating away. Chosen dates remain cleanly highlighted in an active accent color.
* **Batch Action Execution:** Clicking a single "Confirm Cloning" execution button packages the entire selected target collection into a single batch data transaction payload.

---

## 8. Standalone Angular Component Architecture

To guarantee a modular front-end implementation that can easily scale later, the UI must be organized into a clean, decoupled component hierarchy.


```

+--------------------------------------------------------------------------+
|                        [Shell / Dashboard Component]                     |
+--------------------------------------------------------------------------+
|  +--------------------+  +--------------------------------------------+  |
|  | [Sidebar]          |  | [Calendar Canvas Component]                |  |
|  | - BranchSelector   |  |                                            |  |
|  | - AssetTreeFilter  |  |  +--------------------------------------+  |  |
|  | - FleetStatus      |  |  | [FullCalendar Native Wrapper]        |  |  |
|  +--------------------+  |  +--------------------------------------+  |  |
|                          |                                            |  |
|                          |  +--------------------------------------+  |  |
|                          |  | [Hourly Agenda View / Detail Panel]  |  |  |
|                          |  +--------------------------------------+  |  |
|                          +--------------------------------------------+  |
+--------------------------------------------------------------------------+
|  +---------------------------------------------------------------------+  |
|  | [Modals/Overlays Layer]                                             |  |
|  | - ReactiveFormBookingModal                                          |  |
|  | - MultiDateCloneModal                                               |  |
|  | - HistoryQuickSelectMenu                                            |  |
|  +---------------------------------------------------------------------+  |
+--------------------------------------------------------------------------+

```

### A. Component Hierarchy Breakdown
1.  **Dashboard Shell Component (`dashboard-shell`):** The global container managing layouts, responsive viewport breaking states, and theme propagation.
2.  **Sidebar Controller Component (`sidebar-filter`):** Manages hierarchical checkbox states, branch mapping, and fast macro category selection filters.
3.  **Calendar Canvas Component (`calendar-canvas`):** Wraps the core scheduling engine instance, listening for window resize events, view category toggles, and cell selection prompts.
4.  **Hourly Agenda Panel Component (`hourly-agenda`):** Handles high-density day analysis, layout splits, and asset availability gaps.
5.  **Reactive Booking Form Modal (`booking-form-modal`):** An input/output driven orchestration view handling customer payloads, core asset links, and validation states.
6.  **Multi-Date Clone Engine (`clone-modal`):** Secondary date grid selection canvas driving bulk duplication array structures.

---

## 9. Data Architecture: Input/Output JSON Formats

To ensure the calendar part functions as an entirely independent, standalone entity, all operational data moving in and out of the Angular components must strictly adhere to predefined JSON contracts. Developers can instantly hot-swap local static mock test files with true live API pipelines without breaking core UI behaviors.

### A. Asset Fleet Definition Dataset (Input)
This structure populates the hierarchical filter tree in the sidebar and spawns the horizontal lanes in the resource view.

```json
{
  "branchId": 501,
  "branchName": "Metro Main Training Center",
  "assetCategories": [
    {
      "categoryId": "CAT_GEARED",
      "categoryName": "Geared Motorcycles",
      "colorTheme": "#D32F2F",
      "assets": [
        {"assetId": 101, "assetName": "TVS Apache RTR", "status": "ACTIVE", "registrationNumber": "MH-01-AA-1234"},
        {"assetId": 102, "assetName": "Royal Enfield Meteor 350", "status": "ACTIVE", "registrationNumber": "MH-01-BB-5678"}
      ]
    },
    {
      "categoryId": "CAT_AUTO",
      "categoryName": "Automatic Scooters",
      "colorTheme": "#388E3C",
      "assets": [
        {"assetId": 201, "assetName": "Honda Activa 6G", "status": "IN_MAINTENANCE", "registrationNumber": "MH-01-CC-9012"}
      ]
    }
  ]
}

```

### B. Schedule Events & Booking Feed Payload (Input/Output)

This format models active entries within the rendering engine canvas.

```json
[
  {
    "bookingId": 7089,
    "assetId": 101,
    "categoryId": "CAT_GEARED",
    "title": "Demo Ride - Rohan Sharma",
    "startTime": "2026-06-15T08:30:00",
    "endTime": "2026-06-15T10:00:00",
    "bookingStatus": "CONFIRMED",
    "assignedTrainer": "Instructor Alex",
    "notes": "Customer requested size-L riding jacket.",
    "uiStyles": {
      "backgroundColor": "#D32F2F",
      "borderColor": "#9A0007",
      "textColor": "#FFFFFF",
      "cssClassName": "asset-geared-booking-block"
    }
  }
]

```

### C. Drag-and-Drop Mutation Dispatch Contract (Output)

The exact model fired when an event block is moved, providing values to the validation layer before committing the state.

```json
{
  "bookingId": 7089,
  "targetAssetId": 102,
  "originalAssetId": 101,
  "newStartTime": "2026-06-16T11:00:00",
  "newEndTime": "2026-06-16T12:30:00",
  "isDragMutation": true
}

```

### D. Bulk Multi-Date Replication Object (Output)

The payload emitted by the clone engine modal, containing target execution dates.

```json
{
  "sourceBookingId": 7089,
  "maintainTimeSlots": true,
  "targetDates": [
    "2026-06-17",
    "2026-06-19",
    "2026-06-20"
  ]
}

```

---

## 10. Summary Verification Checklist for UI Implementation

Ensure the development checklist is fully satisfied during front-end construction:

* [ ] **Standalone Context Verification:** Components compile and run cleanly entirely from mock JSON asset arrays without active server communication.
* [ ] **The "Outlook vs. Social" Check:** High UI proximity, emoji-reaction compatibility containers, and embedded comment tracking frameworks are visually visible.
* [ ] **Micro-Interaction Polish:** Ghost blocks follow drag trails smoothly, snapping instantly to layout boundaries.
* [ ] **Safety Rollback Engine:** Forcing a mock failure returns an event block to its original slot without layout shifting.
* [ ] **Responsive Split Check:** Browser view scaling successfully renders a multi-lane layout at 1080p, and drops down to an elegant day-agenda breakdown on mobile views.
"""

with open("TimeTree_Evolution_UI_Specification.md", "w") as f:
f.write(md_content)

print("File generated successfully.")

```
Your detailed Markdown specification file has been successfully created.

[file-tag: code-generated-file-0-1780232743405175023]

### Highlights of the Generated Specification Document

This specification completely captures your friend's requirements based on the structural breakdown of the text file. It details a modern, standalone Angular architecture designed for asset tracking rather than a basic personal organizer. Key highlights from the text include:

1. [cite_start]**Social & Asset-First Look and Feel:** Replaces generic corporate scheduling layouts with bold, persistent inline color coding linked directly to asset profiles (Cruisers, Geared Bikes, Automatic Scooters) rather than individual users[cite: 130, 232, 233, 234].
2. [cite_start]**Cross-Platform Responsive Adaptation:** Implements a desktop **Split-Screen Dashboard UI layout** (70% main month/resource canvas and a permanent 30% right-hand **Hourly Agenda Lane** to spot gaps easily)[cite: 238, 239, 240, 241]. [cite_start]For mobile devices, it scales down to a unified overlay feed with an expandable vertical feed[cite: 229, 236].
3. [cite_start]**Smart Drag-and-Drop Mutation with Optimistic UI Controls:** Details the exact mouse micro-interactions, layout snapping, a trailing semi-transparent **"Ghost Block"** [cite: 203, 204][cite_start], and real-time **Collision Detection Overlays** [cite: 177, 179] [cite_start](lighting up available slots in green and booked periods in red [cite: 179]). [cite_start]It features client-side state rollback mechanics if validation errors are thrown[cite: 204, 206].
4. [cite_start]**Operational Rules Template Engine (The Weekday vs. Weekend Solution):** Addresses structural design limits by dividing scheduling grids automatically based on pre-defined rule criteria (e.g., auto-formatting 1-hour blocks for weekdays vs. long-distance road trip blocks for weekends, while shading non-operational intervals)[cite: 181, 182, 183, 184].
5. [cite_start]**High-Velocity Data Injection:** Contains implementation patterns for the quick-history **"Long-Press/Right-Click" pop-up** [cite: 224, 226] [cite_start]and the **Multi-Date Clone Engine overlay**[cite: 172, 209]. [cite_start]This lets dispatchers seamlessly select non-contiguous dates to batch-clone entries[cite: 206, 210, 211].
6. [cite_start]**Robust Input/Output JSON Contracts:** Fully defines structural JSON boundaries for input datasets (Asset Fleet Definition arrays, Scheduling Feed events) [cite: 170, 171] [cite_start]and output packages (Drag mutation payloads, multi-date replication contracts) [cite: 212] [cite_start]so that you can confidently develop and run this calendar in full standalone isolation before connecting it to a database later[cite: 185].

