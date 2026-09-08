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
