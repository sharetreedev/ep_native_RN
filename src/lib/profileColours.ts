/**
 * Fallback avatar colours. When a user has no profile picture, we assign one
 * of these hex values once and persist it to Xano as `profile_hex_colour` so
 * the same colour is used across sessions, devices, and views. The WeWeb
 * onboarding flow uses this exact palette — keep them in sync.
 */
export const PROFILE_HEX_COLOURS = [
  '#6FAD42',
  '#5A819E',
  '#FFC300',
  '#6A0DAD',
  '#008080',
  '#D81B60',
] as const;

export type ProfileHex = (typeof PROFILE_HEX_COLOURS)[number];

export function pickRandomProfileHex(): ProfileHex {
  const i = Math.floor(Math.random() * PROFILE_HEX_COLOURS.length);
  return PROFILE_HEX_COLOURS[i];
}

/** Derive 2-letter initials from first+last name, or fall back to first two
 *  alpha chars of a single name / email local part. Returns '?' when nothing
 *  usable is available. */
export function deriveProfileInitials(firstName?: string | null, lastName?: string | null, fullName?: string | null): string {
  const f = (firstName ?? '').trim();
  const l = (lastName ?? '').trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f) return f[0].toUpperCase();
  if (l) return l[0].toUpperCase();
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return '?';
}
