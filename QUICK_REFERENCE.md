# Manakher Codebase - Quick Reference

## Alert System Summary
**Used:** Native browser `alert()` and `confirm()` only
- NO custom modals, toasts, or dialog components
- All confirmations bilingual (Arabic/English)
- Success/error feedback via alert()

## Delete Operations Quick Map

### Admin Dashboard
| Page | Line | What | Type |
|------|------|------|------|
| sections/page.tsx | 100 | Section (+ cascade) | confirm + alert |
| subjects/page.tsx | 85 | Subject (+ cascade) | confirm + alert |
| students/page.tsx | 212 | Single student | confirm |
| teachers/page.tsx | 189 | Single teacher | confirm |
| announcements/page.tsx | 119 | Single announcement | confirm |
| exams/page.tsx | 166 | Single exam | confirm |
| moderation/page.tsx | 133-158 | Materials/Announcements/Comments | confirm x3 |

### Teacher Dashboard
| Page | Line | What | Type |
|------|------|------|------|
| materials/page.tsx | 161 | Single material | confirm |
| homework/page.tsx | 215 | Single homework | confirm |
| announcements/page.tsx | 121 | Single announcement | confirm |
| quizzes/page.tsx | 190, 225, 298 | Quiz creation, delete, questions | confirm x3 |

### Components
| Component | Line | What | Type |
|-----------|------|------|------|
| ui/comments.tsx | 86 | Single comment | confirm |
| ui/reactions.tsx | 88 | Reaction toggle | NO confirm |

## Design Tokens (CSS Variables)

### Colors
```
Primary accent: #5b21b6 (violet)
Admin role: #5b21b6 (violet)
Teacher role: #0d9488 (teal)
Student role: #ea580c (amber)
Danger: #dc2626 (red)
Success: #16a34a (green)
```

### Button Variants
- primary (violet, white text)
- secondary (violet subtle)
- ghost (transparent)
- danger (red)

### Badge Variants
- admin, teacher, student, accent, default

## UI Components
**Location:** `/src/components/ui/`
- button.tsx (4 variants, 4 sizes)
- card.tsx
- badge.tsx
- input.tsx
- stat-card.tsx
- rich-editor.tsx (Tiptap v3)
- rich-content.tsx (DOMPurify)
- comments.tsx
- reactions.tsx
- file-upload.tsx

## Styling
**File:** `/src/app/globals.css`
- Tailwind v4 with @theme inline
- All custom colors via CSS variables
- RTL/LTR support via text-align: start
- Dot-grid background pattern (.bg-surface-dotted)
- Rich content typography (.rich-content)

## Auth & Utils
**Location:** `/src/lib/`
- auth.ts: AuthUser type, getDisplayName(), getRoleDashboardPath()
- pocketbase.ts: getPocketBase(), pb export
- locale-config.ts: LOCALES, DEFAULT_LOCALE
- text-direction.ts: RTL detection for mixed-language content
- i18n.ts: getDictionary() (server-only)

## File Paths Reference
- Admin sections delete: `/frontend/src/app/[lang]/dashboard/admin/sections/page.tsx:91-165`
- Admin subjects delete: `/frontend/src/app/[lang]/dashboard/admin/subjects/page.tsx:76-144`
- Admin students delete: `/frontend/src/app/[lang]/dashboard/admin/students/page.tsx:211-220`
- Teacher materials delete: `/frontend/src/app/[lang]/dashboard/teacher/materials/page.tsx:160-165`
- Settings (school name): `/frontend/src/app/[lang]/dashboard/admin/settings/page.tsx:31-100`
- Buttons: `/frontend/src/components/ui/button.tsx:1-45`
- Badges: `/frontend/src/components/ui/badge.tsx:1-34`
- Global CSS: `/frontend/src/app/globals.css:1-222`

## Cascade Delete Pattern
1. Show confirm dialog with warning
2. Fetch related records by filter
3. Delete leaf nodes first (submissions → homework)
4. Remove relations from parents
5. Delete parent record last
6. Show success/error alert
7. Update UI state

## Key Limitation
**NO toast notification system** - all feedback is via `alert()` or `confirm()`

This is a gap for UX! Consider implementing Radix UI AlertDialog + Toast Sonner for M10.
