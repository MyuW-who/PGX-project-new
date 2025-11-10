# User Profile Management

## Overview
The profile page allows users to update their personal information (first name, last name) and manage their digital signature for document verification.

## Features

### 1. Personal Information
- **Edit First Name & Last Name**: Users can update their display names
- **Real-time validation**: Form validates required fields
- **Auto-save to session**: Updates are reflected immediately in the UI
- **Audit logging**: All profile changes are tracked in audit logs

### 2. Digital Signature Management
- **Upload Signature**: Upload signature images (JPG, PNG, GIF)
- **File Validation**: 
  - Maximum size: 2MB
  - Supported formats: image/* (JPG, PNG, GIF, etc.)
- **Preview**: Display signature before saving
- **Delete**: Remove signature with confirmation
- **Storage**: Signatures stored in Supabase Storage (`Image_Bucket/signatures/`)

### 3. Account Information Display
- Username (read-only)
- Role with Thai label (medtech, pharmacist, admin)
- Hospital ID
- Account creation date

## Database Schema

### New Fields in `system_users` Table
```sql
first_name      VARCHAR(100)  -- User's first name
last_name       VARCHAR(100)  -- User's last name
signature_url   TEXT          -- URL to signature in Supabase Storage
```

### Migration
Run the SQL migration:
```bash
psql -d your_database < rulebase/user_profile_migration.sql
```
Or apply via Supabase dashboard → SQL Editor

## File Structure

### Frontend
- `view/Role_medtech/profile_medtech.html` - Profile page UI
- `view/Role_medtech/js/profile_medtech.js` - Client-side logic
- `view/Role_medtech/css/profile_medtech.css` - Styling

### Backend
- `controllers/userProfileController.js` - Profile management functions
  - `getUserProfile(userId)` - Fetch user profile
  - `updateUserProfile(userId, profileData)` - Update profile fields
  - `uploadSignature(userId, fileBuffer, fileName)` - Upload signature to storage
  - `deleteSignature(signatureUrl)` - Remove signature from storage

### IPC Layer
- `main.js` - IPC handlers for profile operations
- `preload.js` - Bridge exposing functions to renderer

## Usage Flow

### Editing Name
1. User opens profile page
2. Profile data loads from database
3. User edits first_name and/or last_name
4. Clicks "บันทึกการเปลี่ยนแปลง" (Save Changes)
5. Data updates in database
6. Session storage updates
7. UI reflects changes immediately
8. Audit log records the change

### Uploading Signature
1. User clicks "อัปโหลดลายเซ็น" (Upload Signature)
2. File picker opens
3. User selects image file
4. Validation checks:
   - File type (must be image)
   - File size (max 2MB)
5. File uploads to Supabase Storage
6. Public URL generated
7. Profile updates with signature_url
8. Preview displays signature

### Deleting Signature
1. User clicks "ลบลายเซ็น" (Delete Signature) - only visible when signature exists
2. Confirmation dialog appears
3. If confirmed:
   - File deleted from Supabase Storage
   - signature_url set to NULL in database
   - Preview returns to placeholder state

## API Reference

### `getUserProfile(userId)`
**Purpose**: Retrieve full user profile including signature

**Returns**:
```javascript
{
  success: true,
  data: {
    user_id: 1,
    username: 'admin1',
    role: 'medtech',
    hospital_id: 'H001',
    first_name: 'Admin',
    last_name: 'MedTech',
    signature_url: 'https://...supabase.co/storage/v1/object/public/Image_Bucket/signatures/1_1699123456.png',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T10:30:00Z'
  }
}
```

### `updateUserProfile(userId, profileData)`
**Purpose**: Update user profile fields

**Parameters**:
```javascript
{
  first_name: 'John',      // Optional
  last_name: 'Doe',        // Optional
  signature_url: 'https://...' // Optional
}
```

**Returns**:
```javascript
{
  success: true,
  message: 'อัปเดตโปรไฟล์สำเร็จ!',
  data: { /* updated user object */ }
}
```

### `uploadSignature(userId, fileBuffer, fileName)`
**Purpose**: Upload signature image to Supabase Storage

**Parameters**:
- `userId` (number): User ID
- `fileBuffer` (Buffer): File data as buffer
- `fileName` (string): Original filename

**Returns**:
```javascript
{
  success: true,
  message: 'อัปโหลดลายเซ็นสำเร็จ!',
  url: 'https://...supabase.co/storage/v1/object/public/Image_Bucket/signatures/1_1699123456.png',
  path: 'signatures/1_1699123456.png'
}
```

### `deleteSignature(signatureUrl)`
**Purpose**: Delete signature from Supabase Storage

**Parameters**:
- `signatureUrl` (string): Full URL of signature

**Returns**:
```javascript
{
  success: true,
  message: 'ลบลายเซ็นสำเร็จ!'
}
```

## Storage Configuration

### Supabase Storage Bucket
- **Bucket Name**: `Image_Bucket`
- **Folder**: `signatures/`
- **File Naming**: `{userId}_{timestamp}.{extension}`
- **Access**: Public (via getPublicUrl)

### Security Considerations
1. Files named with user_id to prevent conflicts
2. Timestamp prevents caching issues
3. Public bucket allows direct URL access
4. Old signatures NOT automatically deleted (manual cleanup recommended)

## Error Handling

### Common Errors
1. **"ไม่พบข้อมูลผู้ใช้"**: Session expired, redirect to login
2. **"ขนาดไฟล์ต้องไม่เกิน 2MB"**: File too large
3. **"กรุณาเลือกไฟล์รูปภาพเท่านั้น"**: Invalid file type
4. **Storage upload fails**: Check Supabase bucket permissions

### Debugging
- Check browser console for errors
- Verify Supabase bucket exists and is public
- Check IPC communication in main process logs
- Validate session storage contains currentUser

## Future Enhancements

### Potential Improvements
1. **Image Cropping**: Allow users to crop signature before upload
2. **Draw Signature**: Built-in canvas for drawing signatures
3. **Multiple Signatures**: Support different signature types (initial, full)
4. **Compression**: Auto-compress images before upload
5. **Storage Cleanup**: Automatically delete old signatures when uploading new ones
6. **Preview Before Save**: Show preview before confirming upload

## Related Files
- `controllers/userProfileController.js` - Backend logic
- `view/Role_medtech/profile_medtech.html` - UI template
- `view/Role_medtech/js/profile_medtech.js` - Frontend logic
- `view/Role_medtech/css/profile_medtech.css` - Styling
- `main.js` - IPC handlers
- `preload.js` - IPC bridge
- `rulebase/user_profile_migration.sql` - Database migration
