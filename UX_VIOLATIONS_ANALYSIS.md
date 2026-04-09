# UX VIOLATIONS ANALYSIS REPORT
**Generated:** April 9, 2026

## EXECUTIVE SUMMARY

This report analyzes code quality violations detected across the Manakher project frontend, focusing on:
1. State management complexity (excessive useState calls)
2. Component architecture violations
3. Missing page routing documentation
4. Auto-fixable vs Manual fix categorization

---

## 1. MAIN VIOLATION CATEGORIES

### Category 1: Excessive useState Usage (7+ States)
**Severity:** HIGH - Indicates poor component architecture
**Fixability:** Manual - Requires component refactoring

Components with 7+ useState hooks:

| Component | Count | Status | Complexity |
|-----------|-------|--------|-----------|
| `admin/users/page.tsx` | 23 | MANUAL FIX REQUIRED | Critical |
| `admin/settings/page.tsx` | 19 | MANUAL FIX REQUIRED | Critical |
| `teacher/quizzes/page.tsx` | 18 | MANUAL FIX REQUIRED | High |
| `student/assessments/page.tsx` | 18 | MANUAL FIX REQUIRED | High |
| `admin/subjects_exams/page.tsx` | 17 | MANUAL FIX REQUIRED | High |
| `student/quizzes/page.tsx` | 15 | MANUAL FIX REQUIRED | High |
| `teacher/homework/page.tsx` | 14 | MANUAL FIX REQUIRED | High |
| `teacher/materials/page.tsx` | 13 | MANUAL FIX REQUIRED | High |
| `admin/students/page.tsx` | 13 | MANUAL FIX REQUIRED | High |
| `admin/teachers/page.tsx` | 12 | MANUAL FIX REQUIRED | High |
| `teacher/page.tsx` | 10 | MANUAL FIX REQUIRED | Medium |
| `teacher/announcements/page.tsx` | 9 | MANUAL FIX REQUIRED | Medium |
| `admin/exams/page.tsx` | 9 | MANUAL FIX REQUIRED | Medium |

**Total Components with Violations:** 13 page components
**Total Excess useState Instances:** ~200+ (well above best practice of 3-5 per component)

---

### Category 2: State Management Anti-Patterns

#### Issue 2a: Form State Explosion
**Pattern:** Multiple related form fields using separate useState hooks

Example from `admin/users/page.tsx`:
```typescript
const [formField1, setFormField1] = useState("");
const [formField2, setFormField2] = useState("");
const [formField3, setFormField3] = useState("");
// ... repeated 15+ times
```

**Impact:** 
- Harder to validate entire form atomically
- Increases re-render cycles
- Difficult to implement form reset/clear logic
- Makes form submission error handling complex

**Fix Type:** MANUAL - Consolidate into single form state object

---

#### Issue 2b: UI State Duplication
**Pattern:** Multiple boolean flags for showing/hiding different modals, panels, accordions

Example from `admin/settings/page.tsx`:
```typescript
const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
const [moderationTab, setModerationTab] = useState<"materials" | "announcements" | "comments">("materials");
const [accordions, setAccordions] = useState({
  moderation: false,
  monitoring: false,
  settings: true,
});
```

**Impact:**
- Multiple sources of truth for UI state
- Difficult to maintain consistent UI state across tabs/accordions
- Risk of stale UI states

**Fix Type:** MANUAL - Consolidate UI state into single "UIState" object

---

#### Issue 2c: Loading State Fragmentation
**Pattern:** Separate isLoading/isSaving states for different data categories

Example from `admin/settings/page.tsx`:
```typescript
const [moderationLoading, setModerationLoading] = useState(true);
const [monitoringLoading, setMonitoringLoading] = useState(true);
const [settingsLoading, setSettingsLoading] = useState(false);
const [savingQuiz, setSavingQuiz] = useState(false);
const [savingQuestion, setSavingQuestion] = useState(false);
```

**Impact:**
- Unclear loading state at component level
- Hard to show global loading indicator
- Error handling scattered across multiple states

**Fix Type:** MANUAL - Use single "LoadingState" manager or custom hook

---

#### Issue 2d: Data State Duplication
**Pattern:** Multiple collections loaded with separate useState + useEffect

Example from `admin/subjects_exams/page.tsx`:
```typescript
const [subjects, setSubjects] = useState<Subject[]>([]);
const [exams, setExams] = useState<ExamSchedule[]>([]);
const [sections, setSections] = useState<ExamSection[]>([]);
// ... each with separate useEffect for loading
```

**Impact:**
- Repeated fetch patterns
- Harder to implement global error handling
- Coordination between data sets complex

**Fix Type:** MANUAL - Create custom useAsyncData hook or use reducer pattern

---

### Category 3: Component Architecture Issues

#### Issue 3a: Giant Page Components (700+ lines)
**Affected Files:**
- `admin/settings/page.tsx`: 701 lines
- `admin/users/page.tsx`: 787 lines
- `teacher/quizzes/page.tsx`: 800+ lines

**Problems:**
- Mixing multiple concerns in single component
- Hard to test individual features
- Reduced code readability
- Difficult to reuse component logic

**Fix Type:** MANUAL - Extract into smaller sub-components with composition

---

#### Issue 3b: Embedded Selection Components
**Components affected:**
- `MultiSelect` component embedded in `admin/users/page.tsx` (lines 52-99)
- `SingleSelect` component embedded in `admin/users/page.tsx` (lines 101-147)

**Problem:** Reusable components defined inside page component
**Impact:** 
- Recreated on every render (despite memoization)
- Not available for reuse elsewhere
- Clutters page component

**Fix Type:** AUTO-FIXABLE - Move to `components/ui/` directory

---

#### Issue 3c: Missing Context for Shared State
**Issue:** Dialog/Settings contexts exist but not leveraged everywhere

Example from `admin/settings/page.tsx`:
```typescript
const { alert, confirm } = useDialog();  // ✓ Used
const { settings, updateSettings } = useSettings();  // ✓ Used
```

But in many pages, native `confirm()` and `alert()` still used directly.

**Fix Type:** AUTO-FIXABLE - Replace all native confirm/alert with context

---

### Category 4: Missing Documentation

#### Issue 4a: No Page Routing Map
**Current State:** No centralized documentation of routes
**Needed:**
- Route hierarchy diagram
- Page purpose/responsibility
- Required params and queries
- Access control (role requirements)

**Fix Type:** MANUAL - Create `ROUTING.md` or enhance existing `ux_plan/routing.md`

---

#### Issue 4b: No Component Architecture Guide
**Needed:**
- Component layering strategy
- When to use hooks vs context
- State management patterns
- File organization conventions

**Fix Type:** MANUAL - Create `COMPONENT_ARCHITECTURE.md`

---

#### Issue 4c: No useState Migration Guide
**Current:** Developers unaware of refactoring targets
**Needed:**
- Priority list for component refactoring
- Before/after examples
- Migration patterns with code samples

**Fix Type:** MANUAL - Create `REFACTORING_GUIDE.md`

---

## 2. AUTO-FIXABLE VS MANUAL FIXES BREAKDOWN

### AUTO-FIXABLE (Can be done with scripts/tools)

| Fix Type | Count | Effort | Tools |
|----------|-------|--------|-------|
| Move embedded components to `ui/` | 3+ | 15 min | Manual move + update imports |
| Replace `alert()` → `useDialog()` | 40+ | 30 min | Find & replace with validation |
| Replace `confirm()` → `useDialog()` | 50+ | 30 min | Find & replace with validation |
| Unused imports removal | 20+ | 10 min | ESLint auto-fix |
| Consistent naming conventions | 100+ | 20 min | Script-based replacement |
| **Total Auto-Fixable:** | **~213+** | **~1.5 hours** | **Yes** |

### MANUAL FIXES (Require logic changes)

| Fix Type | Count | Effort | Complexity |
|----------|-------|--------|-----------|
| Consolidate useState into form state objects | 13 | 8-10 hrs | High |
| Consolidate UI state into managers | 13 | 6-8 hrs | High |
| Consolidate loading states | 13 | 4-6 hrs | Medium |
| Extract sub-components from giant pages | 10 | 10-15 hrs | High |
| Create custom hooks for data fetching | 13 | 8-10 hrs | High |
| Add missing routing documentation | 1 | 2-3 hrs | Low |
| Add component architecture guide | 1 | 1-2 hrs | Low |
| **Total Manual Fixes:** | **~64** | **~39-54 hours** | **Various** |

### Mixed (Part Auto, Part Manual)

| Fix Type | Auto % | Manual % | Effort |
|----------|--------|----------|--------|
| Extract component hooks | 20% | 80% | 6-8 hrs |
| Consolidate state patterns | 10% | 90% | 10-12 hrs |
| Add context integration | 60% | 40% | 4-6 hrs |

---

## 3. EXCESSIVE useState PATTERN ANALYSIS

### Pattern 1: Form States (30% of violations)

```typescript
// ❌ BEFORE: 8+ useState calls
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [sections, setSections] = useState([]);
const [subjects, setSubjects] = useState([]);

// ✓ AFTER: 1 useState + optional useReducer
const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  sections: [],
  subjects: [],
});
```

**Affected Components:**
- `admin/users/page.tsx` - Teacher/Student forms
- `teacher/quizzes/page.tsx` - Quiz creation form
- `teacher/homework/page.tsx` - Homework form

**Estimated Refactoring Gain:** Reduce from 18+ states to 4-6 per component

---

### Pattern 2: UI Visibility Toggles (25% of violations)

```typescript
// ❌ BEFORE: Multiple boolean + string states
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [expandedItem, setExpandedItem] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState("tab1");
const [accordions, setAccordions] = useState({...});

// ✓ AFTER: Single UI state object
const [uiState, setUiState] = useState({
  showForm: false,
  editingId: null,
  expandedItem: null,
  activeTab: "tab1",
  accordions: {...}
});

// Helper: useUIState custom hook
const useUIState = (initial) => {
  const [state, setState] = useState(initial);
  return {
    state,
    toggle: (key) => setState(s => ({...s, [key]: !s[key]})),
    set: (key, val) => setState(s => ({...s, [key]: val})),
  };
};
```

**Affected Components:**
- `admin/settings/page.tsx` - Accordion states
- `admin/subjects_exams/page.tsx` - Tab + form visibility
- Multiple pages with multi-tab interfaces

**Estimated Refactoring Gain:** Reduce from 9+ states to 1-2 per component

---

### Pattern 3: Async Operations (20% of violations)

```typescript
// ❌ BEFORE: Separate loading states per operation
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [deleting, setDeleting] = useState(false);
const [deletingId, setDeletingId] = useState<string | null>(null);

// ✓ AFTER: Single async state manager
const [asyncState, setAsyncState] = useState({
  loading: true,
  saving: false,
  deleting: false,
  deletingId: null,
  error: null,
});

// Helper: useAsync custom hook
const useAsync = (asyncFn, deps = []) => {
  const [state, dispatch] = useReducer(asyncReducer, initialState);
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'LOADING' });
    asyncFn().then(
      data => !cancelled && dispatch({ type: 'SUCCESS', data }),
      err => !cancelled && dispatch({ type: 'ERROR', error: err })
    );
    return () => { cancelled = true; };
  }, deps);
  return state;
};
```

**Affected Components:**
- All data-fetching pages
- All CRUD operation pages

**Estimated Refactoring Gain:** Reduce from 5-8 states to 1 per async operation

---

### Pattern 4: Data Collections (15% of violations)

```typescript
// ❌ BEFORE: Multiple collection states
const [materials, setMaterials] = useState([]);
const [announcements, setAnnouncements] = useState([]);
const [comments, setComments] = useState([]);
const [materialsLoading, setMaterialsLoading] = useState(false);
const [announcementsLoading, setAnnouncementsLoading] = useState(false);

// ✓ AFTER: Collections manager
const useCollections = (collectionNames) => {
  const [collections, setCollections] = useState(
    Object.fromEntries(collectionNames.map(n => [n, { data: [], loading: false }]))
  );
  // Implementation handles all collections uniformly
};
```

**Affected Components:**
- `admin/settings/page.tsx` - Moderation data
- Multi-tab management pages

**Estimated Refactoring Gain:** Reduce from 8+ states to 2 per component

---

### Pattern 5: Edit Mode States (10% of violations)

```typescript
// ❌ BEFORE: Multiple edit states
const [editingId, setEditingId] = useState<string | null>(null);
const [editForm, setEditForm] = useState({...});
const [savingEdit, setSavingEdit] = useState(false);

// ✓ AFTER: Single edit state
const [editState, setEditState] = useState({
  id: null,
  formData: {...},
  saving: false,
  error: null,
});
```

**Affected Components:**
- Any CRUD pages with inline editing

**Estimated Refactoring Gain:** Reduce from 3-5 states to 1 per component

---

## 4. COMPONENTS NEEDING MOST ATTENTION

### Priority 1: CRITICAL (23-19 states)

#### 1. `admin/users/page.tsx` (23 useState)
**Issues:**
- Embedded MultiSelect and SingleSelect components
- Handling both teachers and students in one page
- Teacher form has 5+ fields × 2 (Arabic + English names)
- Student form has 4+ fields
- Multiple async operations (add, edit, delete teacher; add, edit, delete student)

**Recommended Fix:**
```
Component Decomposition:
- UsersPage (container)
  ├── TeachersTab
  │   ├── TeacherForm (consolidate 8 states → 2)
  │   ├── TeacherList
  ├── StudentsTab
  │   ├── StudentForm (consolidate 6 states → 2)
  │   ├── StudentList
  └── Shared
      ├── MultiSelectComponent (move to ui/)
      ├── SingleSelectComponent (move to ui/)
```

**Estimated Reduction:** 23 → 6-8 states

**Effort:** 6-8 hours

---

#### 2. `admin/settings/page.tsx` (19 useState)
**Issues:**
- Three separate sections: Settings, Moderation, Monitoring
- Accordion state management
- Per-item expansion states
- Tab switching within moderation

**Recommended Fix:**
```
Decomposition:
- SettingsPage (container)
  ├── SettingsSection (consolidate 7 states → 2)
  ├── ModerationSection (consolidate 8 states → 3)
  └── MonitoringSection (consolidate 4 states → 1)

Use custom hooks:
- useAccordion(initial) → returns {state, toggle}
- useModeration() → returns {materials, announcements, comments, ...}
- useMonitoring() → returns {metrics, loading, error}
```

**Estimated Reduction:** 19 → 7-9 states

**Effort:** 6-8 hours

---

### Priority 2: HIGH (18-17 states)

#### 3. `teacher/quizzes/page.tsx` (18 useState)
**Issues:**
- Quiz list + form states
- Question management within quiz
- Results/attempts viewing
- Multiple nested expand/collapse states

**Decomposition:**
```
- TeacherQuizzesPage
  ├── QuizList
  ├── QuizForm (consolidate form states)
  ├── QuestionManager (extract as sub-component)
  └── ResultsViewer
```

**Estimated Reduction:** 18 → 7-9 states

**Effort:** 5-7 hours

---

#### 4. `student/assessments/page.tsx` (18 useState)
**Issues:**
- Similar to quizzes but for students
- Assessment list + quiz attempt states
- Results viewing
- Timer/validation states

**Decomposition:** Similar to quizzes

**Estimated Reduction:** 18 → 7-9 states

**Effort:** 5-7 hours

---

#### 5. `admin/subjects_exams/page.tsx` (17 useState)
**Issues:**
- Two tabs: Subjects and Exams
- Each tab has form, list, edit states
- Multiple expand/collapse states

**Decomposition:**
```
- SubjectsExamsPage
  ├── SubjectsTab (consolidate → 4-5 states)
  ├── ExamsTab (consolidate → 4-5 states)

Custom hooks:
- useTabState(tabs)
- useCRUDForm(initialData)
```

**Estimated Reduction:** 17 → 6-8 states

**Effort:** 4-6 hours

---

### Priority 3: MEDIUM (15-12 states)

Affected: `student/quizzes`, `teacher/homework`, `teacher/materials`, `admin/students`, `admin/teachers`, `teacher/page`

**Common Pattern:** CRUD operations on single resource
**Estimated Reduction Per Component:** 15→6, 14→5, 13→4
**Total Effort:** 15-20 hours combined

---

## 5. RECOMMENDED PRIORITY FOR FIXES

### Phase 1: Foundation (Weeks 1-2) - 15-20 hours
**Goal:** Create reusable state management patterns

1. **Create Custom Hooks** (5-7 hrs)
   - `useFormState(initialData)` - Consolidates form states
   - `useUIState(initialState)` - Consolidates UI visibility toggles
   - `useAsync(asyncFn)` - Consolidates loading/error/success states
   - `useCRUDForm(resource)` - Combines all above for CRUD operations

2. **Extract Embedded Components** (3-4 hrs)
   - Move `MultiSelect` to `components/ui/multi-select.tsx`
   - Move `SingleSelect` to `components/ui/single-select.tsx`
   - Update all imports

3. **Replace Native Dialogs** (2-3 hrs)
   - Replace all `confirm()` → `useDialog().confirm()`
   - Replace all `alert()` → `useDialog().alert()`
   - ESLint rule to prevent future violations

### Phase 2: Major Refactoring (Weeks 3-4) - 20-25 hours
**Goal:** Reduce violations in priority 1 & 2 components

1. **Refactor Priority 1 Components** (12-15 hrs)
   - `admin/users/page.tsx`
   - `admin/settings/page.tsx`

2. **Refactor Priority 2 Components** (8-10 hrs)
   - `teacher/quizzes/page.tsx`
   - `student/assessments/page.tsx`
   - `admin/subjects_exams/page.tsx`

### Phase 3: Documentation (Weeks 5) - 4-5 hours
**Goal:** Prevent future violations

1. **Create Documentation**
   - `docs/COMPONENT_ARCHITECTURE.md` - Design patterns
   - `docs/STATE_MANAGEMENT_GUIDE.md` - When/how to use hooks
   - `docs/REFACTORING_PATTERNS.md` - Examples with before/after
   - `ux_plan/routing.md` - Complete route map

2. **Add ESLint Rules**
   - Warn on useState > 5 per component
   - Warn on embedded component definitions

3. **Code Review Template**
   - Checklist for reviewers on state management

### Phase 4: Remaining Components (Weeks 6-7) - 10-15 hours
**Goal:** Reduce Priority 3 violations

- Batch refactor remaining 6 components
- Apply same patterns from Phase 2

---

## 6. MIGRATION GUIDE FOR DEVELOPERS

### Before Refactoring
```typescript
// Count states
grep -c "useState" your-component.tsx

// Measure complexity
cloc your-component.tsx
```

### After Refactoring Target
- **useState count:** Max 5 per component (down from 7+)
- **Component size:** Max 300-400 lines (down from 700+)
- **Readability:** Complex logic extracted to custom hooks

### Example Migration

**Step 1: Identify related states**
```typescript
// Before: 8 states
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [sections, setSections] = useState([]);
const [error, setError] = useState("");
const [saving, setSaving] = useState(false);
```

**Step 2: Create custom hook**
```typescript
// hooks/useCRUDForm.ts
export function useCRUDForm(initialData) {
  const [formData, setFormData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  return { formData, setFormData, isLoading, error, setError };
}
```

**Step 3: Apply hook**
```typescript
// After: 2 states + 1 hook
const form = useCRUDForm({ name: "", email: "", sections: [] });
const [isOpen, setIsOpen] = useState(false);
```

---

## 7. TESTING RECOMMENDATIONS

After refactoring each component:

1. **Unit Tests**
   - Test custom hooks in isolation
   - Test form validation logic
   - Test state transitions

2. **Integration Tests**
   - Test component with real data
   - Test all CRUD operations
   - Test error scenarios

3. **E2E Tests**
   - Test user workflows
   - Test data persistence
   - Test error recovery

---

## SUMMARY TABLE

| Category | Count | Auto-Fix | Manual | Priority | Effort (hrs) |
|----------|-------|----------|--------|----------|--------------|
| Excessive useState | 13 pages | 10% | 90% | P1 | 40-50 |
| Embedded Components | 3 | 100% | 0% | P1 | 1 |
| Native Dialogs | 90+ | 60% | 40% | P2 | 2 |
| Missing Docs | 3 docs | 0% | 100% | P3 | 4 |
| **TOTAL** | **~109** | **~20%** | **~80%** | | **~47-57** |

---

## NEXT STEPS

1. **Prioritize:** Focus on Phase 1 (Custom Hooks) before refactoring
2. **Document:** Create refactoring guide before starting Phase 2
3. **Review:** Establish code review process to prevent new violations
4. **Monitor:** Add linting rules to catch violations early

