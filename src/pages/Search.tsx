/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, collection, getDocs } from '../lib/firebase';
import { Novel, Genre, Tag, Category } from '../types';
import NovelCard from '../components/NovelCard';
import { Search as SearchIcon, SlidersHorizontal, ArrowUpDown, RefreshCw, Layers, BookOpen } from 'lucide-react';

interface SearchProps {
  onNavigate: (path: string) => void;
  initialQuery?: string;
  initialGenre?: string;
}

export default function Search({ onNavigate, initialQuery = '', initialGenre = '' }: SearchProps) {
  // Master states
  const [allNovels, setAllNovels] = useState<Novel[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [showFilters, setShowFilters] = useState(true);
  const [keyword, setKeyword] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [authorFilter, setAuthorFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string>('latest'); // latest, popular, alphabet, rating, chapters

  // Sync props
  useEffect(() => {
    setKeyword(initialQuery);
    setSelectedGenre(initialGenre);
  }, [initialQuery, initialGenre]);

  useEffect(() => {
    async function loadSearchAssets() {
      setLoading(true);
      try {
        const novelsSnap = await getDocs(collection(db, 'novels'));
        setAllNovels(novelsSnap.docs.map(doc => doc.data() as Novel));

        const genresSnap = await getDocs(collection(db, 'genres'));
        setGenres(genresSnap.docs.map(doc => doc.data() as Genre));

        const tagsSnap = await getDocs(collection(db, 'tags'));
        setTags(tagsSnap.docs.map(doc => doc.data() as Tag));

        const catsSnap = await getDocs(collection(db, 'categories'));
        setCategories(catsSnap.docs.map(doc => doc.data() as Category));
      } catch (error) {
        console.error("Error loading search page data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSearchAssets();
  }, []);

  // Filter novels locally for instant search response & maximum performance
  const filteredNovels = allNovels.filter(novel => {
    // Only search published novels
    if (novel.visibility !== 'publish') return false;

    // Keyword match (Title, Alternative Title, Author, Description)
    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      const matchTitle = novel.title.toLowerCase().includes(q);
      const matchAlt = novel.alternativeTitle?.toLowerCase().includes(q) || false;
      const matchAuthor = novel.author.toLowerCase().includes(q);
      const matchDesc = novel.description.toLowerCase().includes(q);
      if (!matchTitle && !matchAlt && !matchAuthor && !matchDesc) {
        return false;
      }
    }

    // Genre match
    if (selectedGenre !== 'all' && selectedGenre !== '') {
      if (!novel.genreIds || !novel.genreIds.includes(selectedGenre)) {
        return false;
      }
    }

    // Tag match
    if (selectedTag !== 'all') {
      if (!novel.tagIds || !novel.tagIds.includes(selectedTag)) {
        return false;
      }
    }

    // Category match
    if (selectedCategory !== 'all') {
      if (!novel.categoryIds || !novel.categoryIds.includes(selectedCategory)) {
        return false;
      }
    }

    // Status match
    if (statusFilter !== 'all') {
      if (novel.status !== statusFilter) {
        return false;
      }
    }

    // Author match
    if (authorFilter.trim()) {
      if (!novel.author.toLowerCase().includes(authorFilter.toLowerCase())) {
        return false;
      }
    }

    // Year match
    if (yearFilter.trim()) {
      if (novel.releaseYear !== Number(yearFilter)) {
        return false;
      }
    }

    // Language match
    if (languageFilter !== 'all') {
      if (novel.language?.toLowerCase() !== languageFilter.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // Sort local array
  const sortedNovels = [...filteredNovels].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        // sort by chapterCount + ratings count as popularity weight
        const aWeight = (a.ratingCount || 0) + (a.chapterCount || 0) * 0.1;
        const bWeight = (b.ratingCount || 0) + (b.chapterCount || 0) * 0.1;
        return bWeight - aWeight;
      case 'alphabet':
        return a.title.localeCompare(b.title);
      case 'rating':
        return b.rating - a.rating;
      case 'chapters':
        return (b.chapterCount || 0) - (a.chapterCount || 0);
      case 'latest':
      default:
        const aTime = a.updatedAt?.seconds || 0;
        const bTime = b.updatedAt?.seconds || 0;
        return bTime - aTime;
    }
  });

  const handleResetFilters = () => {
    setKeyword('');
    setSelectedGenre('all');
    setSelectedTag('all');
    setSelectedCategory('all');
    setStatusFilter('all');
    setAuthorFilter('');
    setYearFilter('');
    setLanguageFilter('all');
    setSortBy('latest');
  };

  const genresObj: { [key: string]: string } = {};
  genres.forEach(g => { genresObj[g.id] = g.name; });

  return (
    <div className="bg-gray-50 dark:bg-[#050811] min-h-screen pb-16 transition-colors duration-200" id="search-page-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 font-sans">
            Advanced Search
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse through our extensive library of web novels and light novels using refined filters.
          </p>
        </div>

        {/* Primary Keyword Bar */}
        <div className="bg-white dark:bg-[#090d16] rounded-xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center mb-6">
          <div className="relative w-full flex-grow">
            <input
              type="text"
              placeholder="Search by title, alternative title, synopsis..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:text-gray-200"
              id="search-input-field"
            />
            <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-lg text-sm font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                showFilters 
                  ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30'
                  : 'bg-white dark:bg-[#090d16] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#121b2d]'
              }`}
              id="search-toggle-filters-btn"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </button>

            <button
              onClick={handleResetFilters}
              className="px-4 py-3 bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#121b2d] text-gray-700 dark:text-gray-300 cursor-pointer transition-colors flex items-center gap-2"
              id="search-reset-btn"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-[#090d16] border border-gray-100 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-8 transition-all">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              
              {/* Genre Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Genre
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200"
                  id="search-genre-select"
                >
                  <option value="all">All Genres</option>
                  {genres.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Tag Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Tag / Trope
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200"
                  id="search-tag-select"
                >
                  <option value="all">All Tags</option>
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Category / Type
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200"
                  id="search-category-select"
                >
                  <option value="all">All Types</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200"
                  id="search-status-select"
                >
                  <option value="all">All Statuses</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                  <option value="dropped">Dropped</option>
                </select>
              </div>

              {/* Author text search */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Author
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shougo Kinugasa"
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200"
                  id="search-author-input"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Release Year
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2018"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200"
                  id="search-year-input"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Language
                </label>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200"
                  id="search-language-select"
                >
                  <option value="all">All Languages</option>
                  <option value="english">English</option>
                  <option value="japanese">Japanese</option>
                  <option value="chinese">Chinese</option>
                  <option value="korean">Korean</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>Sort By</span>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200"
                  id="search-sort-select"
                >
                  <option value="latest">Latest Update</option>
                  <option value="popular">Popularity</option>
                  <option value="alphabet">Alphabetical (A-Z)</option>
                  <option value="rating">Rating</option>
                  <option value="chapters">Chapter Count</option>
                </select>
              </div>

            </div>
          </div>
        )}

        {/* Loading / Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {loading ? 'Searching...' : `Found ${sortedNovels.length} stories`}
          </p>
        </div>

        {/* Results list */}
        {loading ? (
          <div className="text-center py-20">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Scanning archives...</p>
          </div>
        ) : sortedNovels.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#090d16] border border-gray-100 dark:border-slate-800 rounded-xl max-w-lg mx-auto">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">No Novels Match Your Search</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
              Try adjusting your query, relaxing your genres or filters, or resetting your searches to explore other stories.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="search-results-grid">
            {sortedNovels.map(novel => (
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
    </div>
  );
}
