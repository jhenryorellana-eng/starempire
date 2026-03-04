'use client';

import { useState } from 'react';
import type { FeedItem } from '@/types';

interface ActionBarProps {
  item: FeedItem;
  onReact: (type: 'inspired' | 'game_changer') => void;
  onBookmark: () => void;
  onShare: () => void;
  onViewCompany: () => void;
}

export function ActionBar({ item, onReact, onBookmark, onShare, onViewCompany }: ActionBarProps) {
  const [inspireAnim, setInspireAnim] = useState(false);
  const [gameChangerAnim, setGameChangerAnim] = useState(false);

  const handleInspire = () => {
    setInspireAnim(true);
    onReact('inspired');
    setTimeout(() => setInspireAnim(false), 400);
  };

  const handleGameChanger = () => {
    setGameChangerAnim(true);
    onReact('game_changer');
    setTimeout(() => setGameChangerAnim(false), 400);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Company Avatar */}
      <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={onViewCompany}>
        <div className="w-10 h-10 rounded-full border-2 border-white p-0.5 relative overflow-hidden transition-transform group-active:scale-95">
          {item.companyCoverUrl ? (
            <img
              alt={item.companyTitle}
              className="w-full h-full object-cover rounded-full"
              src={item.companyCoverUrl}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-surface-dark flex items-center justify-center">
              <span className="material-icons-round text-primary text-lg">domain</span>
            </div>
          )}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-primary rounded-full w-4 h-4 flex items-center justify-center border border-black">
            <span className="material-icons-round text-[10px] text-white">add</span>
          </div>
        </div>
      </div>

      {/* Me inspiró */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleInspire}
          className={`w-10 h-10 rounded-full glass-icon flex items-center justify-center ${
            inspireAnim ? 'animate-scale-bounce' : ''
          }`}
        >
          <span
            className={`material-icons-round text-2xl ${
              item.hasInspired
                ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]'
                : 'text-white'
            }`}
          >
            lightbulb
          </span>
        </button>
        <span className="text-xs font-semibold text-white/90 text-shadow">
          {formatCount(item.inspiredCount)}
        </span>
      </div>

      {/* Game Changer */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleGameChanger}
          className={`w-10 h-10 rounded-full glass-icon flex items-center justify-center group ${
            gameChangerAnim ? 'animate-scale-bounce' : ''
          }`}
        >
          <span
            className={`material-icons-round text-2xl transition-colors ${
              item.hasGameChanged ? 'text-primary' : 'text-white group-active:text-primary'
            }`}
          >
            rocket_launch
          </span>
        </button>
        <span className="text-xs font-semibold text-white/90 text-shadow">
          {formatCount(item.gameChangerCount)}
        </span>
      </div>

      {/* Bookmark */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onBookmark}
          className="w-10 h-10 rounded-full glass-icon flex items-center justify-center"
        >
          <span
            className={`material-icons-round text-2xl ${
              item.hasBookmarked ? 'text-primary' : 'text-white'
            }`}
          >
            {item.hasBookmarked ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
        <span className="text-xs font-semibold text-white/90 text-shadow">
          {formatCount(item.saveCount)}
        </span>
      </div>

      {/* Share */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onShare}
          className="w-10 h-10 rounded-full glass-icon flex items-center justify-center"
        >
          <span className="material-icons-round text-2xl text-white -rotate-45 ml-1">
            link
          </span>
        </button>
        <span className="text-xs font-semibold text-white/90 text-shadow">Share</span>
      </div>

      {/* Vinyl Spinner */}
      <div className="mt-1 animate-spin-slow">
        <div className="w-8 h-8 rounded-full bg-gray-900 border-[3px] border-gray-800 flex items-center justify-center overflow-hidden relative">
          {item.companyCoverUrl ? (
            <img
              alt="Audio"
              className="w-5 h-5 rounded-full object-cover opacity-80"
              src={item.companyCoverUrl}
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-surface-dark" />
          )}
        </div>
      </div>
    </div>
  );
}
