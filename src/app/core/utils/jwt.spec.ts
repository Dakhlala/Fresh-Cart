import { describe, it, expect } from 'vitest';
import { decodeJwt } from './jwt';

function createJwt(payload: any): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  // Encode payload handling UTF-8 characters
  const jsonStr = JSON.stringify(payload);
  const utf8Bytes = encodeURIComponent(jsonStr).replace(
    /%([0-9A-F]{2})/g,
    (_, p1) => String.fromCharCode(parseInt(p1, 16))
  );
  const payloadBase64 = btoa(utf8Bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${payloadBase64}.mocksignature`;
}

describe('decodeJwt Stress Tests', () => {
  describe('Malformed and Invalid Inputs', () => {
    it('should return null for null, undefined, empty string, or non-string inputs', () => {
      expect(decodeJwt(null as any)).toBeNull();
      expect(decodeJwt(undefined as any)).toBeNull();
      expect(decodeJwt('')).toBeNull();
      expect(decodeJwt('   ')).toBeNull();
      expect(decodeJwt(12345 as any)).toBeNull();
      expect(decodeJwt({} as any)).toBeNull();
      expect(decodeJwt([] as any)).toBeNull();
      expect(decodeJwt(true as any)).toBeNull();
    });

    it('should return null when token does not have exactly 3 parts', () => {
      expect(decodeJwt('part1')).toBeNull();
      expect(decodeJwt('part1.part2')).toBeNull();
      expect(decodeJwt('part1.part2.part3.part4')).toBeNull();
      expect(decodeJwt('.')).toBeNull();
      expect(decodeJwt('..')).toBeNull();
      expect(decodeJwt('...')).toBeNull();
    });

    it('should return null for invalid base64 strings in the payload', () => {
      expect(decodeJwt('header.!!!invalid-base64!!!.sig')).toBeNull();
      expect(decodeJwt('header.==invalid==.sig')).toBeNull();
      expect(decodeJwt('header.  .sig')).toBeNull();
    });

    it('should return null when payload decodes to non-JSON text', () => {
      const rawText = btoa('This is not JSON at all');
      expect(decodeJwt(`header.${rawText}.sig`)).toBeNull();
    });

    it('should return null when payload is valid JSON primitives instead of an object', () => {
      const stringJson = btoa(JSON.stringify('just a string'));
      expect(decodeJwt(`header.${stringJson}.sig`)).toBeNull();

      const numberJson = btoa(JSON.stringify(12345));
      expect(decodeJwt(`header.${numberJson}.sig`)).toBeNull();

      const boolJson = btoa(JSON.stringify(true));
      expect(decodeJwt(`header.${boolJson}.sig`)).toBeNull();

      const nullJson = btoa('null');
      expect(decodeJwt(`header.${nullJson}.sig`)).toBeNull();
    });
  });

  describe('Identifier extraction (id, _id, userId)', () => {
    it('should correctly extract id when payload has "id"', () => {
      const token = createJwt({ id: 'user-id-001', name: 'Alice', role: 'user' });
      const decoded = decodeJwt(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe('user-id-001');
      expect(decoded?.name).toBe('Alice');
      expect(decoded?.role).toBe('user');
    });

    it('should correctly extract id when payload has "_id" (MongoDB convention)', () => {
      const token = createJwt({ _id: 'mongo-id-6407cf6f', name: 'Bob', role: 'admin' });
      const decoded = decodeJwt(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe('mongo-id-6407cf6f');
      expect(decoded?.name).toBe('Bob');
      expect(decoded?.role).toBe('admin');
    });

    it('should correctly extract id when payload has "userId"', () => {
      const token = createJwt({ userId: 'legacy-user-999', name: 'Charlie' });
      const decoded = decodeJwt(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe('legacy-user-999');
      expect(decoded?.name).toBe('Charlie');
      expect(decoded?.role).toBe('user'); // default fallback
    });

    it('should prioritize id over _id and userId if multiple exist', () => {
      const token = createJwt({
        id: 'primary-id',
        _id: 'mongo-id',
        userId: 'alt-id',
        name: 'Dave',
      });
      const decoded = decodeJwt(token);
      expect(decoded?.id).toBe('primary-id');
    });

    it('should prioritize _id over userId if id is absent', () => {
      const token = createJwt({
        _id: 'mongo-id',
        userId: 'alt-id',
        name: 'Eve',
      });
      const decoded = decodeJwt(token);
      expect(decoded?.id).toBe('mongo-id');
    });

    it('should return empty string id if none of id/_id/userId exist', () => {
      const token = createJwt({ name: 'Frank', role: 'guest' });
      const decoded = decodeJwt(token);
      expect(decoded?.id).toBe('');
    });
  });

  describe('Timestamps and Expiration Handling', () => {
    it('should preserve past exp timestamps for expired tokens', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token = createJwt({
        id: 'user-1',
        name: 'Expired User',
        exp: pastExp,
        iat: pastExp - 3600,
      });
      const decoded = decodeJwt(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.exp).toBe(pastExp);
      expect(decoded?.iat).toBe(pastExp - 3600);
      expect((decoded?.exp ?? 0) * 1000).toBeLessThan(Date.now());
    });

    it('should preserve future exp timestamps for valid tokens', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 7200; // 2 hours in future
      const token = createJwt({
        id: 'user-2',
        name: 'Active User',
        exp: futureExp,
        iat: Math.floor(Date.now() / 1000),
      });
      const decoded = decodeJwt(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.exp).toBe(futureExp);
      expect((decoded?.exp ?? 0) * 1000).toBeGreaterThan(Date.now());
    });

    it('should default exp and iat to 0 if not present', () => {
      const token = createJwt({ id: 'user-3', name: 'No Time User' });
      const decoded = decodeJwt(token);
      expect(decoded?.exp).toBe(0);
      expect(decoded?.iat).toBe(0);
    });
  });

  describe('UTF-8 and Unicode payload support', () => {
    it('should decode Arabic and international characters accurately', () => {
      const token = createJwt({
        id: '67aa6ac7fa7895e81f67b4e4',
        name: 'أحمد عبد المعطي',
        role: 'user',
      });
      const decoded = decodeJwt(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.name).toBe('أحمد عبد المعطي');
      expect(decoded?.id).toBe('67aa6ac7fa7895e81f67b4e4');
    });
  });
});
