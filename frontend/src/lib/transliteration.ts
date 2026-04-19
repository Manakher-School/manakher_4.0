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
 * Generate email base from Arabic name with smart name part selection
 * Strategy: 
 * 1. Try first + last name (most common)
 * 2. If would collide, try first + middle name (avoids collision)
 * 3. If still would collide, use all name parts
 * @param arabicName - Full name in Arabic
 * @param nameParts - Pre-split name parts array
 * @param collisionAvoidanceLevel - 0=first+last, 1=first+middle, 2=all names
 * @returns Generated email base
 */
function getEmailBase(
  arabicName: string,
  nameParts?: string[],
  collisionAvoidanceLevel: number = 0
): string {
  const parts = nameParts || arabicName.trim().split(/\s+/);
  
  if (parts.length === 0) {
    throw new Error('Invalid name');
  }
  
  let emailBase: string;
  
  if (parts.length === 1) {
    // Single name: just use it
    emailBase = transliterateArabic(parts[0]).toLowerCase();
  } else if (parts.length === 2) {
    // Two names: use both (first + last)
    const firstName = transliterateArabic(parts[0]).toLowerCase();
    const secondName = transliterateArabic(parts[1]).toLowerCase();
    emailBase = `${firstName}.${secondName}`;
  } else {
    // Three or more names: apply collision avoidance strategy
    const firstName = transliterateArabic(parts[0]).toLowerCase();
    
    if (collisionAvoidanceLevel === 0) {
      // Level 0: first + last (most concise)
      const lastName = transliterateArabic(parts[parts.length - 1]).toLowerCase();
      emailBase = `${firstName}.${lastName}`;
    } else if (collisionAvoidanceLevel === 1) {
      // Level 1: first + middle (avoids collision when first+last names are same)
      const middleName = transliterateArabic(parts[1]).toLowerCase();
      emailBase = `${firstName}.${middleName}`;
    } else {
      // Level 2: all name parts (maximum specificity)
      const allTransliterated = parts
        .map(part => transliterateArabic(part).toLowerCase())
        .filter(part => part.length > 0);
      emailBase = allTransliterated.join('.');
    }
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
 * Generate email from Arabic name with smart collision avoidance
 * Strategy: first tries first+last, then first+middle if collision detected
 * Format: firstname.lastname@manakher.edu.jo or firstname.middlename@manakher.edu.jo
 * @param arabicName - Full name in Arabic
 * @param avoidanceLevel - Collision avoidance level (0=first+last, 1=first+middle, 2=all)
 * @returns Generated email address
 */
export function generateEmail(arabicName: string, avoidanceLevel: number = 0): string {
  const nameParts = arabicName.trim().split(/\s+/);
  let emailBase = getEmailBase(arabicName, nameParts, avoidanceLevel);
  
  return `${emailBase}@manakher.edu.jo`;
}

/**
 * Generate email with guaranteed uniqueness against existing emails
 * Smart strategy: Tries first+last, then first+middle, then all names
 * If still collision, adds counter suffix
 * Examples:
 *   "سليمان محمد البنيان الدعجه" → "suleiman.aldaaja@" (first+last)
 *   If duplicate exists, tries → "suleiman.mohammad@" (first+middle) ✅
 *   If still duplicate → "suleiman.mohammad1@" (first+middle+counter)
 * @param arabicName - Full name in Arabic
 * @param existingEmails - Set or array of existing email addresses to avoid
 * @returns Generated unique email address
 */
export function generateUniqueEmail(arabicName: string, existingEmails: Set<string> | string[]): string {
  const emailSet = existingEmails instanceof Set ? existingEmails : new Set(existingEmails);
  const nameParts = arabicName.trim().split(/\s+/);
  
  // Strategy 1: Try first + last name (most concise)
  let email = generateEmail(arabicName, 0);
  if (!emailSet.has(email)) {
    return email;
  }
  
  // Strategy 2: Try first + middle name (if name has 3+ parts)
  // This intelligently avoids collisions when first+last names are identical
  if (nameParts.length >= 3) {
    email = generateEmail(arabicName, 1);
    if (!emailSet.has(email)) {
      return email;
    }
  }
  
  // Strategy 3: Try all name parts (maximum specificity)
  if (nameParts.length > 2) {
    email = generateEmail(arabicName, 2);
    if (!emailSet.has(email)) {
      return email;
    }
  }
  
  // Strategy 4: Use counter suffix with all name parts
  const emailBase = getEmailBase(arabicName, nameParts, 2);
  for (let counter = 1; counter <= 100; counter++) {
    email = `${emailBase}${counter}@manakher.edu.jo`;
    if (!emailSet.has(email)) {
      return email;
    }
  }
  
  // Last resort: use timestamp (should almost never reach here)
  const timestamp = Date.now();
  return `${getEmailBase(arabicName, nameParts, 2)}${timestamp}@manakher.edu.jo`;
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
