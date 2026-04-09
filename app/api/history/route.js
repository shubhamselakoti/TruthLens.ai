/**
 * app/api/history/route.js
 * GET /api/history — Returns recent analyses
 * DELETE /api/history/[id] — Delete a specific analysis
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Analysis from '@/models/Analysis';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const analyses = await Analysis.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('question answer score mode processing_time_ms createdAt analyzed_claims')
      .lean();

    return NextResponse.json({ analyses });
  } catch (err) {
    console.error('History fetch error:', err);
    return NextResponse.json({ analyses: [] });
  }
}
