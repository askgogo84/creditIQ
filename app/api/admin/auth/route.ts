import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD || 'CreditIQ-2026';
  if (password === expected) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

