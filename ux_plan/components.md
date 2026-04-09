# Component Hierarchy & Registry

**Generated:** 2026-04-09  
**Updated by:** UX Fix Analysis  
**Status:** VERIFIED - Reflects actual application components

---

## Component Architecture

```
App (root/layout.tsx)
├── RootLayout (sets fonts, global styles)
│   └── AuthProvider (authentication context)
│       └── [lang]/layout.tsx (locale provider)
│           ├── HtmlAttributes (RTL/LTR controller)
│           └── Router (dynamic routing)
│               └── DashboardLayout (shared header/nav)
│                   ├── Header (auth badge, lang switcher)
│                   ├── Sidebar (role-based nav)
│                   ├── MainContent
│                   │   └── PageComponent (role-specific)
│                   └── Footer (school info)
```

---

## Layout Components

### Core Layouts

| Component | Path | Purpose | Props |
|-----------|------|---------|-------|
| **RootLayout** | `app/layout.tsx` | Root wrapper, fonts, global styles | children |
| **LocaleLayout** | `app/[lang]/layout.tsx` | Locale provider, dictionary setup | children, params |
| **DashboardLayout** | `app/[lang]/dashboard/layout.tsx` | Header, nav, role guard | children, params |
| **AuthProvider** | `context/auth-context.tsx` | Auth state & session management | children |
| **LocaleProvider** | `context/locale-context.tsx` | i18n locale & dict switching | children |

### UI Layout Blocks

| Component | Path | Purpose |
|-----------|------|---------|
| **HtmlAttributes** | `components/html-attributes.tsx` | Sets `lang` and `dir` on `<html>` |

---

## Page Components (Role-Based)

### Admin Pages

| Route | Component | File | States | Status |
|-------|-----------|------|--------|--------|
| `/admin` | AdminOverview | `admin/page.tsx` | 7 | 🟡 Medium |
| `/admin/sections` | SectionsManager | `admin/sections/page.tsx` | 8 | 🟡 Medium |
| `/admin/subjects` | SubjectsManager | `admin/subjects/page.tsx` | 8 | 🟡 Medium |
| `/admin/teachers` | TeachersManager | `admin/teachers/page.tsx` | 12 | 🔴 Critical |
| `/admin/students` | StudentsManager | `admin/students/page.tsx` | 13 | 🔴 Critical |
| `/admin/users` | UsersManager | `admin/users/page.tsx` | **23** | 🔴 Critical |
| `/admin/announcements` | AnnouncementsManager | `admin/announcements/page.tsx` | 8 | 🟡 Medium |
| `/admin/exams` | ExamsManager | `admin/exams/page.tsx` | 9 | 🟡 Medium |
| `/admin/monitoring` | MonitoringDashboard | `admin/monitoring/page.tsx` | 5 | 🟢 Low |
| `/admin/moderation` | ModerationPanel | `admin/moderation/page.tsx` | 6 | 🟢 Low |
| `/admin/settings` | SettingsPanel | `admin/settings/page.tsx` | **19** | 🔴 Critical |

### Teacher Pages

| Route | Component | File | States | Status |
|-------|-----------|------|--------|--------|
| `/teacher` | TeacherOverview | `teacher/page.tsx` | 10 | 🟡 Medium |
| `/teacher/sections` | SectionsViewer | `teacher/sections/page.tsx` | 5 | 🟢 Low |
| `/teacher/materials` | MaterialsManager | `teacher/materials/page.tsx` | 13 | 🟠 High |
| `/teacher/homework` | HomeworkManager | `teacher/homework/page.tsx` | 14 | 🟠 High |
| `/teacher/announcements` | AnnouncementsManager | `teacher/announcements/page.tsx` | 9 | 🟡 Medium |
| `/teacher/quizzes` | QuizzesManager | `teacher/quizzes/page.tsx` | **18** | 🟠 High |

### Student Pages

| Route | Component | File | States | Status |
|-------|-----------|------|--------|--------|
| `/student` | StudentOverview | `student/page.tsx` | 6 | 🟢 Low |
| `/student/announcements` | AnnouncementsViewer | `student/announcements/page.tsx` | 3 | 🟢 Low |
| `/student/materials` | MaterialsViewer | `student/materials/page.tsx` | 7 | 🟡 Medium |
| `/student/homework` | HomeworkViewer | `student/homework/page.tsx` | 7 | 🟡 Medium |
| `/student/assessments` | AssessmentsTab | `student/assessments/page.tsx` | **18** | 🟠 High |
| `/student/exams` | ExamsViewer | `student/exams/page.tsx` | 3 | 🟢 Low |
| `/student/quizzes` | QuizzesViewer | `student/quizzes/page.tsx` | 15 | 🟠 High |

### Authentication

| Route | Component | File | States | Status |
|-------|-----------|------|--------|--------|
| `/login` | LoginPage | `app/[lang]/login/page.tsx` | 4 | 🟢 Low |

---

## UI Component Library

### Primitives (Design System)

| Component | Path | Purpose | Props |
|-----------|------|---------|-------|
| **Button** | `components/ui/button.tsx` | CTA button with variants | `variant`, `size`, `onClick` |
| **Badge** | `components/ui/badge.tsx` | Status/role indicator | `variant` (default/admin/teacher/student/accent) |
| **Card** | `components/ui/card.tsx` | Container with shadow/border | `children`, `className` |
| **Input** | `components/ui/input.tsx` | Text input with label | `label`, `placeholder`, `value`, `onChange` |
| **StatCard** | `components/ui/stat-card.tsx` | Metric display card | `icon`, `label`, `value` |

### Rich Content Components

| Component | Path | Purpose | Props |
|-----------|------|---------|-------|
| **RichEditor** | `components/ui/rich-editor.tsx` | Tiptap WYSIWYG editor | `value`, `onChange`, `dir` |
| **RichContent** | `components/ui/rich-content.tsx` | Safe HTML renderer | `html`, `className` |

### Interactive Components

| Component | Path | Purpose | Props |
|-----------|------|--------|-------|
| **FileUpload** | `components/ui/file-upload.tsx` | File input with preview | `onFile`, `accept`, `label` |
| **Comments** | `components/ui/comments.tsx` | Comment thread UI | `targetId`, `targetType`, `userId` |
| **Reactions** | `components/ui/reactions.tsx` | Emoji/like reactions | `targetId`, `targetType` |
| **Dialog** | `components/ui/dialog.tsx` | Modal dialog | `open`, `onOpenChange`, `children` |

---

## Feature-Specific Components

### Admin Features

| Component | Purpose | Props |
|-----------|---------|-------|
| **SectionForm** | Create/edit class section | `section`, `onSave`, `onCancel` |
| **SubjectForm** | Create/edit subject | `subject`, `onSave`, `onCancel` |
| **TeacherForm** | Assign sections/subjects to teacher | `teacher`, `sections`, `subjects`, `onSave` |
| **StudentForm** | Assign section to student | `student`, `sections`, `onSave` |
| **MultiSelectDropdown** | Checkbox-based multi-select | `options`, `selected`, `onChange` |
| **ExamScheduleForm** | Create/edit exam schedule | `exam`, `onSave`, `onCancel` |

### Teacher Features

| Component | Purpose | Props |
|-----------|---------|-------|
| **MaterialForm** | Create/edit learning material | `material`, `onSave`, `onCancel` |
| **HomeworkForm** | Create/edit homework | `homework`, `onSave`, `onCancel` |
| **SubmissionGradePanel** | Grade student submission | `submission`, `onGrade` |
| **QuizEditor** | Create/edit quiz & questions | `quiz`, `onSave`, `onCancel` |
| **QuestionForm** | Add/edit quiz question | `question`, `onSave`, `onCancel` |

### Student Features

| Component | Purpose | Props |
|-----------|---------|-------|
| **QuizTaker** | Interactive quiz-taking interface | `quiz`, `onSubmit`, `timeLimit` |
| **SubmissionForm** | Submit homework online | `homework`, `onSubmit` |
| **GradeDisplay** | Show graded submission with feedback | `submission` |
| **ExamCard** | Display exam schedule info | `exam` |

---

## State Management Patterns

### Page-Level State (Current - Anti-pattern)

**Issue:** Multiple scattered `useState` calls per page

Example from `admin/users/page.tsx` (23 states):
```typescript
// ❌ Current approach
const [users, setUsers] = useState([]);
const [showCreate, setShowCreate] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [formData, setFormData] = useState({ name_ar: "", name_en: "", ... });
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState("");
// ... 17 more useState calls
```

**Impact:**
- Hard to trace state dependencies
- Difficult to test
- Cognitive overload
- Bug-prone state synchronization

### Recommended State Consolidation Pattern

```typescript
// ✅ Recommended approach
interface UsersPageState {
  users: User[];
  formData: Partial<User>;
  ui: {
    showCreate: boolean;
    editingId: string | null;
    isLoading: boolean;
    error: string;
    expandedId: string | null;
  };
  filters: {
    searchTerm: string;
    roleFilter: string;
    sortBy: string;
  };
}

const [state, setState] = useState<UsersPageState>(initialState);

// Usage:
const handleError = (err: string) => 
  setState(prev => ({ ...prev, ui: { ...prev.ui, error: err } }));
```

---

## Component Dependencies Map

```
AuthProvider
├── LocaleProvider
│   ├── DashboardLayout
│   │   ├── Header
│   │   ├── Sidebar
│   │   │   ├── Button (role nav)
│   │   │   └── Badge
│   │   ├── PageComponent
│   │   │   ├── StatCard (overview)
│   │   │   ├── Card (list items)
│   │   │   ├── Button (CRUD actions)
│   │   │   ├── Input (forms)
│   │   │   ├── RichEditor (content)
│   │   │   ├── Dialog (modals)
│   │   │   ├── FileUpload (files)
│   │   │   ├── Comments (discussion)
│   │   │   └── Reactions (engagement)
│   │   └── Footer
│   └── Login
│       ├── Input
│       ├── Button
│       └── Badge
```

---

## Migration Path: Reduce Component Complexity

### Priority 1 (Critical) - Start Here

1. **`admin/users/page.tsx`** (23 states)
   - Extract `useFormState()` hook for form data
   - Extract `useCrudState()` hook for CRUD UI
   - Extract `useFiltersState()` hook for search/filters
   - **Target:** 5-6 useState calls

2. **`admin/settings/page.tsx`** (19 states)
   - Extract `usePlatformSettings()` hook
   - Extract `useFeatureToggle()` hook
   - Consolidate school name form state
   - **Target:** 6-7 useState calls

### Priority 2 (High) - Second Wave

3. **`student/assessments/page.tsx`** (18 states)
   - Extract `useQuizState()` hook (quiz UI + timer)
   - Extract `useTabState()` hook
   - **Target:** 5-6 useState calls

4. **`teacher/quizzes/page.tsx`** (18 states)
   - Extract `useQuizEditor()` hook
   - Extract `useQuestionForm()` hook
   - **Target:** 5-6 useState calls

5. **`admin/subjects_exams/page.tsx`** (17 states)
   - Combined page requires rethinking
   - **Target:** 6-7 useState calls (may need route split)

### Priority 3 (Medium) - Third Wave

Remaining components with 12-14 states:
- `teacher/materials/page.tsx` (13)
- `student/quizzes/page.tsx` (15)
- `admin/students/page.tsx` (13)
- `admin/teachers/page.tsx` (12)
- `teacher/homework/page.tsx` (14)

---

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Avg states per page | 11-14 | 4-6 | ≤5 |
| Max states in component | 23 | 7-9 | ≤8 |
| Component readability | Low | High | Easy to scan |
| Test coverage | <30% | >70% | >80% |
| Time to add feature | 2-3 hours | 30-45 min | Proportional |

---

## Notes for Developers

1. **Custom Hooks Location:** Create custom hooks in `lib/hooks/` directory
   - `useFormState.ts` - Manage form data
   - `useCrudState.ts` - CRUD operations UI state
   - `useFiltersState.ts` - Search/filter state
   - `useTabState.ts` - Tab navigation state

2. **Type Safety:** Always define interfaces for consolidated state objects:
   ```typescript
   interface PageState {
     data: Data[];
     form: FormData;
     ui: UIState;
     filters: FilterState;
   }
   ```

3. **Testing:** With consolidated state, component testing becomes easier:
   - Mock state object (1 object vs 20 state setters)
   - Test state transitions directly
   - Easier to write snapshot tests

4. **Performance:** Avoid creating new objects on every render:
   ```typescript
   // ❌ Bad
   const [ui, setUI] = useState({ ...initialUI });
   
   // ✅ Good
   const initialUI = useMemo(() => ({ ... }), []);
   const [ui, setUI] = useState(initialUI);
   ```
