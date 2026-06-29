/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch, query, where, orderBy, getDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Novel, Chapter, Genre, Tag, Category, SiteSettings } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import { 
  LayoutDashboard, BookOpen, Layers, FolderHeart, Tags, Settings, Image as ImageIcon, 
  Plus, Edit, Trash2, Save, FileText, Check, AlertCircle, Calendar, Sparkles, LogOut,
  ChevronRight, ArrowLeftRight, Clock, HelpCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
  currentUser: any;
}

type MenuSection = 'dashboard' | 'novels_list' | 'novel_add' | 'chapters_list' | 'chapter_add' | 'categories' | 'tags' | 'genres' | 'settings' | 'media';

export default function AdminDashboard({ onNavigate, currentUser }: AdminDashboardProps) {
  // Navigation states
  const [activeSection, setActiveSection] = useState<MenuSection>('dashboard');

  // Database lists
  const [novels, setNovels] = useState<Novel[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'EpicNovel',
    siteDescription: 'A premium web novel platform.',
    contactEmail: 'admin@example.com',
    bannerNotice: 'Welcome to EpicNovel!'
  });

  // Loading, success, error states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Active items being edited
  const [editingNovelId, setEditingNovelId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // 1. ADD / EDIT NOVEL FORM STATE
  const [novelTitle, setNovelTitle] = useState('');
  const [novelAltTitle, setNovelAltTitle] = useState('');
  const [novelAuthor, setNovelAuthor] = useState('');
  const [novelArtist, setNovelArtist] = useState('');
  const [novelIllustrator, setNovelIllustrator] = useState('');
  const [novelStatus, setNovelStatus] = useState<Novel['status']>('ongoing');
  const [novelPublisher, setNovelPublisher] = useState('');
  const [novelDescription, setNovelDescription] = useState('');
  const [novelGenres, setNovelGenres] = useState<string[]>([]);
  const [novelCategories, setNovelCategories] = useState<string[]>([]);
  const [novelTags, setNovelTags] = useState<string[]>([]);
  const [novelLanguage, setNovelLanguage] = useState('English');
  const [novelOrigLang, setNovelOrigLang] = useState('');
  const [novelReleaseYear, setNovelReleaseYear] = useState<number>(new Date().getFullYear());
  const [novelCoverUrl, setNovelCoverUrl] = useState('');
  const [novelBannerUrl, setNovelBannerUrl] = useState('');
  const [novelSeoTitle, setNovelSeoTitle] = useState('');
  const [novelSeoDescription, setNovelSeoDescription] = useState('');
  const [novelVisibility, setNovelVisibility] = useState<Novel['visibility']>('publish');

  // 2. ADD / EDIT CHAPTER FORM STATE
  const [chapterNovelId, setChapterNovelId] = useState('');
  const [chapterVolume, setChapterVolume] = useState('');
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterStatus, setChapterStatus] = useState<Chapter['status']>('publish');
  const [chapterScheduledPublish, setChapterScheduledPublish] = useState(''); // datetime-local string
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'dirty' | null>(null);

  // 3. TAXONOMY INPUT STATES
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreDesc, setNewGenreDesc] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // 4. MEDIA UPLOAD STATE
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  // Fetch all databases
  const refreshAllData = async () => {
    setLoading(true);
    try {
      const novelsSnap = await getDocs(collection(db, 'novels'));
      setNovels(novelsSnap.docs.map(d => d.data() as Novel));

      const chaptersSnap = await getDocs(query(collection(db, 'chapters'), orderBy('chapterNumber', 'asc')));
      setChapters(chaptersSnap.docs.map(d => d.data() as Chapter));

      const genresSnap = await getDocs(collection(db, 'genres'));
      setGenres(genresSnap.docs.map(d => d.data() as Genre));

      const tagsSnap = await getDocs(collection(db, 'tags'));
      setTags(tagsSnap.docs.map(d => d.data() as Tag));

      const catsSnap = await getDocs(collection(db, 'categories'));
      setCategories(catsSnap.docs.map(d => d.data() as Category));

      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      if (settingsDoc.exists()) {
        setSiteSettings(settingsDoc.data() as SiteSettings);
      }
    } catch (e) {
      console.error("Dashboard failed to retrieve data:", e);
      setErrorMessage("Could not download backend records. Check Firestore rules or connectivity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Automatic slug generators
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Pre-fill fields for SEO on novel title change
  const handleNovelTitleChange = (title: string) => {
    setNovelTitle(title);
    if (!editingNovelId) {
      setNovelSeoTitle(title + " | Read Free WebNovel");
      setNovelSeoDescription("Read " + title + " and thousands of other highly popular web novels on our free reading companion.");
    }
  };

  // Reset Form states
  const clearNovelForm = () => {
    setEditingNovelId(null);
    setNovelTitle('');
    setNovelAltTitle('');
    setNovelAuthor('');
    setNovelArtist('');
    setNovelIllustrator('');
    setNovelStatus('ongoing');
    setNovelPublisher('');
    setNovelDescription('');
    setNovelGenres([]);
    setNovelCategories([]);
    setNovelTags([]);
    setNovelLanguage('English');
    setNovelOrigLang('');
    setNovelReleaseYear(new Date().getFullYear());
    setNovelCoverUrl('');
    setNovelBannerUrl('');
    setNovelSeoTitle('');
    setNovelSeoDescription('');
    setNovelVisibility('publish');
  };

  const clearChapterForm = () => {
    setEditingChapterId(null);
    setChapterNovelId(novels[0]?.slug || '');
    setChapterVolume('');
    setChapterNumber(chapters.filter(c => c.novelId === chapterNovelId).length + 1);
    setChapterTitle('');
    setChapterContent('');
    setChapterStatus('publish');
    setChapterScheduledPublish('');
    setAutoSaveStatus(null);
  };

  // AUTO-SAVE to Local Storage draft
  useEffect(() => {
    if (activeSection === 'chapter_add' && chapterContent.trim()) {
      setAutoSaveStatus('saving');
      const draftKey = editingChapterId ? `draft_chapter_${editingChapterId}` : 'draft_new_chapter';
      const draftObj = {
        novelId: chapterNovelId,
        volume: chapterVolume,
        chapterNumber,
        title: chapterTitle,
        content: chapterContent,
        status: chapterStatus,
        scheduled: chapterScheduledPublish
      };
      localStorage.setItem(draftKey, JSON.stringify(draftObj));
      const t = setTimeout(() => {
        setAutoSaveStatus('saved');
      }, 800);
      return () => clearTimeout(t);
    }
  }, [chapterContent, chapterTitle, chapterNovelId, chapterVolume, chapterNumber, chapterStatus, chapterScheduledPublish]);

  // Handle Loading cached drafts
  const loadChapterDraft = () => {
    const draftKey = editingChapterId ? `draft_chapter_${editingChapterId}` : 'draft_new_chapter';
    const cached = localStorage.getItem(draftKey);
    if (cached) {
      const data = JSON.parse(cached);
      setChapterNovelId(data.novelId || '');
      setChapterVolume(data.volume || '');
      setChapterNumber(data.chapterNumber || 1);
      setChapterTitle(data.title || '');
      setChapterContent(data.content || '');
      setChapterStatus(data.status || 'publish');
      setChapterScheduledPublish(data.scheduled || '');
      alert("Autosaved local draft loaded successfully!");
    } else {
      alert("No local draft found in this browser cache.");
    }
  };

  // Triggering Edit Modes
  const handleStartEditNovel = (novel: Novel) => {
    setEditingNovelId(novel.slug);
    setNovelTitle(novel.title);
    setNovelAltTitle(novel.alternativeTitle || '');
    setNovelAuthor(novel.author);
    setNovelArtist(novel.artist || '');
    setNovelIllustrator(novel.illustrator || '');
    setNovelStatus(novel.status);
    setNovelPublisher(novel.publisher || '');
    setNovelDescription(novel.description);
    setNovelGenres(novel.genreIds || []);
    setNovelCategories(novel.categoryIds || []);
    setNovelTags(novel.tagIds || []);
    setNovelLanguage(novel.language || 'English');
    setNovelOrigLang(novel.originalLanguage || '');
    setNovelReleaseYear(novel.releaseYear || new Date().getFullYear());
    setNovelCoverUrl(novel.coverUrl || '');
    setNovelBannerUrl(novel.bannerUrl || '');
    setNovelSeoTitle(novel.seoTitle || '');
    setNovelSeoDescription(novel.seoDescription || '');
    setNovelVisibility(novel.visibility);
    setActiveSection('novel_add');
  };

  const handleStartEditChapter = (ch: Chapter) => {
    setEditingChapterId(ch.id);
    setChapterNovelId(ch.novelId);
    setChapterVolume(ch.volume || '');
    setChapterNumber(ch.chapterNumber);
    setChapterTitle(ch.title);
    setChapterContent(ch.content);
    setChapterStatus(ch.status);
    
    if (ch.scheduledPublish?.seconds) {
      const date = new Date(ch.scheduledPublish.seconds * 1000);
      // convert to local ISO string formatted for input value
      const pad = (n: number) => n.toString().padStart(2, '0');
      const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      setChapterScheduledPublish(iso);
    } else {
      setChapterScheduledPublish('');
    }

    setActiveSection('chapter_add');
  };

  // SUBMIT SAVE FUNCTIONS

  // Save/Update Novel
  const handleSaveNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novelTitle.trim() || !novelAuthor.trim() || !novelDescription.trim()) {
      setErrorMessage("Please fill all required inputs (Title, Author, Description).");
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    const targetSlug = editingNovelId || generateSlug(novelTitle);

    const novelData: Novel = {
      id: targetSlug,
      slug: targetSlug,
      title: novelTitle.trim(),
      alternativeTitle: novelAltTitle.trim() || undefined,
      author: novelAuthor.trim(),
      artist: novelArtist.trim() || undefined,
      illustrator: novelIllustrator.trim() || undefined,
      status: novelStatus,
      publisher: novelPublisher.trim() || undefined,
      description: novelDescription.trim(),
      genreIds: novelGenres,
      categoryIds: novelCategories,
      tagIds: novelTags,
      language: novelLanguage,
      originalLanguage: novelOrigLang.trim() || undefined,
      releaseYear: Number(novelReleaseYear),
      rating: editingNovelId ? novels.find(n => n.slug === editingNovelId)?.rating || 5 : 5,
      ratingCount: editingNovelId ? novels.find(n => n.slug === editingNovelId)?.ratingCount || 0 : 0,
      ratingSum: editingNovelId ? novels.find(n => n.slug === editingNovelId)?.ratingSum || 0 : 0,
      coverUrl: novelCoverUrl.trim() || undefined,
      bannerUrl: novelBannerUrl.trim() || undefined,
      seoTitle: novelSeoTitle.trim() || undefined,
      seoDescription: novelSeoDescription.trim() || undefined,
      visibility: novelVisibility,
      chapterCount: editingNovelId ? novels.find(n => n.slug === editingNovelId)?.chapterCount || 0 : 0,
      createdAt: editingNovelId ? novels.find(n => n.slug === editingNovelId)?.createdAt || new Date() : new Date(),
      updatedAt: new Date()
    };

    try {
      await setDoc(doc(db, 'novels', targetSlug), novelData);
      setSuccessMessage(`Novel "${novelTitle}" saved successfully!`);
      clearNovelForm();
      await refreshAllData();
      setActiveSection('novels_list');
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Save failed. Confirm Firestore writes are allowed for administrators.");
    } finally {
      setSubmitting(false);
    }
  };

  // Save/Update Chapter
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterNovelId || !chapterTitle.trim() || !chapterContent.trim()) {
      setErrorMessage("Please select a Novel and enter Chapter Title and Chapter Content.");
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    const activeNovel = novels.find(n => n.slug === chapterNovelId);
    const activeNovelTitle = activeNovel ? activeNovel.title : chapterNovelId;

    const targetId = editingChapterId || `${chapterNovelId}-${chapterNumber}`;

    const parsedSchedule = chapterScheduledPublish 
      ? new Date(chapterScheduledPublish)
      : null;

    const chapterData: Chapter = {
      id: targetId,
      novelId: chapterNovelId,
      novelTitle: activeNovelTitle,
      volume: chapterVolume.trim() || undefined,
      chapterNumber: Number(chapterNumber),
      title: chapterTitle.trim(),
      content: chapterContent.trim(),
      status: chapterStatus,
      scheduledPublish: parsedSchedule,
      createdAt: editingChapterId ? chapters.find(c => c.id === editingChapterId)?.createdAt || new Date() : new Date(),
      updatedAt: new Date()
    };

    try {
      await setDoc(doc(db, 'chapters', targetId), chapterData);

      // Clean up autosave cached draft
      const draftKey = editingChapterId ? `draft_chapter_${editingChapterId}` : 'draft_new_chapter';
      localStorage.removeItem(draftKey);

      // Update chapterCount on the parent novel
      const novelRef = doc(db, 'novels', chapterNovelId);
      const relativeChapters = chapters.filter(c => c.novelId === chapterNovelId && c.status === 'publish');
      
      let updatedChsCount = relativeChapters.length;
      if (!editingChapterId && chapterStatus === 'publish') {
        updatedChsCount += 1;
      }
      
      await updateDoc(novelRef, {
        chapterCount: updatedChsCount,
        updatedAt: new Date()
      });

      setSuccessMessage(`Chapter ${chapterNumber} published successfully under "${activeNovelTitle}"!`);
      clearChapterForm();
      await refreshAllData();
      setActiveSection('chapters_list');
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Publishing chapter failed. Ensure database allows operations.");
    } finally {
      setSubmitting(false);
    }
  };

  // Image Upload handler (Covers & Banners)
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'banner' | 'media') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    try {
      const storagePath = target === 'media' ? `media/${Date.now()}_${file.name}` : `covers/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      if (target === 'cover') {
        setNovelCoverUrl(downloadUrl);
        setSuccessMessage("Cover image uploaded successfully to storage!");
      } else if (target === 'banner') {
        setNovelBannerUrl(downloadUrl);
        setSuccessMessage("Banner image uploaded successfully!");
      } else {
        setMediaUrls([downloadUrl, ...mediaUrls]);
        setSuccessMessage("General media asset uploaded successfully!");
      }
    } catch (error) {
      console.error("Storage write failed:", error);
      setErrorMessage("Firebase Storage upload failed. Fallback to copying paste URL.");
      const manualUrl = prompt("Enter manual pasted Image URL instead:");
      if (manualUrl) {
        if (target === 'cover') setNovelCoverUrl(manualUrl);
        if (target === 'banner') setNovelBannerUrl(manualUrl);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // DELETION HANDLERS

  const handleDeleteNovel = async (slug: string) => {
    if (!confirm("Are you absolutely sure you want to delete this novel? This will permanently remove its metadata. Chapters will remain but won't be linked!")) return;
    try {
      await deleteDoc(doc(db, 'novels', slug));
      setSuccessMessage("Novel deleted successfully.");
      await refreshAllData();
    } catch (e) {
      setErrorMessage("Could not delete document.");
    }
  };

  const handleDeleteChapter = async (ch: Chapter) => {
    if (!confirm("Delete this chapter permanently?")) return;
    try {
      await deleteDoc(doc(db, 'chapters', ch.id));
      
      // Update count
      const novelRef = doc(db, 'novels', ch.novelId);
      const count = Math.max(0, chapters.filter(c => c.novelId === ch.novelId && c.status === 'publish').length - 1);
      await updateDoc(novelRef, {
        chapterCount: count,
        updatedAt: new Date()
      });

      setSuccessMessage("Chapter deleted.");
      await refreshAllData();
    } catch (e) {
      setErrorMessage("Could not delete chapter.");
    }
  };

  // TAXONOMY MANAGEMENT HANDLERS (Create Tags, Categories, Genres)

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    const gid = generateSlug(newGenreName);
    try {
      await setDoc(doc(db, 'genres', gid), {
        id: gid,
        name: newGenreName.trim(),
        description: newGenreDesc.trim() || undefined
      });
      setSuccessMessage(`Genre "${newGenreName}" added!`);
      setNewGenreName('');
      setNewGenreDesc('');
      await refreshAllData();
    } catch (e) {
      setErrorMessage("Failed to add genre.");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const cid = generateSlug(newCategoryName);
    try {
      await setDoc(doc(db, 'categories', cid), {
        id: cid,
        name: newCategoryName.trim()
      });
      setSuccessMessage(`Category "${newCategoryName}" added!`);
      setNewCategoryName('');
      await refreshAllData();
    } catch (e) {
      setErrorMessage("Failed to add category.");
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const tid = generateSlug(newTagName);
    try {
      await setDoc(doc(db, 'tags', tid), {
        id: tid,
        name: newTagName.trim()
      });
      setSuccessMessage(`Tag "${newTagName}" added!`);
      setNewTagName('');
      await refreshAllData();
    } catch (e) {
      setErrorMessage("Failed to add tag.");
    }
  };

  const handleDeleteTaxonomy = async (collectionName: 'genres' | 'tags' | 'categories', id: string) => {
    if (!confirm(`Delete this taxonomy item?`)) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      setSuccessMessage("Taxonomy deleted successfully.");
      await refreshAllData();
    } catch (e) {
      setErrorMessage("Failed to delete item.");
    }
  };

  // Global Settings save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'general'), siteSettings);
      setSuccessMessage("Global website configurations updated!");
      await refreshAllData();
    } catch (e) {
      setErrorMessage("Could not update site settings.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050811]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">Unlocking administrative console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-[#050811] min-h-screen flex flex-col md:flex-row transition-colors duration-200" id="admin-dashboard-container">
      
      {/* Sidebar Control Column (Mobile-Friendly top or Left-Drawer) */}
      <div className="w-full md:w-64 bg-white dark:bg-[#090d16] border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-800 flex flex-col shrink-0 select-none">
        
        {/* Administrator profile label */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
              A
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">Administrator</h2>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase">Console Panel</span>
            </div>
          </div>
        </div>

        {/* Menu selections */}
        <div className="p-4 flex-grow space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard Stats', icon: LayoutDashboard },
            { id: 'novels_list', label: 'Daftar Novel', icon: BookOpen },
            { id: 'novel_add', label: 'Tambah Novel', icon: Plus, callback: clearNovelForm },
            { id: 'chapters_list', label: 'Daftar Chapter', icon: Layers },
            { id: 'chapter_add', label: 'Tambah Chapter', icon: Plus, callback: clearChapterForm },
            { id: 'categories', label: 'Kategori', icon: FolderHeart },
            { id: 'tags', label: 'Tag / Trope', icon: Tags },
            { id: 'genres', label: 'Genre', icon: Sparkles },
            { id: 'settings', label: 'Pengaturan Web', icon: Settings },
            { id: 'media', label: 'Media Library', icon: ImageIcon }
          ].map(menu => {
            const IconComp = menu.icon;
            const active = activeSection === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => {
                  if (menu.callback) menu.callback();
                  setActiveSection(menu.id as MenuSection);
                  setSuccessMessage('');
                  setErrorMessage('');
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#121b2d] hover:text-gray-950 dark:hover:text-white'
                }`}
                id={`admin-menu-${menu.id}`}
              >
                <IconComp className="h-4 w-4" />
                <span>{menu.label}</span>
              </button>
            );
          })}
        </div>

        {/* Back to Client Mode */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={() => onNavigate('/')}
            className="w-full text-center py-2 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-[#121b2d] text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Exit Admin Mode
          </button>
        </div>
      </div>

      {/* Main Workspace Frame (Scrollable layout) */}
      <div className="flex-grow p-6 sm:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        
        {/* Status notification alerts */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* RENDER ACTIVE SECTIONS */}

        {/* SECTION 1: DASHBOARD STATISTICS */}
        {activeSection === 'dashboard' && (
          <div className="space-y-8" id="admin-sec-dashboard">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Overview of your platform's active catalog databases.
              </p>
            </div>

            {/* Grid of stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Novels', count: novels.length, desc: 'Published & drafts', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
                { label: 'Chapters', count: chapters.length, desc: 'Index updates', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
                { label: 'Genres', count: genres.length, desc: 'Categorized scopes', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
                { label: 'Tags', count: tags.length, desc: 'Tropes mapped', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' }
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">{stat.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{stat.count}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-1">{stat.desc}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions & Recent Novel listings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Draft novels alerting */}
              <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-50 dark:border-slate-800 pb-2">
                  Draft Novels ({novels.filter(n => n.visibility === 'draft').length})
                </h3>
                {novels.filter(n => n.visibility === 'draft').length === 0 ? (
                  <p className="text-xs text-gray-400 py-3">No pending drafts. All novels are live!</p>
                ) : (
                  <div className="space-y-3">
                    {novels.filter(n => n.visibility === 'draft').map(n => (
                      <div key={n.slug} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800 dark:text-gray-300">{n.title}</span>
                        <button
                          onClick={() => handleStartEditNovel(n)}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 font-semibold rounded"
                        >
                          Edit & Publish
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Draft chapters alerting */}
              <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-50 dark:border-slate-800 pb-2">
                  Draft Chapters ({chapters.filter(c => c.status === 'draft').length})
                </h3>
                {chapters.filter(c => c.status === 'draft').length === 0 ? (
                  <p className="text-xs text-gray-400 py-3">All chapters are live.</p>
                ) : (
                  <div className="space-y-3">
                    {chapters.filter(c => c.status === 'draft').map(c => (
                      <div key={c.id} className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-gray-800 dark:text-gray-300">{c.title}</span>
                          <span className="text-[10px] text-gray-400 block">Novel: {c.novelTitle}</span>
                        </div>
                        <button
                          onClick={() => handleStartEditChapter(c)}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 font-semibold rounded"
                        >
                          Publish
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: NOVELS CATALOG LIST */}
        {activeSection === 'novels_list' && (
          <div className="space-y-6" id="admin-sec-novels-list">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Daftar Novel</h1>
                <p className="text-xs text-gray-500 mt-1">Manage and edit your active stories catalogues.</p>
              </div>
              <button
                onClick={() => { clearNovelForm(); setActiveSection('novel_add'); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Novel</span>
              </button>
            </div>

            <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#121b2d] text-gray-500 font-bold border-b border-gray-150 dark:border-slate-800 uppercase tracking-wider">
                      <th className="p-4">Novel Cover & Title</th>
                      <th className="p-4">Author</th>
                      <th className="p-4">Chapters</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Visibility</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {novels.map(novel => (
                      <tr key={novel.slug} className="hover:bg-gray-50/50 dark:hover:bg-[#121b2d]/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={novel.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=80&q=80'} className="h-10 w-8 object-cover rounded shadow" alt="" referrerPolicy="no-referrer" />
                            <div className="font-bold text-gray-800 dark:text-gray-200">
                              <span>{novel.title}</span>
                              <span className="block text-[10px] text-gray-400 font-normal mt-0.5">Slug: {novel.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-gray-600 dark:text-gray-300">{novel.author}</td>
                        <td className="p-4 font-bold text-indigo-600">{novel.chapterCount || 0} Chs</td>
                        <td className="p-4 capitalize"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600">{novel.status}</span></td>
                        <td className="p-4 uppercase"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${novel.visibility === 'publish' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{novel.visibility}</span></td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => handleStartEditNovel(novel)} className="p-1.5 hover:bg-indigo-50 dark:hover:bg-[#121b2d] text-indigo-600 rounded cursor-pointer" title="Edit Metadata"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteNovel(novel.slug)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-[#121b2d] text-rose-600 rounded cursor-pointer" title="Delete Novel"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: ADD / EDIT NOVEL FORM */}
        {activeSection === 'novel_add' && (
          <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6" id="admin-sec-novel-add">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingNovelId ? `Edit Novel: ${novelTitle}` : 'Tambah Novel Baru'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Configure full metadata information, details, covers, and banners.</p>
            </div>

            <form onSubmit={handleSaveNovel} className="space-y-6 text-xs font-semibold">
              
              {/* Cover & Banner uploads combined */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-[#121b2d]/50 rounded-xl border border-gray-150 dark:border-slate-800">
                {/* Cover File Upload */}
                <div>
                  <label className="block text-gray-500 mb-1.5">Cover Image (Upload file or paste URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Image URL e.g. https://imgur.com/xyz.jpg"
                      value={novelCoverUrl}
                      onChange={(e) => setNovelCoverUrl(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                    />
                    <label className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-center cursor-pointer font-bold hover:bg-indigo-500 whitespace-nowrap">
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'cover')} className="hidden" />
                    </label>
                  </div>
                  {novelCoverUrl && (
                    <img src={novelCoverUrl} alt="Cover Preview" className="h-20 w-16 object-cover rounded shadow mt-3 border border-gray-100" referrerPolicy="no-referrer" />
                  )}
                </div>

                {/* Banner File Upload */}
                <div>
                  <label className="block text-gray-500 mb-1.5">Banner Background (Upload or paste URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Banner URL e.g. https://imgur.com/abc.jpg"
                      value={novelBannerUrl}
                      onChange={(e) => setNovelBannerUrl(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                    />
                    <label className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-center cursor-pointer font-bold hover:bg-indigo-500 whitespace-nowrap">
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'banner')} className="hidden" />
                    </label>
                  </div>
                  {novelBannerUrl && (
                    <img src={novelBannerUrl} alt="Banner Preview" className="h-12 w-32 object-cover rounded shadow mt-3 border border-gray-100" referrerPolicy="no-referrer" />
                  )}
                </div>
              </div>

              {/* Core Text fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-500 mb-1.5">Judul Novel *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Classroom of the Elite"
                    value={novelTitle}
                    onChange={(e) => handleNovelTitleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5">Judul Alternatif (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Youkoso Jitsuryoku Shijou Shugi"
                    value={novelAltTitle}
                    onChange={(e) => setNovelAltTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-500 mb-1.5">Author *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shougo Kinugasa"
                    value={novelAuthor}
                    onChange={(e) => setNovelAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5">Artist (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shunsaku Tomose"
                    value={novelArtist}
                    onChange={(e) => setNovelArtist(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5">Illustrator (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shunsaku Tomose"
                    value={novelIllustrator}
                    onChange={(e) => setNovelIllustrator(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>
              </div>

              {/* Status, Publisher, Language, Release year */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <label className="block text-gray-500 mb-1.5">Status</label>
                  <select
                    value={novelStatus}
                    onChange={(e) => setNovelStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="hiatus">Hiatus</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5">Publisher</label>
                  <input
                    type="text"
                    placeholder="e.g. Kadokawa"
                    value={novelPublisher}
                    onChange={(e) => setNovelPublisher(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5">Language</label>
                  <input
                    type="text"
                    placeholder="e.g. Japanese"
                    value={novelLanguage}
                    onChange={(e) => setNovelLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5">Orig. Language</label>
                  <input
                    type="text"
                    placeholder="e.g. Japanese"
                    value={novelOrigLang}
                    onChange={(e) => setNovelOrigLang(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5">Release Year</label>
                  <input
                    type="number"
                    value={novelReleaseYear}
                    onChange={(e) => setNovelReleaseYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>
              </div>

              {/* Genres, Categories, Tags checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border border-gray-200 dark:border-slate-800 rounded-xl">
                {/* Categories */}
                <div>
                  <span className="block text-gray-500 font-extrabold mb-2 uppercase tracking-wide">Categories</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto p-1 bg-gray-50/50 dark:bg-transparent rounded">
                    {categories.map(c => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={novelCategories.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) setNovelCategories([...novelCategories, c.id]);
                            else setNovelCategories(novelCategories.filter(id => id !== c.id));
                          }}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Genres */}
                <div>
                  <span className="block text-gray-500 font-extrabold mb-2 uppercase tracking-wide">Genres</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto p-1 bg-gray-50/50 dark:bg-transparent rounded">
                    {genres.map(g => (
                      <label key={g.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={novelGenres.includes(g.id)}
                          onChange={(e) => {
                            if (e.target.checked) setNovelGenres([...novelGenres, g.id]);
                            else setNovelGenres(novelGenres.filter(id => id !== g.id));
                          }}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>{g.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <span className="block text-gray-500 font-extrabold mb-2 uppercase tracking-wide">Tags</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto p-1 bg-gray-50/50 dark:bg-transparent rounded">
                    {tags.map(t => (
                      <label key={t.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={novelTags.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) setNovelTags([...novelTags, t.id]);
                            else setNovelTags(novelTags.filter(id => id !== t.id));
                          }}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description textarea */}
              <div>
                <label className="block text-gray-500 mb-1.5">Description / Sinopsis *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste story description here..."
                  value={novelDescription}
                  onChange={(e) => setNovelDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200 leading-relaxed text-sm"
                />
              </div>

              {/* SEO details */}
              <div className="p-4 bg-gray-50 dark:bg-[#121b2d]/50 border border-gray-200 dark:border-slate-800 rounded-xl space-y-4">
                <span className="block font-extrabold text-xs uppercase tracking-wider text-gray-500">SEO Meta Configuration (Optional)</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">SEO Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Read Classroom of the Elite light novel"
                      value={novelSeoTitle}
                      onChange={(e) => setNovelSeoTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">SEO Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Read classroom of the elite light novel volume 1 to latest translations online."
                      value={novelSeoDescription}
                      onChange={(e) => setNovelSeoDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                    />
                  </div>
                </div>
              </div>

              {/* Visibility and Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-6 gap-4">
                <div>
                  <span className="text-gray-500 block mb-1.5">Visibility Status</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={novelVisibility === 'publish'} onChange={() => setNovelVisibility('publish')} className="text-indigo-600 focus:ring-0" />
                      <span>Publish (Publicly visible)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={novelVisibility === 'draft'} onChange={() => setNovelVisibility('draft')} className="text-indigo-600 focus:ring-0" />
                      <span>Draft (Admin only)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => { clearNovelForm(); setActiveSection('novels_list'); }}
                    className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 shadow disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    <span>{submitting ? 'Saving...' : 'Save Novel'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* SECTION 4: CHAPTERS LIST TABLE */}
        {activeSection === 'chapters_list' && (
          <div className="space-y-6" id="admin-sec-chapters-list">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Daftar Chapter</h1>
                <p className="text-xs text-gray-500 mt-1">Manage, schedule, edit, or delete existing chapter logs.</p>
              </div>
              <button
                onClick={() => { clearChapterForm(); setActiveSection('chapter_add'); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Chapter</span>
              </button>
            </div>

            <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#121b2d] text-gray-500 font-bold border-b border-gray-150 dark:border-slate-800 uppercase tracking-wider">
                      <th className="p-4">Novel Name</th>
                      <th className="p-4">Chapter Number & Title</th>
                      <th className="p-4">Volume</th>
                      <th className="p-4">Schedule Status</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {chapters.map(ch => {
                      const isScheduled = ch.scheduledPublish?.seconds 
                        ? new Date(ch.scheduledPublish.seconds * 1000) > new Date()
                        : false;
                      return (
                        <tr key={ch.id} className="hover:bg-gray-50/50 dark:hover:bg-[#121b2d]/50 transition-colors">
                          <td className="p-4 font-bold text-gray-900 dark:text-gray-200">{ch.novelTitle}</td>
                          <td className="p-4 font-semibold text-gray-700 dark:text-gray-300">
                            Ch {ch.chapterNumber}: {ch.title}
                          </td>
                          <td className="p-4 text-gray-500">{ch.volume || '-'}</td>
                          <td className="p-4 font-medium">
                            {ch.scheduledPublish?.seconds ? (
                              <span className={`flex items-center gap-1 ${isScheduled ? 'text-blue-600 font-bold animate-pulse' : 'text-gray-400'}`}>
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(ch.scheduledPublish.seconds * 1000).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">Immediate</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ch.status === 'publish' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {ch.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleStartEditChapter(ch)} className="p-1.5 hover:bg-indigo-50 dark:hover:bg-[#121b2d] text-indigo-600 rounded cursor-pointer" title="Edit"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteChapter(ch)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-[#121b2d] text-rose-600 rounded cursor-pointer" title="Delete"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: ADD / EDIT CHAPTER FORM */}
        {activeSection === 'chapter_add' && (
          <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6" id="admin-sec-chapter-add">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingChapterId ? 'Edit Chapter Content' : 'Tambah Chapter Baru'}
                </h2>
                <p className="text-xs text-gray-400 mt-1">Draft or publish rich text novel chapters instantly.</p>
              </div>

              {/* Autosave badge & Load Draft button */}
              <div className="flex items-center gap-3">
                {autoSaveStatus && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${
                    autoSaveStatus === 'saved' ? 'bg-emerald-50 text-emerald-700' :
                    autoSaveStatus === 'saving' ? 'bg-amber-50 text-amber-700 animate-pulse' : ''
                  }`}>
                    <Check className="h-3 w-3" />
                    <span>{autoSaveStatus === 'saved' ? 'Autosaved' : 'Drafting...'}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={loadChapterDraft}
                  className="px-2.5 py-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 rounded text-[10px] font-bold text-gray-600 dark:text-gray-300 cursor-pointer"
                  title="Restore Draft autosaved locally in your browser cache"
                >
                  Load Local Draft
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-6 text-xs font-semibold">
              
              {/* Novel Selector & Vol & Ch number */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-gray-500 mb-1.5">Select Novel *</label>
                  <select
                    required
                    value={chapterNovelId}
                    onChange={(e) => {
                      setChapterNovelId(e.target.value);
                      // Auto-increment chapter number based on existing chapters
                      const count = chapters.filter(c => c.novelId === e.target.value).length;
                      setChapterNumber(count + 1);
                    }}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200 text-sm"
                  >
                    <option value="" disabled>-- Pilih Novel --</option>
                    {novels.map(n => (
                      <option key={n.slug} value={n.slug}>{n.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1.5">Volume (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Volume 1, Book 3"
                    value={chapterVolume}
                    onChange={(e) => setChapterVolume(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-1.5">Chapter Number *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-gray-500 mb-1.5">Judul Chapter *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1: The Structure of Class D"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-255 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200 text-sm"
                />
              </div>

              {/* RICH TEXT EDITOR */}
              <div>
                <label className="block text-gray-500 mb-1.5">Isi Chapter (WYSIWYG Modern Editor) *</label>
                <RichTextEditor
                  value={chapterContent}
                  onChange={setChapterContent}
                  placeholder="Paste your story chapter text from Google Docs, Word, or type directly here..."
                />
              </div>

              {/* Scheduled release & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-[#121b2d]/50 rounded-xl border border-gray-150 dark:border-slate-800">
                <div>
                  <label className="block text-gray-500 mb-1 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Scheduled Publish (optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={chapterScheduledPublish}
                    onChange={(e) => setChapterScheduledPublish(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200 text-xs"
                  />
                  <span className="text-[10px] text-gray-400 block mt-1">Leave empty to publish immediately upon saving.</span>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1.5">Chapter Visibility</label>
                  <div className="flex gap-4 py-2 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={chapterStatus === 'publish'} onChange={() => setChapterStatus('publish')} className="text-indigo-600 focus:ring-0" />
                      <span>Publish live</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={chapterStatus === 'draft'} onChange={() => setChapterStatus('draft')} className="text-indigo-600 focus:ring-0" />
                      <span>Save as Draft</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 pt-6">
                <button
                  type="button"
                  onClick={() => { clearChapterForm(); setActiveSection('chapters_list'); }}
                  className="px-5 py-2.5 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 shadow disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  <span>{submitting ? 'Saving...' : 'Publish Chapter'}</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* SECTION 6: CATEGORIES MANAGEMENT */}
        {activeSection === 'categories' && (
          <div className="space-y-6" id="admin-sec-categories">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kategori Management</h1>
              <p className="text-xs text-gray-500 mt-1">Create or remove primary categories (e.g. Japanese, Chinese, Korean, Originals).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form card */}
              <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Add Kategori</h3>
                <form onSubmit={handleAddCategory} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-gray-500 mb-1">Nama Kategori *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Japanese Translation"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 cursor-pointer text-xs">
                    Save Kategori
                  </button>
                </form>
              </div>

              {/* List grid */}
              <div className="md:col-span-2 bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-2">Daftar Kategori</h3>
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center py-2.5 text-xs">
                      <div>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{cat.name}</span>
                        <span className="text-[10px] text-gray-400 block">ID: {cat.id}</span>
                      </div>
                      <button onClick={() => handleDeleteTaxonomy('categories', cat.id)} className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: TAGS MANAGEMENT */}
        {activeSection === 'tags' && (
          <div className="space-y-6" id="admin-sec-tags">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tag / Trope Management</h1>
              <p className="text-xs text-gray-500 mt-1">Create or clean database book tag taxonomies (e.g. Reincarnation, Overpowered MC).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form card */}
              <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Add Tag</h3>
                <form onSubmit={handleAddTag} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-gray-500 mb-1">Nama Tag *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Overpowered MC"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 cursor-pointer text-xs">
                    Save Tag
                  </button>
                </form>
              </div>

              {/* List grid */}
              <div className="md:col-span-2 bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-2">Daftar Tags</h3>
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {tags.map(t => (
                    <div key={t.id} className="flex justify-between items-center py-2.5 text-xs">
                      <div>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{t.name}</span>
                        <span className="text-[10px] text-gray-400 block">ID: {t.id}</span>
                      </div>
                      <button onClick={() => handleDeleteTaxonomy('tags', t.id)} className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: GENRES MANAGEMENT */}
        {activeSection === 'genres' && (
          <div className="space-y-6" id="admin-sec-genres">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Genre Management</h1>
              <p className="text-xs text-gray-500 mt-1">Create, document, and filter custom genre options (e.g. Fantasy, Xianxia, Wuxia).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form card */}
              <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Add Genre</h3>
                <form onSubmit={handleAddGenre} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-gray-500 mb-1">Nama Genre *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cultivation"
                      value={newGenreName}
                      onChange={(e) => setNewGenreName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Description (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Immortality martial cultivation paths"
                      value={newGenreDesc}
                      onChange={(e) => setNewGenreDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 cursor-pointer text-xs">
                    Save Genre
                  </button>
                </form>
              </div>

              {/* List grid */}
              <div className="md:col-span-2 bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-2">Daftar Genre</h3>
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {genres.map(g => (
                    <div key={g.id} className="flex justify-between items-center py-2.5 text-xs">
                      <div>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{g.name}</span>
                        {g.description && <span className="text-[10px] text-gray-400 block leading-normal">{g.description}</span>}
                      </div>
                      <button onClick={() => handleDeleteTaxonomy('genres', g.id)} className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 9: GLOBAL WEBSITE CONFIGS */}
        {activeSection === 'settings' && (
          <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6" id="admin-sec-settings">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pengaturan Website</h1>
              <p className="text-xs text-gray-400 mt-1">Configure global title headers, notices, and contact parameters.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-500 mb-1.5">Site Header Name</label>
                  <input
                    type="text"
                    required
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5">Administrative Contact Email</label>
                  <input
                    type="email"
                    required
                    value={siteSettings.contactEmail}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1.5">Meta Site Description</label>
                <input
                  type="text"
                  required
                  value={siteSettings.siteDescription}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1.5">Homepage Banner Announcement Notice</label>
                <textarea
                  rows={3}
                  value={siteSettings.bannerNotice}
                  onChange={(e) => setSiteSettings({ ...siteSettings, bannerNotice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121b2d] rounded-lg focus:outline-none dark:text-gray-200 text-sm"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 shadow cursor-pointer flex items-center gap-1.5">
                  <Save className="h-4 w-4" />
                  <span>Update Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SECTION 10: MEDIA REPOSITORY LIBRARY */}
        {activeSection === 'media' && (
          <div className="bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6" id="admin-sec-media">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Media Library Repository</h1>
              <p className="text-xs text-gray-500 mt-1">Upload files to Firebase Storage and copy URLs instantly to use anywhere!</p>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-[#121b2d]/50 border border-dashed border-gray-300 dark:border-slate-800 rounded-2xl text-center select-none">
              <ImageIcon className="h-10 w-10 text-indigo-400 mx-auto mb-3 animate-pulse" />
              <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer inline-block hover:bg-indigo-500">
                Choose Asset File
                <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'media')} className="hidden" />
              </label>
              <p className="text-[10px] text-gray-400 mt-2">Support JPG, PNG, WEBP, GIF formats</p>
            </div>

            {mediaUrls.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider border-b pb-1">Uploaded Assets ({mediaUrls.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="group p-2.5 border border-gray-100 dark:border-slate-800 rounded-xl relative hover:border-indigo-200 text-[10px]">
                      <img src={url} alt="" className="h-24 w-full object-cover rounded shadow-sm bg-gray-100 mb-2" referrerPolicy="no-referrer" />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                          alert("URL copied to clipboard!");
                        }}
                        className="w-full text-center py-1 bg-indigo-50 dark:bg-[#121b2d] text-indigo-700 dark:text-indigo-400 font-extrabold rounded hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        Copy Link URL
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
