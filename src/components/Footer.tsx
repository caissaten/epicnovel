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
              <span>Mirai<span className="text-indigo-600 dark:text-indigo-400">Pages</span></span>
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

          {/* Facebook Follow Widget */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Follow Us</h3>
            <div className="rounded-lg overflow-hidden bg-white dark:bg-zinc-900 inline-block p-1 border border-gray-200 dark:border-gray-700">
              <iframe
                src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Ftakonovel&tabs&width=220&height=70&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false&appId"
                width="220"
                height="70"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen={true}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>
          </div>
        </div>

        {/* Bagian Bawah Footer */}
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-2 sm:gap-1">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              &copy; {new Date().getFullYear()} MiraiPages. Built with React, Tailwind, and Firebase.
            </p>
            <div className="flex space-x-6 text-xs text-gray-400 dark:text-gray-500">
              <span>Clean UI Mode</span>
              <span>&bull;</span>
              <span>Ultra Fast loading</span>
            </div>
          </div>

         {/* WIDGET VISITOR COUNTER BARU */}
<div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
  <span className="text-[10px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
    Visitors:
  </span>
  <img 
    src="https://api.visitorbadge.io/api/visitors?path=miraipages.site&label=hits&labelColor=%23374151&countColor=%234f46e5&style=flat" 
    alt="Visitor Count"
    className="h-5"
  />
          </div>
        </div>
      </div>
    </footer>
  );
}
