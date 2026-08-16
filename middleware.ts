import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ─────────────────────────────────────────────────────────────────────────────
// Auth gate for the PERSONAL tools. Everything not listed here — /cards,
// /card/[slug], /compare, /best-cards/*, /blog, /glossary, /sweet-spots,
// /card-roast, the devaluation tracker — stays public for SEO and is never
// touched by this middleware. A signed-out visitor to a gated route is bounced
// to /login with a ?next= return path (the param /login already reads).
//
// We validate with supabase.auth.getUser() (a real token check), not getSession(),
// so a stale/forged cookie can't slip through. The matcher below is scoped to the
// gated prefixes only, so public routes never pay for a Supabase round-trip.
// ─────────────────────────────────────────────────────────────────────────────

const GATED_PREFIXES = [
  '/dashboard',
  '/statement-truth',
  '/spend-optimizer',
  '/points-optimizer',
  '/card-switch',
  '/trip-planner',
  '/travel', // Travel AI (app/(shell)/travel)
  '/lounge-tracker',
  '/optimize',
];

function isGated(pathname: string): boolean {
  return GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Defensive: the matcher already scopes us, but never gate a non-listed path.
  if (!isGated(pathname)) return NextResponse.next();

  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  return res;
}

// Base + subpath forms for each gated root, so the exact base path (e.g.
// /statement-truth) is gated as well as its children. Public routes are absent.
export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/statement-truth',
    '/statement-truth/:path*',
    '/spend-optimizer',
    '/spend-optimizer/:path*',
    '/points-optimizer',
    '/points-optimizer/:path*',
    '/card-switch',
    '/card-switch/:path*',
    '/trip-planner',
    '/trip-planner/:path*',
    '/travel',
    '/travel/:path*',
    '/lounge-tracker',
    '/lounge-tracker/:path*',
    '/optimize',
    '/optimize/:path*',
  ],
};
