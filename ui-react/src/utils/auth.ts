/**
 * Auth utility functions for client-side token validation.
 */

/**
 * Check if a JWT token is expired by decoding its payload.
 * Returns true if the token is expired, malformed, or missing.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
