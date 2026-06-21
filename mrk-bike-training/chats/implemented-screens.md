# Screens Implemented in This Session

## New Components Created

1. **Client Actions** (`admin/client-actions.component.ts`)
   - Route: `/admin/clients?action=deactivate|delete|update-password|mark-absent|pause-training`
   - Handles: Deactivate client, Delete client, Reset password, Mark absent, Pause training

2. **Trainer Actions** (`admin/trainer-actions.component.ts`)
   - Route: `/admin/trainers?action=deactivate|delete|update-password|switch-branch|mark-absence`
   - Handles: Deactivate trainer, Delete trainer, Reset password, Switch branch, Mark absence

3. **Course Management** (`admin/course-management.component.ts`)
   - Route: `/admin/courses?action=deactivate|delete`
   - Handles: Deactivate training, Delete training

4. **Vehicle Management** (`admin/vehicle-management.component.ts`)
   - Route: `/admin/vehicles-manage?action=deactivate|delete|maintenance|switch-branch`
   - Handles: Deactivate vehicle, Delete vehicle, Set maintenance, Switch vehicle branch

## Updated Components

5. **Client Management** (`admin/client-management.component.ts`)
   - Now detects `?action=` query param and renders `ClientActionsComponent` when present
   - Otherwise shows the existing client list grid

6. **Trainer Management** (`admin/trainer-management.component.ts`)
   - Now detects `?action=` query param and renders `TrainerActionsComponent` when present
   - Otherwise shows the existing trainer list grid

7. **Navbar** (`core/components/app-navbar/app-navbar.component.ts`)
   - Vehicle action links updated from `/admin/site?tab=vehicles&action=...` to `/admin/vehicles-manage?action=...`

## New Routes Added (admin.routes.ts)

- `/admin/courses` → CourseManagementComponent (deactivate/delete training)
- `/admin/courses-template` → SiteManagementComponent (existing template management)
- `/admin/vehicles-manage` → VehicleManagementComponent (vehicle actions)

## API Service Methods Added (training-api.service.ts)

- `deleteClient(id)` — DELETE `/api/clients/:id`
- `deactivateCourse(id)` — PUT `/api/courses/:id/deactivate`
- `deleteCourse(id)` — DELETE `/api/courses/:id`
- `deactivateVehicle(id)` — PUT `/api/vehicles/:id/deactivate`
- `deleteVehicle(id)` — DELETE `/api/vehicles/:id`
- `switchVehicleBranch(id, branchId)` — PUT `/api/vehicles/:id/switch-branch`
- `switchTrainerBranch(id, branchId)` — PUT `/api/trainers/:id/switch-branch`

## Design Pattern

All action screens follow the same pattern:
- Wrapped in `<app-form-bg-template>` (blue gradient background)
- Angular Material form fields with `appearance="outline"`
- White-on-blue CSS overrides
- Dropdown to select entity → info card displayed → action button + cancel
- Signal-based loading/error/success states
- Confirmation dialog before destructive actions
