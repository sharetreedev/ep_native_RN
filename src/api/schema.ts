// Thin helpers over the openapi-typescript output so call sites can
// reference response/request shapes by operation id without restating
// the deep `operations[K]['responses'][200]['content']['application/json']`
// path every time.
//
// Operation ids are Xano-flavoured: `api/<path>|<METHOD>`, e.g.
// `api/auth/login|POST`. Find them in src/api/xano-schema.d.ts.
//
// Usage:
//   request<Body<'api/auth/login|POST'>>('POST', '/auth/login', { email, password })

import type { operations } from './xano-schema';

/** Successful (200) response body for an endpoint. */
export type Body<K extends keyof operations> =
  operations[K] extends {
    responses: {
      200: { content: { 'application/json': infer T } };
    };
  }
    ? T
    : never;

/** JSON request body for an endpoint. */
export type ReqBody<K extends keyof operations> =
  operations[K] extends {
    requestBody?: { content: { 'application/json': infer T } };
  }
    ? T
    : never;
