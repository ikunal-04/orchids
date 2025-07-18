import { db } from '@/db';
import { songs } from '@/db/schema';
import { desc, isNotNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const recentlyPlayed = await db.select()
      .from(songs)
      .where(isNotNull(songs.lastPlayedAt))
      .orderBy(desc(songs.lastPlayedAt))
      .limit(10);
      
    return NextResponse.json(recentlyPlayed);
  } catch (error) {
    console.error('Failed to fetch recently played songs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}