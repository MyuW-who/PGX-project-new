# User Profile Integration - Manual Update Guide

## ✅ Completed Files:
1. **patient.html** - ✓ Added userProfile.js script
2. **patient.js** - ✓ Using `initializeUserProfile()`
3. **information.html** - ✓ Added userProfile.js script  
4. **information.js** - ✓ Partially updated (needs settings cleanup)
5. **adminpage.html** - ✓ Added userProfile.js script

## 🔧 Files Still Need Manual Updates:

### 1. **adminpage.js**
Remove lines 15-58 (session management functions) and update DOMContentLoaded:
```javascript
// DELETE these functions (lines ~15-58):
function getCurrentUser() { ... }
function checkAuthentication() { ... }
function updateUserDisplay() { ... }

// REPLACE the DOMContentLoaded (around line 280-290):
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication first
  if (!checkAuthentication()) return;
  
  // Update user display in header
  updateUserDisplay();
  
  // Load users if authenticated
  loadUsers();
});

// WITH:
document.addEventListener('DOMContentLoaded', () => {
  // Initialize user profile (from userProfile.js)
  if (!initializeUserProfile()) return;
  
  // Load users if authenticated
  loadUsers();
});
```

Also REMOVE settings popup handlers (lines ~272-340) - already in userProfile.js

### 2. **dashboard1.html**
Add userProfile.js script before dashboard.js:
```html
<script src="./js/userProfile.js"></script>
<script src="./js/dashboard.js"></script>
<script src="./js/darkmode.js"></script>
```

### 3. **dashboard.js**
REMOVE lines 10-90 (session functions):
```javascript
// DELETE:
const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
const settingsPopup = document.getElementById('settingsPopup');
... all the settings elements ...
function getCurrentUser() { ... }
function checkAuthentication() { ... }
function updateUserDisplay() { ... }
```

REMOVE the settings handlers (lines ~155-200)

UPDATE the initialization at bottom (around line 670-710):
```javascript
// REPLACE:
window.addEventListener('DOMContentLoaded', () => {
  if (!checkAuthentication()) return;
  updateUserDisplay();
  ... settings load ...
});

// WITH:
window.addEventListener('DOMContentLoaded', () => {
  // Initialize user profile (from userProfile.js)
  if (!initializeUserProfile()) return;
});
```

REMOVE logout and dropdown handlers (lines ~92-145) - already in userProfile.js

### 4. **information.js**  
REMOVE settings popup handlers completely (lines ~152-225)

### 5. **patient.js**
REMOVE the remaining settings handlers if any still exist (lines ~270-344)

## 📋 Summary of Changes:

Each page now only needs to:
1. Include `<script src="./js/userProfile.js"></script>` BEFORE their own script
2. Call `initializeUserProfile()` in their DOMContentLoaded
3. Remove all duplicate session/dropdown/settings code

The userProfile.js handles:
- ✓ getCurrentUser()
- ✓ checkAuthentication()  
- ✓ updateUserDisplay()
- ✓ Dropdown menu toggle
- ✓ Logout with confirmation
- ✓ Settings popup (open/close/save)
- ✓ Load saved settings

## 🚀 Quick Test:
After updates, each page should:
1. Show username in dropdown: "👤 username (role) ▼"
2. Dropdown works on click
3. Settings button opens popup
4. Logout asks for confirmation
5. Settings save and apply theme immediately
