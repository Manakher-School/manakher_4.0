/**
 * CSV Parser utilities for bulk importing student data
 * Accepts: CSV, Excel (xlsx/xls), ODS, and Google Sheets exports
 */

import * as XLSX from 'xlsx';

export interface StudentImportRow {
  name_ar: string;
  name_en?: string;
  email?: string;
  password?: string;
  section_id?: string;
  rowNumber: number;
}

/**
 * Parse CSV/Excel/ODS content into student rows
 * Extracts only the "الاسم" (Arabic name) column
 * Accepts: CSV, Excel (xlsx/xls), ODS formats
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
 * Parse Excel/ODS file into student rows
 * Uses XLSX library to handle multiple formats
 */
export async function parseExcelFile(file: File): Promise<StudentImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('No sheets found in file');
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
          throw new Error('No data rows found in file');
        }

        // Find the Arabic name column
        const firstRow = jsonData[0];
        const nameColumnKey = Object.keys(firstRow).find(key => 
          key.toLowerCase().includes('الاسم') || 
          key.toLowerCase() === 'name' ||
          key.toLowerCase() === 'الاسم'
        );

        if (!nameColumnKey) {
          throw new Error('Column "الاسم" (Arabic name) not found in the file');
        }

        // Extract names
        const rows: StudentImportRow[] = [];
        jsonData.forEach((row, index) => {
          const nameAr = (row[nameColumnKey] || '').trim();
          if (nameAr) {
            rows.push({
              name_ar: nameAr,
              rowNumber: index + 2, // Row number in original file (1-indexed, +1 for header)
            });
          }
        });

        if (rows.length === 0) {
          throw new Error('No valid rows found with names in the file');
        }

        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Determine file type and parse accordingly
 */
export async function parseStudentFile(file: File): Promise<StudentImportRow[]> {
  const fileName = file.name.toLowerCase();
  
  // Check file type by extension
  if (fileName.endsWith('.csv')) {
    const text = await readFileAsText(file);
    return parseStudentCSV(text);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods')) {
    return parseExcelFile(file);
  } else {
    // Try to auto-detect by MIME type or attempt Excel parsing first
    if (file.type.includes('spreadsheet') || file.type.includes('sheet') || file.type.includes('ms-excel')) {
      try {
        return parseExcelFile(file);
      } catch {
        // Fall back to CSV if Excel parsing fails
        const text = await readFileAsText(file);
        return parseStudentCSV(text);
      }
    } else {
      // Assume CSV for unknown types
      const text = await readFileAsText(file);
      return parseStudentCSV(text);
    }
  }
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
