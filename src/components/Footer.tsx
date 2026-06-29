/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-gray-50 dark:bg-[#151518] border-t border-gray-100 dark:border-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2 text-xl font-bold font-sans tracking-tight text-gray-900 dark:text-gray-100 cursor-pointer"
            >
              <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span>Epic<span className="text-indigo-600 dark:text-indigo-400">Novel</span></span>
            </button>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Discover, read, and track your favorite web novels, light novels, and fanfiction in an immersive, customizable reading workspace designed for story lovers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Navigation</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/search')}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                >
                  Browse Search
                </button>
              </li>
            </ul>
          </div>

          {/* Legal / Info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Guidelines</h3>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              This website is an independent community project. All rights to published stories belong to their respective authors. If you are a copyright owner and want your novel removed, contact us.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} EpicNovel. Built with React, Tailwind, and Firebase.
          </p>
          <div className="flex space-x-6 text-xs text-gray-400 dark:text-gray-500">
            <span>Clean UI Mode</span>
            <span>&bull;</span>
            <span>Ultra Fast loading</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
