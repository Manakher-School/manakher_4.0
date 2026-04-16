/**
 * CSV Parser utilities for bulk importing student data
 */

export interface StudentCSVRow {
  name_ar: string;
  name_en: string;
  email: string;
  password: string;
  section_id: string;
}

/**
 * Parse CSV content into student rows
 * Expected CSV columns: name_ar, name_en, email, password, section_id
 */
export function parseStudentCSV(csvContent: string): StudentCSVRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have headers and at least one data row');
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
  
  // Validate required columns
  const required = ['name_ar', 'name_en', 'email', 'password', 'section_id'];
  for (const col of required) {
    if (!headers.includes(col)) {
      throw new Error(`Missing required column: ${col}`);
    }
  }

  // Find column indices
  const indexMap = {
    name_ar: headers.indexOf('name_ar'),
    name_en: headers.indexOf('name_en'),
    email: headers.indexOf('email'),
    password: headers.indexOf('password'),
    section_id: headers.indexOf('section_id'),
  };

  // Parse data rows
  const rows: StudentCSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    rows.push({
      name_ar: values[indexMap.name_ar] || '',
      name_en: values[indexMap.name_en] || '',
      email: values[indexMap.email] || '',
      password: values[indexMap.password] || '',
      section_id: values[indexMap.section_id] || '',
    });
  }

  // Validate all rows have required fields
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.name_ar || !row.name_en || !row.email || !row.password || !row.section_id) {
      throw new Error(`Row ${i + 2} has missing required fields`);
    }
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
