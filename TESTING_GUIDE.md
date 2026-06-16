# Testing Guide - JWT & Admin Navigation Refactoring

## Summary of Changes

### Frontend Changes ✅
1. **AuthService**: Token now persists to localStorage - survives page refresh
2. **Admin Navigation**: Single unified sidebar replacing two conflicting navbars
3. **Trainer Management**: New components for managing trainers (list, add, edit, delete, deactivate)
4. **JWT Auth**: All API calls through HttpClient with automatic JWT header injection

### Backend Changes ✅
1. **TrainerController**: Added delete, deactivate, reset-password endpoints
2. **TrainerService**: Added corresponding service methods
3. **All trainer endpoints**: Protected with //    @PreAuthorize for ADMIN/SUPER_ADMIN roles

---

## Testing Checklist

### 1. JWT Token Persistence
- [ ] Start the app, login with "rohan"/"<password>"
- [ ] Verify you can see the schedule page
- [ ] **Refresh the browser (F5)** - Should still be logged in
- [ ] Check DevTools > Application > localStorage - should see `auth_token` key
- [ ] Try making API calls - Authorization header should be present

### 2. Login & Redirection
- [ ] Logout, then try to access `/admin` - should redirect to login
- [ ] Login as CLIENT - should redirect to `/client`
- [ ] Login as TRAINER - should redirect to `/trainer`
- [ ] Login as ADMIN/SUPER_ADMIN - should redirect to `/admin`

### 3. Admin Navigation
- [ ] Navigate to `/admin` (as SUPER_ADMIN/ADMIN)
- [ ] **Verify single sidebar with:**
  - ✓ Schedule
  - ✓ Client (with submenu: View Clients, Add Client)
  - ✓ Trainer (with submenu: View Trainers, Add Trainer)
  - ✓ Admin
  - ✓ Pending Approvals (with badge if pending)
  - ✓ Logout button
- [ ] NO duplicate top navbar (Branch, Vehicle, etc.)

### 4. Client Management
- [ ] Click "Client" → "View Clients" - should list all clients
- [ ] Click "Add Client" - should show add form
- [ ] Try adding a test client
- [ ] Click on a client - should show detail page with:
  - ✓ Name, Email, Unique ID (read-only)
  - ✓ Update Trainings Allowance
  - ✓ Deactivate button
  - ✓ Reset Password form

### 5. Trainer Management (NEW)
- [ ] Click "Trainer" → "View Trainers" - should list all trainers
- [ ] Verify trainer table shows: Name, Email, Active status, Branch
- [ ] Click "Add Trainer" - should show form with:
  - ✓ Name *
  - ✓ Email/Username *
  - ✓ Password *
  - ✓ Default Branch (optional)
  - ✓ Active checkbox
- [ ] Try adding a test trainer
- [ ] Click on a trainer - should show detail page with:
  - ✓ Basic info (read-only)
  - ✓ Status management
  - ✓ Reset Password form
  - ✓ Delete button

### 6. API Calls with JWT
Monitor Network tab in DevTools:
- [ ] **Every API request** (except /api/auth/login) should have:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
  ```
- [ ] Login request (`/api/auth/login`): NO Authorization header
- [ ] All protected requests to `/api/branches`, `/api/clients`, `/api/trainers`: WITH header
- [ ] Refresh page - Authorization header still present on next request

### 7. Pending Approvals
- [ ] If there are pending enrollments, "Pending Approvals" shows red badge ●
- [ ] Click to view pending list
- [ ] Can select trainer and asset from dropdowns
- [ ] Can approve or reject

### 8. Admin
- [ ] Click "Admin"
- [ ] Should show:
  - ✓ Branches (add new branch form)
  - ✓ Assets/Vehicles list
  - ✓ Courses list (with image upload)
- [ ] Can add a new branch
- [ ] Can set asset to maintenance
- [ ] Can upload course image

### 9. Error Handling
- [ ] Try adding duplicate client username - should show error
- [ ] Try adding trainer with blank password - should show error
- [ ] Try accessing `/admin` without login - should redirect to `/login`
- [ ] Make invalid API call - error message should display

### 10. Responsive Design
- [ ] Resize browser to mobile (< 768px)
- [ ] Sidebar should adapt (hamburger menu or stack)
- [ ] Forms should be readable
- [ ] Tables should remain usable

---

## Quick Test Commands

### Test JWT Token:
```bash
# 1. Open DevTools Console and check:
localStorage.getItem('auth_token')
# Should return: "eyJhbGciOiJIUzI1NiJ9..."

# 2. Check token in requests:
# Open Network tab > Filter for "api" > Click any request
# Headers tab > Authorization: Bearer ...
```

### Test Backend Endpoints (curl):
```bash
# Get JWT token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailUsername":"rohan","password":"<password>"}' | jq -r '.token')

# Test trainer endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/trainers
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/trainers/1
```

---

## Known Limitations / Future Work

1. **Ledger & Metrics removed** - not in current requirements
2. **Trainer Availability/Absence** - endpoints exist but UI not fully integrated
3. **Create Trainer validation** - assumes backend request object is compatible
4. **Profile picture uploads** - not yet implemented on forms

---

## Troubleshooting

### 403 Error on API calls:
- [ ] Check if token is in localStorage: `localStorage.getItem('auth_token')`
- [ ] Check if Authorization header is present in Network tab
- [ ] Verify token is not expired
- [ ] Check backend //    @PreAuthorize role requirements match user role

### Token lost after refresh:
- [ ] Verify localStorage persistence is working
- [ ] Check browser console for errors
- [ ] Clear browser cache and try again

### Trainer management not working:
- [ ] Verify backend was rebuilt with new TrainerController/Service
- [ ] Check trainer endpoints are accessible: `curl http://localhost:8080/api/trainers`
- [ ] Verify user has ADMIN or SUPER_ADMIN role

---

## Files Modified

### Frontend:
- `src/app/auth/auth.service.ts` - Added localStorage persistence
- `src/app/admin/admin-shell.component.ts` - New unified navigation
- `src/app/admin/admin.routes.ts` - Updated routes
- `src/app/admin/trainer-management.component.ts` - NEW
- `src/app/admin/trainer-detail.component.ts` - NEW
- `src/app/admin/trainer-add.component.ts` - NEW
- `src/app/core/services/training-api.service.ts` - Added trainer methods

### Backend:
- `src/main/java/com/mrk/training/web/controller/TrainerController.java` - Added endpoints
- `src/main/java/com/mrk/training/service/TrainerService.java` - Added methods
