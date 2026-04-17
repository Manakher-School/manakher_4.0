/**
 * CSV Parser utilities for bulk importing student data
 * Accepts: CSV, Excel (xlsx/xls), Google Sheets exports
 */

export interface StudentImportRow {
  name_ar: string;
  rowNumber: number;
}

/**
 * Parse CSV/Excel content into student rows
 * Extracts only the "الاسم" (Arabic name) column
 * Accepts any file format as long as it contains the column
 */
export function parseStudentCSV(csvContent: string): StudentImportRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have headers and at least one data row');
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());
  
  // Find the "الاسم" column (case-insensitive)
  const nameArabicIndex = headers.findIndex(h => 
    h.toLowerCase().includes('الاسم') || 
    h.toLowerCase() === 'name' || 
    h.toLowerCase() === 'الاسم'
  );

  if (nameArabicIndex === -1) {
    throw new Error('Column "الاسم" (Arabic name) not found in the file');
  }

  // Parse data rows - extract only name_ar
  const rows: StudentImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const nameAr = values[nameArabicIndex]?.trim() || '';

    // Only add rows that have a name
    if (nameAr) {
      rows.push({
        name_ar: nameAr,
        rowNumber: i + 1, // Row number in original file (1-indexed)
      });
    }
  }

  if (rows.length === 0) {
    throw new Error('No valid rows found with names in the file');
  }

  return rows;
}

/**
 * Read a File as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
