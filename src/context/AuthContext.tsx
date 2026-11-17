import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  subscribeToAuth,
  signInWithGoogle,
  logOut,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
  claimUsernameForUser,
} from '../firebase/service';
import { subscribeToUserProfile } from '../firebase/socialService';
import { UserProfile } from '../types';
import { useUI } from './UIContext';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAuthReady: boolean;
  isFirebaseActive: boolean;
  needsUsernameSetup: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (identifier: string, pass: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    name?: string,
    username?: string
  ) => Promise<void>;
  completeUsernameSetup: (username: string, displayName?: string) => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);
  const { closeAuthModal } = useUI();

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        setIsFirebaseActive(true);
        closeAuthModal();
      } else {
        setIsFirebaseActive(false);
        setUserProfile(null);
        setProfileLoaded(false);
      }
    });
    return () => unsubscribe();
  }, [closeAuthModal]);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setProfileLoaded(false);
      return;
    }

    setProfileLoaded(false);
    const unsub = subscribeToUserProfile(user.uid, (profile) => {
      setUserProfile(profile);
      setProfileLoaded(true);
    });
    return () => unsub();
  }, [user]);

  const needsUsernameSetup = Boolean(
    user && profileLoaded && (!userProfile || !userProfile.username)
  );

  const loginWithGoogle = async () => {
    await signInWithGoogle();
    closeAuthModal();
  };

  const loginWithEmail = async (identifier: string, pass: string) => {
    await signInWithEmail(identifier, pass);
    closeAuthModal();
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name?: string,
    username?: string
  ) => {
    await signUpWithEmail(email, pass, name, username);
    closeAuthModal();
  };

  const completeUsernameSetup = async (username: string, displayName?: string) => {
    if (!user) throw new Error('Nicht angemeldet.');
    const profile = await claimUsernameForUser(user, username, displayName);
    setUserProfile(profile);
  };

  const sendResetPasswordEmail = async (email: string) => {
    await resetPassword(email);
  };

  const logout = async () => {
    await logOut();
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAuthReady,
        isFirebaseActive,
        needsUsernameSetup,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        completeUsernameSetup,
        sendResetPasswordEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
