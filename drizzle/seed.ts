import { db } from '../src/db';
import { usersTable, songsTable, recentlyPlayedSongsTable } from '../src/db/schema';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function seed() {
  console.log('Seeding database...');

  // Clean up existing data
  await db.delete(recentlyPlayedSongsTable);
  await db.delete(usersTable);
  await db.delete(songsTable);
  console.log('Cleared existing data.');

  // Seed Users
  const users = await db.insert(usersTable).values([
    { name: 'Demo User', age: 25, email: 'demo@example.com' },
  ]).returning();
  console.log(`Seeded ${users.length} users.`);
  
  // Seed Songs
  const songs = await db.insert(songsTable).values([
    { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', durationSeconds: 355 },
    { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', durationSeconds: 482 },
    { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', durationSeconds: 391 },
    { title: 'Like a Rolling Stone', artist: 'Bob Dylan', album: 'Highway 61 Revisited', durationSeconds: 373 },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', durationSeconds: 301 },
    { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', durationSeconds: 200 },
    { title: 'Shape of You', artist: 'Ed Sheeran', album: '÷', durationSeconds: 233 },
    { title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', durationSeconds: 167 },
  ]).returning();

  console.log(`Seeded ${songs.length} songs.`);
  console.log('Seeding complete. You can now start the application.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error during seeding:', error);
  process.exit(1);
});