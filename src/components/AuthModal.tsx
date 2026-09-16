import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Mode = 'login' | 'register' | 'reset';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    sendResetPasswordEmail,
  } = useApp();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const resetFormState = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleSwitchMode = (newMode: Mode) => {
    setMode(newMode);
    resetFormState();
  };

  const mapAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Ungültige E-Mail-Adresse.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-Mail oder Passwort ist falsch.';
      case 'auth/email-already-in-use':
        return 'Diese E-Mail-Adresse wird bereits verwendet.';
      case 'auth/weak-password':
        return 'Das Passwort ist zu schwach (mindestens 6 Zeichen erforderlich).';
      case 'auth/popup-closed-by-user':
        return 'Das Anmeldefenster wurde geschlossen.';
      case 'auth/network-request-failed':
        return 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';
      default:
        return err?.message || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Bitte fülle alle Pflichtfelder aus.');
        }
        await registerWithEmail(email, password, displayName.trim());
      } else if (mode === 'reset') {
        if (!email.trim()) {
          throw new Error('Bitte gib deine E-Mail-Adresse ein.');
        }
        await sendResetPasswordEmail(email);
        setSuccessMessage('Eine E-Mail zum Zurücksetzen deines Passworts wurde versendet.');
      }
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    resetFormState();
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#e3ebe5] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#e3ebe5] bg-[#fafcfa] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#174e36] to-[#0f3424] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-[#86e3b5]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#171c19] tracking-tight">
                {mode === 'login' && 'Willkommen zurück'}
                {mode === 'register' && 'Konto erstellen'}
                {mode === 'reset' && 'Passwort zurücksetzen'}
              </h3>
              <p className="text-xs text-[#52645a]">
                {mode === 'reset'
                  ? 'Gib deine E-Mail-Adresse ein, um einen Reset-Link zu erhalten'
                  : 'Synchronisiere deine Lebensplanung auf allen Geräten'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-2 text-[#6b7d72] hover:text-[#171c19] hover:bg-[#f0f4f1] rounded-xl transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Mode Tabs */}
          <div className="flex bg-[#f0f4f1] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#174e36] shadow-xs'
                  : 'text-[#52645a] hover:text-[#171c19]'
              }`}
            >
              Anmelden
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#174e36] shadow-xs'
                  : 'text-[#52645a] hover:text-[#171c19]'
              }`}
            >
              Registrieren
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Quick Button */}
          {mode !== 'reset' && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-[#f3f7f4] text-[#171c19] border border-[#d2ded6] rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Mit Google fortfahren</span>
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-[#e3ebe5] w-full" />
                <span className="bg-white px-3 text-[11px] text-[#6b7d72] uppercase font-semibold">
                  oder mit E-Mail
                </span>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#171c19] mb-1">
                  Name (optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6b7d72] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#c4d6cb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174e36] bg-white text-[#171c19]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#171c19] mb-1">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6b7d72] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#c4d6cb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174e36] bg-white text-[#171c19]"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#171c19]">Passwort</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('reset')}
                      className="text-[11px] text-[#174e36] hover:underline font-medium cursor-pointer"
                    >
                      Passwort vergessen?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6b7d72] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs border border-[#c4d6cb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174e36] bg-white text-[#171c19]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7d72] hover:text-[#171c19]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                'Bitte warten...'
              ) : mode === 'login' ? (
                'Anmelden'
              ) : mode === 'register' ? (
                'Konto erstellen'
              ) : (
                'Reset-Link senden'
              )}
            </button>
          </form>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className="w-full text-center text-xs text-[#52645a] hover:text-[#171c19] font-medium pt-2 cursor-pointer"
            >
              &larr; Zurück zum Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
