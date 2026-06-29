/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection as firestoreCollection,
  doc as firestoreDoc,
  query as firestoreQuery,
  where as firestoreWhere,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  getDocs as firestoreGetDocs,
  getDoc as firestoreGetDoc,
  setDoc as firestoreSetDoc,
  addDoc as firestoreAddDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  increment as firestoreIncrement,
  writeBatch as firestoreWriteBatch
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import local database helper
import { LocalDb } from './localDb';

// Import local auto-generated Firebase Config directly
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Detect if we are running inside the official Google AI Studio workspace container
const isAiStudioContainer = typeof window !== 'undefined' && 
  (window.location.hostname.includes('asia-east1.run.app') || window.location.hostname.includes('localhost'));

// Use environment variables if defined, otherwise fall back to the statically-loaded JSON config
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey || "",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain || "",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || "",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket || "",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId || "",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId || "",
  firestoreDatabaseId: (import.meta as any).env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 
    (isAiStudioContainer ? (firebaseAppletConfig.firestoreDatabaseId || "(default)") : "(default)")
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const storage = getStorage(app);

// ----------------------------------------------------------------------
// SYSTEM-WIDE LOCAL FALLBACK / OFFLINE MODE ENGINE
// ----------------------------------------------------------------------

const hasValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.projectId !== "");
export let isLocalMode = !hasValidConfig;
let onLocalModeCallbacks: (() => void)[] = [];

export function subscribeToLocalModeChange(cb: () => void) {
  onLocalModeCallbacks.push(cb);
  return () => {
    onLocalModeCallbacks = onLocalModeCallbacks.filter(c => c !== cb);
  };
}

export function enableLocalMode() {
  if (!isLocalMode) {
    isLocalMode = true;
    console.warn("SYSTEM FALLBACK: ENABLED LOCAL MODE FALLBACK GLOBALLY FOR THIS SESSION.");
    onLocalModeCallbacks.forEach(cb => cb());
  }
}

export function isConnectivityError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || String(error)).toLowerCase();
  return msg.includes('timeout') || 
         msg.includes('offline') || 
         msg.includes('network') || 
         msg.includes('could not reach') ||
         msg.includes('failed-precondition') ||
         msg.includes('unavailable');
}

// Timeout helper to prevent infinite loading of Firestore calls
async function runWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout of ${timeoutMs}ms exceeded.`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    clearTimeout(timeoutId);
    return result as T;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Mock auth callbacks list
let authCallbacks: ((user: any) => void)[] = [];

export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  // Listen to standard Firebase Auth
  const unsubscribeReal = firebaseOnAuthStateChanged(authInstance, (user) => {
    if (!isLocalMode || !localStorage.getItem('local_session_user')) {
      callback(user);
    }
  });

  authCallbacks.push(callback);

  // Trigger instantly if there's a cached local user
  const savedUserStr = localStorage.getItem('local_session_user');
  if (savedUserStr) {
    try {
      const savedUser = JSON.parse(savedUserStr);
      callback(savedUser);
    } catch (_) {}
  }

  return () => {
    unsubscribeReal();
    authCallbacks = authCallbacks.filter(cb => cb !== callback);
  };
}

export function triggerLocalAuthStateChange(user: any) {
  authCallbacks.forEach(cb => cb(user));
}

export async function signOut(authInstance: any) {
  localStorage.removeItem('local_session_user');
  triggerLocalAuthStateChange(null);
  
  try {
    await firebaseSignOut(authInstance);
  } catch (e) {
    console.warn("Real signOut failed or not loaded", e);
  }
}

export function simulateLocalLogin(email: string, password: any) {
  const users = LocalDb.getCollection('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (user) {
    const mockUser = {
      uid: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces&q=80',
      emailVerified: true
    };
    localStorage.setItem('local_session_user', JSON.stringify(mockUser));
    triggerLocalAuthStateChange(mockUser);
    return mockUser;
  }
  
  // Default admin caissaorg@gmail.com password-based access for testability on custom domains
  if (email.toLowerCase() === 'caissaorg@gmail.com' && password === 'admin123456') {
    const mockUser = {
      uid: 'admin-caissa',
      email: 'caissaorg@gmail.com',
      displayName: 'Owner Admin',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces&q=80',
      emailVerified: true
    };
    localStorage.setItem('local_session_user', JSON.stringify(mockUser));
    triggerLocalAuthStateChange(mockUser);
    return mockUser;
  }
  return null;
}

export function simulateLocalRegister(email: string, password: any, displayName: string) {
  const users = LocalDb.getCollection('users');
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('Email already registered.');
  }
  const id = Math.random().toString(36).substring(2, 11);
  users.push({ id, email, password, displayName });
  LocalDb.saveCollection('users', users);
}

// ----------------------------------------------------------------------
// FIREBASE / LOCALSTORE TRANSPARENT PROXY IMPLEMENTATION
// ----------------------------------------------------------------------

export function collection(dbRef: any, name: string) {
  if (isLocalMode) {
    return { type: 'collection', name };
  }
  const realCol = firestoreCollection(dbRef, name);
  (realCol as any)._customName = name;
  return realCol;
}

export function doc(dbRef: any, collectionName: string, id?: string) {
  if (isLocalMode) {
    return { type: 'doc', collectionName, id };
  }
  const realDoc = firestoreDoc(dbRef, collectionName, id as string);
  (realDoc as any)._customCollectionName = collectionName;
  (realDoc as any)._customId = id;
  return realDoc;
}

export function query(ref: any, ...constraints: any[]) {
  if (isLocalMode) {
    return { ...ref, constraints };
  }
  const realQuery = firestoreQuery(ref, ...constraints);
  
  const customName = ref._customName;
  if (customName) {
    (realQuery as any)._customName = customName;
  }
  
  const customConstraints = constraints
    .map(c => c._customConstraintInfo)
    .filter(Boolean);
  (realQuery as any)._customConstraints = customConstraints;
  
  return realQuery;
}

export function where(field: string, operator: any, value: any) {
  if (isLocalMode) {
    return { type: 'where', field, operator, value };
  }
  const constraint = firestoreWhere(field, operator, value);
  (constraint as any)._customConstraintInfo = { type: 'where', field, operator, value };
  return constraint;
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  if (isLocalMode) {
    return { type: 'orderBy', field, direction };
  }
  const constraint = firestoreOrderBy(field, direction);
  (constraint as any)._customConstraintInfo = { type: 'orderBy', field, direction };
  return constraint;
}

export function limit(value: number) {
  if (isLocalMode) {
    return { type: 'limit', value };
  }
  const constraint = firestoreLimit(value);
  (constraint as any)._customConstraintInfo = { type: 'limit', value };
  return constraint;
}

export function increment(value: number) {
  if (isLocalMode) {
    return { _type: 'increment', value };
  }
  return firestoreIncrement(value);
}

export function writeBatch(dbRef: any) {
  if (isLocalMode) {
    return {
      set: (docRef: any, data: any) => {
        LocalDb.setDoc(docRef.collectionName, docRef.id, data);
      },
      update: (docRef: any, data: any) => {
        LocalDb.updateDoc(docRef.collectionName, docRef.id, data);
      },
      delete: (docRef: any) => {
        LocalDb.deleteDoc(docRef.collectionName, docRef.id);
      },
      commit: async () => {
        return;
      }
    };
  }
  return firestoreWriteBatch(dbRef);
}

// Fetch helper that returns collection from localDb
function getLocalDocsInternal(queryRef: any) {
  const colName = queryRef._customName || queryRef.name;
  if (!colName) {
    console.warn("getLocalDocsInternal: Could not determine collection name", queryRef);
    return { empty: true, docs: [] };
  }
  let items = LocalDb.getCollection(colName);

  const constraints = queryRef._customConstraints || queryRef.constraints;
  if (constraints) {
    for (const constraint of constraints) {
      if (constraint.type === 'where') {
        const { field, operator, value } = constraint;
        if (operator === '==') {
          items = items.filter(item => {
            const itemVal = item[field];
            if (Array.isArray(itemVal)) {
              return itemVal.includes(value);
            }
            return itemVal === value;
          });
        }
      }
    }

    // Apply sorting
    for (const constraint of constraints) {
      if (constraint.type === 'orderBy') {
        const { field, direction } = constraint;
        items = items.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA === undefined) return 1;
          if (valB === undefined) return -1;

          const dateA = valA instanceof Date ? valA.getTime() : typeof valA === 'string' && valA.includes('T') ? new Date(valA).getTime() : valA;
          const dateB = valB instanceof Date ? valB.getTime() : typeof valB === 'string' && valB.includes('T') ? new Date(valB).getTime() : valB;

          if (typeof dateA === 'number' && typeof dateB === 'number') {
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
          }
          if (typeof valA === 'string' && typeof valB === 'string') {
            return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return direction === 'asc' ? valA - valB : valB - valA;
        });
      }
    }

    // Apply limit
    for (const constraint of constraints) {
      if (constraint.type === 'limit') {
        items = items.slice(0, constraint.value);
      }
    }
  }

  return {
    empty: items.length === 0,
    docs: items.map(item => ({
      id: item.id || item.slug,
      data: () => item,
      exists: () => true
    }))
  };
}

// Fetch helper that returns single document from localDb
function getLocalDocInternal(docRef: any) {
  const colName = docRef._customCollectionName || docRef.collectionName;
  const docId = docRef._customId || docRef.id;
  if (!colName || !docId) {
    console.warn("getLocalDocInternal: Could not determine collection or document id", docRef);
    return { exists: () => false, id: docId || '', data: () => null };
  }
  const data = LocalDb.getDoc(colName, docId);
  return {
    exists: () => data !== null,
    id: docId,
    data: () => data
  };
}

export async function getDocs(queryRef: any): Promise<any> {
  if (isLocalMode) {
    return getLocalDocsInternal(queryRef);
  }

  try {
    const result = await runWithTimeout(() => firestoreGetDocs(queryRef), 15000);
    return result;
  } catch (error) {
    console.warn("getDocs failed or timed out. Falling back to Local Mode...", error);
    if (isConnectivityError(error)) {
      enableLocalMode();
    }
    return getLocalDocsInternal(queryRef);
  }
}

export async function getDoc(docRef: any): Promise<any> {
  if (isLocalMode) {
    return getLocalDocInternal(docRef);
  }

  try {
    return await runWithTimeout(() => firestoreGetDoc(docRef), 15000);
  } catch (error) {
    console.warn("getDoc failed or timed out. Falling back to Local Mode...", error);
    if (isConnectivityError(error)) {
      enableLocalMode();
    }
    return getLocalDocInternal(docRef);
  }
}

// Helper to sanitize objects for Firestore (removes undefined fields)
function cleanUndefined(data: any): any {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map(item => cleanUndefined(item));
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return data;
}

export async function setDoc(docRef: any, data: any, options?: any): Promise<any> {
  const sanitized = cleanUndefined(data);
  const colName = docRef._customCollectionName || docRef.collectionName;
  const docId = docRef._customId || docRef.id;

  if (isLocalMode) {
    if (colName && docId) {
      LocalDb.setDoc(colName, docId, sanitized);
    }
    return;
  }

  try {
    return await runWithTimeout(() => firestoreSetDoc(docRef, sanitized, options), 15000);
  } catch (error) {
    console.warn("setDoc failed, falling back to local mode...", error);
    if (isConnectivityError(error)) {
      enableLocalMode();
    }
    if (colName && docId) {
      LocalDb.setDoc(colName, docId, sanitized);
    }
  }
}

export async function addDoc(collectionRef: any, data: any): Promise<any> {
  const sanitized = cleanUndefined(data);
  const colName = collectionRef._customName || collectionRef.name;

  if (isLocalMode) {
    if (colName) {
      const id = LocalDb.addDoc(colName, sanitized);
      return { id };
    }
    return { id: '' };
  }

  try {
    return await runWithTimeout(() => firestoreAddDoc(collectionRef, sanitized), 15000);
  } catch (error) {
    console.warn("addDoc failed, falling back to local mode...", error);
    if (isConnectivityError(error)) {
      enableLocalMode();
    }
    if (colName) {
      const id = LocalDb.addDoc(colName, sanitized);
      return { id };
    }
    return { id: '' };
  }
}

export async function updateDoc(docRef: any, data: any): Promise<any> {
  const sanitized = cleanUndefined(data);
  const colName = docRef._customCollectionName || docRef.collectionName;
  const docId = docRef._customId || docRef.id;

  if (isLocalMode) {
    if (colName && docId) {
      LocalDb.updateDoc(colName, docId, sanitized);
    }
    return;
  }

  try {
    return await runWithTimeout(() => firestoreUpdateDoc(docRef, sanitized), 15000);
  } catch (error) {
    console.warn("updateDoc failed, falling back to local mode...", error);
    if (isConnectivityError(error)) {
      enableLocalMode();
    }
    if (colName && docId) {
      LocalDb.updateDoc(colName, docId, sanitized);
    }
  }
}

export async function deleteDoc(docRef: any): Promise<any> {
  const colName = docRef._customCollectionName || docRef.collectionName;
  const docId = docRef._customId || docRef.id;

  if (isLocalMode) {
    if (colName && docId) {
      LocalDb.deleteDoc(colName, docId);
    }
    return;
  }

  try {
    return await runWithTimeout(() => firestoreDeleteDoc(docRef), 15000);
  } catch (error) {
    console.warn("deleteDoc failed, falling back to local mode...", error);
    if (isConnectivityError(error)) {
      enableLocalMode();
    }
    if (colName && docId) {
      LocalDb.deleteDoc(colName, docId);
    }
  }
}

export default app;
