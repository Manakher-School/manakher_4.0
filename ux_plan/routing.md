# Routing Architecture

**Generated:** 2026-04-09  
**Updated by:** UX Fix Analysis  
**Status:** VERIFIED - Reflects actual application structure

---

## Overview

The application uses a role-based routing architecture with locale prefixes. All routes are nested under `[lang]` parameter for Arabic/English internationalization.

```
/[lang]/
├── /login                          # Authentication page
└── /dashboard/                     # Role-based dashboard hub
    ├── /[role]/                    # Role selector
    ├── /admin/                     # Admin dashboard (superuser access)
    ├── /teacher/                   # Teacher dashboard
    └── /student/                   # Student dashboard
```

---

## Public Routes

| Route | Component | Purpose | Auth |
|-------|-----------|---------|------|
| `/[lang]` | `layout.tsx` | Root with locale provider | ❌ |
| `/[lang]/login` | `login/page.tsx` | Authentication | ❌ |

---

## Admin Dashboard Routes

**Access:** Admin role only. Route prefix: `/[lang]/dashboard/admin/`

### Overview & Monitoring
| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin` | `admin/page.tsx` | Dashboard overview (stats) |
| `/admin/monitoring` | `admin/monitoring/page.tsx` | System-wide activity metrics |
| `/admin/moderation` | `admin/moderation/page.tsx` | Content moderation (3 tabs) |
| `/admin/settings` | `admin/settings/page.tsx` | Platform-wide configuration |

### Academic Structure Management
| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/sections` | `admin/sections/page.tsx` | Class sections CRUD (grades A-J) |
| `/admin/subjects` | `admin/subjects/page.tsx` | Subject management CRUD |
| `/admin/exams` | `admin/exams/page.tsx` | Exam schedule management |

### User Management
| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/teachers` | `admin/teachers/page.tsx` | Teacher account management |
| `/admin/students` | `admin/students/page.tsx` | Student account management |
| `/admin/users` | `admin/users/page.tsx` | Universal user CRUD (all roles) |
| `/admin/announcements` | `admin/announcements/page.tsx` | Global announcements CRUD |

---

## Teacher Dashboard Routes

**Access:** Teacher role only. Route prefix: `/[lang]/dashboard/teacher/`

| Route | Component | Purpose |
|-------|-----------|---------|
| `/teacher` | `teacher/page.tsx` | Dashboard overview (stats) |
| `/teacher/sections` | `teacher/sections/page.tsx` | Assigned sections & students |
| `/teacher/materials` | `teacher/materials/page.tsx` | Learning materials CRUD |
| `/teacher/homework` | `teacher/homework/page.tsx` | Homework assignments CRUD |
| `/teacher/announcements` | `teacher/announcements/page.tsx` | Announcements CRUD |
| `/teacher/quizzes` | `teacher/quizzes/page.tsx` | Quiz management & results |

---

## Student Dashboard Routes

**Access:** Student role only. Route prefix: `/[lang]/dashboard/student/`

| Route | Component | Purpose |
|-------|-----------|---------|
| `/student` | `student/page.tsx` | Dashboard overview (stats) |
| `/student/announcements` | `student/announcements/page.tsx` | View announcements (read-only) |
| `/student/materials` | `student/materials/page.tsx` | View materials & download files |
| `/student/homework` | `student/homework/page.tsx` | Submit homework & view grades |
| `/student/assessments` | `student/assessments/page.tsx` | Combined quizzes & exams tab interface |
| `/student/exams` | `student/exams/page.tsx` | View exam schedules (legacy) |
| `/student/quizzes` | `student/quizzes/page.tsx` | Take quizzes (legacy) |

---

## State Management Hierarchy

```
AppState (Root)
├── UserSession
│   ├── AuthToken
│   ├── UserProfile (name_ar, name_en, role)
│   └── UserPreferences (locale, theme)
├── DashboardState (Role-specific)
│   ├── AdminDashboardState
│   │   ├── SectionsList
│   │   ├── SubjectsList
│   │   ├── UsersList
│   │   ├── ExamSchedules
│   │   ├── PlatformSettings
│   │   └── ContentModeration
│   ├── TeacherDashboardState
│   │   ├── AssignedSections
│   │   ├── Materials
│   │   ├── Homework & Submissions
│   │   ├── Quizzes & Results
│   │   └── Announcements
│   └── StudentDashboardState
│       ├── EnrolledSections
│       ├── Materials (read-only)
│       ├── Homework Submissions
│       ├── Quiz Attempts
│       └── Announcements (read-only)
└── UIState (Global)
    ├── LanguageLocale
    ├── SidebarCollapsed
    └── NotificationStack
```

---

## Protected Routes & Authorization

**Route Guards:**
1. **Server-side (proxy.ts):** Validates auth cookie, enforces role prefix
2. **Client-side (dashboard/layout.tsx):** Double-checks role, prevents unauthorized navigation
3. **Component-level:** Individual page components may have additional permission checks

**Redirect Logic:**
- Unauthenticated users → `/[lang]/login`
- Student accessing `/admin` → `/[lang]/dashboard/student`
- Teacher accessing `/admin` → `/[lang]/dashboard/teacher`
- Expired session → `/[lang]/login`

---

## Locale Routing

All routes are prefixed with `[lang]` dynamic segment:
- `/ar/dashboard/admin` - Arabic admin dashboard
- `/en/dashboard/admin` - English admin dashboard
- `/ar/login` - Arabic login page
- `/en/login` - English login page

Fallback: Unauthenticated root `/` → redirects to `/[DEFAULT_LOCALE]/login`

---

## Navigation Patterns

### Admin Navigation (Sidebar + Mobile Tabs)
- Overview
- Classes & Sections
- Subjects
- Teachers
- Students
- Users
- Announcements
- Exams
- Monitoring
- Moderation
- Settings

### Teacher Navigation (Sidebar + Mobile Tabs)
- Overview
- My Sections
- Materials
- Homework
- Announcements
- Quizzes

### Student Navigation (Sidebar + Mobile Tabs)
- Overview
- Announcements
- Materials
- Homework
- Assessments (Quizzes + Exams)

---

## Data Flow Between Routes

```
Login (/login)
  ↓ (authenticate)
Proxy checks role
  ↓ (role-based redirect)
Role Dashboard (/dashboard/[role])
  ├─→ Fetch user's data (sections, subjects, etc.)
  ├─→ Fetch role-specific collections
  └─→ Render role-specific UI

Sub-routes (/dashboard/[role]/[feature])
  └─→ Fetch feature-specific data
      └─→ Render feature CRUD/read interface
```

---

## Migration Notes

**From Generic Blueprint → Actual Structure:**

The initial UX blueprint suggested a generic dashboard structure:
```
/ ⊃ [Dashboard, Tasks, Settings]
  → /tasks ⊃ [TaskList | TaskDetail]
  → /settings ⊃ [Profile | Preferences]
```

**Actual implementation evolved to role-based multi-dashboard architecture:**
- Separate dashboards for admin, teacher, student (not generic)
- Role-specific features (not generic tasks/settings)
- Hierarchical CRUD pages (sections → materials → homework → submissions)
- Bilingual, locale-prefixed routes (not single-locale)

**This is intentional and correct for a school management system.**
