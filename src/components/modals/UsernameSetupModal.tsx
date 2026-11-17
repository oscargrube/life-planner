import React, { useState, useEffect } from 'react';
import { AtSign, User, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isUsernameAvailable, isValidUsername, normalizeUsername } from '../../firebase/service';

export const UsernameSetupModal: React.FC = () => {
  const { user, needsUsernameSetup, completeUsernameSetup } = useApp();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && needsUsernameSetup) {
      setDisplayName(user.displayName || user.email?.split('@')[0] || '');
      const suggested = normalizeUsername(
        (user.displayName || user.email?.split('@')[0] || '').replace(/[^a-zA-Z0-9_]/g, '_')
      ).slice(0, 18);
      if (suggested.length >= 3) {
        setUsername(suggested);
      }
    }
  }, [user, needsUsernameSetup]);

  useEffect(() => {
    if (!needsUsernameSetup) return;
    const clean = normalizeUsername(username);
    if (!clean) {
      setStatus('idle');
      return;
    }
    if (!isValidUsername(clean)) {
      setStatus('invalid');
      return;
    }
    setStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const ok = await isUsernameAvailable(clean);
        setStatus(ok ? 'available' : 'taken');
      } catch {
        setStatus('idle');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [username, needsUsernameSetup]);

  if (!needsUsernameSetup || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = normalizeUsername(username);
    if (!isValidUsername(clean)) {
      setError('Bitte wähle einen gültigen Benutzernamen (3–20 Zeichen, a-z, 0-9, _).');
      return;
    }
    setLoading(true);
    try {
      await completeUsernameSetup(clean, displayName.trim() || clean);
    } catch (err: any) {
      setError(err?.message || 'Benutzername konnte nicht gespeichert werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171c19]/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#e3ebe5] overflow-hidden">
        <div className="p-6 border-b border-[#e3ebe5] bg-[#fafcfa] flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#174e36] to-[#0f3424] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5 text-[#86e3b5]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#171c19]">Benutzername festlegen</h3>
            <p className="text-xs text-[#52645a]">
              Damit dich Freunde und Teammitglieder finden können
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#171c19] mb-1">
              Benutzername *
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-[#6b7d72] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="dein_username"
                className="w-full pl-9 pr-9 py-2.5 text-xs border border-[#c4d6cb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174e36] bg-white text-[#171c19]"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {status === 'checking' && <Loader2 className="w-3.5 h-3.5 text-[#6b7d72] animate-spin" />}
                {status === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {(status === 'taken' || status === 'invalid') && (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                )}
              </div>
            </div>
            <p className="text-[10px] mt-1 text-[#52645a]">
              {status === 'available' && (
                <span className="text-emerald-700 font-semibold">@{normalizeUsername(username)} ist frei!</span>
              )}
              {status === 'taken' && (
                <span className="text-rose-600 font-semibold">Bereits vergeben – bitte wähle einen anderen.</span>
              )}
              {status === 'invalid' && (
                <span className="text-rose-600 font-semibold">3–20 Zeichen (a-z, 0-9, _).</span>
              )}
              {(status === 'idle' || status === 'checking') && 'Eindeutiger Name für Freundschafts- & Projektanfragen.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171c19] mb-1">
              Anzeigename
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#6b7d72] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dein Name"
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-[#c4d6cb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174e36] bg-white text-[#171c19]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || status === 'taken' || status === 'invalid'}
            className="w-full py-2.5 px-4 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Speichere...' : 'Profil aktivieren'}
          </button>
        </form>
      </div>
    </div>
  );
};
