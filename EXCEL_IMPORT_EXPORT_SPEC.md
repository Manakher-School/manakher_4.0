# Excel Import/Export Feature Specification

**Created:** 2026-04-11  
**Status:** SPECIFICATION  
**Priority:** HIGH (Round 11 Feature)

---

## 1. Excel Import Feature

### 1.1 Overview
Allow admins to bulk import students from Excel files (.xls, .xlsx, .csv) into the system.

### 1.2 File Format

#### Input File Requirements
- **File Types:** .xls, .xlsx, .csv
- **Encoding:** UTF-8 (for Arabic support)
- **Columns:** Full Name (Arabic only), Social Number (not imported)
- **Example File:** "طلاب أول ب.xls" (Students Grade 1 Section B)

#### Data Extraction
- Column 1: Full Name (Arabic) - **REQUIRED**
- Column 2: Social Number - **IGNORED** (not stored for legal reasons)
- Other columns: Ignored

#### Auto-Generated Fields
- **Email:** `firstname_lastname@manakher.edu.jo`
  - Extract first and last name from "Full Name"
  - Convert to lowercase
  - Replace Arabic with Latin equivalents
  - Example: "أحمد محمد" → "ahmad_mohammad@manakher.edu.jo"
- **Password:** Same as email (initial password = email)
- **Role:** "student" (hardcoded)
- **Section:** Selected by user during import (dropdown)

### 1.3 Import UI/UX

#### Import Modal
- **Trigger:** "Import Students" button on Students tab in admin/users page
- **Layout:**
  1. File upload area (drag & drop or file picker)
  2. Section selector dropdown (get from system: "Grade 1 - Section A", etc.)
  3. Preview area (shows first 5 rows of parsed data)
  4. Allowed file types display

#### File Upload Component
```
┌─────────────────────────────────────────┐
│ Import Students                    [×]  │
├─────────────────────────────────────────┤
│ Allowed file types: .xls, .xlsx, .csv   │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Drag file here or Click to select   │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ Section: [Dropdown: Select Section...] │
│                                          │
│ Preview (Read-only):                    │
│ ┌─────────────────────────────────────┐ │
│ │ Full Name          | Email           │ │
│ ├─────────────────────────────────────┤ │
│ │ أحمد محمد          | ahmad_moha...   │ │
│ │ فاطمة علي          | fatima_ali...   │ │
│ │ ...                | ...             │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ [Cancel] [Import]                      │
└─────────────────────────────────────────┘
```

### 1.4 Import Process

#### Step 1: File Upload & Parsing
- User selects Excel file
- System parses file and extracts Full Name column
- Display preview of data

#### Step 2: Section Selection
- User selects section from dropdown (required)
- Section options populated from system

#### Step 3: Email Generation & Validation
- Extract first/last name from "Full Name"
- Generate email: `firstname_lastname@manakher.edu.jo`
- Check for duplicates

#### Step 4: Duplicate Detection & Preview
- **Check:** Is email already in system?
- **Show:** Preview of:
  - New students to import (green)
  - Duplicate students (orange/warning)
- **Allow:** User to deselect duplicates before importing

#### Step 5: Import Confirmation
- User reviews preview
- Can deselect rows to skip
- Clicks "Import" to proceed

#### Step 6: Batch Insert & Response
- Create user records for all selected rows
- Set password = email
- Assign to section
- Show success message: "Imported 45 students successfully"
- Show errors (if any): "Failed to import 2 students - see details"

### 1.5 Error Handling

#### Preview Mode Before Import
- Parse file and identify issues
- Show preview with status:
  - ✅ "Valid - will import" (green)
  - ⚠️ "Duplicate - email exists" (orange, allow user to skip)
  - ❌ "Error - invalid data" (red, cannot import)
- User decides which rows to import

#### Error Types & Messages
| Error | Message | Action |
|-------|---------|--------|
| Empty name | "Row 5: Name is empty" | Skip row |
| Duplicate email | "Row 8: Email already exists (Ahmed)" | Show existing student, allow skip |
| Invalid format | "Row 12: Could not parse name" | Skip row |
| File format | "Unsupported file type - use .xls, .xlsx, .csv" | Retry with correct format |

### 1.6 Success Response
```json
{
  "success": true,
  "imported": 45,
  "skipped": 2,
  "duplicates": 2,
  "errors": 0,
  "message": "Successfully imported 45 students to Grade 1 - Section B",
  "details": {
    "duplicates": ["ahmed@manakher.edu.jo", "fatima@manakher.edu.jo"],
    "errors": []
  }
}
```

---

## 2. Excel Export Feature

### 2.1 Overview
Allow admins to export student and teacher lists to Excel.

### 2.2 Export Targets

#### Students Export
- **Trigger:** Export button on Students tab
- **Scope Options:**
  - Export by section (dropdown select section)
  - Export all students
  - Export currently filtered view
- **Columns:**
  - Student ID
  - Name (Arabic)
  - Email
  - Section
  - Date Created
  - Status (Active/Inactive)

#### Teachers Export
- **Trigger:** Export button on Teachers tab
- **Scope:** All teachers (system-wide)
- **Columns:**
  - Teacher ID
  - Name (Arabic)
  - Email
  - Assigned Sections (comma-separated)
  - Assigned Subjects (comma-separated)
  - Date Created
  - Status (Active/Inactive)

### 2.3 Export Format
- **File Type:** .xlsx (Excel 2007+)
- **File Naming:**
  - Students: `Students_Grade1_SectionA_2026-04-11.xlsx`
  - Teachers: `Teachers_AllSchools_2026-04-11.xlsx`
  - Format: `[Type]_[Scope]_[Date].xlsx`
- **Sheet Name:** "Students" or "Teachers"
- **Headers:** Bold, frozen row, background color

### 2.4 Export UI
```
Students Tab Actions:
[Search] [Add Student] [Import] [Export ▼]
                                   ├─ Export by Section
                                   ├─ Export All Students
                                   └─ Export Filtered View

Teachers Tab Actions:
[Search] [Add Teacher] [Export ▼]
                         └─ Export All Teachers
```

### 2.5 Export Process

#### Step 1: User Clicks Export
- Show dropdown or modal with options

#### Step 2: Select Scope
- For students: Choose section (dropdown)
- For teachers: Auto (all teachers)

#### Step 3: Generate File
- Query database for selected records
- Create Excel workbook
- Add headers and data
- Format as table

#### Step 4: Download
- Browser downloads file
- Filename: Auto-generated with date

### 2.6 Example Export Structure

**Students Export (طلاب.xlsx)**
```
| Student ID | Name       | Email               | Section          | Date Created | Status |
|------------|------------|---------------------|------------------|--------------|--------|
| stu_001   | أحمد محمد  | ahmad_mohammad@...  | 1-A (Grade 1 A)  | 2026-04-01   | Active |
| stu_002   | فاطمة علي  | fatima_ali@...      | 1-A (Grade 1 A)  | 2026-04-02   | Active |
```

**Teachers Export (معلمون.xlsx)**
```
| Teacher ID | Name      | Email          | Sections    | Subjects                    | Date Created | Status |
|-----------|-----------|----------------|-------------|----------------------------|--------------|--------|
| tea_001   | سارة أحمد | sarah_ahmad@.. | 1-A, 1-B    | Arabic, Islamic Studies    | 2026-03-15   | Active |
| tea_002   | محمد علي  | mohammad_ali@. | 2-C         | Mathematics, Science       | 2026-03-16   | Active |
```

---

## 3. Implementation Plan

### Phase 1: Backend API Endpoints
- [ ] POST `/api/students/import` - Parse and validate Excel file
- [ ] POST `/api/students/import/preview` - Preview before import
- [ ] POST `/api/students/import/confirm` - Confirm and execute import
- [ ] GET `/api/students/export?section=xxx` - Export students
- [ ] GET `/api/teachers/export` - Export teachers
- [ ] Utility: `parseExcelFile(file)` - XLS/XLSX/CSV parser
- [ ] Utility: `generateEmail(fullName)` - Arabic name to email converter

### Phase 2: Frontend Import UI
- [ ] Create `StudentImportModal` component
- [ ] File upload with drag & drop
- [ ] Section selector
- [ ] Data preview table
- [ ] Import confirmation flow
- [ ] Error handling UI

### Phase 3: Frontend Export UI
- [ ] Add Export button to Students tab
- [ ] Add Export button to Teachers tab
- [ ] Export scope selector
- [ ] Loading state during download
- [ ] File format validation

### Phase 4: Testing & Validation
- [ ] Test import with sample file
- [ ] Test duplicate detection
- [ ] Test email generation with Arabic names
- [ ] Test export formats
- [ ] Test error scenarios

---

## 4. Technical Notes

### Arabic Name to Email Conversion
```typescript
function generateEmail(arabicName: string): string {
  const words = arabicName.trim().split(/\s+/);
  const latinized = words.map(word => transliterateArabic(word)).join('_');
  return `${latinized.toLowerCase()}@manakher.edu.jo`;
}

// Example:
// "أحمد محمد" → "ahmad_mohammad@manakher.edu.jo"
// "فاطمة علي" → "fatima_ali@manakher.edu.jo"
```

### File Parsing Libraries
- **Excel:** `xlsx` (npm package)
- **CSV:** Built-in or `papaparse`
- **XLS (Legacy):** `xlsxPopulate` or convert to XLSX first

### Database Constraints
- Email must be unique (constraint on users table)
- Section must exist (foreign key)
- Password must be hashed before storage (use existing auth system)

### Security Considerations
- Validate file size (max 5MB)
- Validate file type (MIME check)
- Rate limit import endpoint
- Sanitize names before email generation
- Log all imports for audit trail

---

## 5. Dependencies & File Structure

### New Files/Components
```
frontend/src/components/
├── ui/
│   ├── student-import-modal.tsx       # Import UI component
│   └── export-button.tsx               # Export button component
└── hooks/
    └── useExcelExport.ts               # Export logic hook

frontend/src/lib/
├── excel/
│   ├── parser.ts                       # Parse Excel/CSV files
│   ├── name-converter.ts               # Arabic to Latin converter
│   └── email-generator.ts              # Email generation logic
└── api/
    └── import-export-api.ts            # API client methods

backend/src/routes/
├── students/
│   ├── import.ts                       # POST /students/import
│   ├── import-preview.ts               # POST /students/import/preview
│   ├── import-confirm.ts               # POST /students/import/confirm
│   └── export.ts                       # GET /students/export

backend/src/routes/
├── teachers/
│   └── export.ts                       # GET /teachers/export
```

### Dependencies to Add
```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.5"
  }
}
```

---

## 6. User Stories

### Story 1: Import Students from Excel
**As an** Admin  
**I want to** bulk import students from an Excel file  
**So that** I don't have to add each student individually  

**Acceptance Criteria:**
- [ ] Can select .xls, .xlsx, or .csv file
- [ ] Can preview data before import
- [ ] System generates emails automatically
- [ ] Duplicate detection prevents double-import
- [ ] Shows success/error summary after import

### Story 2: Export Student List
**As an** Admin  
**I want to** export student lists to Excel  
**So that** I can share with management or use in reports  

**Acceptance Criteria:**
- [ ] Can export by section or all students
- [ ] File contains Name, Email, Section, Date Created
- [ ] Filename includes section name and date
- [ ] Can open in Microsoft Excel or Google Sheets

### Story 3: Export Teacher List
**As an** Admin  
**I want to** export teacher lists to Excel  
**So that** I can manage teacher assignments and communications  

**Acceptance Criteria:**
- [ ] Can export all teachers
- [ ] File shows sections and subjects assigned
- [ ] Includes contact information

---

## 7. Timeline Estimate

| Task | Hours | Status |
|------|-------|--------|
| Backend: File parsing & email generation | 2 | Pending |
| Backend: Import endpoints (preview + confirm) | 3 | Pending |
| Backend: Export endpoints (students + teachers) | 2 | Pending |
| Frontend: Import modal UI | 3 | Pending |
| Frontend: Export buttons & logic | 2 | Pending |
| Testing & validation | 2 | Pending |
| **TOTAL** | **14 hours** | Pending |

---

## References
- Excel file sample: `طلاب أول ب.xls`
- Admin users page: `frontend/src/app/[lang]/dashboard/admin/users/page.tsx`
- Backend collections: PocketBase (users, class_sections, subjects)

