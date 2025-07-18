import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log('Seeding database...');

  // Clear existing data
  await db.delete(schema.playlistSongs);
  await db.delete(schema.playlists);
  await db.delete(schema.songs);
  console.log('Cleared existing data.');

  // Insert Songs
  const insertedSongs = await db.insert(schema.songs).values([
    { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', albumArt: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', duration: 200 },
    { title: 'As It Was', artist: 'Harry Styles', album: "Harry's House", albumArt: 'https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14', duration: 167 },
    { title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', albumArt: 'https://i.scdn.co/image/ab67616d0000b273e0b60c608552a2a0615717c2', duration: 201 },
    { title: 'Save Your Tears', artist: 'The Weeknd', album: 'After Hours', albumArt: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', duration: 215 },
    { title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', albumArt: 'https://i.scdn.co/image/ab67616d0000b273bd2523318991be6a8a235540', duration: 203 },
    { title: 'good 4 u', artist: 'Olivia Rodrigo', album: 'SOUR', albumArt: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a', duration: 178 },
    { title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland', albumArt: 'https://i.scdn.co/image/ab67616d0000b2739e495fb707973f3390850eea', duration: 239 },
    { title: 'Stay', artist: 'The Kid LAROI, Justin Bieber', album: 'F*CK LOVE 3: OVER YOU', albumArt: 'https://i.scdn.co/image/ab67616d0000b2733e8a883cdf47a83d21532363', duration: 141 },
    { title: 'Shivers', artist: 'Ed Sheeran', album: '=', albumArt: 'https://i.scdn.co/image/ab67616d0000b273bb5a34b2542e535311e9b465', duration: 207 },
    { title: 'Bad Habit', artist: 'Steve Lacy', album: 'Gemini Rights', albumArt: 'https://i.scdn.co/image/ab67616d0000b27375f3a34a15f33e36e1f57958', duration: 232 },
  ]).returning();
  console.log(`Inserted ${insertedSongs.length} songs.`);

  // Insert Playlists
  const insertedPlaylists = await db.insert(schema.playlists).values([
    // Made for You
    { name: 'Daily Mix 1', description: 'A mix of your recent favorites and new discoveries.', coverArt: 'https://dailymix-images.scdn.co/v2/img/ab6761610000e5ebc52101344e45c47083b74b17/1/en/default', type: 'made-for-you' },
    { name: 'Discover Weekly', description: 'Your weekly mixtape of fresh music. Enjoy new discoveries and deep cuts chosen just for you.', coverArt: 'https://newjams-images.scdn.co/v2/discover-weekly/aAbca4_KxB20NX2dAUA_5w==/bmVuZW5lbmVuZW5lbmVubw==/default', type: 'made-for-you' },
    { name: 'On Repeat', description: 'Songs you love right now.', coverArt: 'https://on-repeat-images.scdn.co/v2/images/0a2ea1702f32de075596e1a93807d9b98095b542', type: 'made-for-you' },

    // Popular Albums
    { name: 'After Hours', description: 'The Weeknd', coverArt: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', type: 'popular-album' },
    { name: "Harry's House", description: 'Harry Styles', coverArt: 'https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14', type: 'popular-album' },
    { name: 'Midnights', description: 'Taylor Swift', coverArt: 'https://i.scdn.co/image/ab67616d0000b273e0b60c608552a2a0615717c2', type: 'popular-album' },
    { name: 'SOUR', description: 'Olivia Rodrigo', coverArt: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a', type: 'popular-album' },
    { name: 'Future Nostalgia', description: 'Dua Lipa', coverArt: 'https://i.scdn.co/image/ab67616d0000b273bd2523318991be6a8a235540', type: 'popular-album' },
  ]).returning();
  console.log(`Inserted ${insertedPlaylists.length} playlists.`);

  // Link Songs to Playlists
  const dailyMix1 = insertedPlaylists.find(p => p.name === 'Daily Mix 1')!;
  const afterHoursAlbum = insertedPlaylists.find(p => p.name === 'After Hours')!;
  const harrysHouseAlbum = insertedPlaylists.find(p => p.name === "Harry's House")!;
  const midnightsAlbum = insertedPlaylists.find(p => p.name === 'Midnights')!;

  await db.insert(schema.playlistSongs).values([
    { playlistId: dailyMix1.id, songId: insertedSongs[0].id },
    { playlistId: dailyMix1.id, songId: insertedSongs[2].id },
    { playlistId: dailyMix1.id, songId: insertedSongs[4].id },
    { playlistId: afterHoursAlbum.id, songId: insertedSongs[0].id },
    { playlistId: afterHoursAlbum.id, songId: insertedSongs[3].id },
    { playlistId: harrysHouseAlbum.id, songId: insertedSongs[1].id },
    { playlistId: midnightsAlbum.id, songId: insertedSongs[2].id },
  ]);
  console.log('Linked songs to playlists.');

  console.log('Database seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});