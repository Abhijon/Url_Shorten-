/**
 * Base62 alphabet: 0-9, a-z, A-Z (62 characters).
 * Used to convert PostgreSQL autoincrement IDs into short, URL-safe codes.
 *
 * Example: encodeBase62(1000) === "g8"
 */
const BASE62_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const BASE = BASE62_ALPHABET.length;

/**
 * Encodes a non-negative integer into a Base62 string.
 *
 * @param num - Non-negative integer to encode (typically a database ID)
 * @returns Base62-encoded string
 *
 * @example
 * encodeBase62(1000) // => "g8"
 * encodeBase62(125)  // => "21"
 */
export function encodeBase62(num: number): string {
  if (!Number.isInteger(num) || num < 0) {
    throw new Error('encodeBase62 expects a non-negative integer');
  }

  if (num === 0) {
    return BASE62_ALPHABET[0]!;
  }

  let value = num;
  let result = '';

  while (value > 0) {
    result = BASE62_ALPHABET[value % BASE] + result;
    value = Math.floor(value / BASE);
  }

  return result;
}

/**
 * Decodes a Base62 string back into a non-negative integer.
 *
 * @param str - Base62-encoded string
 * @returns Decoded non-negative integer
 *
 * @example
 * decodeBase62("g8") // => 1000
 * decodeBase62("21") // => 125
 */
export function decodeBase62(str: string): number {
  if (!str) {
    throw new Error('decodeBase62 expects a non-empty string');
  }

  let result = 0;

  for (const char of str) {
    const index = BASE62_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base62 character: "${char}"`);
    }
    result = result * BASE + index;
  }

  return result;
}
