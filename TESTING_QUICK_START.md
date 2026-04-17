# Quick Start Guide - Browser Testing

**Time to complete:** ~15-20 minutes

---

## Step 1: Ensure Servers Are Running

```bash
# Terminal 1 - Backend
cd /home/hussam/my_work/coding_stuff/manakher_4.0/backend
./pocketbase serve

# Terminal 2 - Frontend
cd /home/hussam/my_work/coding_stuff/manakher_4.0/frontend
npm run dev
```

Wait for:
- Backend: "Server started at: http://127.0.0.1:8090"
- Frontend: "Local: http://localhost:3000"

---

## Step 2: Login to Admin

1. Open browser to: **http://localhost:3000/ar/dashboard/admin**
2. On login page, enter:
   - Email: `admin@school.edu`
   - Password: `Admin@12345`
3. Click "Sign in"

---

## Step 3: Test Each Fix (In Order)

### Fix 1: Title Spacing (2 min)
- [ ] View: http://localhost:3000/ar/dashboard/admin
  - **Check:** Gap between "نظرة عامة" title and 4 stat cards below (should be visible)
- [ ] View: http://localhost:3000/ar/dashboard/teacher (login as teacher first)
  - **Check:** Same spacing exists
- [ ] View: http://localhost:3000/ar/dashboard/student (login as student first)
  - **Check:** Same spacing exists

### Fix 2: Grade Order = 0 (2 min)
- [ ] Go to: http://localhost:3000/ar/dashboard/admin/sections
- [ ] Find "Grade Order" input field in the section creation form
- [ ] Type: `0`
- [ ] **Check:** No error, value accepted

### Fix 3: Exams Table (2 min)
- [ ] Go to: http://localhost:3000/ar/dashboard/admin/subjects_exams
- [ ] Click "Exams" tab
- [ ] Look at any exam card
- [ ] **Check:** You can see all these pieces of information:
  - Title (exam name)
  - Subject (small gray text)
  - Section (small gray text)
  - Date (with calendar icon)
  - Time (with clock icon, shows "start - end")
  - Type badge (midterm/final/etc)
  - Edit and Delete buttons

### Fix 4: Centered Search (2 min)
- [ ] Go to: http://localhost:3000/ar/dashboard/admin/users
- [ ] **Check Teachers tab:**
  - Search box is centered horizontally on page (not on the left)
  - "Add Teacher" button is next to it
- [ ] **Check Students tab:**
  - Same centered layout
  - Try typing a name to verify search works

### Fix 5: Teacher Label Colors (2 min)
- [ ] Stay on Teachers tab
- [ ] Look at any teacher card that has sections
- [ ] **Check:** Section labels below teacher name show:
  - White text (not blue)
  - On a light blue background
  - Example: "الشعبة أ" in white on blue background

### Fix 6: CSV Import (2 min)
- [ ] Click "Students" tab
- [ ] Look for button bar with "Add Student" button
- [ ] **Check:** An "Import CSV" button exists next to "Add Student"
- [ ] Click "Import CSV"
- [ ] **Check:** A dialog opens with:
  - Title: "Import Students from CSV"
  - Instructions about CSV format
  - File upload input
  - Cancel and Import buttons

### Fix 7: Layla vs Ahmed (2 min)
- [ ] Stay on Students tab
- [ ] In search box, type: `Layla`
- [ ] **Check:** No results (Layla should NOT exist)
- [ ] Clear search, type: `Ahmed`
- [ ] **Check:** Results show at least one "Ahmed" student

---

## Step 4: Mark Results

Count how many fixes are working:

| Fix | Status |
|-----|--------|
| 1. Title spacing | ☐ PASS ☐ FAIL |
| 2. Grade Order = 0 | ☐ PASS ☐ FAIL |
| 3. Exams columns | ☐ PASS ☐ FAIL |
| 4. Centered search | ☐ PASS ☐ FAIL |
| 5. Teacher colors | ☐ PASS ☐ FAIL |
| 6. CSV import | ☐ PASS ☐ FAIL |
| 7. Layla/Ahmed | ☐ PASS ☐ FAIL |

**Expected:** All 7 should be PASS ✅

---

## Troubleshooting

### "Connection refused" at localhost:3000
- Frontend server not running. Check Terminal 2. Run: `npm run dev`

### "Connection refused" at http://127.0.0.1:8090
- Backend server not running. Check Terminal 1. Run: `./pocketbase serve`

### Login fails with "Invalid credentials"
- Check email/password spelling (case-sensitive)
- Email: `admin@school.edu` (exact)
- Password: `Admin@12345` (exact)

### No search results when looking for students
- The search might be case-sensitive or you might be on wrong tab
- Make sure you're on "Students" tab, not "Teachers"
- Try searching just for "Ahmed" (first name)

---

## Optional: Test in English

Repeat all steps but use `/en/` URLs instead of `/ar/`:

Example: `http://localhost:3000/en/dashboard/admin/users`

All fixes should work identically in both languages.

---

## For Browser Recording (User Demonstration)

1. Open OBS, Loom, or browser DevTools screen recording
2. Record your screen
3. Follow the testing steps above
4. Navigate through each fix, explaining what you see
5. Stop recording
6. Share with team

---

## Document References

For more details, see:
- **Main guide:** BROWSER_TEST_PLAN.md
- **Code details:** FIX_IMPLEMENTATION_DETAILS.md
- **All credentials:** See BROWSER_TEST_PLAN.md under "Test Credentials"

