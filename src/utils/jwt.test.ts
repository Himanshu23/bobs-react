import { describe, expect, it } from 'vitest';
import { decodeJwtClaims, isJwtExpired } from './jwt';

const b64url = (value: object) =>
  btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const token = (claims: object) =>
  `${b64url({ alg: 'HS256' })}.${b64url(claims)}.signature`;

describe('decodeJwtClaims', () => {
  it('reads the role, subject and expiry', () => {
    expect(
      decodeJwtClaims(token({ sub: 'admin', role: 'admin', exp: 2000000000 }))
    ).toEqual({ sub: 'admin', role: 'admin', exp: 2000000000 });
  });

  it('returns null for missing or malformed tokens', () => {
    expect(decodeJwtClaims(null)).toBeNull();
    expect(decodeJwtClaims('')).toBeNull();
    expect(decodeJwtClaims('not-a-jwt')).toBeNull();
    expect(decodeJwtClaims('a.%%%.c')).toBeNull();
  });
});

describe('isJwtExpired', () => {
  it('compares exp (seconds) with now', () => {
    expect(isJwtExpired({ exp: 100 }, 100_000)).toBe(true);
    expect(isJwtExpired({ exp: 101 }, 100_000)).toBe(false);
  });

  it('treats a token without exp as not expired', () => {
    expect(isJwtExpired({}, Date.now())).toBe(false);
    expect(isJwtExpired(null)).toBe(false);
  });
});
