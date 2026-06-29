/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, where, orderBy, limit, isLocalMode } from '../lib/firebase';
import { seedDatabaseIfEmpty } from '../lib/dbSeeder';
import { Novel, Chapter, Genre, Category } from '../types';
import NovelCard from '../components/NovelCard';
import { BookOpen, Sparkles, Star, Clock, Layers, Flame, ArrowRight, Compass } from 'lucide-react';

interface HomeProps {
  onNavigate: (path: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestChapters, setLatestChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [featuredNovel, setFeaturedNovel] = useState<Novel | null>(null);

  useEffect(() => {
    async function initHome() {
      setLoading(true);
      try {
        // Seed first if empty
        await seedDatabaseIfEmpty();

        // 1. Fetch Genres & Categories
        const genresSnap = await getDocs(collection(db, 'genres'));
        const genresList = genresSnap.docs.map(doc => doc.data() as Genre);
        setGenres(genresList);

        const catsSnap = await getDocs(collection(db, 'categories'));
        setCategories(catsSnap.docs.map(doc => doc.data() as Category));

        const genreMap: { [key: string]: string } = {};
        genresList.forEach(g => { genreMap[g.id] = g.name; });

        // 2. Fetch Novels
        const novelsQuery = query(
          collection(db, 'novels'),
          where('visibility', '==', 'publish')
        );
        const novelsSnap = await getDocs(novelsQuery);
        const novelsList = novelsSnap.docs.map(doc => doc.data() as Novel);
        setNovels(novelsList);

        if (novelsList.length > 0) {
          // Choose highest rating as featured, or just first
          const sortedByRating = [...novelsList].sort((a, b) => b.rating - a.rating);
          setFeaturedNovel(sortedByRating[0]);
        }

        // 3. Fetch Latest Chapters
        const chaptersQuery = query(
          collection(db, 'chapters'),
          orderBy('createdAt', 'desc'),
          limit(30)
        );
        const chaptersSnap = await getDocs(chaptersQuery);
        const chaptersList = chaptersSnap.docs
          .map(doc => doc.data() as Chapter)
          .filter(ch => ch.status === 'publish')
          .slice(0, 6);
        setLatestChapters(chaptersList);

      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setLoading(false);
      }
    }
    initHome();
  }, []);

  // Filter novels by selected category tab
  const filteredNovels = selectedCategory === 'all'
    ? novels
    : novels.filter(n => n.categoryIds && n.categoryIds.includes(selectedCategory));

  const genresObj: { [key: string]: string } = {};
  genres.forEach(g => { genresObj[g.id] = g.name; });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050811]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading novels platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-[#050811] min-h-screen pb-16 transition-colors duration-200" id="home-page-container">
      {/* Local Mode Notice */}
      {isLocalMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-4 sm:px-6 lg:px-8 text-center text-xs text-amber-600 dark:text-amber-400 font-medium">
          ⚠️ Mode Lokal Aktif (Firestore offline/belum dibuat). Novel yang Anda buat atau edit disimpan di browser Anda.
        </div>
      )}
      {/* Banner/Hero Section */}
      {featuredNovel && (
        <div className="relative overflow-hidden bg-gray-900 text-white border-b border-gray-800" id="hero-banner-section">
          {featuredNovel.bannerUrl && (
            <div className="absolute inset-0 z-0">
              <img 
                src={featuredNovel.bannerUrl} 
                alt="" 
                className="w-full h-full object-cover opacity-20 filter blur-sm scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-slate-950/90 to-slate-900" />
            </div>
          )}
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Cover */}
              <div className="lg:col-span-3 flex justify-center lg:justify-start">
                <div 
                  onClick={() => onNavigate(`/novel/${featuredNovel.slug}`)}
                  className="relative w-44 sm:w-52 h-64 sm:h-72 rounded-xl overflow-hidden shadow-2xl border border-gray-700/50 cursor-pointer transform hover:scale-[1.02] transition-transform duration-200"
                >
                  <img 
                    src={featuredNovel.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80'} 
                    alt={featuredNovel.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-md">
                    Featured
                  </div>
                </div>
              </div>

              {/* Description & Buttons */}
              <div className="lg:col-span-9 flex flex-col justify-center text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-3">
                  <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">
                    {featuredNovel.language}
                  </span>
                  <span className="text-gray-600">&bull;</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400" />
                    <span className="font-bold text-sm text-gray-200">{Number(featuredNovel.rating).toFixed(1)}</span>
                  </div>
                  <span className="text-gray-600">&bull;</span>
                  <span className="text-xs text-gray-400">Author: {featuredNovel.author}</span>
                </div>

                <h1 
                  onClick={() => onNavigate(`/novel/${featuredNovel.slug}`)}
                  className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white hover:text-indigo-400 cursor-pointer transition-colors"
                >
                  {featuredNovel.title}
                </h1>

                <p className="text-sm sm:text-base text-gray-300 line-clamp-3 mb-6 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                  {featuredNovel.description}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <button 
                    onClick={() => onNavigate(`/novel/${featuredNovel.slug}`)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold rounded-lg shadow-lg hover:shadow-indigo-600/20 text-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Start Reading</span>
                  </button>
                  <button 
                    onClick={() => onNavigate(`/search`)}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 active:scale-95 text-gray-200 font-semibold rounded-lg border border-gray-700 text-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Browse All Novels</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Novels & Tabs */}
          <div className="lg:col-span-8 space-y-10">
            {/* Header and Tabs */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Explore Stories</h2>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-800/60 pb-3">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'bg-white dark:bg-[#090d16] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-slate-800 hover:border-gray-200'
                  }`}
                  id="tab-all"
                >
                  All Sources
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-white dark:bg-[#090d16] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-slate-800 hover:border-gray-200'
                    }`}
                    id={`tab-${cat.id}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Novels */}
            {filteredNovels.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#090d16] rounded-xl border border-gray-100 dark:border-slate-800">
                <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No novels published under this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="novels-cards-grid">
                {filteredNovels.map(novel => (
                  <NovelCard 
                    key={novel.id} 
                    novel={novel} 
                    onNavigate={onNavigate} 
                    allGenres={genresObj}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sidebar (Latest Chapters & Genres) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Latest Chapter Updates */}
            <div className="bg-white dark:bg-[#090d16] rounded-xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-800/40 pb-3">
                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Latest Updates</h3>
              </div>

              {latestChapters.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No recent chapter updates.</p>
              ) : (
                <div className="space-y-4">
                  {latestChapters.map(ch => (
                    <div 
                      key={ch.id} 
                      onClick={() => onNavigate(`/chapter/${ch.novelId}-${ch.chapterNumber}`)}
                      className="group flex items-start gap-3 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/30 cursor-pointer transition-all"
                      id={`latest-chapter-${ch.id}`}
                    >
                      <div className="h-10 w-8 flex-shrink-0 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded flex items-center justify-center font-mono text-[10px] font-bold">
                        Ch{ch.chapterNumber}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {ch.title}
                        </h4>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          On <span className="font-semibold text-gray-500 dark:text-gray-300">{ch.novelTitle}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Genres Search Helpers */}
            <div className="bg-white dark:bg-[#090d16] rounded-xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-800/40 pb-3">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Genres</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {genres.map(g => (
                  <button
                    key={g.id}
                    onClick={() => onNavigate(`/search?genre=${g.id}`)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                    id={`genre-btn-${g.id}`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
