import { NextResponse } from 'next/server';
import { db } from '@/db';
import { songs } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const featuredSongs = await db
      .select()
      .from(songs)
      .orderBy(sql`RANDOM()`)
      .limit(6);

    return NextResponse.json(featuredSongs);
  } catch (error) {
    console.error('Failed to fetch featured songs:', error);
    return NextResponse.json({ error: 'Failed to fetch featured songs' }, { status: 500 });
  }
}