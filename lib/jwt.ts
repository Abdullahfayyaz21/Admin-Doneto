export interface JwtUser {
  id: string;
  email: string | null;
  name: string;
  role: 'Admin' | 'NGO' | 'Donor';
  [key: string]: any;
}

export function decodeJwt(token: string): JwtUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (base64.length % 4)) % 4;
    const paddedBase64 = base64 + '='.repeat(pad);
    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT token:', e);
    return null;
  }
}

export function createMockAdminToken(
  email = 'admin@example.com',
  name = 'System Admin'
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    id: '0c6e0503-dc6d-43bf-9033-dce131ac94fc',
    email,
    name,
    role: 'Admin' as const,
    accountStatus: 'Verified',
    exp: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60,
  };

  const toBase64Url = (obj: any) => {
    const str = JSON.stringify(obj);
    const b64 =
      typeof window !== 'undefined'
        ? btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
        : Buffer.from(str).toString('base64');
    return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  return `${toBase64Url(header)}.${toBase64Url(payload)}.doneto_mock_signature`;
}

