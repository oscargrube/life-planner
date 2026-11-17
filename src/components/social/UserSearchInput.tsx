import React, { useState, useEffect } from 'react';
import { Search, Loader2, UserPlus, Check } from 'lucide-react';
import { UserProfile } from '../../types';
import { searchUsers } from '../../firebase/socialService';
import { useAuth } from '../../context/AuthContext';

interface UserSearchInputProps {
  placeholder?: string;
  excludeUids?: string[];
  actionLabel?: string;
  onSelectUser: (user: UserProfile) => Promise<void> | void;
}

export const UserSearchInput: React.FC<UserSearchInputProps> = ({
  placeholder = 'Nach @username oder E-Mail suchen...',
  excludeUids = [],
  actionLabel = 'Auswählen',
  onSelectUser,
}) => {
  const { user } = useAuth();
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [doneUids, setDoneUids] = useState<Set<string>>(new Set());

  useEffect(() => {
    const trimmed = queryText.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const list = await searchUsers(trimmed, user?.uid);
        if (!cancelled) setResults(list);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [queryText, user?.uid]);

  const handleAction = async (profile: UserProfile) => {
    setBusyUid(profile.uid);
    try {
      await onSelectUser(profile);
      setDoneUids((prev) => new Set(prev).add(profile.uid));
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 text-[#7d8e84] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-[#d8e2db] focus:border-[#174e36] rounded-xl text-[#171c19] placeholder-[#7d8e84] outline-none"
        />
        {searching && (
          <Loader2 className="w-3.5 h-3.5 text-[#174e36] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {queryText.trim().length >= 2 && (
        <div className="bg-white border border-[#e2e8e3] rounded-xl divide-y divide-[#f0f4f1] max-h-52 overflow-y-auto shadow-xs">
          {results.length === 0 && !searching ? (
            <div className="p-3 text-center text-xs text-[#6b7d72]">
              Keine passenden Nutzer gefunden.
            </div>
          ) : (
            results.map((profile) => {
              const isExcluded = excludeUids.includes(profile.uid);
              const isDone = doneUids.has(profile.uid);
              return (
                <div
                  key={profile.uid}
                  className="p-2.5 flex items-center justify-between gap-2 hover:bg-[#fafcfa]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {profile.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-[#cfe0d5] shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center text-xs font-bold shrink-0">
                        {(profile.displayName || profile.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#171c19] truncate">
                        {profile.displayName}
                      </p>
                      <p className="text-[11px] text-[#52645a] truncate">@{profile.username}</p>
                    </div>
                  </div>

                  {isExcluded ? (
                    <span className="text-[11px] font-medium text-[#6b7d72] px-2.5 py-1 bg-[#f4f7f5] rounded-lg shrink-0">
                      Bereits dabei
                    </span>
                  ) : isDone ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
                      <Check className="w-3 h-3" />
                      Gesendet
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busyUid === profile.uid}
                      onClick={() => handleAction(profile)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#174e36] hover:bg-[#12402c] text-white rounded-lg text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>{busyUid === profile.uid ? '...' : actionLabel}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
