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
 * Generate email from Arabic name
 * Format: firstname.lastname@manakher.edu.jo
 * @param arabicName - Full name in Arabic
 * @returns Generated email address
 */
export function generateEmail(arabicName: string): string {
  const nameParts = arabicName.trim().split(/\s+/);
  
  if (nameParts.length === 0) {
    throw new Error('Invalid name');
  }
  
  let emailBase: string;
  
  if (nameParts.length === 1) {
    // Single name
    emailBase = transliterateArabic(nameParts[0]).toLowerCase();
  } else {
    // Multiple names: use first and last
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
  
  return `${emailBase}@manakher.edu.jo`;
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
