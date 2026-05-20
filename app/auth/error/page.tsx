import Link from 'next/link';
export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-2xl mb-4" style={{ color: 'var(--text)' }}>Sign in failed</h1>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Something went wrong. Please try again.</p>
        <Link href="/login" className="btn-primary">Try again</Link>
      </div>
    </div>
  );
}
