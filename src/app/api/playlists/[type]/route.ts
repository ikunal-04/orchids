import { db } from '@/db';
import { playlists } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type;

    if (type !== 'made-for-you' && type !== 'popular-album') {
        return NextResponse.json({ error: 'Invalid playlist type' }, { status: 400 });
    }

    const results = await db.query.playlists.findMany({
        where: eq(playlists.type, type),
        with: {
            songs: {
                with: {
                    song: true
                },
                limit: 1 // Fetch only the first song for the play button
            }
        }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error(`Failed to fetch playlists of type ${params.type}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}