import { NextResponse } from 'next/server';
import { db } from '@/db';
import { songs } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const allSongs = await db.select().from(songs).orderBy(desc(songs.createdAt));
        return NextResponse.json(allSongs);
    } catch (error) {
        console.error('Error fetching songs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
