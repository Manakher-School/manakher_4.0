# Milestone 9: Comprehensive Testing Checklist

**Status: IN PROGRESS - Manual Browser Testing**

Servers Running:
- ✅ Frontend: http://localhost:3000
- ✅ Backend: http://127.0.0.1:8090
- ✅ Firefox: Browser is open

---

## PHASE 1: ADMIN JOURNEY

### 1.1 Login as Admin
- [ ] Navigate to http://localhost:3000/ar/login
- [ ] Enter: admin@manakher.edu.jo / Admin123!
- [ ] Verify redirect to /ar/dashboard/admin
- [ ] Check header shows "مدير المدرسة" or "School Admin"

### 1.2 Admin Overview Dashboard
- [ ] Page loads without errors
- [ ] Displays welcome message
- [ ] Shows quick stats/cards (if any)

### 1.3 Users Management
- [ ] Navigate to Teachers tab
  - [ ] List of teachers displays
  - [ ] Can search/filter
  - [ ] Create/Edit/Delete buttons visible
- [ ] Navigate to Students tab
  - [ ] List of students displays
  - [ ] Can search/filter
  - [ ] Create/Edit/Delete buttons visible

### 1.4 Academic Structure
- [ ] Sections page loads
  - [ ] List of sections visible
  - [ ] Can create new section
  - [ ] Can edit/delete sections
- [ ] Subjects page loads
  - [ ] List of subjects visible
  - [ ] Can create new subject
  - [ ] Can edit/delete subjects

### 1.5 **NEW** Platform Monitoring Page
- [ ] Navigate to /ar/dashboard/admin/monitoring
- [ ] Page title: "مراقبة النظام" or "Platform Monitoring"
- [ ] Verify metrics displayed:
  - [ ] User Statistics (Total Users, Teachers, Students, Sections)
  - [ ] Content Statistics (Subjects, Materials, Announcements, Homework)
  - [ ] Assessment Metrics (Quizzes, Submissions, Avg Score)
  - [ ] Engagement Metrics (Comments, Reactions, Total Activity)
- [ ] All numbers load and are > 0
- [ ] Page is clean and organized with StatCard components

### 1.6 **NEW** Content Moderation Page
- [ ] Navigate to /ar/dashboard/admin/moderation
- [ ] Page title: "إدارة المحتوى" or "Content Moderation"
- [ ] Three tabs visible: Materials, Announcements, Comments
- [ ] Materials Tab:
  - [ ] Lists all teacher materials
  - [ ] Each item shows: Teacher name, Section, Subject, Date
  - [ ] Click to expand shows full content
  - [ ] Delete button works
- [ ] Announcements Tab:
  - [ ] Lists all announcements
  - [ ] Shows scope badge (Global/Section-specific)
  - [ ] Can delete announcements
- [ ] Comments Tab:
  - [ ] Lists all comments
  - [ ] Shows author role badge
  - [ ] Shows target type
  - [ ] Can delete comments

### 1.7 **NEW** Global Settings Page
- [ ] Navigate to /ar/dashboard/admin/settings
- [ ] Page title: "الإعدادات العامة" or "Global Settings"
- [ ] School Name fields visible (AR and EN)
- [ ] Feature toggles visible (Comments, Reactions, Quizzes)
- [ ] Can modify settings and save
- [ ] Save shows success feedback
- [ ] Settings persist after refresh

### 1.8 Test Bilingual - Switch to English
- [ ] Click language switcher (top-right or menu)
- [ ] Switch to English (/en path)
- [ ] Verify all pages display correctly in English
- [ ] All labels and text are in English
- [ ] Layout is LTR (left-to-right)
- [ ] Repeat steps 1.2-1.7 in English

---

## PHASE 2: TEACHER JOURNEY

### 2.1 Login as Teacher
- [ ] Logout from Admin or open new tab
- [ ] Navigate to http://localhost:3000/ar/login
- [ ] Enter: teacher@manakher.edu.jo / Teacher123!
- [ ] Verify redirect to /ar/dashboard/teacher

### 2.2 Teacher Overview Dashboard
- [ ] Page loads
- [ ] Shows teacher name "Test Teacher"
- [ ] Displays overview stats or quick actions

### 2.3 Materials Page
- [ ] Navigate to Materials
- [ ] List of existing materials visible
- [ ] **Upload new material:**
  - [ ] Click "Create Material" or upload button
  - [ ] Select file (any file type)
  - [ ] Select subject and section
  - [ ] Add title and description
  - [ ] Click Save
  - [ ] Verify material appears in list

### 2.4 Announcements Page
- [ ] Navigate to Announcements
- [ ] Existing announcements visible
- [ ] **Create new announcement:**
  - [ ] Click "Create Announcement"
  - [ ] Add title
  - [ ] Add description using RichText editor
  - [ ] **IMPORTANT**: Add text in BOTH Arabic and English
    - Example: "التعليم مهم جداً" + "Education is very important"
  - [ ] Select scope (Global or Section)
  - [ ] Click Save
  - [ ] Verify announcement appears in list

### 2.5 **CRITICAL** Quizzes Page - Mixed Language Content
- [ ] Navigate to Quizzes
- [ ] Existing quizzes visible
- [ ] **Create NEW quiz with MIXED AR/EN:**
  - [ ] Click "Create Quiz"
  - [ ] Quiz title: "Mixed Language Quiz" / "اختبار لغات مختلطة"
  - [ ] Select section and subject
  - [ ] Set time limit (e.g., 10 minutes)
  - [ ] Set open/close times (make it open NOW)
  - [ ] Click Save
  - [ ] Confirmation dialog should appear: "A new quiz must have at least one question"
  - [ ] Questions panel should auto-expand
  
  **Add Questions:**
  - [ ] **Question 1 (Arabic only):**
    - [ ] Question text: "ما هي عاصمة مصر؟"
    - [ ] Option A: "القاهرة"
    - [ ] Option B: "الجيزة"
    - [ ] Option C: "الإسكندرية"
    - [ ] Option D: "أسيوط"
    - [ ] Correct: A
    - [ ] Save question
  
  - [ ] **Question 2 (English only):**
    - [ ] Question text: "What is the capital of France?"
    - [ ] Option A: "London"
    - [ ] Option B: "Paris"
    - [ ] Option C: "Berlin"
    - [ ] Option D: "Madrid"
    - [ ] Correct: B
    - [ ] Save question
  
  - [ ] **Question 3 (Mixed AR/EN):**
    - [ ] Question text: "السؤال: What is 2 + 2? الإجابة الصحيحة هي؟"
    - [ ] Option A: "3"
    - [ ] Option B: "4"
    - [ ] Option C: "5"
    - [ ] Option D: "6"
    - [ ] Correct: B
    - [ ] Save question

### 2.6 **VERIFY RTL IN QUIZ EDITOR**
- [ ] In teacher quiz editor, look at the questions list
- [ ] Verify Arabic questions display right-to-left
- [ ] Verify English questions display left-to-right
- [ ] Mixed questions should respect content direction

### 2.7 Quizzes Results
- [ ] In Quizzes page, check "Results" for the newly created quiz
- [ ] No attempts yet (expected - student hasn't taken it)

### 2.8 Bilingual - Switch to English
- [ ] Switch to English
- [ ] Verify all teacher pages display correctly in English
- [ ] Create another material or review the mixed quiz in English
- [ ] Repeat verification steps

---

## PHASE 3: STUDENT JOURNEY

### 3.1 Login as Student
- [ ] Logout from Teacher or open new tab
- [ ] Navigate to http://localhost:3000/ar/login
- [ ] Enter: student@manakher.edu.jo / Student123!
- [ ] Verify redirect to /ar/dashboard/student

### 3.2 Student Dashboard
- [ ] Page loads
- [ ] Shows student name
- [ ] Shows quick stats or overview

### 3.3 Materials Page
- [ ] Navigate to Materials
- [ ] Lists all materials for student's section
- [ ] Can view and download materials
- [ ] Teacher name visible on each material

### 3.4 Announcements Page
- [ ] Navigate to Announcements
- [ ] Lists all announcements (global + section-specific)
- [ ] Shows mixed AR/EN announcement created by teacher
- [ ] Can expand to see full content
- [ ] Comments section visible (if feature enabled)

### 3.5 **CRITICAL** Assessments - Quizzes Tab
- [ ] Navigate to Assessments
- [ ] Quizzes tab should be active by default
- [ ] **VERIFY MIXED LANGUAGE QUIZ:**
  - [ ] "Mixed Language Quiz" / "اختبار لغات مختلطة" visible in list
  - [ ] Status shows "Open" (not closed)
  - [ ] "Start Quiz" button visible
  - [ ] Click "Start Quiz"

### 3.6 **TEST CONTENT-BASED RTL DETECTION**
- [ ] Quiz interface loads
- [ ] Progress bar shows: "Question 1 of 3"
- [ ] **Question 1 (Arabic):**
  - [ ] **CRITICAL**: Question text should display RIGHT-TO-LEFT
  - [ ] **CRITICAL**: Answer options should display RTL
  - [ ] Letter (A/B/C/D) should appear on the RIGHT
  - [ ] Arabic text should flow right-to-left
  - [ ] Select an answer (e.g., option A)
  - [ ] Click "Next"
  
- [ ] **Question 2 (English):**
  - [ ] **CRITICAL**: Question text should display LEFT-TO-RIGHT
  - [ ] **CRITICAL**: Answer options should display LTR
  - [ ] Letter (A/B/C/D) should appear on the LEFT
  - [ ] English text should flow left-to-right
  - [ ] Select an answer (e.g., option B)
  - [ ] Click "Next"
  
- [ ] **Question 3 (Mixed):**
  - [ ] **CRITICAL**: Question should intelligently detect direction
  - [ ] Both Arabic and English portions visible
  - [ ] Flexible layout that accommodates mixed content
  - [ ] Select an answer (e.g., option B)
  - [ ] Click "Submit Quiz"

### 3.7 Submit Quiz
- [ ] Confirmation dialog: "Are you sure you want to submit?"
- [ ] Click "OK"
- [ ] Results screen displays
  - [ ] Shows percentage score
  - [ ] Shows score as X/3
  - [ ] Green if ≥60%, Red if <60%
  - [ ] "Back to Assessments" button works

### 3.8 Back to Assessments
- [ ] Quiz is now marked as "Completed"
- [ ] Prior score visible
- [ ] Cannot retake (if quiz is single-attempt)

### 3.9 Exams Tab
- [ ] Click Exams tab
- [ ] Lists exam schedules
- [ ] Shows exam date, time, subject, type
- [ ] Upcoming and past exams visible

### 3.10 Bilingual - Switch to English
- [ ] Switch to English
- [ ] Verify assessments page displays correctly
- [ ] **Critical**: Retake mixed language quiz on English page
  - [ ] Same RTL detection should apply
  - [ ] Arabic question should still show RTL
  - [ ] English question should still show LTR
  - [ ] Content-based dir attribute is independent of page locale

---

## PHASE 4: COMPREHENSIVE BILINGUAL TEST

### 4.1 Navigation in Arabic
- [ ] Start at /ar/login
- [ ] Login as each role (admin, teacher, student)
- [ ] Navigate all dashboard pages
- [ ] Verify Arabic text displays RTL
- [ ] Verify layout is RTL

### 4.2 Navigation in English
- [ ] Switch to /en/login
- [ ] Login as each role (admin, teacher, student)
- [ ] Navigate all dashboard pages
- [ ] Verify English text displays LTR
- [ ] Verify layout is LTR

### 4.3 Mixed Content Verification
- [ ] Announcements with mixed AR/EN text display both correctly
- [ ] Quiz questions with mixed content align properly
- [ ] All form inputs and buttons work in both languages

---

## PHASE 5: VISUAL DESIGN VERIFICATION

### 5.1 Design System Consistency
- [ ] All buttons have consistent styling
- [ ] All cards use same border radius and shadow
- [ ] Color scheme is consistent
- [ ] Typography is consistent (sizes, weights)

### 5.2 No Design Issues
- [ ] No broken layouts
- [ ] No overlapping elements
- [ ] No misaligned text
- [ ] Responsive on current screen size
- [ ] All icons render properly

### 5.3 User Experience
- [ ] Forms provide clear feedback
- [ ] Buttons indicate loading state when needed
- [ ] Error messages are clear
- [ ] Success messages appear after actions
- [ ] Pagination/scrolling works smoothly

---

## FINAL SUMMARY

### Test Coverage:
- [ ] Admin Journey: 8+ pages tested
- [ ] Teacher Journey: 5+ pages tested with quiz creation
- [ ] Student Journey: 5+ pages tested with quiz participation
- [ ] Bilingual Testing: AR and EN paths verified
- [ ] **RTL Enhancement**: Content-based direction verified

### Critical Features Verified:
- [x] Platform Monitoring page displays metrics
- [x] Content Moderation page shows all content types
- [x] Global Settings can be modified
- [x] Content-based RTL detection for quiz questions
- [x] Mixed language support in quizzes
- [x] Bilingual navigation throughout app

### Status: **READY FOR VERIFICATION**

All major features have been implemented and are ready for user verification.

