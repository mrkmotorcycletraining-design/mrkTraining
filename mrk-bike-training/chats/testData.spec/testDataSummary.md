Let me start by reading the existing code to understand the current structure.

I'll gather the essential files you need. Let me read all the specified files in parallel.

Now let me check for any header/navbar components:

Perfect! I've successfully gathered all the requested files. Let me provide you with a comprehensive summary:

Now I have a full picture. Let me also check the quick-menu component to understand the right-click context menu:

Now I have everything I need. Let me plan and implement all the changes:

1. **Create a `ScheduleDataService`** - with separate read/append/update/delete methods (replaceable with APIs)
2. **Update `app.html`** - Remove old header content, add new navbar with logo "MRK Bike Training" (blue), menu items, collapsible on small screens, icon-style dark mode toggle
3. **Update `app.ts`** - Wire up the data service, handle context menu for add/edit/delete
4. **Update `app.scss`** - New navbar styles, blue branding
5. **Update `testData.json`** - Keep as the data source

Let me start implementing:

Now update `app.ts` to use the service and wire up the new context-menu logic:

Now update `app.html` with the new navbar and single calendar instance:

Now update `app.scss` with the new blue-branded navbar styles:

Now let's verify the build compiles cleanly:

No errors. Let me also check the app.scss for any issues and verify the quick-menu component still works correctly with the calendar's existing right-click flow. Let me also check if there's anything in the week-view or month-view that handles right-click to understand how "Add New Schedule" on right-click of empty slot and edit/delete on existing event should be wired:

The existing calendar already has a right-click quick-menu for empty slots (via `onGridCellRightClick`) and edit/delete via the hourly agenda panel. The calendar component already handles these flows internally. 

Now I need to understand what "test component" means in context — the user wants the `app` component itself to act as the test harness that uses the calendar component, with right-click "Add New Schedule" on empty slots and right-click "Edit/Delete" on existing events. The calendar's internal quick-menu already handles the empty-slot right-click. For existing events, I need to add a right-click context menu on event blocks.

Let me check the week-view HTML to see how events are rendered:

I can see the event blocks in week-view don't have a `contextmenu` handler. I need to add right-click support on event blocks to show an "Edit / Delete" context menu. I'll add this to the week-view component and wire it through the calendar state service. Let me add a right-click handler on event nodes:

Now add the `onEventRightClick` method to the week-view component and add an `eventContextMenu` output:

Now add the `onEventRightClick` method to the week-view component:

Now wire the `eventContextMenu` output through the calendar component. Update `calendar.html` to listen to it:

Now add the `eventContextMenu` output and handler to the calendar component, and add a new `eventContextMenu` signal to the state service:

Now add the `onEventContextMenu` handler method to the calendar component:

Now update `app.html` to listen to `eventContextMenuRequest` and show the event context menu, and also add the context menu overlay:

Now update `app.ts` to handle the context menu for events (edit/delete) and wire it to the data service. I also need to add the `onEventContextMenuRequest`, `onContextEdit`, `onContextDelete`, and `closeContextMenu` methods:

Now add the context menu handler methods and remove the old `@HostListener`:

Now remove the unused `HostListener` import and `contextMenu` signal from app.ts, and clean up the imports:

Also remove the unused `computed` import since we don't use it:

Now add the context menu styles to `app.scss`:

Now run diagnostics to check everything compiles:

All clean. Let me also check the month-view to add right-click on events there too for consistency:

I'll add right-click on event strips in the month view too. Add an `eventContextMenu` output to month-view:

Add `contextmenu` handler to month-view event strips in the HTML:

Now wire the month-view `eventContextMenu` output through the calendar component:

Now run diagnostics on all changed files:

All clean. Let me do a final review of the key files to make sure everything looks right:

I notice `pendingEditEventId` is set but not actually used to trigger the edit form in the calendar. The cleanest approach is to have the calendar accept an `editEventId` input that, when set, opens the booking form. Let me wire that up properly:

Now wire `editEventId` in `app.html` and clear it after the booking form saves:

All clean. Here's a summary of everything that was done:

---

**What changed:**

**New file — `src/app/services/schedule-data.service.ts`**
A dedicated data service with four clearly separated methods:
- `readAll()` — fetch all schedules (replace with `GET /api/schedules`)
- `append(payload)` — add a new schedule (replace with `POST /api/schedules`)
- `update(id, changes)` — modify an existing schedule (replace with `PUT /api/schedules/:id`)
- `delete(id)` — remove a schedule (replace with `DELETE /api/schedules/:id`)

The service seeds from `testData.json` data on init and exposes a reactive `events` signal.

**`app.ts`** — Refactored to use `ScheduleDataService` for all CRUD. All event mutations now go through the service methods.

**`app.html`** — Completely replaced the old header:
- Logo: 🏍️ **MRK Bike Training** in blue
- Removed: TimeTree, Resource Engine badge, Dispatcher/Trainer tabs, Overlap Collision toggle
- Added: collapsible navbar with Item 1–5 menu links (hamburger on mobile)
- Dark mode toggle is now an icon button (moon/sun SVG), no text label
- Right-click on existing events shows a context menu with **Edit Schedule** and **Delete Schedule**
- Right-click on empty calendar slots still shows the existing **Add New Schedule** quick-menu (unchanged calendar behavior)

**`app.scss`** — New blue navbar (`#1565C0`), dark mode variant (`#0D1B3E`), hamburger animation, collapsible menu at ≤768px, and context menu styles.

**`calendar.ts`** — Added `editEventId` input setter that opens the booking form for a given event id, and `eventContextMenuRequest` output.

**`week-view.ts` / `week-view.html`** — Added `contextmenu` handler on event blocks, emits `eventContextMenu` output.

**`month-view.ts` / `month-view.html`** — Same right-click support on event strips.