import 'dotenv/config';
import { db } from '../src/db';
import { songs } from '../src/db/schema';

const sampleSongs = [
  {
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    duration: 200,
  },
  {
    title: 'As It Was',
    artist: 'Harry Styles',
    album: 'Harry\'s House',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273b46f74097652c7f3a3324b87',
    duration: 167,
  },
  {
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273d4090901a4e16c3f3e5c2d4b',
    duration: 203,
  },
  {
    title: 'good 4 u',
    artist: 'Olivia Rodrigo',
    album: 'SOUR',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
    duration: 178,
  },
  {
    title: 'Stay',
    artist: 'The Kid LAROI, Justin Bieber',
    album: 'F*CK LOVE 3: OVER YOU',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273c01f655be8449c2e475179a3',
    duration: 141,
  },
  {
    title: 'Shivers',
    artist: 'Ed Sheeran',
    album: '=',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273bb5a393963391cf024720042',
    duration: 207,
  },
  {
    title: 'INDUSTRY BABY',
    artist: 'Lil Nas X, Jack Harlow',
    album: 'MONTERO',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273be8267331f4781745429a3a5',
    duration: 212,
  },
  {
    title: 'Heat Waves',
    artist: 'Glass Animals',
    album: 'Dreamland',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273c5c93c1b82c8f8afa29e3768',
    duration: 238,
  },
];

async function main() {
  console.log('Seeding database...');
  await db.delete(songs); // Clear existing songs
  await db.insert(songs).values(sampleSongs);
  console.log('Database seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});