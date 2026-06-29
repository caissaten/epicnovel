/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';
import { isAdmin } from './config/admin';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import NovelDetail from './pages/NovelDetail';
import ChapterReader from './pages/ChapterReader';
import Search from './pages/Search';
import AdminDashboard from './pages/AdminDashboard';

import { BookOpen, ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Read dark mode state from localStorage, defaulting to true for Elegant Dark
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme-dark');
    return saved !== null ? saved === 'true' : true;
  });

  // Simple Hash-based Router
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.hash.substring(1) || '/';
  });

  // Track hash changes in window location
  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.substring(1) || '/';
      setCurrentPath(path);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync dark mode class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme-dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme-dark', 'false');
    }
  }, [darkMode]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleAdminLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Admin login popup failed", e);
    }
  };

  // Simple routing matcher
  const renderRoute = () => {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-white dark:bg-[#050811] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent dark:border-indigo-400 rounded-full animate-spin" />
            <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">Authorizing Session...</span>
          </div>
        </div>
      );
    }

    // Parse sub-parameters
    // 1. Novel Detail: /novel/:slug
    if (currentPath.startsWith('/novel/')) {
      const novelSlug = currentPath.replace('/novel/', '');
      return (
        <NovelDetail 
          novelSlug={novelSlug} 
          onNavigate={navigate} 
          currentUser={currentUser} 
        />
      );
    }

    // 2. Chapter Reader: /chapter/:chapterSlug
    if (currentPath.startsWith('/chapter/')) {
      const chapterSlug = currentPath.replace('/chapter/', '');
      return (
        <ChapterReader 
          chapterSlug={chapterSlug} 
          onNavigate={navigate} 
          currentUser={currentUser} 
        />
      );
    }

    // 3. Search browser: /search
    if (currentPath.startsWith('/search')) {
      // Extract optional queries
      let initialQ = '';
      let initialGenre = '';
      if (currentPath.includes('?')) {
        const queryParams = new URLSearchParams(currentPath.split('?')[1]);
        initialQ = queryParams.get('q') || '';
        initialGenre = queryParams.get('genre') || '';
      }
      return (
        <Search 
          onNavigate={navigate} 
          initialQuery={initialQ} 
          initialGenre={initialGenre} 
        />
      );
    }

    // 4. Admin portal: /admin
    if (currentPath.startsWith('/admin')) {
      const isUserAdmin = currentUser ? isAdmin(currentUser.email) : false;
      if (!isUserAdmin) {
        return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#050811] text-center transition-colors">
            <ShieldAlert className="h-16 w-16 text-rose-500 mb-4 animate-bounce" />
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Akses Ditolak (Access Denied)</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm leading-relaxed">
              Kamu tidak memiliki izin untuk membuka Dashboard Admin. Hanya email yang terdaftar sebagai administrator yang dapat mengakses menu ini.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAdminLogin}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wide rounded-lg shadow cursor-pointer flex items-center justify-center gap-2"
                id="access-denied-login-btn"
              >
                <LogIn className="h-4 w-4" />
                <span>Login dengan Google Admin</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Kembali ke Home
              </button>
            </div>
          </div>
        );
      }
      return (
        <AdminDashboard 
          onNavigate={navigate} 
          currentUser={currentUser} 
        />
      );
    }

    // 5. Fallback Default: Home Page
    return <Home onNavigate={navigate} />;
  };

  // ChapterReader does not render default navigation layout to keep immersion maximum
  const isReaderPage = currentPath.startsWith('/chapter/');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#050811] transition-colors duration-200 selection:bg-indigo-600/20">
      {/* 1. Header Navbar */}
      {!isReaderPage && (
        <Navbar 
          currentUser={currentUser} 
          currentPath={currentPath} 
          onNavigate={navigate} 
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      )}

      {/* 2. Main Page Render */}
      <main className="flex-grow">
        {renderRoute()}
      </main>

      {/* 3. Footer */}
      {!isReaderPage && (
        <Footer onNavigate={navigate} />
      )}
    </div>
  );
}
