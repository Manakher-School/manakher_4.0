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
 * Generate 8-character email name from name parts with smart combining
 * Strategy: Take N chars from first name + remaining from second name to reach exactly 8
 * Order: first name chars come first, then last/middle name chars
 * Level 0: first + last names (e.g., hussam + alraggad = hussamal)
 * Level 1: first + middle names (fallback when Level 0 collides)
 * @param nameParts - Split name parts array
 * @param level - 0=first+last, 1=first+middle
 * @returns 8-character email name
 */
function generate8CharEmailName(nameParts: string[], level: number = 0): string {
  if (nameParts.length === 0) {
    throw new Error('Invalid name - no parts');
  }

  // Transliterate all parts
  const transliterated = nameParts.map(part => transliterateArabic(part).toLowerCase()).filter(p => p.length > 0);

  if (transliterated.length === 0) {
    throw new Error('Could not transliterate name');
  }

  const first = transliterated[0];

  // Determine second part based on level
  let second: string;
  if (level === 0) {
    // Level 0: first + last
    second = transliterated[transliterated.length - 1];
  } else if (level === 1) {
    // Level 1: first + middle (use second part if available)
    second = transliterated.length > 1 ? transliterated[1] : transliterated[transliterated.length - 1];
  } else {
    throw new Error('Invalid collision avoidance level');
  }

  // Combine to reach exactly 8 characters
  // Take as much as possible from first, then fill remaining from second
  const firstCharsToTake = Math.min(first.length, 8);
  const remainingChars = 8 - firstCharsToTake;
  const secondCharsToTake = Math.min(second.length, remainingChars);

  // Build the 8-char string: first part chars + second part chars
  let emailName = first.substring(0, firstCharsToTake) + second.substring(0, secondCharsToTake);

  // If still less than 8 chars (both names too short), pad with numbers as fallback
  while (emailName.length < 8) {
    emailName += Math.floor(Math.random() * 10);
  }

  // Ensure exactly 8 characters
  return emailName.substring(0, 8);
}

/**
 * Generate email base from Arabic name with smart 8-character strategy
 * NEW STRATEGY (replaces old dot-separated format):
 * - Exactly 8 characters, combining first and second name
 * - Level 0: first + last name (most common)
 * - Level 1: first + middle name (collision avoidance)
 * Example: "hussam alraggad" → "hussamal" (8 chars: hussam[6] + al[2])
 * @param arabicName - Full name in Arabic
 * @param nameParts - Pre-split name parts array
 * @param collisionAvoidanceLevel - 0=first+last, 1=first+middle
 * @returns Generated 8-character email base (no dots, no @)
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
    // Single name: transliterate and pad/trim to 8 chars
    emailBase = transliterateArabic(parts[0]).toLowerCase();
    while (emailBase.length < 8) {
      emailBase += emailBase; // Repeat the name to reach 8 chars
    }
    emailBase = emailBase.substring(0, 8);
  } else {
    // Two or more names: use 8-character combining strategy
    emailBase = generate8CharEmailName(parts, collisionAvoidanceLevel);
  }

  // Final validation: exactly 8 alphanumeric characters
  emailBase = emailBase.replace(/[^a-z0-9]/g, '').substring(0, 8);

  if (!emailBase || emailBase.length < 8) {
    throw new Error('Could not generate valid 8-character email from name');
  }

  return emailBase;
}

/**
 * Generate email from Arabic name with 8-character strategy
 * Format: 8chars@manakher.edu.jo
 * Examples:
 *   "hussam alraggad" → "hussamal@manakher.edu.jo" (hussam[6] + al[2])
 *   "محمد علي أحمد" → "mohammel@manakher.edu.jo" (mohammad[6] + el[2])
 * @param arabicName - Full name in Arabic
 * @param avoidanceLevel - Collision avoidance level (0=first+last, 1=first+middle)
 * @returns Generated email address
 */
export function generateEmail(arabicName: string, avoidanceLevel: number = 0): string {
  const nameParts = arabicName.trim().split(/\s+/);
  let emailBase = getEmailBase(arabicName, nameParts, avoidanceLevel);
  
  return `${emailBase}@manakher.edu.jo`;
}

/**
 * Generate email with guaranteed uniqueness against existing emails
 * Smart 8-character strategy with 2 levels:
 * Level 0: first + last name (e.g., "hussamal")
 * Level 1: first + middle name (if Level 0 collides, e.g., "hussamkh")
 * If still collision, adds numeric counter (e.g., "hussamal1", "hussamal2")
 * Examples:
 *   "امير رائد عارف البنيان" → "amyrraid" (amyr[4] + raid[4]) Level 0
 *   If "amyrraid" exists, try → "amyrraid" (amyr[4] + raid[4]) Level 1 ... wait, same result
 *   Actually: First="amir" Middle="raid" Last="albnyan"
 *   Level 0: amir[4] + albn[4] = "amiralbn"
 *   Level 1: amir[4] + raid[4] = "amirraid"
 *   If still collision → "amirraid1", "amirraid2", etc.
 * @param arabicName - Full name in Arabic
 * @param existingEmails - Set or array of existing email addresses to avoid
 * @returns Generated unique email address
 */
export function generateUniqueEmail(arabicName: string, existingEmails: Set<string> | string[]): string {
  const emailSet = existingEmails instanceof Set ? existingEmails : new Set(existingEmails);
  const nameParts = arabicName.trim().split(/\s+/);
  
  // Strategy 1: Try first + last name (most common)
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
  
  // Strategy 3: Use numeric counter suffix with Level 1 (or Level 0 if 2 parts)
  const emailBase = getEmailBase(arabicName, nameParts, nameParts.length >= 3 ? 1 : 0);
  for (let counter = 1; counter <= 100; counter++) {
    email = `${emailBase}${counter}@manakher.edu.jo`;
    if (!emailSet.has(email)) {
      return email;
    }
  }
  
  // Last resort: use timestamp (should almost never reach here)
  const timestamp = Date.now();
  return `${emailBase}${timestamp}@manakher.edu.jo`;
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
