# Two-Step Confirmation Workflow

## Overview
The PGx application requires **two different pharmacists** to confirm each test request PDF before it can be marked as complete. This ensures quality control and prevents errors in patient pharmacogenomics reports.

## Business Rules

### Confirmation Flow
1. **Initial State**: When a PDF is uploaded, status = `"need 2 confirmation"`
2. **First Confirmation**: After first pharmacist confirms, status = `"need 1 confirmation"`
3. **Complete**: After second pharmacist confirms, status = `"done"`
4. **Rejection**: If any pharmacist rejects, status = `"reject"` (workflow stops)

### Key Constraints
- ✅ Two different users must confirm (same user **cannot** confirm twice)
- ✅ First confirmer is tracked in `confirmed_by_1`
- ✅ Second confirmer is tracked in `confirmed_by_2`
- ✅ Rejection requires a reason (stored in `rejection_reason`)
- ✅ Rejection can happen at any stage (before first, after first confirmation)

## Database Schema

### New Fields in `test_request` Table
```sql
confirmed_by_1         UUID (FK → system_users.user_id)
confirmed_at_1         TIMESTAMP WITH TIME ZONE
confirmed_by_2         UUID (FK → system_users.user_id)
confirmed_at_2         TIMESTAMP WITH TIME ZONE
rejected_by            UUID (FK → system_users.user_id)
rejected_at            TIMESTAMP WITH TIME ZONE
rejection_reason       TEXT
```

### Migration
Run the SQL migration file:
```bash
psql -d your_database < rulebase/confirmation_workflow_migration.sql
```
Or apply via Supabase dashboard → SQL Editor

## Frontend Implementation

### Files Modified
1. **view/Role_pharmacy/js/verify_pharmacy.js**
   - Fetches test request with confirmation status
   - Displays stepper showing progress (0/2, 1/2, 2/2 confirmations)
   - Handles confirm/reject button clicks
   - Prevents duplicate confirmations (disables button if user already confirmed)

2. **controllers/testRequestController.js**
   - `confirmTestRequest(requestId, userId)`: Validates and records confirmation
   - `rejectTestRequest(requestId, userId, reason)`: Records rejection

3. **main.js** & **preload.js**
   - Added IPC handlers: `confirm-test-request`, `reject-test-request`
   - Exposed as: `window.electronAPI.confirmTestRequest()`, `window.electronAPI.rejectTestRequest()`

## Usage Flow

### Pharmacy Verification Page
1. Pharmacist opens `verify_pharmacy.html` from information page
2. Page loads PDF and displays current confirmation status
3. Stepper shows progress:
   - Step 1: First confirmation (active when confirmed_by_1 exists)
   - Step 2: Second confirmation (active when confirmed_by_2 exists)

### Confirmation Button
- **Enabled**: User hasn't confirmed yet AND status isn't 'done' or 'reject'
- **Disabled**: User already confirmed OR request is complete/rejected
- **Click action**:
  1. Shows SweetAlert confirmation dialog with patient details
  2. Calls `window.electronAPI.confirmTestRequest(request_id, user_id)`
  3. Backend checks if user already confirmed (returns error if duplicate)
  4. Updates `confirmed_by_1` or `confirmed_by_2` based on current state
  5. Updates status: `need 2 confirmation` → `need 1 confirmation` → `done`
  6. Navigates back to information page

### Rejection Button
- **Click action**:
  1. Shows SweetAlert with textarea for rejection reason
  2. Calls `window.electronAPI.rejectTestRequest(request_id, user_id, reason)`
  3. Backend updates status to 'reject' and stores reason
  4. Records who rejected and when
  5. Navigates back to information page

## Status Display Logic

### Subtitle Text
- `"เจ้าหน้าที่ 0 / 2 กำลังตรวจสอบไฟล์ PDF"` - No confirmations
- `"เจ้าหน้าที่ 1 / 2 ยืนยันแล้ว"` - One confirmation
- `"เอกสารได้รับการยืนยันแล้ว"` - Complete (2 confirmations)
- `"เอกสารถูกปฏิเสธ"` - Rejected

### Stepper Status
- `"รอการยืนยันจาก 2 คน"` - Initial state
- `"รอการยืนยันจากอีก 1 คน"` - After first confirmation
- `"คุณยืนยันแล้ว - รอผู้อื่นยืนยัน"` - Current user already confirmed
- `"เสร็จสมบูรณ์ - ยืนยันครบ 2 คน"` - Complete
- `"ถูกปฏิเสธ"` - Rejected

## API Reference

### `confirmTestRequest(requestId, userId)`
**Location**: `controllers/testRequestController.js`

**Purpose**: Records user confirmation and updates status

**Parameters**:
- `requestId` (string): Test request ID
- `userId` (string): User ID from session

**Returns**:
```javascript
{
  success: true,
  message: 'ยืนยันสำเร็จ! รอผู้อื่นยืนยันอีก 1 คน' // or 'ยืนยันสำเร็จ! สถานะเปลี่ยนเป็น Done'
}
// OR
{
  success: false,
  message: 'คุณได้ยืนยันเอกสารนี้ไปแล้ว'
}
```

**Database Operations**:
1. Fetch current request
2. Check if user already in `confirmed_by_1` or `confirmed_by_2`
3. If not confirmed: assign to available slot and update timestamp
4. Update status based on confirmation count

### `rejectTestRequest(requestId, userId, reason)`
**Location**: `controllers/testRequestController.js`

**Purpose**: Records rejection and stops workflow

**Parameters**:
- `requestId` (string): Test request ID
- `userId` (string): User ID from session
- `reason` (string): Rejection reason (required)

**Returns**:
```javascript
{
  success: true,
  message: 'ปฏิเสธเอกสารสำเร็จ'
}
```

**Database Operations**:
1. Update status to 'reject'
2. Store `rejected_by`, `rejected_at`, `rejection_reason`

## Testing Checklist

- [ ] Two different users can confirm same request
- [ ] Same user gets error when trying to confirm twice
- [ ] Status changes: need 2 confirmation → need 1 confirmation → done
- [ ] Stepper updates correctly (step 1 active, step 2 active)
- [ ] Confirm button disabled after user confirms
- [ ] Confirm button disabled when status = done or reject
- [ ] Rejection sets status to reject and stores reason
- [ ] Rejection can happen at any stage (0, 1, or 2 confirmations)
- [ ] Navigation back to information page works after confirm/reject

## Future Enhancements

### Potential Improvements
1. **Display Confirmer Names**: Show username of who confirmed instead of just count
   - Query `system_users` table using `confirmed_by_1` and `confirmed_by_2`
   - Display in stepper: "ยืนยันโดย: John Doe"

2. **Notification System**: Alert second pharmacist when first confirmation done
   - Add notification table
   - Show badge in navigation menu

3. **Audit Trail**: Complete history of all confirmation attempts
   - Already exists in `audit_logs` table (if enabled)
   - Can query for complete history

4. **Role-Based Confirmation**: Require specific roles (e.g., senior pharmacist + junior)
   - Add role check in `confirmTestRequest()`
   - Restrict who can be first/second confirmer

## Troubleshooting

### Issue: "คุณได้ยืนยันเอกสารนี้ไปแล้ว"
**Cause**: User trying to confirm twice
**Solution**: This is expected behavior - same user cannot confirm twice

### Issue: Confirm button always disabled
**Cause**: User's user_id not found in session
**Solution**: Check `sessionStorage.getItem('currentUser')` contains valid user_id

### Issue: Status not updating in information page
**Cause**: Cache or page not refreshing
**Solution**: Ensure information page re-fetches data on load (not cached)

### Issue: Database constraint error on confirmation
**Cause**: `confirmed_by_1` and `confirmed_by_2` are the same
**Solution**: This should be prevented by frontend, but check database constraint:
```sql
SELECT * FROM test_request WHERE confirmed_by_1 = confirmed_by_2;
```

## Related Files
- `view/Role_pharmacy/js/verify_pharmacy.js` - Frontend logic
- `view/Role_pharmacy/verify_pharmacy.html` - UI template
- `controllers/testRequestController.js` - Backend API
- `main.js` - IPC handlers
- `preload.js` - IPC bridge
- `rulebase/confirmation_workflow_migration.sql` - Database migration
