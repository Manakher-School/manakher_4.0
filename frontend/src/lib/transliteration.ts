/**
 * Arabic to Latin transliteration utilities for email and name generation
 */

// Arabic to Latin character mapping (simplified)
const arabicToLatin: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'a',
  'ئ': 'i', 'ؤ': 'o', 'ء': 'a',
};

/**
 * Transliterate Arabic text to Latin characters
 * @param arabicText - Text in Arabic script
 * @returns Transliterated Latin text
 */
export function transliterateArabic(arabicText: string): string {
  let result = '';
  
  for (const char of arabicText) {
    if (arabicToLatin[char]) {
      result += arabicToLatin[char];
    } else if (/[A-Za-z0-9]/.test(char)) {
      // Keep existing Latin characters and numbers
      result += char;
    }
    // Skip other characters (punctuation, spaces handled separately)
  }
  
  return result;
}

/**
 * Generate email base from Arabic name (without counter or domain)
 * Format: firstname.lastname or firstname.middlename.lastname
 * @param arabicName - Full name in Arabic
 * @param useAllNames - If true, uses all name parts; if false, uses first + last only
 * @returns Generated email base
 */
function getEmailBase(arabicName: string, useAllNames: boolean = false): string {
  const nameParts = arabicName.trim().split(/\s+/);
  
  if (nameParts.length === 0) {
    throw new Error('Invalid name');
  }
  
  let emailBase: string;
  
  if (nameParts.length === 1) {
    // Single name
    emailBase = transliterateArabic(nameParts[0]).toLowerCase();
  } else if (useAllNames && nameParts.length > 2) {
    // Use all name parts: first.middle.last
    const allTransliterated = nameParts
      .map(part => transliterateArabic(part).toLowerCase())
      .filter(part => part.length > 0);
    emailBase = allTransliterated.join('.');
  } else {
    // Use first and last: first.last
    const firstName = transliterateArabic(nameParts[0]).toLowerCase();
    const lastName = transliterateArabic(nameParts[nameParts.length - 1]).toLowerCase();
    emailBase = `${firstName}.${lastName}`;
  }
  
  // Remove any remaining invalid characters and extra dots
  emailBase = emailBase
    .replace(/[^a-z0-9.]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, ''); // Remove leading/trailing dots
  
  if (!emailBase) {
    throw new Error('Could not generate valid email from name');
  }
  
  return emailBase;
}

/**
 * Generate email from Arabic name
 * Format: firstname.lastname@manakher.edu.jo
 * Tries basic format first, then adds counter suffix if needed for uniqueness
 * @param arabicName - Full name in Arabic
 * @param counter - Optional counter suffix (e.g., 1, 2, 3)
 * @returns Generated email address
 */
export function generateEmail(arabicName: string, counter?: number): string {
  let emailBase = getEmailBase(arabicName, false);
  
  // Add counter suffix if provided
  if (counter !== undefined && counter > 0) {
    emailBase = `${emailBase}${counter}`;
  }
  
  return `${emailBase}@manakher.edu.jo`;
}

/**
 * Generate email with guaranteed uniqueness against existing emails
 * Uses counter suffix if needed: firstname.lastname1@, firstname.lastname2@, etc.
 * @param arabicName - Full name in Arabic
 * @param existingEmails - Set or array of existing email addresses to avoid
 * @returns Generated unique email address
 */
export function generateUniqueEmail(arabicName: string, existingEmails: Set<string> | string[]): string {
  const emailSet = existingEmails instanceof Set ? existingEmails : new Set(existingEmails);
  
  // Try basic format first
  let email = generateEmail(arabicName);
  if (!emailSet.has(email)) {
    return email;
  }
  
  // Try with counter suffix (1, 2, 3, ...)
  for (let counter = 1; counter <= 100; counter++) {
    email = generateEmail(arabicName, counter);
    if (!emailSet.has(email)) {
      return email;
    }
  }
  
  // Fallback: use all name parts + counter (should almost never reach here)
  let emailBase = getEmailBase(arabicName, true);
  for (let counter = 1; counter <= 100; counter++) {
    email = `${emailBase}${counter}@manakher.edu.jo`;
    if (!emailSet.has(email)) {
      return email;
    }
  }
  
  // Last resort: use timestamp
  const timestamp = Date.now();
  return `${getEmailBase(arabicName, false)}${timestamp}@manakher.edu.jo`;
}

/**
 * Generate a random password
 * @param length - Password length (default 12)
 * @returns Random password
 */
export function generatePassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password (minimum 8 characters)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Generate English name from Arabic name
 * Transliterates Arabic characters to Latin and capitalizes each word
 * @param arabicName - Full name in Arabic
 * @returns Generated English name
 */
export function generateEnglishName(arabicName: string): string {
  const nameParts = arabicName.trim().split(/\s+/);
  
  if (nameParts.length === 0) {
    return '';
  }
  
  // Transliterate each part and capitalize first letter
  const englishParts = nameParts
    .map(part => {
      const transliterated = transliterateArabic(part);
      // Capitalize first letter
      return transliterated.charAt(0).toUpperCase() + transliterated.slice(1).toLowerCase();
    })
    .filter(part => part.length > 0); // Remove empty parts
  
  return englishParts.join(' ');
}
