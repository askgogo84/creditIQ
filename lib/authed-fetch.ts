// lib/authed-fetch.ts
// Attaches the current user's Supabase session token to a fetch request.
// The server derives the user id FROM this token — callers no longer pass ?userId=.
// This closes the IDOR where any caller could read/write another user's data.
'use client';
import { createBrowserClient } from '@supabase/ssr';

let _sb: ReturnType<typeof createBrowserClient> | null = null;
function browser() {
  if (!_sb) {
    _sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  return _sb;
}

/**
 * Like fetch(), but automatically adds Authorization: Bearer <session token>.
 * Use for any /api route that must act on the logged-in user's own data.
 */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await browser().auth.getSession();
  const token = data.session?.access_token ?? '';
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers });
}
