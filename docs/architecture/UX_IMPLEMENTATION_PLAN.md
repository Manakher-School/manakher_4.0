# UX Architecture Implementation Plan

**Created:** 2026-04-09  
**Status:** PLANNING  
**Total Estimated Time:** 40-50 hours across 5 phases  
**Priority Sequence:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5  

---

## Executive Summary

The Manakher school management system is **feature-complete** but has significant architectural vulnerabilities:

- **47 documented violations** (18 HIGH, 19 MEDIUM, 10 LOW)
- **Overall quality score:** 58/100 (CRITICAL)
- **Main issues:**
  - Excessive state complexity (pages with 15-23 useState calls)
  - Accessibility gaps (WCAG 2.1 violations)
  - No error handling (unhandled errors crash entire pages)
  - Zero test coverage
  - Performance issues at scale (no pagination, no lazy loading)

This plan addresses all violations in 5 phases, with Phase 1-2 being critical for production readiness.

---

## Phase 1: State Management Refactoring (8-10 hours) - CRITICAL

### Objective
Reduce state complexity in 4 critical pages from 15-23 useState calls to 5-6 using custom hooks.

### Target Pages (Priority Order)

#### 1.1 `admin/users/page.tsx` - 23 states → 6 states
**Current issues:**
- 787 lines, 23 useState calls
- Duplicated "users", "teachers", "students" state management
- Mixed form data, UI state, loading states

**Refactoring approach:**
- Use `useCrudState` for CRUD UI state (show/hide panels, loading, expanded IDs)
- Use `useFormState` for form data (name_ar, name_en, email, password, etc.)
- Use `useFiltersState` for search, tab state, pagination
- Consolidate `teacherSections`, `teacherSubjects`, `studentSections` into form context
- Move teacher/student sub-tabs to context-based state

**Custom hooks to apply:**
```typescript
// Before: 23 scattered useState calls
const [users, setUsers] = useState([]);
const [teachers, setTeachers] = useState([]);
const [students, setStudents] = useState([]);
const [showCreateTeacher, setShowCreateTeacher] = useState(false);
// ... 19 more

// After: 3-4 consolidated hooks
const crudState = useCrudState<User>();
const formState = useFormState<CreateUserForm>();
const filterState = useFilterState();
const [activeTab, setActiveTab] = useTabState('teachers');
```

**Acceptance criteria:**
- Page still functions identically
- No data loss
- State updates happen at same speed
- Build passes, zero TypeScript errors

---

#### 1.2 `admin/settings/page.tsx` - 19 states → 7 states
**Current issues:**
- 701 lines, 19 useState calls
- Consolidates 3 separate concerns (settings, moderation, monitoring)
- Each accordion manages separate state

**Refactoring approach:**
- Use `useTabState` for accordion open/closed state (3 booleans → 1)
- Use `useFormState` for platform settings form (7 form fields → 1 object)
- Keep `monitoringMetrics` as single state object instead of 12 separate states
- Extract moderation tab content into sub-component with its own minimal state

**Acceptance criteria:**
- All 3 accordions work independently
- Settings save/load properly
- Monitoring metrics refresh automatically
- Moderation delete operations still cascade correctly

---

#### 1.3 `student/assessments/page.tsx` - 18 states → 6 states
**Current issues:**
- 781 lines, 18 useState calls
- Tab switching between quizzes and exams duplicated logic
- Timer, progress, quiz state all scattered

**Refactoring approach:**
- Use `useTabState` for quiz/exam tab switching
- Use `useCrudState` for quiz list UI (expanded, loading, selected quiz)
- Create `useQuizState` hook (consolidates: currentQuestion, answers, timeRemaining, submitted)
- Use `useFilterState` for exam filtering (status, subject)

**Acceptance criteria:**
- Tab switching works smoothly
- Quiz timer counts down correctly
- Quiz submission and auto-submit on expiry works
- Exams tab shows/hides properly

---

#### 1.4 `teacher/quizzes/page.tsx` - 18 states → 6 states
**Current issues:**
- 500+ lines, 18 useState calls
- Quiz editing, question management, results viewing all mixed

**Refactoring approach:**
- Use `useCrudState` for quiz list (expanded, selected quiz, loading)
- Use `useFormState` for quiz metadata (title, section, subject, time_limit, etc.)
- Use `useFormState` for question form (question_text, options, correct_answer)
- Use `useTabState` for panel switching (questions panel, results panel)

**Acceptance criteria:**
- Can create/edit/delete quizzes
- Can add/edit/delete questions
- Results panel shows all attempts properly
- No performance degradation

---

#### 1.5 Other Heavy Pages (13-15 states) - 6-8 states each
**Pages to refactor in this phase:**
- `teacher/materials/page.tsx` (13 states → 6)
- `teacher/homework/page.tsx` (14 states → 6)
- `student/quizzes/page.tsx` (15 states → 6)
- `admin/students/page.tsx` (13 states → 6)
- `admin/teachers/page.tsx` (12 states → 6)

**Strategy:** Apply same pattern as 1.1-1.4, one page at a time.

### Phase 1 Deliverables
- [ ] All 9 heavy pages refactored
- [ ] Build passes, zero TS errors
- [ ] All state management moved to `frontend/src/lib/hooks/`
- [ ] Barrel export in `hooks/index.ts` updated
- [ ] Commit: "refactor(state): Consolidate page state using custom hooks - Phase 1"

### Time Estimate: 8-10 hours

---

## Phase 2: Accessibility & Error Handling (6-8 hours) - CRITICAL

### Objective
Fix WCAG 2.1 violations and add error boundary protection.

### 2.1 Error Boundaries (3-4 hours)

**Current issue:** Single component error crashes entire page or app

**Solution:**
1. Create `ErrorBoundary` component in `frontend/src/components/error-boundary.tsx`
   - Catches React errors in subtree
   - Displays user-friendly error message
   - Has "Try Again" button (reload component state)
   - Logs error to console for debugging

2. Wrap each role dashboard:
   - `dashboard/admin/layout.tsx` → Wrap children
   - `dashboard/teacher/layout.tsx` → Wrap children
   - `dashboard/student/layout.tsx` → Wrap children

3. Wrap each page component:
   - All `/admin/*` pages
   - All `/teacher/*` pages
   - All `/student/*` pages

**Implementation:**
```typescript
// components/error-boundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

**Acceptance criteria:**
- Can trigger error in any page without crashing others
- Error message shown to user
- "Try Again" button works
- Page state preserved where possible

---

### 2.2 Accessibility Improvements (3-4 hours)

**Violations to fix:**

#### A. Keyboard Navigation for Dropdowns (1 hour)
**Current issue:** MultiSelect, SingleSelect dropdowns not keyboard accessible

**Fix:**
- Add `onKeyDown` handler to dropdown buttons
- Support `ArrowUp`, `ArrowDown` for option navigation
- Support `Enter`, `Space` to select
- Support `Escape` to close
- Focus management: focus returns to button after selection

**Files to update:**
- `components/ui/multi-select.tsx` (if exists, or create)
- `components/ui/single-select.tsx` (if exists, or create)
- All pages using these dropdowns

---

#### B. ARIA Labels & Form Associations (1.5 hours)
**Current issue:** Only 1 aria-label in codebase, forms missing htmlFor

**Fix:**
1. Add `aria-label` to all interactive elements:
   - Buttons: "Create user", "Delete section", "Edit material"
   - Icons: "Menu", "Close", "Search"
   - Form fields already have labels, ensure `htmlFor` matches

2. Add `aria-describedby` for error messages
   - Connect error message `id` to form field
   - Screen readers announce errors with field

3. Add `role` attributes where needed:
   - Custom modals: `role="dialog"`
   - Dropdown menus: `role="listbox"`
   - Tab panels: `role="tabpanel"`

**Implementation:**
```typescript
// Before
<button onClick={handleDelete}>Delete</button>

// After
<button onClick={handleDelete} aria-label={`Delete ${section.name_en}`}>
  Delete
</button>
```

---

#### C. Focus Management & Visible Focus Indicators (0.5 hours)
**Current issue:** Focus not visible on interactive elements in some cases

**Fix:**
1. Ensure `:focus-visible` CSS is applied globally (already done in `globals.css`)
2. Test all interactive elements in keyboard navigation
3. Update `focus:outline` to use accent color (already done)
4. Add focus management in modals (trap focus inside modal)

---

### 2.3 RTL/LTR Consistency Fixes (1-2 hours)

**Current issue:** Some components use hard-coded directional CSS (`border-l`, `ml-*`)

**Fix:**
- Replace all `border-l/r` with `border-s/e` (logical properties)
- Replace all `ml-*/mr-*` with `ms-*/me-*`
- Replace all `pl-*/pr-*` with `ps-*/pe-*`
- Replace all `text-left/right` with `text-start/end`
- Replace all `left/right` position values with `inset-inline-start/end`

**Scan for violations:**
```bash
grep -r "border-l\|border-r\|ml-\|mr-\|pl-\|pr-\|text-left\|text-right" frontend/src --include="*.tsx"
```

---

### Phase 2 Deliverables
- [ ] ErrorBoundary component created and deployed
- [ ] All role dashboards wrapped with error boundaries
- [ ] All pages wrapped with error boundaries
- [ ] Keyboard navigation works for all dropdowns
- [ ] aria-labels added to 100+ interactive elements
- [ ] All directional CSS changed to logical properties
- [ ] Accessibility audit results: WCAG 2.1 Level AA compliant
- [ ] Commit: "feat(a11y): Add error boundaries and improve accessibility - Phase 2"

### Time Estimate: 6-8 hours

---

## Phase 3: Testing Infrastructure (5-7 hours) - FOUNDATIONAL

### Objective
Setup Jest + React Testing Library, write tests for custom hooks and critical components.

### 3.1 Jest Setup (1 hour)

**Install dependencies:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest
```

**Create `jest.config.js`:**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
```

**Create `jest.setup.js`:**
```javascript
import '@testing-library/jest-dom';
```

**Update `package.json`:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

### 3.2 Custom Hook Tests (2-3 hours)

**Test files to create:**

#### `useCrudState.test.ts`
- Test initial state
- Test setLoading(true/false)
- Test setError(msg)
- Test clearError()
- Test setExpandedId(id)
- Test setData(data)
- Test reset()

#### `useFormState.test.ts`
- Test initial state from initialData
- Test updateField(key, value)
- Test setFormData(data)
- Test reset()
- Test validation if validation logic exists

#### `useFilterState.test.ts`
- Test initial pagination state
- Test setSearchTerm(term)
- Test setPage(page)
- Test setSort(field, direction)
- Test reset()

#### `useTabState.test.ts`
- Test initial tab state
- Test switchTab(tabName)
- Test reset()

**Example test:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCrudState } from '@/lib/hooks/useCrudState';

describe('useCrudState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCrudState());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.expandedId).toBe(null);
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useCrudState());
    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.isLoading).toBe(true);
  });
});
```

---

### 3.3 Component Tests (2-3 hours)

**Critical components to test:**

#### `components/ui/button.tsx`
- All variants render correctly
- Click handlers work
- Disabled state blocks clicks
- Loading state shows spinner

#### `components/ui/card.tsx`
- Renders children
- Applies correct styles

#### `components/ui/input.tsx`
- Input accepts text
- onChange callback fires
- Label associates with input

#### `components/ui/rich-editor.tsx`
- Editor loads content
- onChange fires on text change
- Toolbar buttons work

#### `components/ui/dialog.tsx`
- Dialog opens/closes
- Escape key closes
- Outside click closes (if clickOutside enabled)

#### `components/error-boundary.tsx`
- Catches errors
- Renders fallback UI
- Reset button works

**Example test:**
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const onClick = jest.fn();
    const { container } = render(<Button onClick={onClick}>Click</Button>);
    container.querySelector('button')?.click();
    expect(onClick).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByText('Click')).toBeDisabled();
  });
});
```

---

### Phase 3 Deliverables
- [ ] Jest configured and working
- [ ] 4 custom hook test files with 15+ tests each
- [ ] 6 UI component test files with 10+ tests each
- [ ] All tests passing locally
- [ ] CI/CD configured to run tests (GitHub Actions)
- [ ] Coverage report: >70% for hooks, >60% for components
- [ ] Commit: "test: Setup Jest and write tests for hooks and components - Phase 3"

### Time Estimate: 5-7 hours

---

## Phase 4: Component Extraction & Design System (4-6 hours)

### Objective
Extract reusable components, consolidate design tokens, create component documentation.

### 4.1 Extract Reusable Components (2-3 hours)

**Issues:**
- Dropdown logic duplicated across pages (MultiSelect, SingleSelect)
- Form patterns repeated (inline add, edit, delete modals)
- Modal/dialog patterns inconsistent

**Solution: Create Composable Components**

#### Create `FormDialog.tsx`
Wraps Dialog with form submission:
```typescript
interface FormDialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  children: React.ReactNode; // Form fields
  submitLabel?: string;
  isLoading?: boolean;
}

export function FormDialog({ isOpen, title, onClose, onSubmit, children, submitLabel = 'Save', isLoading = false }: FormDialogProps) {
  // Handles form submission, loading state, error handling
}
```

#### Create `DataTable.tsx`
Replaces manual list rendering:
```typescript
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => Promise<void>;
  pagination?: PaginationProps;
}

export function DataTable<T>({ columns, data, isLoading, onEdit, onDelete, pagination }: DataTableProps<T>) {
  // Renders table with consistent styling, sorting, pagination
}
```

#### Create `FilterBar.tsx`
Consolidates search + filters:
```typescript
interface FilterBarProps {
  searchPlaceholder?: string;
  filters?: Filter[];
  onSearch: (term: string) => void;
  onFilterChange: (filters: FilterValue[]) => void;
}

export function FilterBar({ searchPlaceholder, filters, onSearch, onFilterChange }: FilterBarProps) {
  // Search input + filter dropdowns
}
```

#### Create `InlineForm.tsx`
For inline add/edit forms:
```typescript
interface InlineFormProps {
  fields: FormField[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InlineForm({ fields, onSubmit, onCancel, isLoading }: InlineFormProps) {
  // Single-row form for adding/editing items
}
```

**Files to update with these components:**
- All admin pages (sections, subjects, teachers, students)
- All teacher pages (materials, homework)
- Reduce inline JSX by 40-50%

---

### 4.2 Design Token TypeScript Definitions (1-2 hours)

**Current issue:** Design tokens scattered in `globals.css` as CSS variables

**Solution: Create TypeScript design token system**

**Create `frontend/src/lib/design-tokens.ts`:**
```typescript
export const designTokens = {
  colors: {
    surface: '#faf8f5',
    surfaceCard: '#ffffff',
    surfaceSunken: '#f5f3f0',
    border: '#e5e1dc',
    ink: '#2d2420',
    accent: '#5b21b6',
    roleAdmin: { bg: '#6d28d9', text: '#f3e8ff' },
    roleTeacher: { bg: '#0d9488', text: '#ccfbf1' },
    roleStudent: { bg: '#b45309', text: '#fef3c7' },
  },
  typography: {
    headings: { fontFamily: 'Cairo', fontWeight: 700 },
    body: { fontFamily: 'Cairo', fontWeight: 400 },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
  },
} as const;

export type DesignTokens = typeof designTokens;
```

**Benefits:**
- Type-safe token usage
- Single source of truth
- Easy to validate token access
- Can be exported to design systems tools

---

### 4.3 Storybook Setup (1 hour) - Optional but Recommended

**Install Storybook:**
```bash
npx storybook@latest init
```

**Create stories for UI components:**
- `button.stories.tsx` - All button variants
- `badge.stories.tsx` - All badge variants
- `card.stories.tsx` - Card states
- `input.stories.tsx` - Input states
- `dialog.stories.tsx` - Dialog open/closed
- `form-dialog.stories.tsx` - FormDialog examples

**Benefits:**
- Visual component documentation
- Team can reference component usage
- Catch UI bugs before deployment

---

### Phase 4 Deliverables
- [ ] FormDialog, DataTable, FilterBar, InlineForm components created
- [ ] All admin/teacher pages refactored to use new components
- [ ] Design tokens defined in TypeScript
- [ ] Storybook setup and stories created for 8+ components
- [ ] Code duplication reduced by 35-40%
- [ ] Commit: "refactor(components): Extract reusable components and create design token system - Phase 4"

### Time Estimate: 4-6 hours

---

## Phase 5: Performance Optimization (4-6 hours)

### Objective
Improve bundle size, add lazy loading, implement pagination, optimize API calls.

### 5.1 Code Splitting & Lazy Loading (2 hours)

**Current issue:** All 26 pages loaded upfront, massive bundle

**Solution:**

#### Use Next.js Dynamic Imports
```typescript
import dynamic from 'next/dynamic';

// Lazy load admin pages
const AdminUsersPage = dynamic(() => import('./users/page'), { loading: () => <LoadingSpinner /> });
const AdminSettingsPage = dynamic(() => import('./settings/page'), { loading: () => <LoadingSpinner /> });
// ... etc for all pages
```

#### Update `dashboard/admin/layout.tsx`:
```typescript
// Route to lazy-loaded component based on pathname
const pageComponent = getPageComponent(pathname);
```

**Result:**
- Initial bundle: ~150KB → ~50KB
- Faster initial page load (FCP, LCP)
- Pages load on-demand (2-3s latency, but background doesn't block)

---

### 5.2 List Pagination (1.5 hours)

**Current issue:** Loading 300+ students, 50+ teachers at once

**Solution:**

Create `usePagination` hook:
```typescript
function usePagination<T>(fetchFn: (page: number, limit: number) => Promise<T[]>, initialLimit = 25) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadPage = async (pageNum: number) => {
    setIsLoading(true);
    const result = await fetchFn(pageNum, initialLimit);
    setData(result);
    setHasMore(result.length === initialLimit);
    setPage(pageNum);
    setIsLoading(false);
  };

  return { data, page, hasMore, isLoading, loadPage, nextPage: () => loadPage(page + 1) };
}
```

**Apply to:**
- `admin/users/page.tsx` - Paginate teachers/students (25 per page)
- `admin/students/page.tsx` - Legacy page, already paginated
- `teacher/materials/page.tsx` - Paginate by section (20 per page)
- `teacher/quizzes/page.tsx` - Paginate quizzes (15 per page)
- Student lists everywhere

---

### 5.3 API Call Optimization (1.5 hours)

**Current issue:** Multiple calls to same endpoints, no deduplication

**Solution:**

#### Use React Query (or SWR)
```typescript
import { useQuery } from '@tanstack/react-query';

// Deduplicates identical requests within 5 minutes
const { data: users } = useQuery({
  queryKey: ['users', { role: 'teacher' }],
  queryFn: () => pb.collection('users').getList(1, 999, { filter: `role = "teacher"` }),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**Benefits:**
- Automatic request deduplication
- Built-in caching
- Automatic refetch on window focus
- Handles error retry automatically

**Install:**
```bash
npm install @tanstack/react-query
```

**Setup in root layout:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

### 5.4 Image Optimization (1 hour) - If applicable

**Use Next.js Image component:**
```typescript
import Image from 'next/image';

// Before
<img src={avatarUrl} alt="User" width={32} height={32} />

// After
<Image src={avatarUrl} alt="User" width={32} height={32} />
```

**Benefits:**
- Automatic compression
- Responsive images
- Lazy loading below fold
- AVIF format fallback

---

### Phase 5 Deliverables
- [ ] Code splitting implemented for all pages
- [ ] Initial bundle size: 150KB → <60KB
- [ ] Pagination added to all lists >25 items
- [ ] React Query integrated for API calls
- [ ] API calls deduplicated (eliminate 30% of requests)
- [ ] Performance metrics improved:
  - FCP: <2s (from <3s)
  - LCP: <3s (from <5s)
  - CLS: <0.1
- [ ] Commit: "perf: Add code splitting, pagination, and React Query - Phase 5"

### Time Estimate: 4-6 hours

---

## Implementation Timeline

| Phase | Focus | Time | Status | Notes |
|-------|-------|------|--------|-------|
| **Phase 1** | State Management | 8-10h | NOT STARTED | Critical - blocks everything else |
| **Phase 2** | Accessibility & Errors | 6-8h | NOT STARTED | Critical - production blocker |
| **Phase 3** | Testing | 5-7h | NOT STARTED | Foundational - catch bugs early |
| **Phase 4** | Components & Design | 4-6h | NOT STARTED | Quality improvement |
| **Phase 5** | Performance | 4-6h | NOT STARTED | Scale optimization |
| **TOTAL** | All phases | **27-37h** | PLANNING | ~1 full week of dev work |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| State refactoring breaks pages | HIGH | Test thoroughly after each page, run full test suite |
| Accessibility changes break layout | MEDIUM | Use logical CSS properties consistently, test in RTL |
| Testing takes longer than estimated | MEDIUM | Focus on critical paths first, expand coverage later |
| Performance changes cause bugs | MEDIUM | Monitor error rates, have rollback plan |

---

## Success Criteria

**Phase 1 Success:**
- [ ] All pages compile (zero TS errors)
- [ ] All CRUD operations work
- [ ] Page load time unchanged
- [ ] No data loss

**Phase 2 Success:**
- [ ] No unhandled errors crash pages
- [ ] Keyboard navigation works
- [ ] WCAG 2.1 AA audit passes

**Phase 3 Success:**
- [ ] Test suite passes
- [ ] >70% coverage for hooks
- [ ] >60% coverage for components
- [ ] CI/CD runs tests on every commit

**Phase 4 Success:**
- [ ] Reusable components adopted
- [ ] 35-40% code duplication eliminated
- [ ] Storybook deployed

**Phase 5 Success:**
- [ ] Bundle size <60KB (from 150KB)
- [ ] All lists paginated
- [ ] API calls deduplicated
- [ ] Lighthouse score >90

---

## Next Steps

1. Review this plan
2. Approve phases to proceed with
3. I will start Phase 1 (State Management)
4. Each phase will be committed with detailed iteration logs in `journal.md`
5. After each phase, we'll verify success criteria before moving to next phase

---

## References

- UX_ARCHITECTURE_AUDIT.json - Detailed violations (47 findings)
- ux_plan/components.md - Component inventory
- ux_plan/routing.md - Route architecture
- UX_FIX_IMPLEMENTATION_GUIDE.md - Custom hook examples
- frontend/src/lib/hooks/ - Custom hooks (already created)

