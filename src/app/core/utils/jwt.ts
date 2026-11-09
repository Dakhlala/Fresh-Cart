import { DecodedUser } from '../models/auth-model';

export function decodeJwt(token: string): DecodedUser | null {
  if (!token || typeof token !== 'string') {
    return null;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return {
      id: parsed.id || parsed._id || parsed.userId || '',
      name: parsed.name || '',
      role: parsed.role || 'user',
      iat: parsed.iat || 0,
      exp: parsed.exp || 0,
    };
  } catch {
    return null;
  }
}
