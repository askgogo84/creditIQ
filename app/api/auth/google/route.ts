import { NextResponse } from 'next/server'

// Auth is now handled client-side via supabase.auth.signInWithIdToken
// This route is no longer used
export async function POST() {
  return NextResponse.json({ message: 'Use client-side signInWithIdToken instead' }, { status: 200 })
}
