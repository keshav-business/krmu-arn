/**
 * Truncates password to 72 bytes (bcrypt limit)
 * Handles multi-byte UTF-8 characters safely
 * @param {string} password - The password to truncate
 * @returns {string} - Password truncated to max 72 bytes
 */
export function truncatePasswordTo72Bytes(password) {
  const maxBytes = 72;
  let truncated = password;
  
  // Keep removing characters from the end until encoded length is <= 72 bytes
  while (new TextEncoder().encode(truncated).length > maxBytes) {
    truncated = truncated.slice(0, -1);
  }
  
  return truncated;
}

/**
 * Gets the byte length of a string in UTF-8
 * @param {string} str - String to check
 * @returns {number} - Byte length
 */
export function getUtf8ByteLength(str) {
  return new TextEncoder().encode(str).length;
}

/**
 * Validates if password is within bcrypt limits
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password is valid
 */
export function isPasswordValid(password) {
  return getUtf8ByteLength(password) <= 72;
}
