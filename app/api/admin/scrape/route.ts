// Forwards to /api/scrape with appropriate auth
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const bank = url.searchParams.get('bank');

  // Forward to the actual scrape endpoint
  // (For now this is a thin wrapper; in production add proper admin session check)
  const target = new URL(req.url);
  target.pathname = '/api/scrape';

  const res = await fetch(target.toString() + `?bank=${bank || 'all'}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
