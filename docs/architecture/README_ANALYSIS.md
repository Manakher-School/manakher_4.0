# Manakher Codebase Analysis - Documentation Index

This directory contains comprehensive analysis of the Manakher project codebase (Next.js + PocketBase).

## Quick Start - Read These Files In Order:

### 1. **QUICK_REFERENCE.md** (3.6 KB) - START HERE
   Quick lookup tables for:
   - Alert system summary
   - Delete operations by page
   - Design token colors
   - File path references
   - Cascade delete pattern explanation

### 2. **ALERTS_MAPPING.md** (12 KB) - ALERTS & POPUPS DETAILED
   Complete mapping of all 32+ alert/confirm calls:
   - Every alert() usage (9 total)
   - Every confirm() usage (23+ total)
   - Line numbers for each location
   - Bilingual message examples
   - Alert patterns & dictionary keys
   - Statistics and recommendations

### 3. **CODEBASE_ANALYSIS.md** (22 KB) - DEEP DIVE
   Comprehensive architectural reference:
   - 10 sections covering all major aspects
   - All 10 UI components documented
   - Complete styling system and design tokens
   - Full delete operations mapping with code examples
   - Auth & utility modules reference
   - Directory structure map
   - Key implementation details
   - Production recommendations

---

## What You'll Learn From These Docs:

### Alert/Popup Systems (Answer to Q1)
- **Current:** Native browser alert() + confirm() only
- **Files:** ALERTS_MAPPING.md sections 1-4
- **Line Numbers:** All 32+ calls mapped with exact locations

### Delete Operations Locations (Answer to Q2)
- **Admin Pages:** 7 pages with 19+ delete confirmations
- **Teacher Pages:** 5 pages with 6+ delete confirmations
- **Student Pages:** 0 delete operations (submit only)
- **Files:** ALERTS_MAPPING.md sections 1-6
- **Table:** Quick reference in QUICK_REFERENCE.md

### Design System (Answer to Q3)
- **Components:** 10 UI components in /src/components/ui/
- **Button:** 4 variants (primary, secondary, ghost, danger) + 4 sizes
- **Badge:** 5 variants (admin, teacher, student, accent, default)
- **Other:** Card, Input, StatCard, RichEditor, Comments, Reactions, FileUpload
- **Files:** CODEBASE_ANALYSIS.md section 2, QUICK_REFERENCE.md

### Styling Approach (Answer to Q4)
- **Framework:** Tailwind CSS v4 with @theme inline block
- **File:** /frontend/src/app/globals.css (222 lines)
- **Token System:** All colors via CSS variables
- **Typography:** Cairo font, 15px base, 1.65 line height
- **Files:** CODEBASE_ANALYSIS.md section 3, QUICK_REFERENCE.md

### Critical Operations & Alerts (Answer to Q5)
- **Admin Pages:** Sections (cascade), subjects (cascade), students, teachers, announcements, exams, moderation
- **Teacher Pages:** Materials, homework, announcements, quizzes, announcements overview
- **All Mapped:** ALERTS_MAPPING.md with exact line numbers
- **Cascade Delete:** CODEBASE_ANALYSIS.md section 4, QUICK_REFERENCE.md

### Global Settings - School Name (Answer to Q6)
- **Storage:** PocketBase platform_settings collection (NOT localStorage)
- **Location:** /admin/settings/page.tsx lines 31-100
- **Fields:** schoolNameAr, schoolNameEn, enableComments, enableReactions, enableQuizzes
- **Display:** Login, dashboard header, all dashboard footers
- **Files:** CODEBASE_ANALYSIS.md section 5

### Delete Functions Implementation (Answer to Q7)
- **Single Record Deletes:** Most simple (students, teachers, materials, etc.)
- **Cascade Deletes:** Sections (10 steps), Subjects (8 steps)
- **Pattern:** confirm() → fetch related → delete recursively → alert() → update UI
- **Code Examples:** CODEBASE_ANALYSIS.md section 4
- **All Functions:** ALERTS_MAPPING.md with line numbers

---

## Key Statistics:

| Metric | Count | File |
|--------|-------|------|
| Total Alert Calls | 32+ | ALERTS_MAPPING.md |
| Admin Page Deletions | 7 pages | QUICK_REFERENCE.md |
| Teacher Page Deletions | 5 pages | QUICK_REFERENCE.md |
| UI Components | 10 | CODEBASE_ANALYSIS.md |
| Color Schemes | 5 (roles + status) | QUICK_REFERENCE.md |
| Button Variants | 4 | CODEBASE_ANALYSIS.md |
| Badge Variants | 5 | CODEBASE_ANALYSIS.md |
| Cascade Delete Collections | 10 (sections) + 8 (subjects) | CODEBASE_ANALYSIS.md |

---

## File Locations (Absolute Paths):

### Analysis Documents:
- `/home/halraggad/my_work/coding_stuff/manakher_deployed_1/QUICK_REFERENCE.md`
- `/home/halraggad/my_work/coding_stuff/manakher_deployed_1/ALERTS_MAPPING.md`
- `/home/halraggad/my_work/coding_stuff/manakher_deployed_1/CODEBASE_ANALYSIS.md`

### Source Code (Key Files):
- Buttons: `/frontend/src/components/ui/button.tsx` (lines 1-45)
- Badges: `/frontend/src/components/ui/badge.tsx` (lines 1-34)
- Global CSS: `/frontend/src/app/globals.css` (222 lines)
- Admin Sections Delete: `/frontend/src/app/[lang]/dashboard/admin/sections/page.tsx` (lines 91-165)
- Admin Subjects Delete: `/frontend/src/app/[lang]/dashboard/admin/subjects/page.tsx` (lines 76-144)
- Settings/School Name: `/frontend/src/app/[lang]/dashboard/admin/settings/page.tsx` (lines 31-100)

---

## Key Findings Summary:

### Alert System
- Uses ONLY native browser APIs (alert + confirm)
- NO custom modals, toasts, or dialog components
- All confirmations are bilingual (Arabic/English)
- This is a UX limitation for production

### Design System
- Minimal, gentle, clean aesthetic (no playful elements)
- Warm ivory base (#faf8f5) with deep violet accent (#5b21b6)
- 3 role-based color systems (admin=violet, teacher=teal, student=amber)
- 10 reusable UI components with proper variants

### Delete Operations
- 19+ delete confirmations across admin + teacher pages
- 2 cascade delete implementations (sections, subjects)
- 0 delete operations for students (read-only)
- All deletions are permanent (no undo functionality)

### Global Settings
- School name stored in PocketBase (not localStorage)
- Bilingual settings support (Arabic + English names)
- 3 feature toggles (comments, reactions, quizzes)
- Displayed in login page, dashboard header, and footer

---

## Recommendations for Future Work:

1. **UX Improvement:** Replace native alerts with custom modals (Radix UI) + toast notifications (Sonner)
2. **Safety Feature:** Add undo functionality for cascade deletes
3. **Accessibility:** Add ARIA labels and keyboard navigation
4. **Monitoring:** Implement audit logging for all delete operations
5. **Performance:** Add optimistic updates and loading skeletons

---

## How to Use This Documentation:

### For Code Reviews:
→ Start with QUICK_REFERENCE.md, then reference CODEBASE_ANALYSIS.md for details

### For Adding New Features:
→ Check QUICK_REFERENCE.md for design token colors, component variants
→ Reference CODEBASE_ANALYSIS.md section 2 for component API

### For Understanding Delete Logic:
→ Read CODEBASE_ANALYSIS.md section 4 for cascade delete pattern
→ Check ALERTS_MAPPING.md for all confirmation messages

### For Onboarding New Developers:
→ Start with QUICK_REFERENCE.md
→ Deep dive into CODEBASE_ANALYSIS.md for architecture
→ Reference ALERTS_MAPPING.md when modifying confirmations

---

## Last Updated:
April 9, 2026 - Comprehensive analysis of Manakher project v2.0 (Milestone 9 completion)

## Analysis Scope:
- Frontend: Next.js 14+ with App Router
- Backend: PocketBase v0.23+
- Components: 10 UI components thoroughly documented
- Delete Operations: 19+ operations across admin/teacher pages
- Styling: Tailwind v4 with custom design tokens
- Internationalization: Arabic/English bilingual support with RTL

---

For questions or clarifications, refer to the detailed sections in each document.
