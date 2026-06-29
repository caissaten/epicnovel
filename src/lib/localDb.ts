/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Novel, Chapter, Genre, Category, Tag } from '../types';

// Raw Seed Data for Local Database fallback
const INITIAL_GENRES: Genre[] = [
  { id: 'fantasy', name: 'Fantasy', description: 'Magic, mythical beasts, and expansive secondary worlds.' },
  { id: 'romance', name: 'Romance', description: 'Heartfelt relationships, emotional tension, and true love.' },
  { id: 'action', name: 'Action', description: 'Exciting fight scenes, thrilling adventures, and constant movement.' },
  { id: 'scifi', name: 'Sci-Fi', description: 'Advanced futuristic technology, space travels, and virtual realities.' },
  { id: 'xianxia', name: 'Xianxia', description: 'Daoist cultivation, martial magic, immortality paths, and gods.' },
  { id: 'comedy', name: 'Comedy', description: 'Lighthearted stories filled with humor, jokes, and funny occurrences.' }
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'japanese', name: 'Japanese (LN)' },
  { id: 'chinese', name: 'Chinese (WN)' },
  { id: 'korean', name: 'Korean (WN)' },
  { id: 'original', name: 'Original (WebNovel)' }
];

const INITIAL_TAGS: Tag[] = [
  { id: 'male-lead', name: 'Male Protagonist' },
  { id: 'female-lead', name: 'Female Protagonist' },
  { id: 'overpowered', name: 'Overpowered MC' },
  { id: 'system', name: 'Game System' },
  { id: 'reincarnation', name: 'Reincarnation' },
  { id: 'academy', name: 'Magic Academy' }
];

const INITIAL_SETTINGS = {
  siteName: 'EpicNovel',
  siteDescription: 'Your ultimate modern web novel publishing & reading companion.',
  contactEmail: 'admin@epicnovel.com',
  bannerNotice: '🔥 Welcome to EpicNovel! Register today to bookmark your favorite stories and track your reading progress! (Local Offline Mode Enabled)',
  primaryColor: '#4f46e5'
};

const INITIAL_NOVELS: Novel[] = [
  {
    id: 'classroom-of-the-elite',
    slug: 'classroom-of-the-elite',
    title: 'Classroom of the Elite',
    alternativeTitle: 'Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e',
    author: 'Shougo Kinugasa',
    artist: 'Shunsaku Tomose',
    illustrator: 'Shunsaku Tomose',
    status: 'ongoing',
    publisher: 'MF Bunko J',
    description: 'Kiyotaka Ayanokouji has just enrolled in Tokyo Metropolitan Advanced Nurturing High School, where 100% of students go on to university or find employment. However, he ends up in Class 1-D, which is full of all the school\'s problem children. What lies behind the school\'s ultimate meritocracy system?',
    genreIds: ['comedy', 'action', 'romance'],
    categoryIds: ['japanese'],
    tagIds: ['male-lead', 'overpowered', 'academy'],
    language: 'Japanese',
    originalLanguage: 'Japanese',
    releaseYear: 2015,
    rating: 4.8,
    ratingCount: 5,
    ratingSum: 24,
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&auto=format&fit=crop&q=80',
    visibility: 'publish',
    chapterCount: 3,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z')
  },
  {
    id: 'lord-of-the-mysteries',
    slug: 'lord-of-the-mysteries',
    title: 'Lord of the Mysteries',
    alternativeTitle: 'Gui Mi Zhi Zhu',
    author: 'Cuttlefish That Loves Diving',
    artist: 'Qidian',
    illustrator: 'Qidian',
    status: 'completed',
    publisher: 'Qidian',
    description: 'Waking up to find himself reincarnated as Zhou Mingrui in a Victorian-era steampunk fantasy world, he embarks on a journey of mystery, tarot clubs, potions, and pathway sequences to become the true Lord of the Mysteries.',
    genreIds: ['fantasy', 'action'],
    categoryIds: ['chinese'],
    tagIds: ['male-lead', 'system', 'reincarnation'],
    language: 'Chinese',
    originalLanguage: 'Chinese',
    releaseYear: 2018,
    rating: 4.9,
    ratingCount: 8,
    ratingSum: 39.2,
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80',
    visibility: 'publish',
    chapterCount: 2,
    createdAt: new Date('2026-06-02T00:00:00.000Z'),
    updatedAt: new Date('2026-06-02T00:00:00.000Z')
  }
];

const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: 'classroom-of-the-elite-1',
    novelId: 'classroom-of-the-elite',
    novelTitle: 'Classroom of the Elite',
    volume: 'Volume 1',
    chapterNumber: 1,
    title: 'The Structure of Class D',
    content: `
      <p>It was a bright morning in spring. The cherry blossoms were gently falling outside.</p>
      <p>I sat in the middle of the bus, looking out the window. Life at Tokyo Metropolitan Advanced Nurturing High School was about to begin.</p>
      <p>"Excuse me, could you give up your seat to this elderly lady?" an energetic voice rang out across the bus.</p>
      <p>I turned my gaze. A boy with bright blond hair and an arrogant smirk was refusing to stand up. Beside him, a silver-haired girl watched the scene with calm, analytical eyes.</p>
      <p>This was my first meeting with Horikita Suzune and Kouhei Koenji. The journey had started.</p>
    `,
    status: 'publish',
    createdAt: new Date('2026-06-01T01:00:00.000Z'),
    updatedAt: new Date('2026-06-01T01:00:00.000Z')
  },
  {
    id: 'classroom-of-the-elite-2',
    novelId: 'classroom-of-the-elite',
    novelTitle: 'Classroom of the Elite',
    volume: 'Volume 1',
    chapterNumber: 2,
    title: 'The Truth About Points',
    content: `
      <p>The classroom was buzzing. Class 1-D had spent their entire first month living like kings, spending 100,000 Private Points ($1000 equivalent) on absolute luxury without a care in the world.</p>
      <p>But today was May 1st. The day our monthly allowance of points was supposed to arrive.</p>
      <p>Our homeroom teacher, Chabashira Sae, walked up to the podium, her heels clicking on the cold floor.</p>
      <p>"Sensei, where are our points for this month?" Ike Kanji called out.</p>
      <p>Chabashira smirked coldly. "Points? Oh, they have been deposited. The amount of points your class receives is tied directly to your evaluation. And this month..."</p>
      <p>She pointed to the blackboard, showing Class D's score: <b>0</b>.</p>
      <p>"You received zero points. You are garbage, after all," she said flatly.</p>
    `,
    status: 'publish',
    createdAt: new Date('2026-06-01T02:00:00.000Z'),
    updatedAt: new Date('2026-06-01T02:00:00.000Z')
  },
  {
    id: 'classroom-of-the-elite-3',
    novelId: 'classroom-of-the-elite',
    novelTitle: 'Classroom of the Elite',
    volume: 'Volume 1',
    chapterNumber: 3,
    title: 'Rules and Merits',
    content: `
      <p>Class D fell into absolute despair. Zero points meant they had to survive on bread crusts and tap water for the next month.</p>
      <p>I looked at the blackboard, thinking. <i>So that\'s how it works. Evaluation is based on class-wide attendance, lateness, talking in class, and homework completion.</i></p>
      <p>"Hey, Ayanokouji," Horikita Suzune whispered from the desk next to mine. "Do you think we can climb our way up to Class A?"</p>
      <p>"If we score high enough on the midterms, we can change our score," I replied quietly. "But Class D is... special."</p>
    `,
    status: 'publish',
    createdAt: new Date('2026-06-01T03:00:00.000Z'),
    updatedAt: new Date('2026-06-01T03:00:00.000Z')
  },
  {
    id: 'lord-of-the-mysteries-1',
    novelId: 'lord-of-the-mysteries',
    novelTitle: 'Lord of the Mysteries',
    volume: 'Book 1',
    chapterNumber: 1,
    title: 'Crimson Moon',
    content: `
      <p>Pain. A splitting headache.</p>
      <p>Zhou Mingrui struggled to open his eyes. Above him was a ceiling made of dark wooden beams, and outside the window hung a massive, round, crimson moon.</p>
      <p>He was in a small, dusty study. On the desk lay an antique brass revolver, a blood-soaked notebook, and a pocket watch with a cracked glass face.</p>
      <p>"I... died? No, I survived," he muttered. He looked at his hands. They were pale, thin, and definitely not his own.</p>
      <p>He picked up the revolver. There was one bullet missing. When he touched his head, his hand came back stained with dried blood. He had shot himself... yet he was alive.</p>
    `,
    status: 'publish',
    createdAt: new Date('2026-06-02T01:00:00.000Z'),
    updatedAt: new Date('2026-06-02T01:00:00.000Z')
  },
  {
    id: 'lord-of-the-mysteries-2',
    novelId: 'lord-of-the-mysteries',
    novelTitle: 'Lord of the Mysteries',
    volume: 'Book 1',
    chapterNumber: 2,
    title: 'The Tarot Club Initiated',
    content: `
      <p>Zhou Mingrui sat in his study, trying to make sense of the diaries of Emperor Roselle. Suddenly, a strange fog engulfed him.</p>
      <p>He found himself floating in a majestic grey palace above the clouds, sitting at an endless bronze table. Two other figures were pulled into this space along with him—a young noblewoman and a blue-clad sailor.</p>
      <p>"Who are you? Is this a secret ritual?" the sailor demanded, holding a hand to his saber.</p>
      <p>Zhou Mingrui maintained a calm, god-like composure. He smiled from behind the grey fog.</p>
      <p>"You can call me... <b>The Fool</b>," he declared softly.</p>
    `,
    status: 'publish',
    createdAt: new Date('2026-06-02T02:00:00.000Z'),
    updatedAt: new Date('2026-06-02T02:00:00.000Z')
  }
];

// Helper to initialize and query localstorage
export class LocalDb {
  static init() {
    if (!localStorage.getItem('local_genres')) {
      localStorage.setItem('local_genres', JSON.stringify(INITIAL_GENRES));
    }
    if (!localStorage.getItem('local_categories')) {
      localStorage.setItem('local_categories', JSON.stringify(INITIAL_CATEGORIES));
    }
    if (!localStorage.getItem('local_tags')) {
      localStorage.setItem('local_tags', JSON.stringify(INITIAL_TAGS));
    }
    if (!localStorage.getItem('local_settings')) {
      localStorage.setItem('local_settings', JSON.stringify(INITIAL_SETTINGS));
    }
    if (!localStorage.getItem('local_novels')) {
      localStorage.setItem('local_novels', JSON.stringify(INITIAL_NOVELS));
    }
    if (!localStorage.getItem('local_chapters')) {
      localStorage.setItem('local_chapters', JSON.stringify(INITIAL_CHAPTERS));
    }
  }

  static getCollection(name: string): any[] {
    this.init();
    const data = localStorage.getItem(`local_${name}`);
    return data ? JSON.parse(data) : [];
  }

  static saveCollection(name: string, data: any[]) {
    localStorage.setItem(`local_${name}`, JSON.stringify(data));
  }

  static getDoc(collectionName: string, id: string): any | null {
    const col = this.getCollection(collectionName);
    if (collectionName === 'settings' && id === 'general') {
      return col.length > 0 ? col : INITIAL_SETTINGS;
    }
    return col.find(item => item.id === id || item.slug === id) || null;
  }

  static setDoc(collectionName: string, id: string, data: any) {
    if (collectionName === 'settings' && id === 'general') {
      localStorage.setItem('local_settings', JSON.stringify(data));
      return;
    }
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => item.id === id || item.slug === id);
    
    // Ensure standard date format or conversions
    let formattedData = { ...data };
    if (!formattedData.createdAt) formattedData.createdAt = new Date().toISOString();
    formattedData.updatedAt = new Date().toISOString();

    if (index !== -1) {
      // Resolve increments
      const existing = col[index];
      for (const key in formattedData) {
        if (formattedData[key] && typeof formattedData[key] === 'object' && formattedData[key]._type === 'increment') {
          const originalVal = existing[key] !== undefined ? Number(existing[key]) : 0;
          formattedData[key] = originalVal + Number(formattedData[key].value);
        }
      }
      col[index] = { ...existing, ...formattedData };
    } else {
      // Resolve increments against 0
      for (const key in formattedData) {
        if (formattedData[key] && typeof formattedData[key] === 'object' && formattedData[key]._type === 'increment') {
          formattedData[key] = Number(formattedData[key].value);
        }
      }
      col.push({ id, ...formattedData });
    }
    this.saveCollection(collectionName, col);
  }

  static addDoc(collectionName: string, data: any) {
    const col = this.getCollection(collectionName);
    const id = data.id || Math.random().toString(36).substring(2, 11);
    const formattedData = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    // Resolve increments
    for (const key in formattedData) {
      if (formattedData[key] && typeof formattedData[key] === 'object' && formattedData[key]._type === 'increment') {
        formattedData[key] = Number(formattedData[key].value);
      }
    }
    col.push(formattedData);
    this.saveCollection(collectionName, col);
    return id;
  }

  static updateDoc(collectionName: string, id: string, data: any) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => item.id === id || item.slug === id);
    if (index !== -1) {
      const existing = col[index];
      const updatedFields = { ...data };
      for (const key in updatedFields) {
        if (updatedFields[key] && typeof updatedFields[key] === 'object' && updatedFields[key]._type === 'increment') {
          const originalVal = existing[key] !== undefined ? Number(existing[key]) : 0;
          updatedFields[key] = originalVal + Number(updatedFields[key].value);
        }
      }
      col[index] = { ...existing, ...updatedFields, updatedAt: new Date().toISOString() };
      this.saveCollection(collectionName, col);
    }
  }

  static deleteDoc(collectionName: string, id: string) {
    const col = this.getCollection(collectionName);
    const filtered = col.filter(item => item.id !== id && item.slug !== id);
    this.saveCollection(collectionName, filtered);
  }
}
