/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Star, BookOpen, Layers } from 'lucide-react';
import { Novel } from '../types';

interface NovelCardProps {
  key?: any;
  novel: Novel;
  onNavigate: (path: string) => void;
  allGenres?: { [key: string]: string };
}

export default function NovelCard({ novel, onNavigate, allGenres = {} }: NovelCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'hiatus': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'dropped': return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      default: return 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const roundedRating = novel.rating ? Number(novel.rating).toFixed(1) : '0.0';

  return (
    <div 
      onClick={() => onNavigate(`/novel/${novel.slug}`)}
      className="group flex flex-col sm:flex-row gap-5 p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#090d16] hover:border-indigo-100 dark:hover:border-indigo-950/50 hover:shadow-md hover:shadow-indigo-600/5 transition-all duration-200 cursor-pointer"
      id={`novel-card-${novel.slug}`}
    >
      {/* Cover Image */}
      <div className="relative w-full sm:w-28 h-40 flex-shrink-0 bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
        {novel.coverUrl ? (
          <img
            src={novel.coverUrl}
            alt={novel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs p-2 text-center bg-gradient-to-br from-indigo-50/50 to-indigo-100/20 dark:from-indigo-950/20 dark:to-indigo-900/10">
            <BookOpen className="h-6 w-6 text-indigo-300 dark:text-indigo-800 mb-2" />
            <span className="font-semibold text-gray-500 dark:text-gray-400">{novel.title}</span>
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-sm capitalize ${getStatusColor(novel.status)}`}>
          {novel.status}
        </span>
      </div>

      {/* Meta Info */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
              {novel.language || 'Original'}
            </span>
            <span className="text-gray-300 dark:text-gray-700 text-xs">&bull;</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              By {novel.author}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2">
            {novel.title}
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {novel.description || 'No description provided.'}
          </p>

          {/* Genres Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {novel.genreIds && novel.genreIds.slice(0, 3).map(gid => (
              <span 
                key={gid} 
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-slate-800"
              >
                {allGenres[gid] || gid.charAt(0).toUpperCase() + gid.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Foot Stats */}
        <div className="flex items-center gap-4 border-t border-gray-50 dark:border-gray-800/40 pt-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span className="font-semibold text-gray-700 dark:text-gray-200">{roundedRating}</span>
            <span className="text-[10px] text-gray-400">({novel.ratingCount || 0})</span>
          </div>

          <div className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-gray-400" />
            <span>{novel.chapterCount || 0} Chs</span>
          </div>

          {novel.releaseYear && (
            <span className="hidden sm:inline">
              Year: <strong className="font-medium text-gray-700 dark:text-gray-300">{novel.releaseYear}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
