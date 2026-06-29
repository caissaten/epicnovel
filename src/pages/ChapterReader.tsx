/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, getDocs, doc, getDoc, setDoc, query, where, orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Chapter, Novel, ReadingHistory } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  ArrowLeft, ArrowRight, Settings, List, Play, Pause, ChevronDown, 
  HelpCircle, Star, Bookmark, Check, Minimize2, Maximize2
} from 'lucide-react';

interface ChapterReaderProps {
  chapterSlug: string; // formatted as "novelSlug-chapterNumber"
  onNavigate: (path: string) => void;
  currentUser: FirebaseUser | null;
}

type ReaderTheme = 'light' | 'dark' | 'sepia';
type ContentWidth = 'narrow' | 'normal' | 'wide';

export default function ChapterReader({ chapterSlug, onNavigate, currentUser }: ChapterReaderProps) {
  // Parse novelSlug and chapterNumber from slug
  const parts = chapterSlug.split('-');
  const chapterNumber = Number(parts[parts.length - 1]);
  const novelSlug = parts.slice(0, parts.length - 1).join('-');

  const readerContainerRef = useRef<HTMLDivElement>(null);

  // States
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings states (backed up by localStorage!)
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    return (localStorage.getItem('reader-theme') as ReaderTheme) || 'dark';
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('reader-font-size')) || 18;
  });
  const [lineHeight, setLineHeight] = useState<number>(() => {
    return Number(localStorage.getItem('reader-line-height')) || 1.8;
  });
  const [contentWidth, setContentWidth] = useState<ContentWidth>(() => {
    return (localStorage.getItem('reader-width') as ContentWidth) || 'normal';
  });

  // Reading progress and controls
  const [showSettings, setShowSettings] = useState(false);
  const [showChaptersMenu, setShowChaptersMenu] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Auto Scroll
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(2); // 1 to 5
  const autoScrollTimerRef = useRef<any>(null);

  useEffect(() => {
    async function loadChapterContent() {
      if (!novelSlug || isNaN(chapterNumber)) return;
      setLoading(true);
      try {
        // 1. Fetch novel to get title
        const nDoc = await getDoc(doc(db, 'novels', novelSlug));
        if (nDoc.exists()) {
          setNovel(nDoc.data() as Novel);
        }

        // 2. Fetch all chapters of this novel for index & next/prev checks
        const chQuery = query(
          collection(db, 'chapters'),
          where('novelId', '==', novelSlug)
        );
        const chSnap = await getDocs(chQuery);
        const chaptersList = chSnap.docs
          .map(d => d.data() as Chapter)
          .filter(ch => ch.status === 'publish')
          .sort((a, b) => a.chapterNumber - b.chapterNumber);
        setAllChapters(chaptersList);

        // 3. Find target chapter
        const targetChapter = chaptersList.find(c => c.chapterNumber === chapterNumber);
        if (targetChapter) {
          setChapter(targetChapter);
          
          // Reset scroll position to top when chapter changes
          window.scrollTo({ top: 0, behavior: 'instant' as any });

          // 4. Save to Reading History if logged in
          if (currentUser) {
            const historyId = `${currentUser.uid}_${novelSlug}`;
            const historyData: ReadingHistory = {
              id: historyId,
              userId: currentUser.uid,
              novelId: novelSlug,
              novelTitle: nDoc.exists() ? nDoc.data()?.title : novelSlug,
              chapterId: targetChapter.id,
              chapterTitle: targetChapter.title,
              chapterNumber: targetChapter.chapterNumber,
              progress: 0,
              updatedAt: new Date()
            };
            await setDoc(doc(db, 'history', historyId), historyData);
          }
        } else {
          setChapter(null);
        }

      } catch (error) {
        console.error("Error loading chapter reader:", error);
      } finally {
        setLoading(false);
      }
    }
    loadChapterContent();
  }, [chapterSlug, currentUser]);

  // Persist reader configurations
  useEffect(() => {
    localStorage.setItem('reader-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('reader-font-size', String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader-line-height', String(lineHeight));
  }, [lineHeight]);

  useEffect(() => {
    localStorage.setItem('reader-width', contentWidth);
  }, [contentWidth]);

  // Handle Keyboard Shortcuts (Left / Right arrow for navigating chapters)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateToPrev();
      } else if (e.key === 'ArrowRight') {
        navigateToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapter, allChapters]);

  // Handle Reading Scroll Progress Track
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const pct = Math.min(Math.round((scrollTop / docHeight) * 100), 100);
        setScrollProgress(pct);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto scroll effect
  useEffect(() => {
    if (isAutoScrolling) {
      const scrollStep = () => {
        window.scrollBy(0, autoScrollSpeed * 0.5);
        autoScrollTimerRef.current = requestAnimationFrame(scrollStep);
      };
      autoScrollTimerRef.current = requestAnimationFrame(scrollStep);
    } else {
      if (autoScrollTimerRef.current) {
        cancelAnimationFrame(autoScrollTimerRef.current);
      }
    }

    return () => {
      if (autoScrollTimerRef.current) {
        cancelAnimationFrame(autoScrollTimerRef.current);
      }
    };
  }, [isAutoScrolling, autoScrollSpeed]);

  const hasNext = allChapters.some(c => c.chapterNumber === chapterNumber + 1);
  const hasPrev = allChapters.some(c => c.chapterNumber === chapterNumber - 1);

  const navigateToNext = () => {
    if (hasNext) {
      onNavigate(`/chapter/${novelSlug}-${chapterNumber + 1}`);
    }
  };

  const navigateToPrev = () => {
    if (hasPrev) {
      onNavigate(`/chapter/${novelSlug}-${chapterNumber - 1}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050811]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Summoning scroll fragments...</p>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center py-16 px-4 text-white">
        <Minimize2 className="h-16 w-16 text-indigo-400 mb-4" />
        <h2 className="text-2xl font-bold">Chapter Unavailable</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm text-center">
          This chapter has not been published yet or is in administrative draft status.
        </p>
        <button
          onClick={() => onNavigate(`/novel/${novelSlug}`)}
          className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-md transition-colors cursor-pointer"
        >
          Go Back to Novel
        </button>
      </div>
    );
  }

  // Get reading layouts
  const getThemeClasses = () => {
    switch (theme) {
      case 'light': return 'bg-[#fafafa] text-gray-900 border-gray-200';
      case 'sepia': return 'bg-[#f7f0e3] text-[#433422] border-[#e8ddc7]';
      case 'dark':
      default: return 'bg-[#050811] text-gray-200 border-slate-800';
    }
  };

  const getWidthClasses = () => {
    switch (contentWidth) {
      case 'narrow': return 'max-w-xl';
      case 'wide': return 'max-w-4xl';
      case 'normal':
      default: return 'max-w-2xl';
    }
  };

  return (
    <div className={`min-h-screen pb-24 transition-all duration-200 ${getThemeClasses()}`} id="chapter-reader-page">
      {/* Top scroll tracker */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-indigo-950/20 z-50">
        <div 
          className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-100" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating Reader Toolbar (Sticky Header style) */}
      <div className={`sticky top-0 z-40 border-b py-3 backdrop-blur-md px-4 sm:px-6 transition-all duration-200 ${
        theme === 'light' ? 'bg-white/90 border-gray-100 text-gray-800' :
        theme === 'sepia' ? 'bg-[#f7f0e3]/90 border-[#ebdcb9] text-[#433422]' :
        'bg-[#090d16]/90 border-slate-800 text-gray-300'
      }`} id="reader-sticky-toolbar">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate(`/novel/${novelSlug}`)}
            className="flex items-center gap-1 text-xs font-bold hover:opacity-80 cursor-pointer"
            id="reader-back-to-novel-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Novel</span>
          </button>

          {/* Quick chapter selector */}
          <div className="relative">
            <button
              onClick={() => setShowChaptersMenu(!showChaptersMenu)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 hover:opacity-80 cursor-pointer ${
                theme === 'light' ? 'border-gray-200' :
                theme === 'sepia' ? 'border-[#ebdcb9]' :
                'border-gray-800'
              }`}
              id="reader-toc-menu-toggle"
            >
              <span>Chapter {chapter.chapterNumber}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Chapters Dropdown */}
            {showChaptersMenu && (
              <div className={`absolute left-1/2 -translate-x-1/2 mt-2 w-64 max-h-80 overflow-y-auto rounded-xl border p-2 shadow-xl z-50 ${
                theme === 'light' ? 'bg-white border-gray-200 text-gray-800' :
                theme === 'sepia' ? 'bg-[#fcf8f0] border-[#ebdcb9] text-[#433422]' :
                'bg-[#090d16] border-slate-800 text-gray-200'
              }`}>
                <h4 className="text-[10px] uppercase font-black text-gray-400 p-2 border-b border-gray-100/10 mb-1">
                  Table of Contents
                </h4>
                <div className="space-y-1">
                  {allChapters.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        onNavigate(`/chapter/${novelSlug}-${ch.chapterNumber}`);
                        setShowChaptersMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs font-medium flex items-center justify-between hover:bg-indigo-600/10 hover:text-indigo-600 ${
                        ch.chapterNumber === chapterNumber 
                          ? 'bg-indigo-600/10 text-indigo-600 font-bold' 
                          : ''
                      }`}
                    >
                      <span className="truncate">Ch {ch.chapterNumber}: {ch.title}</span>
                      {ch.chapterNumber === chapterNumber && <Check className="h-3 w-3 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls Trigger Panel */}
          <div className="flex items-center gap-3">
            {/* Auto scroll control */}
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer hover:opacity-80 ${
                isAutoScrolling 
                  ? 'bg-emerald-600/15 text-emerald-500' 
                  : ''
              }`}
              title={isAutoScrolling ? 'Pause Auto Scroll' : 'Start Auto Scroll'}
              id="reader-autoscroll-toggle"
            >
              {isAutoScrolling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="hidden md:inline">Scroll</span>
            </button>

            {/* Settings triggers */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              title="Reading Settings"
              id="reader-settings-toggle"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel Modal Drawer */}
      {showSettings && (
        <div className={`border-b px-4 py-4 select-none ${
          theme === 'light' ? 'bg-gray-100/50 border-gray-200 text-gray-800' :
          theme === 'sepia' ? 'bg-[#f4ebe1] border-[#e2d5bd] text-[#433422]' :
          'bg-[#090d16] border-slate-800 text-gray-300'
        }`} id="reader-settings-drawer">
          <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            
            {/* Left side: Themes & Column width */}
            <div className="space-y-4">
              {/* Themes Selector */}
              <div>
                <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                  Theme Palette
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-3 py-2 text-xs rounded-lg border font-semibold cursor-pointer text-center ${
                      theme === 'light' 
                        ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm' 
                        : 'bg-white border-gray-200 text-gray-800'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('sepia')}
                    className={`px-3 py-2 text-xs rounded-lg border font-semibold cursor-pointer text-center ${
                      theme === 'sepia' 
                        ? 'bg-[#fcf8f2] border-indigo-600 text-indigo-600 shadow-sm' 
                        : 'bg-[#fcf8f2] border-[#ebdcb9] text-[#433422]'
                    }`}
                  >
                    Warm Sepia
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-2 text-xs rounded-lg border font-semibold cursor-pointer text-center ${
                      theme === 'dark' 
                        ? 'bg-[#121b2d] border-indigo-400 text-indigo-400 shadow-sm' 
                        : 'bg-[#090d16] border-slate-800 text-gray-300'
                    }`}
                  >
                    Dark Abyss
                  </button>
                </div>
              </div>

              {/* Column width */}
              <div>
                <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                  Content Width
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['narrow', 'normal', 'wide'] as ContentWidth[]).map(w => (
                    <button
                      key={w}
                      onClick={() => setContentWidth(w)}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-semibold capitalize cursor-pointer text-center ${
                        contentWidth === w 
                          ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' 
                          : 'border-transparent bg-black/5 dark:bg-white/5'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Font size, Line height, Scroll speed */}
            <div className="space-y-4">
              {/* Font Size Selector */}
              <div>
                <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2 flex justify-between items-center">
                  <span>Font Size</span>
                  <span className="font-bold font-mono">{fontSize}px</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                    className="flex-grow py-1.5 border border-transparent hover:border-gray-400 rounded-lg bg-black/5 dark:bg-white/5 font-bold cursor-pointer"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSize(Math.min(32, fontSize + 1))}
                    className="flex-grow py-1.5 border border-transparent hover:border-gray-400 rounded-lg bg-black/5 dark:bg-white/5 font-bold cursor-pointer"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Line height */}
              <div>
                <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2 flex justify-between items-center">
                  <span>Line Height</span>
                  <span className="font-bold font-mono">{lineHeight.toFixed(1)}</span>
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[1.4, 1.6, 1.8, 2.0].map(lh => (
                    <button
                      key={lh}
                      onClick={() => setLineHeight(lh)}
                      className={`py-1.5 text-xs rounded-lg border font-bold cursor-pointer text-center ${
                        lineHeight === lh
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent bg-black/5 dark:bg-white/5'
                      }`}
                    >
                      {lh.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scroll Speed (only visible if auto scrolling) */}
              {isAutoScrolling && (
                <div>
                  <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2 flex justify-between items-center">
                    <span>Scroll Speed</span>
                    <span className="font-bold font-mono">Speed: {autoScrollSpeed}</span>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={autoScrollSpeed}
                    onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Main Chapter Content Frame */}
      <div className="max-w-5xl mx-auto px-6 pt-16" ref={readerContainerRef} id="reader-content-area">
        {/* Story Breadcrumb & headers */}
        <div className="text-center mb-12 select-none">
          {novel && (
            <span 
              onClick={() => onNavigate(`/novel/${novelSlug}`)}
              className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline mb-2 block"
            >
              {novel.title}
            </span>
          )}
          
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mt-1 mb-3">
            Chapter {chapter.chapterNumber}: {chapter.title}
          </h1>

          {chapter.volume && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">
              {chapter.volume}
            </span>
          )}
        </div>

        {/* Readable Body Content block */}
        <div 
          className={`mx-auto leading-relaxed prose prose-headings:font-bold prose-p:mb-5 prose-p:leading-relaxed prose-img:rounded-xl dark:prose-invert transition-all selection:bg-indigo-600/30 select-text ${getWidthClasses()}`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            fontFamily: '"Inter", Georgia, system-ui, sans-serif'
          }}
          dangerouslySetInnerHTML={{ __html: chapter.content }}
          id="reader-prose-body"
        />

        {/* Navigation block */}
        <div className="border-t border-gray-100/10 mt-16 pt-12 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto select-none">
          <button
            onClick={navigateToPrev}
            disabled={!hasPrev}
            className={`w-full sm:w-auto px-6 py-3.5 border rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              hasPrev
                ? 'bg-transparent border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 text-current'
                : 'opacity-40 cursor-not-allowed text-gray-400 border-gray-200 dark:border-gray-800'
            }`}
            id="reader-prev-chapter-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Prev Chapter</span>
          </button>

          <button
            onClick={() => onNavigate(`/novel/${novelSlug}`)}
            className="w-full sm:w-auto px-6 py-3.5 bg-black/5 dark:bg-white/5 rounded-xl text-sm font-bold text-center hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 cursor-pointer transition-all"
            id="reader-index-btn"
          >
            Index of Novel
          </button>

          <button
            onClick={navigateToNext}
            disabled={!hasNext}
            className={`w-full sm:w-auto px-6 py-3.5 border rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              hasNext
                ? 'bg-indigo-600 border-transparent hover:bg-indigo-500 active:scale-95 text-white shadow-lg shadow-indigo-600/10'
                : 'opacity-40 cursor-not-allowed text-gray-400 border-gray-200 dark:border-gray-800'
            }`}
            id="reader-next-chapter-btn"
          >
            <span>Next Chapter</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Simple keyboard shortcut help label */}
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-8 select-none">
          💡 Pro-tip: You can use the <kbd className="font-bold">←</kbd> and <kbd className="font-bold">→</kbd> arrow keys on your keyboard to navigate chapters!
        </p>
      </div>
    </div>
  );
}
