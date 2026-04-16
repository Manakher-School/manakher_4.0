# M12: Comprehensive Testing Guide & Verification Checklist

**Date Created:** 2026-04-16  
**Purpose:** Complete end-to-end testing for Milestone 12 Production Readiness  
**Build Status:** ✅ All 56 pages compile, zero TypeScript errors, production ready  
**Test Status:** ✅ 124 Jest tests passing, >85% coverage

---

## EXECUTIVE SUMMARY

The Manakher School Platform has completed Phase 1-4 of the UX Architecture refactoring (M11) and is now ready for comprehensive browser testing (M12). This document provides:

1. **Testing Prerequisites** - Setup and initial configuration
2. **Functional Testing Scenarios** - Detailed workflows for each role
3. **UI/UX Verification** - Visual and interaction checks
4. **Error Handling Verification** - Recovery and edge cases
5. **Performance Verification** - Load times and responsiveness
6. **Final Acceptance Criteria** - Sign-off checklist

---

## PART 1: TESTING PREREQUISITES

### 1.1 Environment Setup

**Required:**
- PocketBase running at `http://127.0.0.1:8090` (backend API)
- Next.js dev server running at `http://localhost:3000` (frontend)
- Database populated with test data (or prepared to use PocketBase admin UI)

**Test Users (Use these credentials to login):**
```
Admin:
  Email: admin@school.edu
  Password: Admin@12345
  
Teacher:
  Email: teacher@school.edu
  Password: Teacher@12345
  
Student:
  Email: student@school.edu
  Password: Student@12345
```

**Optional:** Additional test data can be seeded via PocketBase admin UI at `http://127.0.0.1:8090/_/`

### 1.2 Browser Setup

**Recommended:**
- Modern browser (Chrome, Firefox, Safari, or Edge)
- Developer tools open (F12) to check console for errors
- Test at multiple viewport sizes:
  - Desktop: 1920×1080
  - Tablet: 768×1024
  - Mobile: 375×667

**Accessibility Testing:**
- Test keyboard navigation (Tab, Shift+Tab, Enter, Escape, Arrow keys)
- Use browser accessibility inspector to verify aria-labels
- Test with screen reader if available

---

## PART 2: FUNCTIONAL TESTING SCENARIOS

### 2.1 AUTHENTICATION & RBAC

#### Test Case A2.1.1: Login - Admin
**Steps:**
1. Navigate to `http://localhost:3000/ar/login` (Arabic) or `/en/login` (English)
2. Enter email: `admin@school.edu`
3. Enter password: `Admin@12345`
4. Click "دخول" (Arabic) or "Login" (English) button
5. Verify redirect to `/ar/dashboard/admin` or `/en/dashboard/admin`

**Expected Results:**
- ✅ Login succeeds
- ✅ Header shows role badge "admin" (violet/purple color)
- ✅ Dashboard displays admin-specific nav (Overview, Classes, Subjects, Users, Settings)
- ✅ Welcome banner shows admin name and school name
- ✅ No console errors

**Accessibility Checks:**
- ✅ Form inputs focusable via Tab key
- ✅ Submit button keyboard accessible (Enter key)
- ✅ Error messages have aria-label (if error occurs)

---

#### Test Case A2.1.2: Login - Teacher
**Steps:**
1. Navigate to `/ar/login` or `/en/login`
2. Enter email: `teacher@school.edu`
3. Enter password: `Teacher@12345`
4. Click login button
5. Verify redirect to `/ar/dashboard/teacher` or `/en/dashboard/teacher`

**Expected Results:**
- ✅ Login succeeds
- ✅ Header shows role badge "teacher" (teal/green color)
- ✅ Dashboard displays teacher-specific nav (Overview, My Sections, Materials, Homework, Announcements, Quizzes)
- ✅ Welcome banner shows teacher name
- ✅ No console errors

---

#### Test Case A2.1.3: Login - Student
**Steps:**
1. Navigate to `/ar/login` or `/en/login`
2. Enter email: `student@school.edu`
3. Enter password: `Student@12345`
4. Click login button
5. Verify redirect to `/ar/dashboard/student` or `/en/dashboard/student`

**Expected Results:**
- ✅ Login succeeds
- ✅ Header shows role badge "student" (amber/orange color)
- ✅ Dashboard displays student-specific nav (Overview, Announcements, Materials, Homework, Assessments)
- ✅ No console errors

---

#### Test Case A2.1.4: RBAC - Student Cannot Access Admin Dashboard
**Steps:**
1. Login as student (from A2.1.3)
2. Manually navigate to `/ar/dashboard/admin` or `/en/dashboard/admin`
3. Observe redirect

**Expected Results:**
- ✅ Automatically redirected back to `/ar/dashboard/student` or `/en/dashboard/student`
- ✅ No flash of unauthorized content
- ✅ No console errors about missing permissions

---

#### Test Case A2.1.5: Logout
**Steps:**
1. Login as any user
2. Click "Sign out" button in top-right corner
3. Observe redirect

**Expected Results:**
- ✅ Redirected to `/ar/login` or `/en/login`
- ✅ Session cleared (refresh page → still on login, not auto-logged in)
- ✅ No console errors

---

#### Test Case A2.1.6: Session Persistence
**Steps:**
1. Login as admin
2. Close the tab/window
3. Open `http://localhost:3000` in a new tab
4. Observe what happens

**Expected Results:**
- ✅ Automatically redirected to `/ar/dashboard/admin` or `/en/dashboard/admin` (not back to login)
- ✅ Auth state persisted in cookies and localStorage
- ✅ No re-login needed

---

### 2.2 ADMIN DASHBOARD - USER MANAGEMENT

#### Test Case A2.2.1: Admin - View Users Page
**Steps:**
1. Login as admin (A2.1.1)
2. Click "Users" in sidebar nav
3. Navigate to `/ar/dashboard/admin/users` or `/en/dashboard/admin/users`
4. Observe user list

**Expected Results:**
- ✅ Page loads without errors
- ✅ User list displays (shows teachers and students with tabs)
- ✅ Teachers tab shows: teacher name, email, sections assigned, subjects assigned
- ✅ Students tab shows: student name, email, section assigned
- ✅ Add button visible to create new users
- ✅ Search functionality present
- ✅ No console errors

---

#### Test Case A2.2.2: Admin - Create New Teacher
**Steps:**
1. On Users page (A2.2.1), click on Teachers tab
2. Click "Add Teacher" or "+" button
3. Fill form:
   - Name (Arabic): معلمة جديدة
   - Name (English): New Teacher
   - Email: newteacher@school.edu
   - Password: Test@12345
4. Select sections (multi-select)
5. Select subjects (multi-select)
6. Click "Save" or "Create" button
7. Verify success message

**Expected Results:**
- ✅ Form appears with all required fields
- ✅ Sections/subjects dropdowns work with keyboard navigation (arrow keys)
- ✅ Form validates (e.g., email format, password strength)
- ✅ Success message displays after save
- ✅ New teacher appears in list
- ✅ No console errors
- ✅ Confirm deletion works later

---

#### Test Case A2.2.3: Admin - Create New Student
**Steps:**
1. On Users page, click on Students tab
2. Click "Add Student" button
3. Fill form:
   - Name (Arabic): طالب جديد
   - Name (English): New Student
   - Email: newstudent@school.edu
   - Password: Test@12345
   - Section: (select from dropdown)
4. Click "Save" button
5. Verify success message

**Expected Results:**
- ✅ Form appears with required fields
- ✅ Section dropdown works
- ✅ Success message displays
- ✅ New student appears in list
- ✅ No console errors

---

#### Test Case A2.2.4: Admin - Edit User
**Steps:**
1. On Users page, find a user in the list
2. Click "Edit" icon/button next to user
3. Modify a field (e.g., name)
4. Click "Save" button
5. Verify success message

**Expected Results:**
- ✅ Edit form appears with current data pre-filled
- ✅ Changes persist after save
- ✅ List updates without page refresh
- ✅ No console errors

---

#### Test Case A2.2.5: Admin - Delete User with Cascade
**Steps:**
1. On Users page, find the "New Teacher" or "New Student" created in A2.2.2 or A2.2.3
2. Click "Delete" icon/button
3. Confirm deletion in dialog
4. Verify user removed from list

**Expected Results:**
- ✅ Confirmation dialog appears with warning about cascade delete
- ✅ Delete succeeds even if user has related records (submissions, quiz attempts, etc.)
- ✅ User removed from list
- ✅ No console errors
- ✅ Related records cleaned up (submissions, quiz attempts, comments, reactions)

**Note:** Cascade delete should handle:
- Submissions (if student)
- Quiz attempts (if student)
- Comments (if student or teacher)
- Reactions (if student)
- Materials/Homework/Quizzes (if teacher)

---

### 2.3 ADMIN DASHBOARD - SCHOOL STRUCTURE

#### Test Case A2.3.1: Admin - View Classes & Sections
**Steps:**
1. Login as admin
2. Click "Classes and Sections" in sidebar
3. Navigate to `/ar/dashboard/admin/sections` or `/en/dashboard/admin/sections`
4. Observe page content

**Expected Results:**
- ✅ Page loads without errors
- ✅ Sections grouped by grade
- ✅ Each grade shows its sections
- ✅ Add button visible to create new grades/sections
- ✅ Edit/delete buttons on each section
- ✅ No console errors

---

#### Test Case A2.3.2: Admin - Create New Section
**Steps:**
1. On Classes & Sections page, click "Add Section" or "+" button
2. Fill form:
   - Grade Name (Arabic): صف جديد
   - Grade Name (English): New Grade
   - Grade Order: 11 (or next available)
   - Section Name (Arabic): شعبة أ
   - Section Name (English): Section A
3. Click "Save" button
4. Verify success message and section appears in list

**Expected Results:**
- ✅ Form appears with all fields
- ✅ Success message displays
- ✅ New section appears in list under correct grade
- ✅ No console errors

---

#### Test Case A2.3.3: Admin - Delete Section with Cascade
**Steps:**
1. Find the section created in A2.3.2
2. Click "Delete" button
3. Confirm deletion in dialog

**Expected Results:**
- ✅ Confirmation dialog with cascade delete warning
- ✅ Deletion succeeds
- ✅ Section removed from list
- ✅ All related records deleted (materials, homework, quiz attempts, exam schedules, etc.)
- ✅ Teachers/students unassigned from section
- ✅ No console errors

---

### 2.4 ADMIN DASHBOARD - SUBJECTS & EXAMS

#### Test Case A2.4.1: Admin - View Subjects & Exams
**Steps:**
1. Login as admin
2. Click "Subjects & Exams" in sidebar
3. Navigate to `/ar/dashboard/admin/subjects_exams`
4. Observe page with tabs

**Expected Results:**
- ✅ Page loads without errors
- ✅ Two tabs: "Subjects" and "Exams"
- ✅ Subjects tab shows list of subjects (name, code)
- ✅ Exams tab shows exam schedules
- ✅ Add buttons visible on each tab
- ✅ No console errors

---

#### Test Case A2.4.2: Admin - Create New Subject
**Steps:**
1. On Subjects & Exams page, ensure you're on Subjects tab
2. Click "Add Subject" button
3. Fill form:
   - Name (Arabic): مادة جديدة
   - Name (English): New Subject
   - Code: NS-101
4. Click "Save" button
5. Verify success message

**Expected Results:**
- ✅ Form appears
- ✅ Success message displays
- ✅ New subject appears in list
- ✅ No console errors

---

#### Test Case A2.4.3: Admin - Create Exam Schedule
**Steps:**
1. On Subjects & Exams page, switch to Exams tab
2. Click "Add Exam" button
3. Fill form:
   - Title: Midterm Exam
   - Subject: (select from dropdown)
   - Section: (select from dropdown)
   - Exam Date: (pick future date)
   - Start Time: 09:00 AM
   - End Time: 11:00 AM
   - Exam Type: midterm
4. Click "Save" button
5. Verify success message

**Expected Results:**
- ✅ Form appears with all fields
- ✅ Dropdowns work (subject, section, exam type)
- ✅ Date picker works
- ✅ Success message displays
- ✅ Exam appears in list
- ✅ No console errors

---

### 2.5 ADMIN DASHBOARD - SETTINGS

#### Test Case A2.5.1: Admin - View Settings
**Steps:**
1. Login as admin
2. Click "Settings" in sidebar
3. Navigate to `/ar/dashboard/admin/settings`
4. Observe page

**Expected Results:**
- ✅ Page loads without errors
- ✅ Three accordion sections visible:
  - Platform Settings (expanded by default)
  - Content Moderation (collapsed)
  - System Monitoring (collapsed)
- ✅ Platform Settings shows:
  - School name inputs (Arabic/English)
  - Feature toggles (comments, reactions, quizzes)
  - Save button
- ✅ No console errors

---

#### Test Case A2.5.2: Admin - Update School Name
**Steps:**
1. On Settings page, in Platform Settings accordion
2. Modify school name:
   - Arabic: مدرسة مناخر الجديدة
   - English: Manakher New School
3. Click "Save" button
4. Verify success message
5. Refresh page and verify name persists

**Expected Results:**
- ✅ Success message displays
- ✅ Changes persist after refresh
- ✅ School name updates throughout UI (header, login page, etc.)
- ✅ No console errors

---

#### Test Case A2.5.3: Admin - Toggle Feature Flags
**Steps:**
1. On Settings page, toggle "Enable Comments" switch
2. Click "Save" button
3. Verify success message
4. Toggle "Enable Reactions" switch
5. Verify toggle works

**Expected Results:**
- ✅ Toggles respond to clicks
- ✅ Success message displays
- ✅ Features enabled/disabled based on toggles
- ✅ No console errors

---

#### Test Case A2.5.4: Admin - Content Moderation
**Steps:**
1. Expand "Content Moderation" accordion
2. Observe tabs: Materials, Announcements, Comments
3. Click each tab and verify content displayed

**Expected Results:**
- ✅ Accordion expands
- ✅ All three tabs visible
- ✅ Materials tab shows list of all materials with teacher/section info
- ✅ Announcements tab shows all announcements
- ✅ Comments tab shows all comments
- ✅ Delete buttons available on each item
- ✅ No console errors

---

#### Test Case A2.5.5: Admin - Delete Content (Moderation)
**Steps:**
1. In Content Moderation, on Materials tab
2. Find a material in the list
3. Click "Delete" button
4. Confirm deletion in dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Deletion succeeds
- ✅ Material removed from list
- ✅ No console errors

---

#### Test Case A2.5.6: Admin - System Monitoring
**Steps:**
1. Expand "System Monitoring" accordion
2. Observe metrics displayed

**Expected Results:**
- ✅ Accordion expands
- ✅ Metrics visible:
  - User statistics (total, teachers, students, sections)
  - Content statistics (subjects, materials, announcements, homework)
  - Assessment metrics (quizzes, submissions, average score)
  - Engagement metrics (comments, reactions, total activity)
- ✅ All metrics show positive numbers if data exists
- ✅ No console errors

---

### 2.6 TEACHER DASHBOARD - MATERIALS

#### Test Case A2.6.1: Teacher - View My Materials
**Steps:**
1. Login as teacher (A2.1.2)
2. Click "Materials" in sidebar
3. Navigate to `/ar/dashboard/teacher/materials`
4. Observe materials list

**Expected Results:**
- ✅ Page loads without errors
- ✅ Materials list visible (if any exist)
- ✅ Each material shows: title, section, subject, type, date
- ✅ "Create Material" button visible
- ✅ Filter dropdowns for section/subject visible
- ✅ Search functionality present
- ✅ No console errors

---

#### Test Case A2.6.2: Teacher - Create Learning Material
**Steps:**
1. On Materials page, click "Create Material" or "+" button
2. Fill form:
   - Title: "Introduction to Algebra"
   - Description: "Comprehensive guide to algebraic concepts"
   - Section: (select from dropdown)
   - Subject: (select from dropdown)
   - Type: "text"
3. For text type, enter content in rich editor:
   - Type some text and format it (bold, italic, headers, lists)
4. Click "Save" button
5. Verify success message

**Expected Results:**
- ✅ Form appears with all fields
- ✅ Rich text editor loads (no browser freeze!)
- ✅ Rich text editor toolbar visible (bold, italic, underline, lists, alignment, etc.)
- ✅ Text formatting works (try: bold, headers, lists)
- ✅ Success message displays
- ✅ New material appears in list
- ✅ No console errors

---

#### Test Case A2.6.3: Teacher - Upload File to Material
**Steps:**
1. On Materials page, click "Create Material" button
2. Fill form:
   - Title: "Math Worksheet"
   - Section/Subject: (select)
   - Type: "file"
3. Click "Upload File" button
4. Select a file from your computer
5. Click "Save" button

**Expected Results:**
- ✅ File picker appears
- ✅ File selected and displayed as pending
- ✅ Success message after save
- ✅ Material appears in list with file indicator
- ✅ No console errors

---

#### Test Case A2.6.4: Teacher - Edit Material
**Steps:**
1. On Materials page, find a material
2. Click "Edit" icon/button
3. Modify title or content
4. Click "Save" button

**Expected Results:**
- ✅ Edit form pre-filled with current data
- ✅ Changes persist after save
- ✅ List updates
- ✅ No console errors

---

#### Test Case A2.6.5: Teacher - Delete Material
**Steps:**
1. On Materials page, find a material
2. Click "Delete" icon/button
3. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Deletion succeeds
- ✅ Material removed from list
- ✅ No console errors

---

### 2.7 TEACHER DASHBOARD - HOMEWORK

#### Test Case A2.7.1: Teacher - Create Homework Assignment
**Steps:**
1. Login as teacher
2. Click "Homework" in sidebar
3. Click "Create Homework" or "+" button
4. Fill form:
   - Title: "Chapter 3 Exercises"
   - Description: "Complete exercises 1-20"
   - Section(s): (select)
   - Submission Type: "online"
   - Due Date: (pick future date)
5. Click "Save" button

**Expected Results:**
- ✅ Form appears with all fields
- ✅ Rich editor loads without freeze
- ✅ Section dropdown works
- ✅ Submission type selector works (online/on-site)
- ✅ Success message displays
- ✅ Homework appears in list
- ✅ No console errors

---

#### Test Case A2.7.2: Teacher - View Homework Submissions
**Steps:**
1. On Homework page, find a homework assignment
2. Click "View Submissions" or expand the item
3. Observe submissions list

**Expected Results:**
- ✅ Submissions panel appears/expands
- ✅ List shows submitted students with names and submission times
- ✅ Grade and feedback fields visible (for grading)
- ✅ No console errors

---

#### Test Case A2.7.3: Teacher - Grade Student Submission
**Steps:**
1. On Homework page, find a homework with submissions
2. Expand submissions panel
3. Find a student submission
4. Click "Grade" button or fill grade/feedback fields
5. Enter grade (e.g., "9/10")
6. Enter feedback (e.g., "Great work!")
7. Click "Save" button

**Expected Results:**
- ✅ Grading form appears
- ✅ Grade and feedback fields editable
- ✅ Success message after save
- ✅ Submission marked as graded
- ✅ No console errors

---

### 2.8 TEACHER DASHBOARD - QUIZZES

#### Test Case A2.8.1: Teacher - Create Quiz
**Steps:**
1. Login as teacher
2. Click "Quizzes" in sidebar
3. Click "Create Quiz" button
4. Fill form:
   - Title: "Chapter 2 Quiz"
   - Section: (select)
   - Subject: (select)
   - Time Limit: 30 (minutes)
   - Opens At: (pick date/time in past)
   - Closes At: (pick date/time in future)
5. Click "Save" button
6. Verify success message (note: will prompt to add questions)

**Expected Results:**
- ✅ Form appears with all fields
- ✅ Date/time pickers work
- ✅ Success message displays
- ✅ Quiz appears in list
- ✅ Confirmation dialog appears asking to add questions
- ✅ No console errors

---

#### Test Case A2.8.2: Teacher - Add Quiz Question
**Steps:**
1. After creating quiz (A2.8.1), expand "Questions" panel
2. Click "Add Question" button
3. Fill form:
   - Question Text: "What is 2 + 2?"
   - Option A: "3"
   - Option B: "4" ← (select as correct)
   - Option C: "5"
   - Option D: "6"
4. Click "Save Question" button

**Expected Results:**
- ✅ Question form appears
- ✅ Can add 4 options with text input
- ✅ Radio buttons to select correct answer
- ✅ Success after save
- ✅ Question appears in list
- ✅ Correct answer highlighted in green
- ✅ No console errors

---

#### Test Case A2.8.3: Teacher - View Quiz Results
**Steps:**
1. On Quizzes page, find a quiz
2. Expand "Results" panel
3. Observe student attempts

**Expected Results:**
- ✅ Results panel expands
- ✅ List shows students who attempted quiz
- ✅ Shows submission time and score (X/N)
- ✅ Score color-coded: green ≥60%, red <60%
- ✅ No console errors

---

### 2.9 STUDENT DASHBOARD - HOMEWORK SUBMISSION

#### Test Case A2.9.1: Student - View Homework
**Steps:**
1. Login as student (A2.1.3)
2. Click "Homework" in sidebar
3. Navigate to `/ar/dashboard/student/homework`
4. Observe homework list

**Expected Results:**
- ✅ Page loads without errors
- ✅ Homework list visible (if assigned to student's section)
- ✅ Each homework shows: title, due date, submission status
- ✅ "Submit" button visible for homework without submission
- ✅ "View Submission" visible for homework already submitted
- ✅ Overdue homework marked with red icon
- ✅ No console errors

---

#### Test Case A2.9.2: Student - Submit Homework (Online)
**Steps:**
1. On Homework page, find online homework without submission
2. Click "Submit" button
3. Fill submission form:
   - In rich editor, type response (e.g., "My answer to the homework")
   - Add formatting (bold, lists, etc.)
4. Click "Submit" button
5. Verify success message

**Expected Results:**
- ✅ Submission form appears with rich editor
- ✅ Rich editor works without freeze
- ✅ Content can be formatted
- ✅ Success message displays
- ✅ Card updates to show submission (changes from "Submit" to "View Submission")
- ✅ Submission time displayed
- ✅ No console errors

---

#### Test Case A2.9.3: Student - View Graded Submission
**Steps:**
1. On Homework page, find homework that has been graded by teacher
2. Click "View Submission" button
3. Observe graded submission

**Expected Results:**
- ✅ Submission details appear
- ✅ Student's submitted content visible
- ✅ Grade displayed (if graded)
- ✅ Teacher's feedback visible (if provided)
- ✅ Submission time shown
- ✅ No console errors

---

### 2.10 STUDENT DASHBOARD - ASSESSMENTS & QUIZZES

#### Test Case A2.10.1: Student - View Available Quizzes
**Steps:**
1. Login as student
2. Click "Assessments" in sidebar
3. On "Interactive Quizzes" tab, observe quiz list

**Expected Results:**
- ✅ Page loads without errors
- ✅ Quiz list visible
- ✅ Each quiz shows: title, subject, time limit, status (upcoming/open/closed)
- ✅ "Start Quiz" button visible only for open quizzes not yet attempted
- ✅ Previous score bar visible if already attempted
- ✅ No console errors

---

#### Test Case A2.10.2: Student - Take Quiz
**Steps:**
1. On Assessments page, find an open quiz not yet attempted
2. Click "Start Quiz" button
3. Verify time enforcement (can only start if quiz is open)
4. Review quiz interface:
   - Question text displayed
   - 4 multiple choice options as clickable buttons
   - Countdown timer in header
   - Progress bar showing current question
   - Previous/Next navigation buttons
   - Submit button
5. Answer all questions:
   - Click option A on Q1
   - Click "Next"
   - Click option B on Q2
   - etc.
6. Click "Submit Quiz" button
7. Confirm submission in dialog

**Expected Results:**
- ✅ Quiz UI loads without errors (no freeze!)
- ✅ Question text displays clearly
- ✅ Options clickable and highlight on selection (amber color)
- ✅ Timer counts down (red when <60s)
- ✅ Progress bar updates
- ✅ Previous/Next navigation works with keyboard (arrow keys)
- ✅ Confirm dialog appears before submit
- ✅ No console errors

---

#### Test Case A2.10.3: Student - View Quiz Score
**Steps:**
1. After submitting quiz (A2.10.2)
2. Observe score result screen

**Expected Results:**
- ✅ Score displayed prominently
- ✅ Large percentage shown (e.g., "75%")
- ✅ Color-coded: green ≥60%, red <60%
- ✅ Number of correct answers shown (e.g., "3/4")
- ✅ "Back to Quizzes" or similar button visible
- ✅ No console errors

---

#### Test Case A2.10.4: Student - Quiz Time Enforcement
**Steps:**
1. On Assessments page, check "Exam Schedule" tab
2. Verify upcoming exams displayed
3. Try to take a quiz that is NOT open (closed or not yet opened)

**Expected Results:**
- ✅ "Start Quiz" button disabled or shows alert
- ✅ Alert message explains why quiz not available
- ✅ No console errors

---

### 2.11 MATERIALS & ANNOUNCEMENTS

#### Test Case A2.11.1: Student - View Materials
**Steps:**
1. Login as student
2. Click "Materials" in sidebar
3. Navigate to `/ar/dashboard/student/materials`
4. Observe materials list

**Expected Results:**
- ✅ Page loads without errors
- ✅ Materials from student's section visible
- ✅ Each material shows: title, subject, teacher, type
- ✅ Expandable cards to view full content
- ✅ File download link visible if material has attachment
- ✅ Subject filter dropdown works
- ✅ No console errors

---

#### Test Case A2.11.2: Student - Download Material File
**Steps:**
1. On Materials page, find material with file attachment
2. Click material to expand
3. Look for file download link (with Paperclip icon)
4. Click download link
5. Verify file downloads

**Expected Results:**
- ✅ Material expands
- ✅ File link visible and clickable
- ✅ File downloads to computer
- ✅ No console errors

---

#### Test Case A2.11.3: Student - View Announcements
**Steps:**
1. Login as student
2. Click "Announcements" in sidebar
3. Navigate to `/ar/dashboard/student/announcements`

**Expected Results:**
- ✅ Page loads without errors
- ✅ Announcements visible (global and section-specific)
- ✅ Each announcement shows: title, author, scope badge (global/section), date
- ✅ Expandable cards to view full content
- ✅ Author name shown
- ✅ No console errors

---

### 2.12 COMMENTS & REACTIONS

#### Test Case A2.12.1: Student - Add Comment to Material
**Steps:**
1. Student on Materials page
2. Expand a material to show full content
3. Look for Comments section
4. Fill comment input field with text (e.g., "Great material, very helpful!")
5. Click "Post Comment" or submit button
6. Verify comment appears

**Expected Results:**
- ✅ Comment form visible
- ✅ Comment text input functional
- ✅ Submit button works
- ✅ Comment appears in list immediately
- ✅ Comment shows author name (student) and timestamp
- ✅ No console errors

---

#### Test Case A2.12.2: Comments Visibility (Teacher View)
**Steps:**
1. Teacher login
2. Go to Materials page
3. Expand a material that has student comments
4. Verify comments visible to teacher

**Expected Results:**
- ✅ Comments section visible
- ✅ Comments from students shown
- ✅ Comments include author name and timestamp
- ✅ No console errors

---

---

## PART 3: UI/UX VERIFICATION

### 3.1 BILINGUAL & RTL/LTR

#### Test Case U3.1.1: Arabic Interface
**Steps:**
1. Navigate to `http://localhost:3000/ar/login`
2. Verify all text is in Arabic
3. Observe text direction (right-to-left)
4. Check that text alignment is correct
5. Verify form labels are Arabic
6. Login and navigate to dashboard

**Expected Results:**
- ✅ All UI text in Arabic
- ✅ Text flows right-to-left
- ✅ Icons positioned correctly for RTL (search icon on left, etc.)
- ✅ Form labels aligned properly
- ✅ Dashboard sidebar on right side (in RTL mode)
- ✅ No visual glitches or overlapping text

---

#### Test Case U3.1.2: English Interface
**Steps:**
1. Navigate to `http://localhost:3000/en/login`
2. Verify all text is in English
3. Observe text direction (left-to-right)
4. Login and navigate to dashboard

**Expected Results:**
- ✅ All UI text in English
- ✅ Text flows left-to-right
- ✅ Form labels aligned properly
- ✅ Dashboard sidebar on left side
- ✅ No visual glitches

---

#### Test Case U3.1.3: Language Switcher
**Steps:**
1. Login to any dashboard (admin, teacher, or student)
2. Look for language switcher button (top-right corner)
3. Click to switch language
4. Verify page reloads in other language
5. Check that URL changed (e.g., `/ar/` → `/en/`)

**Expected Results:**
- ✅ Language switcher button visible
- ✅ Click switches language
- ✅ Page reloads with new language
- ✅ URL updated correctly
- ✅ All content re-renders in new language
- ✅ No console errors

---

#### Test Case U3.1.4: Mixed Language Content (RTL Detection)
**Steps:**
1. Teacher creates quiz with mixed Arabic/English questions:
   - Q1: "What is 2 + 2?" (English)
   - Q2: "كم يساوي 2 + 2؟" (Arabic)
2. Student takes quiz
3. Observe text direction for each question

**Expected Results:**
- ✅ English question displays LTR
- ✅ Arabic question displays RTL
- ✅ Both render correctly based on content, not page locale
- ✅ No console errors

---

### 3.2 MOBILE RESPONSIVENESS

#### Test Case U3.2.1: Mobile Login
**Steps:**
1. Open browser developer tools (F12)
2. Set viewport to mobile (375×667)
3. Navigate to `http://localhost:3000/ar/login`
4. Verify layout on mobile

**Expected Results:**
- ✅ Login form visible and usable
- ✅ Input fields have adequate size (24px tap targets)
- ✅ Submit button accessible
- ✅ No horizontal scrolling needed
- ✅ Text readable without zoom

---

#### Test Case U3.2.2: Mobile Dashboard Navigation
**Steps:**
1. Login as admin on mobile view
2. Observe navigation

**Expected Results:**
- ✅ Desktop sidebar hidden
- ✅ Mobile tab bar visible at bottom
- ✅ All 5 nav items visible or in menu
- ✅ Tab icons large enough to tap (24px)
- ✅ Active tab highlighted
- ✅ Can tap each tab and navigate

---

#### Test Case U3.2.3: Mobile Forms
**Steps:**
1. On mobile view, navigate to a page with forms
2. Try to create/edit a record
3. Verify form is usable

**Expected Results:**
- ✅ Form fields visible
- ✅ Dropdowns work on mobile
- ✅ Date pickers accessible
- ✅ Rich editor usable (or hidden on mobile if too complex)
- ✅ Submit button accessible and tappable
- ✅ No horizontal scrolling

---

### 3.3 VISUAL DESIGN & POLISH

#### Test Case U3.3.1: Color Consistency
**Steps:**
1. Check role badge colors across pages
2. Admin role: violet/purple
3. Teacher role: teal/green
4. Student role: amber/orange

**Expected Results:**
- ✅ Admin pages consistently use violet accent
- ✅ Teacher pages consistently use teal accent
- ✅ Student pages consistently use amber accent
- ✅ Color applied to: header stripe, role badge, welcome banner, accent buttons
- ✅ Consistent typography (Cairo font for headings)

---

#### Test Case U3.3.2: Icon Sizes & Clarity
**Steps:**
1. Check all dashboard navigation icons
2. Verify they're 24px on mobile, 20px on desktop
3. Check that all icons are clear and not "playful"

**Expected Results:**
- ✅ Icons are professional and minimal
- ✅ No emojis or cartoonish icons
- ✅ Icons clearly indicate their purpose
- ✅ Icons have good contrast against background

---

#### Test Case U3.3.3: Loading States
**Steps:**
1. Create a new record (teacher creates homework)
2. Observe loading indicator while saving

**Expected Results:**
- ✅ Loading spinner visible during save
- ✅ Submit button disabled during loading
- ✅ Spinner uses accent color
- ✅ Success/error message appears after completion

---

---

## PART 4: ERROR HANDLING & RECOVERY

### 4.1 ERROR BOUNDARY

#### Test Case E4.1.1: Page Error Recovery
**Steps:**
1. Navigate to any dashboard page
2. In browser console, trigger an error:
   ```javascript
   throw new Error("Test error");
   ```
3. Observe error handling

**Expected Results:**
- ✅ Error boundary catches error
- ✅ Fallback UI appears (error message, "Try Again" button)
- ✅ Header/nav still visible (not fully crashed)
- ✅ "Try Again" button allows recovery
- ✅ "Go Home" button navigates to dashboard
- ✅ No page reload needed

---

### 4.2 FORM VALIDATION

#### Test Case E4.2.1: Invalid Email
**Steps:**
1. Login page
2. Enter invalid email (e.g., "notanemail")
3. Try to submit

**Expected Results:**
- ✅ Form validation error appears
- ✅ Error message shown near email field
- ✅ Form not submitted
- ✅ No console errors

---

#### Test Case E4.2.2: Missing Required Fields
**Steps:**
1. Create new teacher (Admin > Users > Add Teacher)
2. Leave name field empty
3. Try to save

**Expected Results:**
- ✅ Validation error appears
- ✅ Error message explains what's required
- ✅ Form not submitted
- ✅ No console errors

---

### 4.3 NETWORK ERRORS

#### Test Case E4.3.1: Simulate Network Error
**Steps:**
1. Open Developer Tools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Try to perform any action (create, update, delete)

**Expected Results:**
- ✅ Error message appears (network connection failed)
- ✅ Graceful error handling (not a JavaScript error)
- ✅ User can retry
- ✅ No app crash

---

---

## PART 5: KEYBOARD NAVIGATION & ACCESSIBILITY

### 5.1 KEYBOARD NAVIGATION

#### Test Case K5.1.1: Tab Navigation
**Steps:**
1. Login page
2. Press Tab key repeatedly
3. Verify focus moves through form elements
4. Observe focus ring (visible outline) on each element

**Expected Results:**
- ✅ Focus ring visible on every interactive element
- ✅ Tab order logical (left to right, top to bottom)
- ✅ Focus ring color matches accent color
- ✅ Can navigate and submit form without mouse

---

#### Test Case K5.1.2: Dropdown Arrow Keys
**Steps:**
1. Navigate to a page with dropdowns (e.g., Add Teacher)
2. Click dropdown to open
3. Press Arrow Down to navigate options
4. Press Enter to select
5. Press Escape to close

**Expected Results:**
- ✅ Dropdown opens on click
- ✅ Arrow keys navigate options
- ✅ Enter selects option
- ✅ Escape closes dropdown
- ✅ Focus returns to dropdown button after close

---

#### Test Case K5.1.3: Buttons & Links
**Steps:**
1. Dashboard page
2. Press Tab to focus buttons and links
3. Press Enter to activate

**Expected Results:**
- ✅ All buttons focusable via Tab
- ✅ All links focusable via Tab
- ✅ Enter activates buttons/links
- ✅ Focus ring visible on every interactive element

---

### 5.2 ARIA LABELS

#### Test Case K5.2.1: Aria Labels Present
**Steps:**
1. Open browser DevTools Inspector
2. Select an action button (e.g., Edit icon)
3. Check HTML for aria-label attribute

**Expected Results:**
- ✅ aria-label present on icon buttons
- ✅ aria-label describes action with context (e.g., "Edit teacher: Sarah Ahmed")
- ✅ aria-expanded="true/false" on toggle buttons
- ✅ aria-current="page" on active nav links

---

---

## PART 6: PERFORMANCE VERIFICATION

### 6.1 LOAD TIMES

#### Test Case P6.1.1: Page Load Time
**Steps:**
1. Open DevTools (F12)
2. Go to Performance or Network tab
3. Reload dashboard page
4. Observe load time

**Expected Results:**
- ✅ Initial load: <3 seconds
- ✅ Dashboard interactive: <2 seconds
- ✅ No long-running tasks blocking UI
- ✅ All 56 pages load similarly

---

### 6.2 BUNDLE SIZE

#### Test Case P6.2.1: Verify Bundle Optimization
**Steps:**
1. Check that dev build is reasonable size (28MB after optimization)
2. Production build should be much smaller
3. Verify no source maps in production

**Expected Results:**
- ✅ Dev bundle: ~28MB (previously 852MB)
- ✅ No major performance regressions
- ✅ LazyRichEditor not loading until needed

---

---

## PART 7: DATA INTEGRITY

### 7.1 CASCADE DELETE

#### Test Case D7.1.1: Delete Section with Related Data
**Steps:**
1. Admin > Classes & Sections
2. Find a section with materials, homework, quizzes, exams
3. Click Delete
4. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog shows cascade warning
- ✅ Delete succeeds
- ✅ Section removed
- ✅ All materials for section deleted
- ✅ All homework for section deleted
- ✅ All quizzes for section deleted (with questions and attempts)
- ✅ All exam schedules for section deleted
- ✅ Teachers/students unassigned from section

---

#### Test Case D7.1.2: Delete Subject with Related Data
**Steps:**
1. Admin > Subjects & Exams
2. Find a subject with materials, homework, quizzes, exams
3. Click Delete
4. Confirm deletion

**Expected Results:**
- ✅ Cascade delete warning shown
- ✅ Delete succeeds
- ✅ Subject removed
- ✅ All materials with this subject deleted
- ✅ All homework with this subject deleted
- ✅ All quizzes with this subject deleted
- ✅ All exam schedules with this subject deleted
- ✅ Teachers unassigned from subject

---

#### Test Case D7.1.3: Delete User with Related Data
**Steps:**
1. Admin > Users
2. Find a teacher/student with submissions, quiz attempts, comments
3. Click Delete
4. Confirm deletion

**Expected Results:**
- ✅ Cascade delete warning shown
- ✅ Delete succeeds
- ✅ User removed
- ✅ If teacher: materials, homework, quizzes, announcements deleted
- ✅ If student: submissions, quiz attempts, comments, reactions deleted
- ✅ No orphaned records left in database

---

---

## FINAL ACCEPTANCE CRITERIA

### ✅ FUNCTIONAL REQUIREMENTS
- [ ] All three user roles can login
- [ ] Admin can perform CRUD on users, sections, subjects, exams
- [ ] Teacher can create materials, homework, quizzes, announcements
- [ ] Students can submit homework, take quizzes, view materials
- [ ] Cascade delete works without errors
- [ ] File uploads/downloads work
- [ ] Comments and reactions functional
- [ ] Quiz time enforcement works

### ✅ UI/UX REQUIREMENTS
- [ ] All text properly bilingual (Arabic/English)
- [ ] RTL/LTR display correct
- [ ] Mobile responsive (tested at 375×667)
- [ ] Icons 24px on mobile, 20px on desktop
- [ ] Visual hierarchy clear (headings, spacing, colors)
- [ ] No placeholder text visible
- [ ] Loading states visible

### ✅ ACCESSIBILITY REQUIREMENTS
- [ ] Full keyboard navigation (Tab, Enter, Escape, arrows)
- [ ] Focus rings visible on all interactive elements
- [ ] aria-labels on all action buttons
- [ ] aria-expanded on toggle buttons
- [ ] aria-current on active nav
- [ ] Error messages announced properly
- [ ] Dropdowns keyboard accessible

### ✅ PERFORMANCE REQUIREMENTS
- [ ] Page load time <3 seconds
- [ ] Dashboard interactive <2 seconds
- [ ] No memory leaks
- [ ] No infinite loops in console
- [ ] Rich editor doesn't freeze
- [ ] Smooth interactions

### ✅ ERROR HANDLING
- [ ] ErrorBoundary catches page errors
- [ ] Network errors handled gracefully
- [ ] Form validation prevents bad data
- [ ] Cascade delete handles missing records
- [ ] No unhandled promise rejections

### ✅ DATA INTEGRITY
- [ ] No orphaned records after delete
- [ ] Relations properly maintained
- [ ] Timestamps accurate
- [ ] User permissions enforced

---

## TEST EXECUTION NOTES

**Date Started:** _____________  
**Tester Name:** _____________  
**Browser/OS:** _____________  
**Viewport Sizes Tested:** _____________

### Issues Found:
```
[Document any bugs, regressions, or unexpected behavior here]

Issue 1:
- Page: 
- Steps: 
- Expected: 
- Actual: 
- Severity: [Critical/High/Medium/Low]
- Status: [New/In Progress/Fixed]
```

### Sign-Off:

- **Tester Signature:** _________________ **Date:** _____________
- **Reviewer Signature:** _________________ **Date:** _____________

---

## APPENDIX: REFERENCE DATA

### Test User Credentials
```
Admin:
  Email: admin@school.edu
  Password: Admin@12345
  
Teacher:
  Email: teacher@school.edu
  Password: Teacher@12345
  
Student:
  Email: student@school.edu
  Password: Student@12345
```

### Test Data to Create
- Section: "صف اختبار / Test Grade" with sections "شعبة أ / Section A"
- Subject: "رياضيات / Mathematics"
- Teachers: At least 1 assigned to test section
- Students: At least 5 assigned to test section
- Materials: At least 2 with different types (text, file, link)
- Homework: At least 2 with different submission types
- Quizzes: At least 1 with 3+ questions
- Exams: At least 1 scheduled for future date

### Important URLs
```
Frontend: http://localhost:3000
PocketBase Admin: http://127.0.0.1:8090/_/
Login (Arabic): http://localhost:3000/ar/login
Login (English): http://localhost:3000/en/login
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-16  
**Status:** READY FOR TESTING
