// app/admin/layout.tsx
// SERVER-SIDE gate for every /admin page (and nested /admin/cards). Reads the
// Supabase session from cookies and redirects anyone who isn't an allowlisted
// admin — this is real server enforcement, not a client redirect that can be
// skipped by editing sessionStorage.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { isAdminEmail } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* no-op: cannot set cookies from a server component */ },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  if (!isAdminEmail(user.email)) redirect('/dashboard');

  return <>{children}</>;
}
