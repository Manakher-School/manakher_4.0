# Manakher Project - Codebase Structure Analysis

## PROJECT OVERVIEW
- **Frontend:** Next.js (App Router with [lang] dynamic segments for i18n)
- **Backend:** PocketBase v0.23+
- **Styling:** Tailwind CSS v4 with custom CSS variables and globals.css
- **Architecture:** Server/Client components with proper auth guards

---

## 1. ALERT/POPUP SYSTEMS ANALYSIS

### Current Implementation: Browser Native Alerts & Confirms
The codebase uses **native browser APIs** for all user confirmations and alerts:

#### Alert() Usage (Informational messages):
| Location | Line | Purpose |
|----------|------|---------|
| `/admin/sections/page.tsx` | 158, 161 | Delete success/failure feedback |
| `/admin/subjects/page.tsx` | 137, 140 | Delete success/failure feedback |
| `/admin/page.tsx` | 89, 111 | Announcement not found, save errors |
| `/admin/settings/page.tsx` | 96 | Settings save error |
| `/student/quizzes/page.tsx` | 191, 223, 230 | Quiz time validation errors |
| `/student/assessments/page.tsx` | 246, 278, 285 | Quiz time validation errors |
| `/ui/rich-editor.tsx` | 155 | Image upload failure |
| `/ui/comments.tsx` | Error logging only (no alert) | Comment operations |

#### Confirm() Usage (Confirmation dialogs):
| Location | Line | Purpose | Bilingual |
|----------|------|---------|-----------|
| `/admin/sections/page.tsx` | 100 | Section cascade delete warning | YES |
| `/admin/subjects/page.tsx` | 85 | Subject cascade delete warning | YES |
| `/admin/students/page.tsx` | 212 | Student delete confirmation | From dict |
| `/admin/teachers/page.tsx` | 189 | Teacher delete confirmation | From dict |
| `/admin/announcements/page.tsx` | 119 | Announcement delete | From dict |
| `/admin/exams/page.tsx` | 166 | Exam schedule delete | From dict |
| `/admin/moderation/page.tsx` | 133, 144, 155 | Content delete (materials, announcements, comments) | From dict |
| `/admin/page.tsx` | 124 | Announcement delete (overview) | From dict |
| `/teacher/page.tsx` | 128 | Announcement delete (overview) | From dict |
| `/teacher/materials/page.tsx` | 161 | Material delete | From dict |
| `/teacher/homework/page.tsx` | 215 | Homework delete | From dict |
| `/teacher/announcements/page.tsx` | 121 | Announcement delete | From dict |
| `/teacher/quizzes/page.tsx` | 190, 225, 298 | Quiz delete, quiz creation warning, question delete | From dict |
| `/student/quizzes/page.tsx` | 304 | Quiz submission confirmation | From dict |
| `/student/assessments/page.tsx` | 358 | Quiz submission confirmation | From dict |
| `/ui/comments.tsx` | 86 | Comment delete | From dict |

### Cascade Delete Warnings (Enhanced)
Two pages use comprehensive bilingual warnings:

**Section Delete (`/admin/sections/page.tsx` lines 91-165):**
```
Warning: Deleting [SECTION NAME] will also delete all related records:
• Learning materials
• Homework
• Submissions
• Announcements
• Assignments

Are you sure you want to delete?
```

**Subject Delete (`/admin/subjects/page.tsx` lines 76-144):**
```
Warning: Deleting subject "[SUBJECT NAME]" will also delete all related records:
• Learning materials
• Homework
• Submissions
• Quizzes
• Exam schedules

Are you sure you want to delete?
```

**Note:** NO custom toast notifications, modals, or custom alert components are implemented. This is a limitation for complex UX patterns.

---

## 2. UI COMPONENT DESIGN SYSTEM

### Location: `/frontend/src/components/ui/`

#### Core Components:
| Component | File | Purpose | Variants |
|-----------|------|---------|----------|
| **Button** | `button.tsx` | Reusable button | primary, secondary, ghost, danger |
| **Card** | `card.tsx` | Container for content | default (no variants) |
| **Badge** | `badge.tsx` | Role/status indicators | default, admin, teacher, student, accent |
| **Input** | `input.tsx` | Text input field | default (no variants) |
| **StatCard** | `stat-card.tsx` | Dashboard stat display | 4 color slots via nth-child |
| **RichEditor** | `rich-editor.tsx` | Tiptap v3 editor | Full toolbar with RTL support |
| **RichContent** | `rich-content.tsx` | HTML renderer (DOMPurify sanitized) | .rich-content CSS class |
| **Comments** | `comments.tsx` | Comment thread UI | Collapsible with delete |
| **Reactions** | `reactions.tsx` | Emoji reactions (like/love/helpful) | 3 reaction types |
| **FileUpload** | `file-upload.tsx` | File picker component | default |

### Button Variants Details (`button.tsx`):
```typescript
primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] 
          shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
secondary: "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] 
           hover:bg-[var(--color-accent)] hover:text-white"
ghost: "bg-transparent text-[var(--color-ink-secondary)] 
        hover:bg-[var(--color-surface-hover)]"
danger: "bg-[var(--color-danger-subtle)] text-[var(--color-danger-text)] 
        hover:bg-[var(--color-danger)]"
```

### Button Size Variants (`button.tsx`):
```
default: px-4 py-2.5 text-sm
sm: px-3 py-1.5 text-xs
lg: px-6 py-3 text-base
icon: p-2
```

### Badge Variants (`badge.tsx`):
- `default`: Neutral background
- `admin`: Purple (#5b21b6 bold, #ede9fe bg, #4c1d95 text)
- `teacher`: Teal (#0d9488 bold, #ccfbf1 bg, #0f766e text)
- `student`: Amber (#ea580c bold, #fed7aa bg, #c2410c text)
- `accent`: Violet accent tint

---

## 3. STYLING ARCHITECTURE

### Global Design Tokens (`/frontend/src/app/globals.css`)

#### Color Palette:
```css
/* Surface (warm ivory base) */
--color-surface:        #faf8f5
--color-surface-card:   #ffffff
--color-surface-sunken: #f2ede8
--color-surface-hover:  #ede8e2

/* Accent (deep violet) */
--color-accent:         #5b21b6
--color-accent-hover:   #4c1d95
--color-accent-subtle:  #ede9fe
--color-accent-text:    #4c1d95

/* Status Colors */
--color-danger:         #dc2626 (danger red)
--color-success:        #16a34a (green)
--color-warning:        #d97706 (orange)

/* Role-Specific Colors */
Admin:    #5b21b6 (violet) + #ede9fe bg
Teacher:  #0d9488 (teal) + #ccfbf1 bg
Student:  #ea580c (amber) + #fed7aa bg

/* Stat Card Icon Palette (4-slot rotation) */
--color-stat-1-bg:   #dbeafe (blue)
--color-stat-1-icon: #2563eb
--color-stat-2-bg:   #dcfce7 (green)
--color-stat-2-icon: #16a34a
--color-stat-3-bg:   #fce7f3 (pink)
--color-stat-3-icon: #db2777
--color-stat-4-bg:   #fef9c3 (yellow)
--color-stat-4-icon: #ca8a04
```

#### Typography:
- **Font:** Cairo (Google Fonts)
- **Font Weights:** 700 (bold), 800 (headers default)
- **Base Size:** 15px
- **Line Height:** 1.65

#### Radii:
```
--radius-sm:   4px
--radius-md:   10px
--radius-lg:   14px
--radius-xl:   20px
--radius-2xl:  28px
--radius-full: 9999px
```

#### Shadows:
```
--shadow-xs: 0 1px 2px (subtle)
--shadow-sm: 0 2px 6px -1px (default)
--shadow-md: 0 6px 16px -4px (hover)
--shadow-lg: 0 16px 32px -8px (lifted)
```

#### Special CSS Classes:
- `.bg-surface-dotted` — Dot-grid background pattern (radial-gradient)
- `.rich-content` — Styles for rendered HTML (headings, lists, links, images)
- `.stat-card-group > *:nth-child(n)` — Color slot injection for stat cards

---

## 4. DELETE OPERATIONS - COMPREHENSIVE MAPPING

### ADMIN PAGES - Delete Functions

#### 1. Admin Sections Delete (`/admin/sections/page.tsx` lines 91-165)
**Type:** Cascade delete (7 related collections)
**Confirmation:** YES (bilingual warning with warning message)
**Feedback:** alert() success/failure

**Delete Sequence:**
1. Materials (filter: `section = "${id}"`)
2. Homework + Submissions (cascade)
3. Announcements (filter: `section = "${id}"`)
4. Quizzes + Questions + Attempts
5. Exam Schedules (filter: `section = "${id}"`)
6. Remove section from users (filter: `sections ~ "${id}"`)
7. Delete class_sections record itself

**Key Code:**
```typescript
async function handleDelete(id: string) {
  if (!confirm(warningMsg)) return;
  setDeletingId(id);
  try {
    // Delete related records first
    const materials = await pb.collection("materials").getFullList({ filter: `section = "${id}"` });
    for (const m of materials) {
      await pb.collection("materials").delete(m.id);
    }
    // ... more deletions
    await pb.collection("class_sections").delete(id);
    alert(locale === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
  } catch (error) {
    alert(locale === "ar" ? "فشل الحذف..." : "Delete failed...");
  }
}
```

#### 2. Admin Subjects Delete (`/admin/subjects/page.tsx` lines 76-144)
**Type:** Cascade delete (5 related collections)
**Confirmation:** YES (bilingual warning)
**Feedback:** alert() success/failure

**Delete Sequence:**
1. Materials (filter: `subject = "${id}"`)
2. Homework + Submissions (cascade)
3. Quizzes + Questions + Attempts
4. Exam Schedules (filter: `subject = "${id}"`)
5. Remove subject from teachers (filter: `subjects ~ "${id}"`)
6. Delete subjects record itself

#### 3. Admin Students Delete (`/admin/students/page.tsx` lines 211-220)
**Type:** Simple single record delete
**Confirmation:** YES (from dict)
**Feedback:** UI list update only

**Key Code:**
```typescript
async function handleDelete(id: string) {
  if (!confirm(t.confirmDelete)) return;
  setDeletingId(id);
  try {
    await pb.collection("users").delete(id);
    setStudents(s => s.filter(x => x.id !== id));
  }
}
```

#### 4. Admin Teachers Delete (`/admin/teachers/page.tsx` lines 188-197)
**Type:** Simple single record delete
**Confirmation:** YES (from dict)
**Feedback:** UI list update only

#### 5. Admin Announcements Delete (`/admin/announcements/page.tsx` line 119)
**Type:** Simple single record delete
**Confirmation:** YES (from dict)

#### 6. Admin Exams Delete (`/admin/exams/page.tsx` line 166)
**Type:** Simple single record delete
**Confirmation:** YES (from dict)

#### 7. Admin Content Moderation (`/admin/moderation/page.tsx` lines 132-163)
**Type:** Three separate delete functions
**Confirmation:** YES (from dict) for each

**Sub-functions:**
- `deleteMaterial()` line 132: materials collection
- `deleteAnnouncement()` line 143: announcements collection
- `deleteComment()` line 154: comments collection

---

### TEACHER PAGES - Delete Functions

#### 1. Teacher Materials Delete (`/teacher/materials/page.tsx` lines 160-165)
**Type:** Single record delete
**Confirmation:** YES (from dict)

```typescript
async function handleDelete(id: string) {
  if (!confirm(t.confirmDelete)) return;
  const pb = getPocketBase();
  await pb.collection("materials").delete(id);
  await load();
}
```

#### 2. Teacher Homework Delete (`/teacher/homework/page.tsx` line 215)
**Type:** Single record delete
**Confirmation:** YES (from dict)

#### 3. Teacher Announcements Delete (`/teacher/announcements/page.tsx` line 121)
**Type:** Single record delete
**Confirmation:** YES (from dict)

#### 4. Teacher Quizzes Delete (`/teacher/quizzes/page.tsx`)
**Three delete operations:**

a) **Quiz Creation Validation** (line 190):
   - Confirms user wants to add questions before saving
   - Uses: `if (!confirm(confirmMsg)) return;`

b) **Quiz Delete** (line 225):
   - Deletes entire quiz record
   - Confirmation: YES (from dict)

c) **Quiz Question Delete** (line 298):
   - Deletes single question from quiz
   - Confirmation: YES (with "?" appended)

#### 5. Teacher Announcements Delete (Overview page, line 128)
**Location:** `/teacher/page.tsx`
**Type:** Single record delete
**Confirmation:** YES (from dict)

---

### STUDENT PAGES - Delete Functions

#### 1. Student Quiz/Assessment Submission (`/student/quizzes/page.tsx` lines 191-230)
**Type:** NOT a true delete - validation checks
**Confirmations:**
- Line 191: Quiz hasn't opened yet → alert()
- Line 223: Quiz has closed → alert()
- Line 230: Quiz closed while taking → alert()
- Line 304: Confirm quiz submission → confirm()

#### 2. Student Assessment Submit (`/student/assessments/page.tsx` lines 246-358)
**Type:** Similar validation + submission
**Confirmations:**
- Line 246, 278, 285: Time validation alerts
- Line 358: Confirm quiz submission → confirm()

---

### SHARED COMPONENT DELETES

#### Comments Component (`/ui/comments.tsx` lines 85-94)
**Type:** Single comment delete
**Confirmation:** YES (from dict)

```typescript
const handleDelete = async (commentId: string) => {
  if (!confirm(t.confirmDelete)) return;
  try {
    await pb.collection("comments").delete(commentId);
    await loadComments();
  }
};
```

#### Reactions Component (`/ui/reactions.tsx` lines 88-96)
**Type:** Toggle delete (if reaction exists, delete it)
- Uses `pb.collection("reactions").delete(existing[0].id)`
- NO confirmation dialog

---

## 5. GLOBAL SETTINGS (SCHOOL NAME)

### Current Implementation
**Storage:** PocketBase `platform_settings` collection

**Location:** `/admin/settings/page.tsx` (lines 31-51, 53-100)

**Fields Stored:**
```json
{
  "key": "school_info",
  "value": {
    "schoolNameAr": "مدرسة مناخر الاساسية المؤنثة",
    "schoolNameEn": "Manakher Basic Girls' School",
    "enableComments": true,
    "enableReactions": true,
    "enableQuizzes": true
  }
}
```

**Load Function** (lines 31-51):
- Queries `platform_settings` collection
- Filters by `key = "school_info"`
- Parses `value` field to extract settings
- Fallback to hardcoded defaults if not found

**Save Function** (lines 53-100):
- Checks if record exists with key `"school_info"`
- Updates if exists, creates if not (try/catch with fallback)
- Stores bilingual school names + 3 feature toggles

**Display Locations:**
| Page | Line | Context |
|------|------|---------|
| `/login/page.tsx` | 161 | Left panel h1 heading |
| `/dashboard/layout.tsx` | 75, 116 | Header subtitle + footer |
| `/admin/page.tsx` | 152 | Dashboard footer |
| `/teacher/page.tsx` | 165 | Dashboard footer |
| `/student/page.tsx` | 100 | Dashboard footer |

**Dictionary Keys:**
- Arabic: `ar.json` line 4, 229-231
- English: `en.json` line 4, 229-231

### Note: NOT using localStorage
The codebase does NOT use localStorage for school name. It uses PocketBase exclusively.

---

## 6. DIRECTORY STRUCTURE

```
frontend/src/
├── app/
│   ├── [lang]/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── admin/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   ├── sections/page.tsx          ← Delete cascade
│   │       │   ├── subjects/page.tsx          ← Delete cascade
│   │       │   ├── students/page.tsx          ← Delete users
│   │       │   ├── teachers/page.tsx          ← Delete users
│   │       │   ├── announcements/page.tsx     ← Delete
│   │       │   ├── exams/page.tsx             ← Delete
│   │       │   ├── moderation/page.tsx        ← Delete multiple
│   │       │   ├── monitoring/page.tsx        ← Stats only
│   │       │   └── settings/page.tsx          ← School settings
│   │       ├── teacher/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   ├── materials/page.tsx         ← Delete materials
│   │       │   ├── homework/page.tsx          ← Delete homework
│   │       │   ├── announcements/page.tsx     ← Delete announcements
│   │       │   ├── quizzes/page.tsx           ← Delete quizzes/questions
│   │       │   └── sections/page.tsx
│   │       └── student/
│   │           ├── layout.tsx
│   │           ├── page.tsx
│   │           ├── assessments/page.tsx       ← Submit only (no delete)
│   │           ├── materials/page.tsx
│   │           ├── homework/page.tsx
│   │           └── announcements/page.tsx
│   ├── globals.css                            ← Design tokens
│   ├── layout.tsx                             ← Root wrapper
│   └── page.tsx                               ← Redirect to default locale
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       ├── stat-card.tsx
│       ├── rich-editor.tsx
│       ├── rich-content.tsx
│       ├── comments.tsx                       ← Delete comments
│       ├── reactions.tsx                      ← Delete reactions
│       └── file-upload.tsx
├── context/
│   ├── auth-context.tsx                       ← Auth user + login/logout
│   └── locale-context.tsx                     ← Locale + dictionary switching
├── lib/
│   ├── auth.ts                                ← AuthUser type, getDisplayName()
│   ├── pocketbase.ts                          ← getPocketBase(), pb export
│   ├── i18n.ts                                ← getDictionary() (server-only)
│   ├── locale-config.ts                       ← LOCALES, DEFAULT_LOCALE
│   └── text-direction.ts                      ← RTL/LTR detection
└── dictionaries/
    ├── ar.json                                ← All Arabic strings
    └── en.json                                ← All English strings
```

---

## 7. AUTH & UTILITY MODULES

### Auth Module (`lib/auth.ts`)
**Types:**
```typescript
AuthUser {
  id: string
  email: string
  name_ar: string
  name_en: string
  role: "admin" | "teacher" | "student"
  sections: string[]
  subjects: string[]
}
```

**Functions:**
- `getDisplayName(user, locale)` — Returns name_ar or name_en based on locale
- `getRoleDashboardPath(role, locale)` — Returns `/{locale}/dashboard/{role}`

### Locale Module (`lib/locale-config.ts`)
**Types:**
```typescript
Locale = "ar" | "en"
```

**Exports:**
- `LOCALES` = ["ar", "en"]
- `DEFAULT_LOCALE` = "ar"
- `hasLocale(pathname)` — Checks if path starts with locale
- `getDir(locale)` — Returns "rtl" or "ltr"

### PocketBase Module (`lib/pocketbase.ts`)
**Exports:**
- `getPocketBase()` — Returns authenticated PB instance
- `pb` — Default export for direct imports
- Sets auth cookie on changes for server-side auth checks

### RTL Detection (`lib/text-direction.ts`)
**Functions:**
- `containsArabic(text)` — Detects Arabic Unicode
- `getTextDirection(text)` — Returns 'rtl' or 'ltr'
- `getDominantTextDirection(text)` — Returns dominant based on 10% threshold

---

## 8. KEY IMPLEMENTATION DETAILS

### Authentication Flow:
1. User logs in at `/[lang]/login`
2. `AuthContext` stores user + token in localStorage
3. `pocketbase.ts` syncs to `pb_auth` cookie (7-day max-age, SameSite=Lax)
4. Server-side `proxy.ts` checks cookie for auth + role RBAC
5. Client-side `dashboard/layout.tsx` guards against role mismatch

### Cascade Delete Pattern:
1. Show bilingual warning confirm dialog
2. Fetch all related records (1 collection → multiple filters)
3. Delete leaf nodes first (submissions before homework, questions before quizzes)
4. Remove relations from parent records
5. Delete parent record last
6. Show success/error alert()
7. Update UI state to remove from list

### RichEditor Integration:
- Tiptap v3 with StarterKit (minus Link to avoid duplicates)
- Custom Link extension (openOnClick: false, target: _blank)
- Image upload to PocketBase `media` collection
- DOMPurify sanitization on output via `RichContent` component

### Bilingual Support:
- All user-facing strings in dictionaries (ar.json, en.json)
- Dynamic page generation via `generateStaticParams()` for both locales
- Context provides `dict` + `locale` to all components
- RTL layout via CSS variable `--dir` (set via useEffect in `HtmlAttributes` component)

---

## 9. DESIGN SYSTEM PHILOSOPHY

**Aesthetic Goals:**
- Minimal, gentle, clean
- Bright but restrained colors (no blinding palettes)
- Professional, structured feel
- Child-appropriate but NOT playful

**Applied Principles:**
- NO emojis in UI
- NO cartoonish icons
- NO heavy/stupid animations
- Warm ivory base color (#faf8f5) instead of harsh white
- Role-based color system for visual hierarchy
- Subtle shadows for depth without drama
- Dot-grid background pattern for tactile feel

---

## 10. CRITICAL NOTES & LIMITATIONS

### Current Limitations:
1. **No Toast Notifications** — Only native alert() used for feedback
2. **No Custom Modal/Dialog** — Only browser confirm() for confirmations
3. **No Undo Functionality** — Cascade deletes are permanent
4. **No Error Recovery UI** — Only console.error() + alert() on failure
5. **No Loading Skeleton** — Spinners only, no progressive loading
6. **Limited Accessibility** — No ARIA labels, no keyboard-only navigation
7. **No Optimistic Updates** — UI waits for server response before updating
8. **Comments Permissions** — No role-based comment delete (admins can't delete all comments)

### Known Issues from Journal:
1. **MCP Auth Drops** — PocketBase MCP drops auth between calls
2. **Cascade Delete Complexity** — Manual deletion order required (PB doesn't support auto-cascade)
3. **File Upload Field Names** — Must use FormData for file attachments
4. **RTL/LTR Detection** — Content-based direction per quiz question/option

### Production Recommendations:
1. **Replace alert()/confirm() with custom modals** for professional UX
2. **Implement toast notification system** for non-blocking feedback
3. **Add undo functionality** to cascade deletes or show preview before delete
4. **Implement error boundaries** at page level
5. **Add analytics** to track user actions and errors
6. **Improve accessibility** with ARIA labels and keyboard navigation
7. **Add optimistic updates** to improve perceived performance
8. **Implement audit logging** for all delete operations
