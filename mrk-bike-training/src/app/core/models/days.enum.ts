/**
 * Days of the week mapping.
 *
 * Storage in DB: comma-separated 2-letter codes (e.g., "Mo,Tu,We")
 * Display to user: full day name (e.g., "Monday")
 */
export interface DayInfo {
  code: string;      // 2-letter code for DB storage (Mo, Tu, etc.)
  shortName: string; // 3-letter abbreviation (Mon, Tue, etc.)
  fullName: string;  // Full display name (Monday, Tuesday, etc.)
}

export const DAYS_OF_WEEK: DayInfo[] = [
  { code: 'Mo', shortName: 'Mon', fullName: 'Monday' },
  { code: 'Tu', shortName: 'Tue', fullName: 'Tuesday' },
  { code: 'We', shortName: 'Wed', fullName: 'Wednesday' },
  { code: 'Th', shortName: 'Thu', fullName: 'Thursday' },
  { code: 'Fr', shortName: 'Fri', fullName: 'Friday' },
  { code: 'Sa', shortName: 'Sat', fullName: 'Saturday' },
  { code: 'Su', shortName: 'Sun', fullName: 'Sunday' },
];

/** Map from 2-letter code to full name */
export const DAY_CODE_TO_FULL: Record<string, string> = Object.fromEntries(
  DAYS_OF_WEEK.map(d => [d.code, d.fullName])
);

/** Map from 2-letter code to short name */
export const DAY_CODE_TO_SHORT: Record<string, string> = Object.fromEntries(
  DAYS_OF_WEEK.map(d => [d.code, d.shortName])
);

/**
 * Convert comma-separated codes to full display names.
 * e.g., "Mo,Tu,Fr" → "Monday, Tuesday, Friday"
 */
export function daysCodesToFullNames(commaSeparated: string): string {
  if (!commaSeparated) return '';
  return commaSeparated
    .split(',')
    .map(code => DAY_CODE_TO_FULL[code.trim()] || code.trim())
    .join(', ');
}

/**
 * Convert comma-separated codes to short names.
 * e.g., "Mo,Tu,Fr" → "Mon, Tue, Fri"
 */
export function daysCodesToShortNames(commaSeparated: string): string {
  if (!commaSeparated) return '';
  return commaSeparated
    .split(',')
    .map(code => DAY_CODE_TO_SHORT[code.trim()] || code.trim())
    .join(', ');
}
