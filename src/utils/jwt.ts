/**
 * Reads a JWT's payload (claims) without verifying it. Only for UI decisions;
 * the server always verifies the token and its role.
 */
export interface JwtClaims {
  sub?: string;
  role?: string;
  /** Expiry, seconds since the epoch. */
  exp?: number;
}

export const decodeJwtClaims = (
  token: string | null | undefined
): JwtClaims | null => {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const claims: unknown = JSON.parse(atob(padded));
    return claims && typeof claims === 'object' ? (claims as JwtClaims) : null;
  } catch {
    return null;
  }
};

/** True when the token has an `exp` claim that has passed. */
export const isJwtExpired = (
  claims: JwtClaims | null,
  nowMs: number = Date.now()
): boolean => typeof claims?.exp === 'number' && claims.exp * 1000 <= nowMs;
