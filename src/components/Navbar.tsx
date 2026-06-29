/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Search, User, LogOut, LayoutDashboard, SlidersHorizontal, LogIn, Menu, X } from 'lucide-react';
import { auth, signOut } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { isAdmin } from '../config/admin';
import AuthModal from './AuthModal';

interface NavbarProps {
  currentUser: FirebaseUser | null;
  currentPath: string;
  onNavigate: (path: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({
  currentUser,
  currentPath,
  onNavigate,
  darkMode,
  onToggleDarkMode
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleLogin = () => {
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (currentPath.startsWith('/admin')) {
        onNavigate('/');
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const isUserAdmin = currentUser ? isAdmin(currentUser.email) : false;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-[#090d16]/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary links */}
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2 text-xl font-bold font-sans tracking-tight text-gray-900 dark:text-gray-100 cursor-pointer"
              id="nav-logo-btn"
            >
              <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span>Mirai<span className="text-indigo-600 dark:text-indigo-400">Pages</span></span>
            </button>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <button
                onClick={() => onNavigate('/')}
                className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                  currentPath === '/' 
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
                id="nav-home-btn"
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('/search')}
                className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                  currentPath.startsWith('/search') 
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
                id="nav-browse-btn"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Search bar & profile */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search novels, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-60 lg:w-80 pl-10 pr-4 py-1.5 rounded-full text-sm bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200"
                id="nav-search-input"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            </form>

            {/* Dark Mode toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#121b2d] cursor-pointer"
              title="Toggle Dark Mode"
              id="nav-dark-mode-btn"
            >
              {darkMode ? (
                <span className="text-xl">☀️</span>
              ) : (
                <span className="text-xl">🌙</span>
              )}
            </button>

            {/* Admin Dashboard link */}
            {isUserAdmin && (
              <button
                onClick={() => onNavigate('/admin')}
                className={`p-2 rounded-full cursor-pointer transition-all ${
                  currentPath.startsWith('/admin')
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#121b2d]'
                }`}
                title="Admin Dashboard"
                id="nav-admin-dashboard-btn"
              >
                <LayoutDashboard className="h-5 w-5" />
              </button>
            )}

            {/* Profile trigger */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces&q=80'}
                  alt={currentUser.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-[#121b2d] rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                  id="nav-logout-btn"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-medium cursor-pointer transition-all shadow-sm shadow-indigo-600/10"
                id="nav-login-btn"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#121b2d]"
              id="nav-dark-mode-mobile-btn"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#121b2d]"
              id="nav-mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-[#090d16] px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative my-2">
            <input
              type="text"
              placeholder="Search novels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-gray-50 dark:bg-[#121b2d] border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-200"
              id="nav-search-mobile-input"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          </form>

          <button
            onClick={() => { onNavigate('/'); setMobileMenuOpen(false); }}
            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
              currentPath === '/' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
            }`}
            id="nav-home-mobile"
          >
            Home
          </button>
          <button
            onClick={() => { onNavigate('/search'); setMobileMenuOpen(false); }}
            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
              currentPath.startsWith('/search') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
            }`}
            id="nav-browse-mobile"
          >
            Browse
          </button>

          {isUserAdmin && (
            <button
              onClick={() => { onNavigate('/admin'); setMobileMenuOpen(false); }}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                currentPath.startsWith('/admin') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
              }`}
              id="nav-admin-mobile"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Admin Dashboard</span>
            </button>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3">
                  <img
                    src={currentUser.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces&q=80'}
                    alt={currentUser.displayName || 'User'}
                    className="h-9 w-9 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{currentUser.displayName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                  id="nav-logout-mobile"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { handleLogin(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium"
                id="nav-login-mobile"
              >
                <LogIn className="h-4 w-4" />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </div>
        </div>
      )}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </nav>
  );
}
