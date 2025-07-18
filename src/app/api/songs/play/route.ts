import { db } from '@/db';
import { songs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    const updatedSong = await db.update(songs)
      .set({ lastPlayedAt: new Date() })
      .where(eq(songs.id, id))
      .returning();

    if (updatedSong.length === 0) {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSong[0]);
  } catch (error) {
    console.error('Failed to update play status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}