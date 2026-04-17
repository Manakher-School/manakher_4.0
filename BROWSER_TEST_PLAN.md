# Comprehensive Browser Test Plan - Fix Verification

## Overview
This test plan verifies 7 fixes that were implemented in the latest development cycle. You will navigate through the admin, teacher, and student dashboards to visually confirm each fix is working correctly.

**Prerequisites:**
- Backend: PocketBase running at http://127.0.0.1:8090
- Frontend: Next.js running at http://localhost:3000
- Logged in as Admin user: `admin@school.edu` / `Admin@12345`

---

## Fix 1: Gap between title and stat cards (mb-6 spacing)

### What to verify:
The "Overview" title should have proper spacing (mb-6 = 24px) between it and the stat cards below it on all three overview pages.

### Test Steps:

#### Admin Overview:
1. Navigate to: **http://localhost:3000/ar/dashboard/admin** (or `/en/dashboard/admin` for English)
2. Look for the heading "نظرة عامة" / "Overview" at the top of the page
3. **Verify:** There is a clear 24px gap between the title and the stat cards (4 blue/green/pink/yellow cards below)
4. The spacing should feel intentional and not cramped

#### Teacher Overview:
1. Log out and login as teacher: `teacher@school.edu` / `Teacher@12345`
2. Navigate to: **http://localhost:3000/ar/dashboard/teacher** (or `/en/dashboard/teacher`)
3. Look for the heading "نظرة عامة" / "Overview"
4. **Verify:** Same 24px gap exists between title and the stat cards below

#### Student Overview:
1. Log out and login as student: `student@school.edu` / `Student@12345`
2. Navigate to: **http://localhost:3000/ar/dashboard/student** (or `/en/dashboard/student`)
3. Look for the heading "نظرة عامة" / "Overview"
4. **Verify:** Same 24px gap exists between title and the stat cards below

**Expected Result:** ✅ All three pages show consistent mb-6 spacing between title and stat cards

---

## Fix 2: Kindergarten class order = 0 (Grade Order field accepts 0)

### What to verify:
The "Grade Order" field when creating a new section should accept "0" as a valid value (for kindergarten classes), not have a minimum of 1.

### Test Steps:

1. Log in as Admin if not already: `admin@school.edu` / `Admin@12345`
2. Navigate to: **http://localhost:3000/ar/dashboard/admin/sections** (or `/en/dashboard/admin/subjects_exams` → click Classes & Sections in new UI)
3. Look for an "Add Grade" or section creation form
4. In the inline form, find the "Grade Order" / "رتبة الصف" input field
5. Try entering **"0"** in the Grade Order field
6. **Verify:** The value "0" is accepted (no min=1 constraint blocks it)
7. Try submitting with 0 - it should work without validation errors
8. If successfully created, you should see the kindergarten section appear with order 0

**Expected Result:** ✅ Grade Order field accepts "0" without validation errors

---

## Fix 3: Exams table view with proper columns

### What to verify:
The exam list in admin should display as a table (or table-like card layout) with all required columns: Title, Subject, Section, Date, Start Time, End Time, Type, and Actions.

### Test Steps:

1. Navigate to: **http://localhost:3000/ar/dashboard/admin/subjects_exams** (or via new nav: Overview → Subjects & Exams)
2. Click on the "Exams" / "الامتحانات" tab (if there are tabs)
3. Look at the exam list display
4. **Verify the following information is visible for each exam:**
   - ✅ **Title** - Exam name (e.g., "Final Math Exam")
   - ✅ **Subject** - Subject name (shown in secondary text)
   - ✅ **Section** - Section/class name (shown in secondary text)
   - ✅ **Date** - Exam date with calendar icon (format: day/month/year)
   - ✅ **Start Time** - Start time with clock icon (format: HH:MM)
   - ✅ **End Time** - End time in the time range (format: HH:MM, shown as "start - end")
   - ✅ **Type** - Exam type badge (shows: midterm/final/quiz/practical)
   - ✅ **Actions** - Edit and Delete buttons on the right

4. Hover over exams to ensure all columns are readable and properly aligned
5. Each exam should be displayed in a card layout with these fields clearly visible

**Expected Result:** ✅ All 8 columns visible and properly formatted for each exam

---

## Fix 4: Centered search bars (Admin Users page)

### What to verify:
The search bars on the admin users page (both Teachers and Students tabs) should be centered on the page with proper alignment.

### Test Steps:

1. Navigate to: **http://localhost:3000/ar/dashboard/admin/users** (or via new nav: Overview → Users)
2. Look at the search bar on the "Teachers" tab
3. **Verify:** The search bar with the Search icon should be centered horizontally on the page (not aligned to the left)
4. The search input should have `justify-center` styling with `max-w-md` constraint
5. Look at the "Add Teacher" button next to it - should also be in the centered row
6. Click the "Students" tab
7. **Verify:** The Students tab also has the same centered search bar layout
8. The search functionality should work (try typing a name)

**Expected Result:** ✅ Search bars are centered with proper alignment on both tabs

---

## Fix 5: Teacher labels text color (White text on colored background)

### What to verify:
In the admin users page, the teacher section/subject labels should have white text on a colored background (not blue accent text).

### Test Steps:

1. Navigate to: **http://localhost:3000/ar/dashboard/admin/users**
2. Go to the "Teachers" tab
3. Look at any teacher card that has sections assigned (look for section labels/badges below the teacher name)
4. **Verify:** The section badges display white text on a colored background
   - Background color: Accent color (blue) with opacity
   - Text color: White (not blue or any other color)
   - Format: Section name in white on the colored badge
5. The badges should look like: `<badge style="background: rgba(blue, 0.2); color: white">`

**Example:** A teacher assigned to "الشعبة أ" (Section A) should show a white text badge on a light blue background

**Expected Result:** ✅ Section labels show white text on colored backgrounds (not blue accent text)

---

## Fix 6: CSV import for students

### What to verify:
An "Import CSV" button should exist next to the "Add Student" button in the admin users page that opens a modal for CSV file upload.

### Test Steps:

1. Navigate to: **http://localhost:3000/ar/dashboard/admin/users**
2. Click on the "Students" tab
3. Look for the button bar with "Add Student" button
4. **Verify:** Next to "Add Student", there should be an "Import CSV" / "استيراد CSV" button
5. Click the "Import CSV" button
6. **Verify:** A modal dialog opens with:
   - Title: "Import Students from CSV" / "استيراد الطلاب من CSV"
   - Instructions about required CSV columns
   - File upload input with upload icon
   - Cancel and Import buttons
7. Try uploading a valid CSV file (or just verify the dialog structure is correct)
8. The modal should handle file selection and validation

**Expected Result:** ✅ "Import CSV" button present and opens working modal

---

## Fix 7: Layla removed, replaced with Ahmed

### What to verify:
The student list should NOT contain any student named "Layla". The seed data should have "Ahmed" instead.

### Test Steps:

1. Navigate to: **http://localhost:3000/ar/dashboard/admin/users**
2. Go to the "Students" tab
3. Look at the student list or use the search functionality
4. **Search for "Layla":**
   - Type "Layla" in the search box
   - **Verify:** No results found (student Layla should not exist)
5. **Search for "Ahmed":**
   - Type "Ahmed" in the search box
   - **Verify:** At least one student named "Ahmed" appears in the results
   - Confirm the student entry shows "Ahmed" in English name

**Expected Result:** ✅ No "Layla" in student list; "Ahmed" is present

---

## Summary Checklist

Print this checklist and mark each item as verified:

- [ ] **Fix 1** - Admin Overview has mb-6 spacing
- [ ] **Fix 1** - Teacher Overview has mb-6 spacing
- [ ] **Fix 1** - Student Overview has mb-6 spacing
- [ ] **Fix 2** - Grade Order field accepts "0"
- [ ] **Fix 3** - Exams display with all 8 columns
- [ ] **Fix 4** - Search bars are centered on Users page
- [ ] **Fix 5** - Teacher section labels show white text on colored background
- [ ] **Fix 6** - "Import CSV" button present and functional
- [ ] **Fix 7** - No "Layla" student in the system
- [ ] **Fix 7** - "Ahmed" student exists in the system

---

## Quick Reference URLs

| Fix | URL | User | Purpose |
|-----|-----|------|---------|
| Fix 1 (Admin) | http://localhost:3000/ar/dashboard/admin | Admin | Check mb-6 spacing |
| Fix 1 (Teacher) | http://localhost:3000/ar/dashboard/teacher | Teacher | Check mb-6 spacing |
| Fix 1 (Student) | http://localhost:3000/ar/dashboard/student | Student | Check mb-6 spacing |
| Fix 2 | http://localhost:3000/ar/dashboard/admin/sections | Admin | Grade Order field |
| Fix 3 | http://localhost:3000/ar/dashboard/admin/subjects_exams (Exams tab) | Admin | Exams table view |
| Fix 4,5,6,7 | http://localhost:3000/ar/dashboard/admin/users | Admin | Users, search, CSV |

---

## Test Credentials

- **Admin:** admin@school.edu / Admin@12345
- **Teacher:** teacher@school.edu / Teacher@12345
- **Student:** student@school.edu / Student@12345

---

## Language Switching

- Add `/ar/` for Arabic (RTL) - Default
- Add `/en/` for English (LTR)

Example: http://localhost:3000/en/dashboard/admin
