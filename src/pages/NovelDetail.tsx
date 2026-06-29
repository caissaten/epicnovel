/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  db, collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, query, where, orderBy, increment
} from '../lib/firebase';
import { Novel, Chapter, Genre, Tag, Category, Bookmark, ReadingHistory } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  Star, Heart, BookOpen, Clock, ChevronDown, ChevronUp, RefreshCw, 
  Layers, User, Eye, ArrowLeftRight, Tag as TagIcon, Compass, Sparkles
} from 'lucide-react';

interface NovelDetailProps {
  novelSlug: string;
  onNavigate: (path: string) => void;
  currentUser: FirebaseUser | null;
}

export default function NovelDetail({ novelSlug, onNavigate, currentUser }: NovelDetailProps) {
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedNovels, setRelatedNovels] = useState<Novel[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState<ReadingHistory | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [isChapterAsc, setIsChapterAsc] = useState(true);

  useEffect(() => {
    async function loadNovelDetails() {
      if (!novelSlug) return;
      setLoading(true);
      try {
        // 1. Fetch current novel doc
        const novelDoc = await getDoc(doc(db, 'novels', novelSlug));
        if (!novelDoc.exists()) {
          setNovel(null);
          setLoading(false);
          return;
        }
        const novelData = { id: novelDoc.id, ...novelDoc.data() } as Novel;
        setNovel(novelData);

        // 2. Fetch taxonomies
        const genresSnap = await getDocs(collection(db, 'genres'));
        setGenres(genresSnap.docs.map(d => d.data() as Genre));

        const tagsSnap = await getDocs(collection(db, 'tags'));
        setTags(tagsSnap.docs.map(d => d.data() as Tag));

        const catsSnap = await getDocs(collection(db, 'categories'));
        setCategories(catsSnap.docs.map(d => d.data() as Category));

        // 3. Fetch Chapters of this novel
        const chQuery = query(
          collection(db, 'chapters'),
          where('novelId', '==', novelSlug)
        );
        const chSnap = await getDocs(chQuery);
        const chaptersList = chSnap.docs
          .map(d => d.data() as Chapter)
          .filter(ch => ch.status === 'publish')
          .sort((a, b) => a.chapterNumber - b.chapterNumber);
        setChapters(chaptersList);

        // 4. Fetch related novels (sharing at least one genre or category)
        const allNovelsSnap = await getDocs(query(collection(db, 'novels'), where('visibility', '==', 'publish')));
        const allNovels = allNovelsSnap.docs.map(d => d.data() as Novel);
        const related = allNovels.filter(n => 
          n.slug !== novelSlug && 
          (n.genreIds?.some(g => novelData.genreIds?.includes(g)) || 
           n.categoryIds?.some(c => novelData.categoryIds?.includes(c)))
        ).slice(0, 3);
        setRelatedNovels(related);

        // 5. Fetch Bookmark status if user is logged in
        if (currentUser) {
          const bookmarkId = `${currentUser.uid}_${novelSlug}`;
          const bDoc = await getDoc(doc(db, 'bookmarks', bookmarkId));
          setBookmarked(bDoc.exists());

          // Fetch user's reading history for this novel
          const historyId = `${currentUser.uid}_${novelSlug}`;
          const hDoc = await getDoc(doc(db, 'history', historyId));
          if (hDoc.exists()) {
            setLastReadChapter(hDoc.data() as ReadingHistory);
          }
        }

      } catch (error) {
        console.error("Error loading novel details:", error);
      } finally {
        setLoading(false);
      }
    }
    loadNovelDetails();
  }, [novelSlug, currentUser]);

  // Handle Bookmarking
  const handleBookmarkToggle = async () => {
    if (!currentUser) {
      alert("Please login first to bookmark your favorite novels!");
      return;
    }
    if (!novel) return;

    const bookmarkId = `${currentUser.uid}_${novelSlug}`;
    try {
      if (bookmarked) {
        await deleteDoc(doc(db, 'bookmarks', bookmarkId));
        setBookmarked(false);
      } else {
        const bookmarkData: Bookmark = {
          id: bookmarkId,
          userId: currentUser.uid,
          novelId: novel.slug,
          novelTitle: novel.title,
          novelCover: novel.coverUrl || '',
          createdAt: new Date()
        };
        await setDoc(doc(db, 'bookmarks', bookmarkId), bookmarkData);
        setBookmarked(true);
      }
    } catch (e) {
      console.error("Bookmark toggle failed:", e);
    }
  };

  // Handle Star Rating submission
  const handleRateNovel = async (stars: number) => {
    if (!currentUser) {
      alert("Please login to submit a rating!");
      return;
    }
    if (!novel) return;

    try {
      const novelRef = doc(db, 'novels', novel.slug);
      const newRatingSum = (novel.ratingSum || 0) + stars;
      const newRatingCount = (novel.ratingCount || 0) + 1;
      const newAvg = Number((newRatingSum / newRatingCount).toFixed(2));

      await updateDoc(novelRef, {
        ratingSum: increment(stars),
        ratingCount: increment(1),
        rating: newAvg,
        updatedAt: new Date()
      });

      // Update local state
      setNovel({
        ...novel,
        ratingSum: newRatingSum,
        ratingCount: newRatingCount,
        rating: newAvg
      });
      setRatingSubmitted(true);
    } catch (e) {
      console.error("Rating submission failed:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121214]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Fetching novel archive...</p>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121214] flex flex-col items-center justify-center py-16 px-4">
        <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Novel Not Found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm text-center">
          The requested story may have been deleted, placed in draft status, or its slug is invalid.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-md transition-colors cursor-pointer"
        >
          Return to Library
        </button>
      </div>
    );
  }

  // Map genre, tag, and category IDs to actual names
  const novelGenres = genres.filter(g => novel.genreIds?.includes(g.id));
  const novelTags = tags.filter(t => novel.tagIds?.includes(t.id));
  const novelCategories = categories.filter(c => novel.categoryIds?.includes(c.id));

  // Sort chapter listings
  const sortedChapters = [...chapters].sort((a, b) => {
    return isChapterAsc 
      ? a.chapterNumber - b.chapterNumber 
      : b.chapterNumber - a.chapterNumber;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'hiatus': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'dropped': return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      default: return 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-[#050811] min-h-screen pb-20 transition-colors duration-200" id="novel-detail-page-container">
      {/* Banner Backdrop */}
      <div className="relative h-60 sm:h-80 w-full overflow-hidden bg-gray-900">
        {novel.bannerUrl ? (
          <img 
            src={novel.bannerUrl} 
            alt="" 
            className="w-full h-full object-cover opacity-30 filter blur-[2px]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#050811] via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-36 sm:-mt-48 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Book cover, Rating Panel, Quick Details (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6" id="detail-left-sidebar">
            {/* Cover image wrapper */}
            <div className="bg-white dark:bg-[#090d16] p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800/80 max-w-sm mx-auto w-full flex justify-center">
              <div className="relative w-full aspect-[3/4] max-w-[240px] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-inner">
                {novel.coverUrl ? (
                  <img 
                    src={novel.coverUrl} 
                    alt={novel.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                    <BookOpen className="h-10 w-10 text-indigo-400 mb-2 animate-pulse" />
                    <span className="font-bold text-xs">{novel.title}</span>
                  </div>
                )}
                <span className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-md uppercase tracking-wider ${getStatusColor(novel.status)}`}>
                  {novel.status}
                </span>
              </div>
            </div>

            {/* Bookmark & Start Reading Button Panel */}
            <div className="bg-white dark:bg-[#090d16] rounded-2xl p-4 border border-gray-100 dark:border-slate-800/80 shadow-sm space-y-3">
              {lastReadChapter ? (
                <button
                  onClick={() => onNavigate(`/chapter/${novel.slug}-${lastReadChapter.chapterNumber}`)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                  id="btn-continue-reading"
                >
                  <Clock className="h-4 w-4" />
                  <span>Continue Ch {lastReadChapter.chapterNumber}</span>
                </button>
              ) : null}

              <button
                onClick={() => {
                  if (chapters.length > 0) {
                    onNavigate(`/chapter/${novel.slug}-1`);
                  } else {
                    alert("No chapters are published yet for this novel!");
                  }
                }}
                className={`w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/10 transition-all cursor-pointer flex items-center justify-center gap-2`}
                id="btn-start-reading"
              >
                <BookOpen className="h-4 w-4" />
                <span>Start Reading</span>
              </button>

              <button
                onClick={handleBookmarkToggle}
                className={`w-full py-2.5 border rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  bookmarked
                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
                    : 'bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
                id="btn-bookmark-toggle"
              >
                <Heart className={`h-4 w-4 ${bookmarked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{bookmarked ? 'Bookmarked' : 'Add to Bookmarks'}</span>
              </button>
            </div>

            {/* Rating Submission widget */}
            <div className="bg-white dark:bg-[#090d16] rounded-2xl p-5 border border-gray-100 dark:border-slate-800/80 shadow-sm">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Rate this story
              </h4>
              {ratingSubmitted ? (
                <div className="text-center py-2">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">✨ Thanks for rating!</p>
                </div>
              ) : (
                <div className="flex justify-between items-center px-2">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRateNovel(starVal)}
                      className="p-1 focus:outline-none cursor-pointer transition-transform hover:scale-110"
                      id={`star-${starVal}`}
                    >
                      <Star 
                        className={`h-6 w-6 transition-colors ${
                          starVal <= (hoverRating || 0)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 dark:text-gray-700'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar quick metadata */}
            <div className="bg-white dark:bg-[#090d16] rounded-2xl p-5 border border-gray-100 dark:border-slate-800/80 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-50 dark:border-gray-800/40 pb-2">
                Quick Details
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Author</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{novel.author}</span>
                </div>
                {novel.publisher && (
                  <div>
                    <span className="text-gray-400 block mb-0.5">Publisher</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{novel.publisher}</span>
                  </div>
                )}
                {novel.releaseYear && (
                  <div>
                    <span className="text-gray-400 block mb-0.5">Released</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{novel.releaseYear}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 block mb-0.5">Chapters</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{chapters.length} published</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Language</span>
                  <span className="font-semibold text-[#6366f1] dark:text-indigo-400">{novel.language}</span>
                </div>
                {novel.originalLanguage && (
                  <div>
                    <span className="text-gray-400 block mb-0.5">Original</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{novel.originalLanguage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Title, Synopsis, Chapters list, Related novels (9 cols) */}
          <div className="lg:col-span-9 space-y-6" id="detail-main-content">
            {/* Header Text details */}
            <div className="bg-white dark:bg-[#090d16] rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-slate-800/80 shadow-sm">
              <div className="flex flex-wrap gap-2.5 mb-3">
                {novelCategories.map(cat => (
                  <span 
                    key={cat.id}
                    className="text-[10px] font-extrabold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-md border border-indigo-100/30"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                {novel.title}
              </h1>

              {novel.alternativeTitle && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic font-medium mb-4">
                  Alt: {novel.alternativeTitle}
                </p>
              )}

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-gray-50 dark:border-gray-800/40 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-base text-gray-800 dark:text-gray-100">
                    {novel.rating ? Number(novel.rating).toFixed(1) : '0.0'}
                  </span>
                  <span className="text-xs text-gray-400">({novel.ratingCount || 0} reviews)</span>
                </div>

                <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-800" />

                <div className="flex items-center gap-1">
                  <Layers className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{chapters.length}</span>
                  <span>Chapters</span>
                </div>
              </div>
            </div>

            {/* Synopsis Panel */}
            <div className="bg-white dark:bg-[#090d16] rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-slate-800/80 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2 border-b border-gray-50 dark:border-gray-800/30 pb-3">
                <Compass className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Synopsis</span>
              </h3>
              
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {novel.description || 'No description provided.'}
              </p>

              {/* Genres & Tags */}
              <div className="pt-6 border-t border-gray-50 dark:border-gray-800/30 space-y-4">
                {novelGenres.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase w-16 select-none">Genres:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {novelGenres.map(g => (
                        <button
                          key={g.id}
                          onClick={() => onNavigate(`/search?genre=${g.id}`)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800/80 hover:border-indigo-100 dark:hover:border-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {novelTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase w-16 select-none">Tags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {novelTags.map(t => (
                        <button
                          key={t.id}
                          onClick={() => onNavigate(`/search?tag=${t.id}`)}
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-100/30 cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <TagIcon className="h-2.5 w-2.5" />
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chapters Table Panel */}
            <div className="bg-white dark:bg-[#090d16] rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-slate-800/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800/30 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Index of Chapters</span>
                </h3>

                <button
                  onClick={() => setIsChapterAsc(!isChapterAsc)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#252529] rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer flex items-center gap-1"
                  id="btn-sort-chapters"
                >
                  <span>Sort: {isChapterAsc ? 'Oldest first' : 'Newest first'}</span>
                  {isChapterAsc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </button>
              </div>

              {chapters.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No chapters have been released yet for this novel.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="chapters-list-grid">
                  {sortedChapters.map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => onNavigate(`/chapter/${novel.slug}-${ch.chapterNumber}`)}
                      className="group flex items-center justify-between p-3.5 border border-gray-100 dark:border-gray-800/70 bg-gray-50/40 dark:bg-gray-800/20 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 hover:border-indigo-100 dark:hover:border-indigo-950/50 rounded-xl cursor-pointer transition-all"
                      id={`chapter-row-${ch.id}`}
                    >
                      <div className="flex-grow min-w-0 pr-3">
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                          CHAPTER {ch.chapterNumber}
                        </span>
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {ch.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {ch.createdAt?.seconds 
                          ? new Date(ch.createdAt.seconds * 1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
                          : 'Recent'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Novels Panel */}
            {relatedNovels.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2 px-1">
                  <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Related Novels You May Enjoy</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedNovels.map(rel => (
                    <div
                      key={rel.id}
                      onClick={() => onNavigate(`/novel/${rel.slug}`)}
                      className="group p-4 bg-white dark:bg-[#090d16] border border-gray-100 dark:border-slate-800 rounded-xl hover:border-indigo-100 dark:hover:border-indigo-950/50 cursor-pointer transition-all"
                      id={`related-novel-card-${rel.slug}`}
                    >
                      <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 mb-3">
                        <img 
                          src={rel.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80'} 
                          alt={rel.title} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-1">
                        {rel.status}
                      </h4>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {rel.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-gray-600 dark:text-gray-300">
                          {rel.rating ? Number(rel.rating).toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
