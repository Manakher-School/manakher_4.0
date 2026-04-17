# Round 1 Test Plan - Browser Verification

## Test URL
- **Frontend:** http://localhost:3004
- **PocketBase Admin:** http://127.0.0.1:8090/_/

## Login Credentials
- **Admin:** admin@manakher.edu.jo / Admin123!

## 8 Issues to Verify

### Issue 1: Settings page navigation not working
**Test Steps:**
1. Login as admin
2. Click "Settings" in navigation (5th item in menu)
3. Should navigate to settings page WITHOUT loading issues
4. **Expected:** Settings page loads and displays accordions (Platform Settings, Content Moderation, System Monitoring)

### Issue 2: Title sticking to cards - need gap
**Test Steps:**
1. Go to Admin Dashboard (Overview)
2. Check the "Overview" section heading spacing above the stat cards
3. Same for Teacher Overview and Student Overview
4. **Expected:** Visible gap (mb-6 = 1.5rem) between title and cards below it

### Issue 3: Classes/sections add/update not effective
**Test Steps:**
1. Go to Classes & Sections page
2. Add a new section (e.g., Grade 11, Section C)
3. Should see success alert: "تم إضافة الفصل بنجاح" or "Class added successfully"
4. Edit the same section
5. Should see success alert: "تم تحديث الفصل بنجاح" or "Class updated successfully"
6. **Expected:** Alerts appear confirming the operation

### Issue 4: Exams tab needs table view not cards
**Test Steps:**
1. Go to Subjects & Exams page
2. Click "Exams" tab
3. Create a test exam (or view existing exams)
4. **Expected:** Exams displayed in TABLE format (not cards), with columns: Title, Subject, Section, Date, Time, Type, Actions

### Issue 5: CSV import for students needed
**Test Steps:**
1. Go to Users page
2. Click "Students" tab
3. Should see "Import CSV" button
4. Click it to open import modal
5. **Expected:** Modal shows file upload input with instructions about required CSV columns

### Issue 6: Search icon vertical centering
**Test Steps:**
1. Go to Users page (both Teachers and Students tabs)
2. Look at the search input field
3. Observe the search icon on the left side
4. **Expected:** Search icon is vertically centered inside the input field (not at top)

### Issue 7: Layla student hardcoded in system
**Test Steps:**
1. Go to Users page → Students tab
2. Search for "Layla" or "ليلى"
3. **Expected:** No student named Layla found (only admin-seeded data initially)

### Issue 8: Seed data - admin only
**Test Steps:**
1. Check seed.js or PocketBase Users collection
2. **Expected:** Only 1 admin user in database (admin@manakher.edu.jo)
3. No teacher or student users from seed

---

## Test Execution Checklist

- [ ] Issue 1 - Settings Navigation: PASS / FAIL
- [ ] Issue 2 - Title Gap: PASS / FAIL
- [ ] Issue 3 - Sections Add/Update: PASS / FAIL
- [ ] Issue 4 - Exams Table View: PASS / FAIL
- [ ] Issue 5 - CSV Import: PASS / FAIL
- [ ] Issue 6 - Search Icon Centering: PASS / FAIL
- [ ] Issue 7 - Layla Student: PASS / FAIL
- [ ] Issue 8 - Seed Data Admin Only: PASS / FAIL

---

## Notes
- Test in both Arabic and English locales
- Test on desktop and mobile if possible
- Screenshot any failures for documentation
