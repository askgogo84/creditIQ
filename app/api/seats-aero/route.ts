// app/api/seats-aero/route.ts
// Proxy endpoint for seats.aero — keeps API key server-side

import { NextRequest, NextResponse } from 'next/server';
import { getBestBusinessClass, searchAwardAvailability } from '@/lib/seats-aero';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date') || startDate;
  const program = searchParams.get('program') || undefined;
  const cabin = (searchParams.get('cabin') || 'business') as 'economy' | 'business' | 'first';
  const mode = searchParams.get('mode') || 'best'; // 'best' or 'all'

  if (!origin || !destination || !startDate) {
    return NextResponse.json({ error: 'Missing origin, destination, or start_date' }, { status: 400 });
  }

  try {
    if (mode === 'best') {
      const result = await getBestBusinessClass(origin, destination, startDate, endDate!, program);
      return NextResponse.json(result);
    } else {
      const results = await searchAwardAvailability(origin, destination, startDate, endDate!, program, cabin);
      return NextResponse.json({ data: results, count: results.length });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
