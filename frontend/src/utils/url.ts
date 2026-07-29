/**
 * Shared frontend utilities.
 * Add helpers (clipboard, date formatting, etc.) as features grow.
 */

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
