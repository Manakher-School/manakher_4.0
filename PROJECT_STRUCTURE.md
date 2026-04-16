# Project Structure

## 📁 Root Directory

```
manakher_deployed_1/
├── frontend/              # Next.js 15 frontend application
├── backend/               # PocketBase backend
├── docs/                  # Organized documentation
├── journal.md             # Single source of truth - iteration history
├── README.md              # Project overview
├── AGENTS.md              # AI agent architectural guidelines
├── .gitignore             # Git ignore rules
├── opencode.json          # OpenCode configuration
└── .git/                  # Git repository
```

## 📚 Documentation Structure (`/docs`)

### `/docs/testing` - M12 Browser Testing
- **M12_COMPREHENSIVE_TESTING_GUIDE.md** - 100+ test cases with step-by-step instructions
- **M12_PRODUCTION_READINESS_SUMMARY.md** - Executive summary and deployment checklist
- **M12_MANUAL_TESTING_SETUP.md** - Setup instructions for browser testing
- **M12_TESTING_CHECKLIST.md** - Quick reference checklist
- **M12_COMPLETION_REPORT.md** - Final completion status
- **M12_SESSION_HANDOFF.md** - Handoff document for testing team

### `/docs/architecture` - System Design & Plans
- **UX_IMPLEMENTATION_PLAN.md** - 5-phase UX refactoring roadmap
- **UX_FIX_IMPLEMENTATION_GUIDE.md** - Implementation patterns and examples
- **PERFORMANCE_PLAN.md** - Performance optimization strategy
- **CODEBASE_ANALYSIS.md** - Complete codebase structure analysis
- **README_ANALYSIS.md** - README documentation review
- **QUICK_REFERENCE.md** - Quick reference guide for common tasks

### `/docs/audit` - Quality Assurance Reports
- **UX_VIOLATIONS_ANALYSIS.md** - Detailed analysis of 47 UX violations
- **UX_VIOLATIONS_INDEX.md** - Index of all violations by type
- **UX_VIOLATIONS_SUMMARY.md** - Summary of violations by severity
- **UX_AUDIT_INDEX.md** - Complete audit index
- **UX_AUDIT_SUMMARY.md** - Audit summary
- **UX_ARCHITECTURE_AUDIT.json** - Machine-readable audit data

### `/docs/archive` - Historical References
- **M9_*.md** - Milestone 9 testing documentation
- **M11_*.md** - Milestone 11 completion reports
- **ROUND_10_11_STATUS.md** - Round 10-11 status tracking
- **UX_FIX_*.md** - Old UX fix session notes
- **ALERTS_MAPPING.md** - One-time setup mapping (archived)
- **EXCEL_IMPORT_EXPORT_SPEC.md** - Excel integration spec (archived)

## 💻 Application Code

### `/frontend` - Next.js 15 Frontend
- `src/app/` - App Router pages (locale-prefixed routes)
- `src/components/` - Reusable UI components
- `src/lib/` - Utilities and hooks
  - `hooks/` - Custom state management hooks
    - `useCrudState.ts` - CRUD UI state
    - `useFormState.ts` - Form data + validation
    - `useFilterState.ts` - Search/filter/pagination
    - `useTabState.ts` - Tab navigation
  - `pocketbase.ts` - PocketBase client
  - `auth.ts` - Authentication utilities
  - `i18n.ts` - Internationalization
- `src/context/` - React context providers
- `src/dictionaries/` - Translation files (ar.json, en.json)
- `__tests__/` - Jest test files
- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup file

### `/backend` - PocketBase Backend
- `pb_migrations/` - Database migrations
- `pocketbase` - PocketBase executable
- `pb.log` - PocketBase logs
- `pb_data/` - Local database (not committed)

## 📋 Essential Root Files

| File | Purpose |
|------|---------|
| `journal.md` | **SINGLE SOURCE OF TRUTH** - Complete iteration history (2400+ lines) |
| `README.md` | Project overview and quick start guide |
| `AGENTS.md` | AI agent architectural guidelines and tech stack |
| `.gitignore` | Git ignore rules (excludes pb_data, .env.local, node_modules, etc.) |
| `opencode.json` | OpenCode IDE configuration |

## 🗂️ What Changed (Cleanup)

### ✅ Organized Into `/docs`
- 28 documentation files moved into 4 organized folders
- Testing guides in `/docs/testing` (6 files)
- Architecture docs in `/docs/architecture` (6 files)
- Audit reports in `/docs/audit` (6 files)
- Historical archives in `/docs/archive` (10 files)

### ❌ Removed Clutter
- `.ux_limb/` - Empty directory
- `ux_plan/` - Old planning files
- `testing_report.txt` - Old report
- `summary.md` - Duplicate summary

### Result
- **Before:** 41 root-level entries (cluttered)
- **After:** 10 root-level entries (clean)
- All documentation remains accessible via organized `/docs` structure

## 🎯 Quick Navigation

### For Testing (M12)
- Start here: `docs/testing/M12_COMPREHENSIVE_TESTING_GUIDE.md`
- Setup: `docs/testing/M12_MANUAL_TESTING_SETUP.md`
- Reference: `docs/testing/M12_TESTING_CHECKLIST.md`

### For Architecture Understanding
- Overview: `README.md`
- Agent Guidelines: `AGENTS.md`
- Implementation Plan: `docs/architecture/UX_IMPLEMENTATION_PLAN.md`
- Codebase Analysis: `docs/architecture/CODEBASE_ANALYSIS.md`

### For Project History
- Complete History: `journal.md` (source of truth)
- Previous Milestones: `docs/archive/`
- Audit Findings: `docs/audit/`

## 📊 Project Status

**Build:** ✅ All 56 pages compile, zero TypeScript errors  
**Tests:** ✅ 124 Jest tests passing (>85% coverage)  
**Performance:** ✅ 97% memory optimization (852MB → 28MB)  
**Status:** **PRODUCTION READY** - Ready for comprehensive browser testing (M12)

---

Generated: 2026-04-16  
Last Updated: Documentation reorganization commit
