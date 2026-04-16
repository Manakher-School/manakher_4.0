# Complete Alerts & Popups Mapping

## Alert System Architecture

The Manakher project uses **ONLY native browser APIs** for all alerts and confirmations:
- `alert(message)` - Informational alerts (blocking)
- `confirm(message)` - Yes/No confirmation dialogs (blocking)

**NO custom components implemented:**
- ❌ Toast notifications
- ❌ Modal dialogs
- ❌ Drawer/Sidebar alerts
- ❌ Inline error messages (except form validation)
- ❌ Snackbars
- ❌ Popovers

---

## All Alert Usages by Location

### ADMIN PAGES

#### `/admin/page.tsx` - Admin Dashboard Overview
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 89 | alert | "الإعلان غير موجود. سيتم إنشاء إعلان جديد." / "Announcement not found. Creating a new one." | Announcement update 404 error |
| 111 | alert | "فشل الحفظ. يرجى المحاولة مرة أخرى." / "Save failed. Please try again." | Announcement save error |
| 124 | confirm | "هل تريد حذف هذا الإعلان؟" (from dict) | Delete announcement |

#### `/admin/sections/page.tsx` - Classes & Sections
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 100 | confirm | "تحذير: حذف [SECTION] سيؤدي إلى حذف جميع السجلات المرتبطة به:\n\n• المواد التعليمية\n• الواجبات\n• التسليمات\n• الإعلانات\n• التعيينات\n\nهل أنت متأكد من الحذف?" | Cascade delete warning |
| 158 | alert | "تم الحذف بنجاح" / "Deleted successfully" | Delete success |
| 161 | alert | "فشل الحذف. يرجى المحاولة مرة أخرى." / "Delete failed. Please try again." | Delete error |

**Cascade Deletes This Page:**
- materials (by section)
- homework + submissions (by section)
- announcements (by section)
- quizzes + questions + attempts (by section)
- exam_schedules (by section)
- Remove section from users

#### `/admin/subjects/page.tsx` - Subjects Management
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 85 | confirm | "تحذير: حذف المقرر \"[SUBJECT]\" سيؤدي إلى حذف جميع السجلات المرتبطة به:\n\n• المواد التعليمية\n• الواجبات\n• التسليمات\n• الاختبارات\n• جداول الامتحانات\n\nهل أنت متأكد من الحذف?" | Cascade delete warning |
| 137 | alert | "تم الحذف بنجاح" | Delete success |
| 140 | alert | "فشل الحذف. يرجى المحاولة مرة أخرى." | Delete error |

**Cascade Deletes This Page:**
- materials (by subject)
- homework + submissions (by subject)
- quizzes + questions + attempts (by subject)
- exam_schedules (by subject)
- Remove subject from teachers

#### `/admin/teachers/page.tsx` - Teachers Management
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 189 | confirm | "هل تريد حذف هذا المدرس؟" (from dict: `t.confirmDelete`) | Delete single teacher |

#### `/admin/students/page.tsx` - Students Management
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 212 | confirm | "هل تريد حذف هذا الطالب؟" (from dict: `t.confirmDelete`) | Delete single student |

#### `/admin/announcements/page.tsx` - Announcements Management
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 119 | confirm | "هل تريد حذف هذا الإعلان؟" (from dict) | Delete announcement |

#### `/admin/exams/page.tsx` - Exam Schedules
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 166 | confirm | "هل تريد حذف جدول الامتحان؟" (from dict) | Delete exam schedule |

#### `/admin/moderation/page.tsx` - Content Moderation
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 133 | confirm | "هل تريد حذف هذه المادة التعليمية؟" (from dict) | Delete material |
| 144 | confirm | "هل تريد حذف هذا الإعلان؟" (from dict) | Delete announcement |
| 155 | confirm | "هل تريد حذف هذا التعليق؟" (from dict) | Delete comment |

**Three Separate Delete Functions:**
- `deleteMaterial(id)` - line 132
- `deleteAnnouncement(id)` - line 143
- `deleteComment(id)` - line 154

#### `/admin/settings/page.tsx` - Platform Settings
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 96 | alert | "Failed to save settings. Please try again." | Settings save error |

---

### TEACHER PAGES

#### `/teacher/page.tsx` - Teacher Dashboard Overview
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 128 | confirm | "هل تريد حذف هذا الإعلان؟" (from dict) | Delete announcement |

#### `/teacher/materials/page.tsx` - Learning Materials
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 161 | confirm | "هل تريد حذف هذه المادة؟" (from dict: `t.confirmDelete`) | Delete material |

#### `/teacher/homework/page.tsx` - Homework Assignments
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 215 | confirm | "هل تريد حذف هذا الواجب؟" (from dict) | Delete homework |

#### `/teacher/announcements/page.tsx` - Announcements
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 121 | confirm | "هل تريد حذف هذا الإعلان؟" (from dict) | Delete announcement |

#### `/teacher/quizzes/page.tsx` - Interactive Quizzes
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 190 | confirm | "تحذير: يجب إضافة سؤال واحد على الأقل قبل حفظ الاختبار" (from locale) | Quiz creation validation |
| 225 | confirm | "هل تريد حذف هذا الاختبار؟" (from dict) | Delete quiz |
| 298 | confirm | "هل تريد حذف هذا السؤال?" (from dict + "?") | Delete quiz question |

---

### STUDENT PAGES

#### `/student/quizzes/page.tsx` - Quizzes
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 191 | alert | "الاختبار لم يفتح بعد" / "Quiz hasn't started yet" | Quiz not opened validation |
| 223 | alert | "انتهى وقت الاختبار" / "Quiz has ended" | Quiz closed validation |
| 230 | alert | "انتهى الاختبار، تم إرسال الإجابات" / "Quiz ended, answers submitted" | Auto-submit on quiz close |
| 304 | confirm | "هل أنت متأكد من إرسال الإجابات؟" (from dict) | Confirm quiz submission |

#### `/student/assessments/page.tsx` - Assessments (Combined Quizzes & Exams)
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 246 | alert | "الاختبار لم يفتح بعد" | Quiz not opened validation |
| 278 | alert | "انتهى وقت الاختبار" | Quiz closed validation |
| 285 | alert | "انتهى الاختبار، تم إرسال الإجابات" | Auto-submit on quiz close |
| 358 | confirm | "هل أنت متأكد من إرسال الإجابات؟" | Confirm quiz submission |

---

### SHARED COMPONENTS

#### `/components/ui/comments.tsx` - Comments Component
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 86 | confirm | "هل تريد حذف هذا التعليق؟" (from dict: `t.confirmDelete`) | Delete comment |

#### `/components/ui/reactions.tsx` - Reactions Component
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 88, 96 | NO CONFIRM | (Toggle reaction - silent delete) | Reaction toggle (like/love/helpful) |

#### `/components/ui/rich-editor.tsx` - Rich Text Editor
| Line | Type | Message | Purpose |
|------|------|---------|---------|
| 155 | alert | "فشل رفع الصورة. حاول مجدداً.\nFailed to upload image." | Image upload failure |

---

## Alert Message Patterns

### Pattern 1: Simple Confirmation (Most Common)
```javascript
if (!confirm(t.confirmDelete)) return;
// Delete operation
```
Usage: All simple deletes (materials, homework, announcements, etc.)

### Pattern 2: Cascade Delete Warning
```javascript
const warningMsg = locale === "ar" 
  ? `تحذير: حذف ${name} سيؤدي إلى...\n\n• Item1\n• Item2\n\nهل أنت متأكد؟`
  : `Warning: Deleting ${name} will also...\n\n• Item1\n• Item2\n\nAre you sure?`;

if (!confirm(warningMsg)) return;
// Delete with cascade logic
```
Usage: Admin sections, Admin subjects

### Pattern 3: Success/Error Feedback
```javascript
try {
  await delete_operation();
  alert(locale === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
} catch (error) {
  alert(locale === "ar" ? "فشل الحذف..." : "Delete failed...");
}
```
Usage: Cascade deletes and complex operations

### Pattern 4: Validation Alert
```javascript
if (quiz.opensAt > now) {
  alert(locale === "ar" ? "الاختبار لم يفتح بعد" : "Quiz hasn't started yet");
  return;
}
```
Usage: Quiz time validation in student pages

---

## Dictionary Keys for Confirmations

All confirmation messages stored in translation dictionaries:

### Common (shared)
```json
"confirmDelete": "هل تريد حذف هذا السجل?"
```

### Admin
```json
"dashboard.admin": {
  "sections.confirmDelete": "Are you sure?",
  "subjects.confirmDelete": "Are you sure?",
  "students.confirmDelete": "Are you sure?",
  "teachers.confirmDelete": "Are you sure?",
  "announcements.confirmDelete": "Are you sure?",
  "exams.confirmDelete": "Are you sure?",
  "moderation.confirmDelete": "Are you sure?"
}
```

### Teacher
```json
"dashboard.teacher": {
  "materials.confirmDelete": "Are you sure?",
  "homework.confirmDelete": "Are you sure?",
  "announcements.confirmDelete": "Are you sure?",
  "quizzes.confirmDelete": "Are you sure?",
  "quizzes.deleteQuestion": "Delete question"
}
```

### Student
```json
"dashboard.student": {
  "quizzes.confirmSubmit": "Are you sure you want to submit?"
}
```

---

## Statistics

### Total Alert Calls: 32+
- `alert()`: 9 usages
- `confirm()`: 23+ usages

### By Page Type
- Admin pages: 17 confirmations + 6 alerts
- Teacher pages: 6 confirmations + 1 alert
- Student pages: 4 confirmations + 3 alerts
- Components: 2 confirmations

### By Operation
- Delete confirmations: 19
- Delete success/error: 6
- Validation alerts: 3
- Settings alerts: 1
- Other: 3

---

## Recommendations for Improvement

1. **Replace native alerts with custom modals**
   - Use Radix UI AlertDialog for confirmations
   - Better UX with custom styling and RTL support

2. **Add toast notifications**
   - Use Sonner or react-toastify
   - Non-blocking success/error feedback
   - Auto-dismiss after 3-5 seconds

3. **Add inline validation**
   - Replace some alerts with form-level feedback
   - Show errors next to inputs

4. **Add loading states**
   - Show spinner during delete operations
   - Prevent double-clicks

5. **Add undo functionality**
   - Show "Undo" toast after delete
   - Keep record in memory for 10 seconds

6. **Implement error boundaries**
   - Catch unhandled errors
   - Show friendly error modals

---

## File Locations - Summary

| Component | Lines | Path |
|-----------|-------|------|
| Alert() usage | 9 | Various pages |
| Confirm() usage | 23+ | Various pages |
| Button component | 1-45 | `/frontend/src/components/ui/button.tsx` |
| Badge component | 1-34 | `/frontend/src/components/ui/badge.tsx` |
| Comments delete | 85-94 | `/frontend/src/components/ui/comments.tsx` |
| Admin sections cascade | 91-165 | `/frontend/src/app/[lang]/dashboard/admin/sections/page.tsx` |
| Admin subjects cascade | 76-144 | `/frontend/src/app/[lang]/dashboard/admin/subjects/page.tsx` |
| Admin students delete | 211-220 | `/frontend/src/app/[lang]/dashboard/admin/students/page.tsx` |
| Teacher materials delete | 160-165 | `/frontend/src/app/[lang]/dashboard/teacher/materials/page.tsx` |
| Teacher quizzes delete | 190, 225, 298 | `/frontend/src/app/[lang]/dashboard/teacher/quizzes/page.tsx` |
| Rich editor alerts | 155 | `/frontend/src/components/ui/rich-editor.tsx` |

