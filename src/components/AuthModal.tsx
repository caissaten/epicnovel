/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { auth, isLocalMode, simulateLocalLogin, simulateLocalRegister } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccess("Successfully logged in with Google!");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/auth-domain-config-required') {
        setError("Domain ini belum terdaftar di Firebase Console (Authorized Domains). Silakan daftar akun menggunakan form Email & Password di bawah yang bisa digunakan di semua domain.");
      } else {
        setError(err.message || "Gagal masuk menggunakan Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'signin') {
        if (isLocalMode) {
          const isDev = (import.meta as any).env?.DEV;
          if (!isDev) {
            setError("Koneksi ke database sedang offline atau belum terkonfigurasi. Silakan lengkapi setup Firebase Anda secara penuh untuk login.");
            setLoading(false);
            return;
          }
          const user = simulateLocalLogin(email, password);
          if (user) {
            setSuccess("Masuk berhasil (Local Mode)!");
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 1000);
          } else {
            setError("Email atau password salah di Local Mode. Silakan Daftar terlebih dahulu.");
          }
        } else {
          await signInWithEmailAndPassword(auth, email, password);
          setSuccess("Masuk berhasil!");
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 1000);
        }
      } else {
        if (!displayName) {
          setError("Nama lengkap wajib diisi untuk pendaftaran.");
          setLoading(false);
          return;
        }

        if (isLocalMode) {
          const isDev = (import.meta as any).env?.DEV;
          if (!isDev) {
            setError("Koneksi ke database sedang offline atau belum terkonfigurasi. Silakan lengkapi setup Firebase Anda secara penuh untuk mendaftar.");
            setLoading(false);
            return;
          }
          simulateLocalRegister(email, password, displayName);
          setSuccess("Pendaftaran berhasil (Local Mode)! Silakan masuk.");
          setActiveTab('signin');
        } else {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          if (userCred.user) {
            await updateProfile(userCred.user, { displayName });
          }
          setSuccess("Pendaftaran berhasil! Akun Anda telah dibuat.");
          setActiveTab('signin');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Email ini sudah digunakan oleh akun lain.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password harus minimal 6 karakter.");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Email atau password yang Anda masukkan salah.");
      } else {
        setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex justify-center items-start sm:items-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative my-auto w-full max-w-md bg-white dark:bg-[#0b1329] border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold font-sans text-gray-950 dark:text-gray-100">
              {activeTab === 'signin' ? 'Masuk ke EpicNovel' : 'Buat Akun Baru'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Local Mode Status Banner */}
        {isLocalMode && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 px-6 py-2">
            <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 font-medium">
              ⚠️ Mode Lokal Aktif (Firebase offline). Akun disimpan sementara di browser Anda.
            </p>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex bg-gray-50 dark:bg-slate-900/40 p-1 rounded-lg mb-6 border border-gray-100 dark:border-slate-800">
            <button
              onClick={() => { setActiveTab('signin'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === 'signin' 
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk</span>
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === 'signup' 
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Daftar</span>
            </button>
          </div>

          {/* Social Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.56l3.85 2.99C6.18 7.42 8.87 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.51z" />
              <path fill="#FBBC05" d="M5.24 14.55c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.39 6.96C.5 8.74 0 10.73 0 12.8s.5 4.06 1.39 5.84l3.85-2.99z" fillRule="evenodd" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.13 0-5.82-2.38-6.76-5.51L1.39 15.91C3.37 19.82 7.35 23 12 23z" />
            </svg>
            <span>Masuk lewat Google</span>
          </button>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-100 dark:border-slate-800"></div>
            <span className="px-3 text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">Atau dengan Email</span>
            <div className="flex-grow border-t border-gray-100 dark:border-slate-800"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Caissa Admin"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-100"
                  />
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Alamat Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-100"
                />
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Min. 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-100"
                />
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Error and Success Notifications */}
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 leading-relaxed">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 leading-relaxed">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer transition-colors"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {activeTab === 'signin' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  <span>{activeTab === 'signin' ? 'Masuk Sekarang' : 'Daftar Sekarang'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
