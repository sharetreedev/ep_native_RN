// Tiny helpers for narrowing `unknown` caught errors into useful shapes.
// Use these in `catch (e: unknown)` blocks so we don't resort to `any` and
// still get reliable message/status extraction whether the thrown value is
// a native `Error`, a `XanoError` from the API client, a plain object, or
// a primitive.

export function errorMessage(e: unknown): string | undefined {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const msg = (e as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return undefined;
}

export function errorStatus(e: unknown): number | undefined {
  if (typeof e === 'object' && e !== null) {
    const obj = e as { status?: unknown; statusCode?: unknown };
    const raw = obj.status ?? obj.statusCode;
    if (typeof raw === 'number') return raw;
  }
  return undefined;
}
