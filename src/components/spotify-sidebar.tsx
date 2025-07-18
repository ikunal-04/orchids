"use client";

import { useEffect, useState } from 'react';
import { HomeIcon, PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { type Song } from '@/db/schema';

interface SpotifySidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  onHomeClick: () => void;
  onSearchClick: () => void;
  onLibraryToggle: () => void;
  onPlaylistClick: (id: string) => void;
  onPlayTrack: (track: Song) => void;
}

export default function SpotifySidebar({
  isVisible, onToggle, onHomeClick, onSearchClick, onLibraryToggle, onPlayTrack
}: SpotifySidebarProps) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);

  useEffect(() => {
    async function fetchRecentlyPlayed() {
      try {
        const res = await fetch('/api/songs/recently-played');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setRecentlyPlayed(data);
      } catch (error) {
        console.error('Could not fetch recently played songs:', error);
      }
    }
    fetchRecentlyPlayed();
  }, []); // isVisible is a good trigger if we want to refetch when sidebar is opened, but key on parent works better

  if (!isVisible) return null;

  return (
    <div className="w-72 bg-black text-[#b3b3b3] p-2 flex flex-col space-y-2">
      <div className="bg-[#121212] rounded-lg p-4 space-y-4">
        <button onClick={onHomeClick} className="flex items-center space-x-4 w-full text-white font-bold">
          <HomeIcon className="h-6 w-6" />
          <span>Home</span>
        </button>
        <button onClick={onSearchClick} className="flex items-center space-x-4 w-full hover:text-white">
          
          <span>Search</span>
        </button>
      </div>
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col">
        <div className="p-4 flex justify-between items-center">
          <button onClick={onLibraryToggle} className="flex items-center space-x-4 hover:text-white">
            
            <span>Your Library</span>
          </button>
          <div className="flex space-x-2">
            <button className="hover:bg-[#1a1a1a] rounded-full p-1"><PlusIcon className="h-5 w-5" /></button>
            <button className="hover:bg-[#1a1a1a] rounded-full p-1"><ArrowRightIcon className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="px-2 flex-1 overflow-y-auto">
          {/* Recently Played Section */}
          <div className="space-y-2">
            {recentlyPlayed.map(track => (
              <div 
                key={track.id} 
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer"
                onClick={() => onPlayTrack(track)}
              >
                <img src={track.albumArt} alt={track.album} className="h-12 w-12 rounded" />
                <div>
                  <p className="text-white truncate">{track.title}</p>
                  <p className="text-sm truncate">{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}