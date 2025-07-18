import { pgTable, text, integer, timestamp, uuid, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const songs = pgTable('songs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  album: text('album').notNull(),
  albumArt: text('album_art').notNull(),
  duration: integer('duration').notNull(), // in seconds
  lastPlayedAt: timestamp('last_played_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Song = typeof songs.$inferSelect;

export const playlists = pgTable('playlists', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    coverArt: text('cover_art').notNull(),
    type: text('type', { enum: ['made-for-you', 'popular-album', 'playlist'] }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Playlist = typeof playlists.$inferSelect;

export const playlistSongs = pgTable('playlist_songs', {
    id: serial('id').primaryKey(),
    playlistId: uuid('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
    songId: uuid('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
});

// RELATIONS

export const songsRelations = relations(songs, ({ many }) => ({
    playlistSongs: many(playlistSongs),
}));

export const playlistsRelations = relations(playlists, ({ many }) => ({
    songs: many(playlistSongs),
}));

export const playlistSongsRelations = relations(playlistSongs, ({ one }) => ({
    playlist: one(playlists, {
        fields: [playlistSongs.playlistId],
        references: [playlists.id],
    }),
    song: one(songs, {
        fields: [playlistSongs.songId],
        references: [songs.id],
    }),
}));