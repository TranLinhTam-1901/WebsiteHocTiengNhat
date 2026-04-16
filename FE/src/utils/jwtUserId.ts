const NAME_ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

function decodePayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const b64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** UserId Identity (NameIdentifier), khớp với ClaimTypes.NameIdentifier trên JWT backend. */
export function getJwtClaimUserId(token: string | null | undefined): string | null {
  if (!token?.trim()) return null;
  const p = decodePayload(token.trim());
  if (!p) return null;
  const fromClaim = p[NAME_ID_CLAIM];
  if (typeof fromClaim === 'string' && fromClaim.trim()) return fromClaim.trim();
  const nameid = p.nameid;
  if (typeof nameid === 'string' && nameid.trim()) return nameid.trim();
  return null;
}

export function getTutorLocalStorageOwnerKey(): string {
  return getJwtClaimUserId(typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null) ?? 'anonymous';
}
