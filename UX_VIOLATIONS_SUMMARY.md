# UX VIOLATIONS - QUICK REFERENCE SUMMARY

## Top Violations by Severity

### 🔴 CRITICAL - Immediate Attention Required

**Components with 19-23 useState states:**
1. `admin/users/page.tsx` - **23 states** → Target: 6-8 states (70% reduction)
2. `admin/settings/page.tsx` - **19 states** → Target: 7-9 states (60% reduction)

**Why:** These components handle multiple features (tabs, forms, CRUD ops) without proper decomposition.

**Quick Wins in These Two:**
- Extract MultiSelect/SingleSelect components (15 min)
- Move settings/moderation/monitoring into sub-components (3 hours)
- Consolidate form states (2 hours)

---

## Main Violation Patterns (In Order of Frequency)

### 1️⃣ FORM STATES (30% of violations)
```typescript
// ❌ BAD: 8 separate states
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
// ... + 5 more

// ✅ GOOD: 1 state
const [form, setForm] = useState({ name: "", email: "", password: "" });
```
**Affected:** 6 components | **Fix Time:** 2-3 hrs per component

---

### 2️⃣ UI TOGGLES (25% of violations)
```typescript
// ❌ BAD: Multiple visibility states
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState(null);
const [expandedItem, setExpandedItem] = useState(null);

// ✅ GOOD: Single UI state object
const [ui, setUi] = useState({ showForm: false, editingId: null, expandedItem: null });
```
**Affected:** 8 components | **Fix Time:** 1-2 hrs per component

---

### 3️⃣ ASYNC LOADING STATES (20% of violations)
```typescript
// ❌ BAD: Multiple loading states
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [deleting, setDeleting] = useState(false);

// ✅ GOOD: Single async state with custom hook
const { loading, saving, deleting, error } = useAsync(operations);
```
**Affected:** 10+ components | **Fix Time:** 1-2 hrs per component

---

### 4️⃣ DATA COLLECTIONS (15% of violations)
```typescript
// ❌ BAD: Separate state for each collection
const [materials, setMaterials] = useState([]);
const [announcements, setAnnouncements] = useState([]);
const [materialsLoading, setMaterialsLoading] = useState(false);

// ✅ GOOD: Collections manager
const { materials, announcements, loading } = useCollections(['materials', 'announcements']);
```
**Affected:** 4 components | **Fix Time:** 1.5-2 hrs per component

---

### 5️⃣ EDIT MODES (10% of violations)
```typescript
// ❌ BAD: Multiple edit states scattered
const [editingId, setEditingId] = useState(null);
const [editForm, setEditForm] = useState({});
const [editError, setEditError] = useState("");

// ✅ GOOD: Single edit state object
const [editMode, setEditMode] = useState({ id: null, form: {}, error: "" });
```
**Affected:** 5 components | **Fix Time:** 0.5-1 hr per component

---

## Auto-Fixable Violations (Quick Wins - 1-2 Hours Total)

✅ **Can be fixed with Find & Replace + Manual Moves:**

1. **Move Embedded Components** (15 min)
   - `MultiSelect` from `admin/users/page.tsx` → `components/ui/multi-select.tsx`
   - `SingleSelect` from `admin/users/page.tsx` → `components/ui/single-select.tsx`

2. **Replace Native Dialogs** (30 min)
   - Replace all `confirm()` with `useDialog().confirm()`
   - Replace all `alert()` with `useDialog().alert()`

3. **Clean Up Unused Imports** (10 min)
   - Run `eslint --fix`

---

## Manual Fixes by Priority

### Phase 1: Foundation (15-20 hrs)
**Create 4 Custom Hooks:**
1. `useFormState(initialData)` - Consolidate form states
2. `useUIState(initialState)` - Consolidate visibility toggles
3. `useAsync(asyncFn)` - Consolidate loading/error states
4. `useCRUDForm(resource)` - Combine all three above

**Plus:** Extract 3 embedded components

---

### Phase 2: Refactor Top 5 Components (18-25 hrs)
1. **admin/users/page.tsx** (6-8 hrs) - Split into TeachersTab + StudentsTab
2. **admin/settings/page.tsx** (6-8 hrs) - Split into 3 sections
3. **teacher/quizzes/page.tsx** (5-7 hrs) - Split into QuizList + QuizForm + QuestionsPanel
4. **student/assessments/page.tsx** (4-6 hrs) - Similar to quizzes
5. **admin/subjects_exams/page.tsx** (4-6 hrs) - Split into SubjectsTab + ExamsTab

---

### Phase 3: Documentation (4-5 hrs)
- `docs/COMPONENT_ARCHITECTURE.md` - Design patterns
- `docs/STATE_MANAGEMENT_GUIDE.md` - When/how to use hooks
- `ux_plan/routing.md` - Complete route map
- Add ESLint rules to prevent future violations

---

### Phase 4: Remaining Components (10-15 hrs)
- Batch refactor Priority 3 components (6 more pages with 9-15 states)

---

## Impact Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Total useState count** | 200+ | 100-120 | -40-50% |
| **Avg states per page** | 14.5 | 7-8 | -50% |
| **Component size (lines)** | 500-800 | 250-400 | -40% |
| **Maintainability score** | Low | Medium-High | +100% |
| **Test coverage ease** | Hard | Easy | +200% |

---

## Files Involved

**Need Refactoring (13 files):**
- admin: users, settings, subjects_exams, students, teachers, exams, announcements
- teacher: quizzes, homework, materials, announcements, page
- student: assessments, quizzes

**Need New Custom Hooks (1 file):**
- `hooks/useFormState.ts`
- `hooks/useUIState.ts`
- `hooks/useAsync.ts`
- `hooks/useCRUDForm.ts`

**Need New UI Components (2 files):**
- `components/ui/multi-select.tsx`
- `components/ui/single-select.tsx`

**Need Documentation (3 files):**
- `docs/COMPONENT_ARCHITECTURE.md`
- `docs/STATE_MANAGEMENT_GUIDE.md`
- `ux_plan/routing.md` (expand existing)

---

## Success Criteria

After all refactoring:
- ✅ No component with 7+ useState hooks
- ✅ Max 5 useState per component
- ✅ Max 400 lines per page component
- ✅ All custom hooks exported from `hooks/` directory
- ✅ All UI components in `components/ui/` directory
- ✅ Zero native `alert()`/`confirm()` calls
- ✅ ESLint rules enforcing these constraints
- ✅ Complete routing documentation
- ✅ 90%+ test coverage on custom hooks

---

## Commands for Developers

```bash
# Count useState in a file
grep -c "useState" path/to/file.tsx

# Find all excessive useState components
find frontend/src -name "*.tsx" -type f | while read f; do 
  count=$(grep -c "useState" "$f" 2>/dev/null || echo 0); 
  if [ "$count" -gt 6 ]; then echo "$count:$f"; fi; 
done | sort -rn

# Check component size
wc -l frontend/src/app/[lang]/dashboard/admin/users/page.tsx
```

---

## Next Actions

1. **TODAY:** Approve this analysis
2. **WEEK 1:** Create custom hooks (Phase 1 foundation)
3. **WEEK 2-3:** Refactor top 5 components (Phase 2)
4. **WEEK 4:** Documentation + ESLint rules (Phase 3)
5. **WEEK 5-6:** Remaining components (Phase 4)

