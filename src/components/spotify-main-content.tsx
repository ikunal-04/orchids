"use client";

import { useEffect, useState } from 'react';
import { type Song } from '@/db/schema';
import { PlayIcon } from '@heroicons/react/24/solid';

export type PlaylistWithFirstSong = {
  id: string;
  name: string;
  description: string | null;
  coverArt: string;
  type: 'made-for-you' | 'popular-album' | 'playlist';
  songs: { song: Song }[];
};

interface SpotifyMainContentProps {
  onPlayTrack: (track: Song) => void;
}

const AlbumCard = ({ playlist, onPlayTrack }: { playlist: PlaylistWithFirstSong, onPlayTrack: (track: Song) => void }) => {
  const handlePlay = () => {
    if (playlist.songs && playlist.songs.length > 0 && playlist.songs[0].song) {
      onPlayTrack(playlist.songs[0].song);
    } else {
      console.warn(`Playlist "${playlist.name}" has no songs to play.`);
    }
  };

  return (
    <div className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-colors duration-300 group relative">
      <div className="relative">
        <img src={playlist.coverArt} alt={playlist.name} className="w-full h-auto rounded-md shadow-lg" />
        <button 
          onClick={handlePlay}
          className="absolute right-2 bottom-2 bg-green-500 rounded-full p-3 shadow-lg transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
        >
          <PlayIcon className="h-6 w-6 text-black" />
        </button>
      </div>
      <h3 className="text-white font-bold mt-4 truncate">{playlist.name}</h3>
      <p className="text-[#b3b3b3] text-sm mt-1 truncate">{playlist.description}</p>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-[#181818] p-4 rounded-lg animate-pulse">
    <div className="bg-neutral-700 w-full h-40 rounded-md"></div>
    <div className="h-4 bg-neutral-700 rounded w-3/4 mt-4"></div>
    <div className="h-3 bg-neutral-700 rounded w-1/2 mt-2"></div>
  </div>
);

const AlbumSection = ({ title, playlists, loading, error, onPlayTrack }: {
  title: string;
  playlists: PlaylistWithFirstSong[];
  loading: boolean;
  error: string | null;
  onPlayTrack: (track: Song) => void;
}) => (
  <section>
    <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
    {error && <p className="text-red-500">Error: {error}</p>}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {loading 
        ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        : playlists.map(playlist => <AlbumCard key={playlist.id} playlist={playlist} onPlayTrack={onPlayTrack} />)
      }
    </div>
  </section>
);

export default function SpotifyMainContent({ onPlayTrack }: SpotifyMainContentProps) {
  const [madeForYou, setMadeForYou] = useState<PlaylistWithFirstSong[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<PlaylistWithFirstSong[]>([]);
  const [loading, setLoading] = useState({ mfy: true, popular: true });
  const [error, setError] = useState<{ mfy: string | null, popular: string | null }>({ mfy: null, popular: null });

  useEffect(() => {
    const fetchPlaylists = async (type: 'made-for-you' | 'popular-albums', 
                                 setData: React.Dispatch<React.SetStateAction<PlaylistWithFirstSong[]>>,
                                 section: 'mfy' | 'popular'
                                 ) => {
      try {
        const res = await fetch(`/api/playlists/${type}`);
        if (!res.ok) throw new Error(`Failed to fetch ${type.replace('-', ' ')} playlists`);
        const data = await res.json();
        setData(data);
      } catch (err: any) {
        setError(prev => ({ ...prev, [section]: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, [section]: false }));
      }
    };

    fetchPlaylists('made-for-you', setMadeForYou, 'mfy');
    fetchPlaylists('popular-albums', setPopularAlbums, 'popular');
  }, []);

  return (
    <div className="p-6 space-y-10">
      <AlbumSection 
        title="Made for You"
        playlists={madeForYou}
        loading={loading.mfy}
        error={error.mfy}
        onPlayTrack={onPlayTrack}
      />
      <AlbumSection 
        title="Popular Albums"
        playlists={popularAlbums}
        loading={loading.popular}
        error={error.popular}
        onPlayTrack={onPlayTrack}
      />
    </div>
  );
}