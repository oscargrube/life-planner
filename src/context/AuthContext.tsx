import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  subscribeToAuth,
  signInWithGoogle,
  logOut,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
} from '../firebase/service';
import { useUI } from './UIContext';

interface AuthContextType {
  user: FirebaseUser | null;
  isAuthReady: boolean;
  isFirebaseActive: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
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
      }
    });
    return () => unsubscribe();
  }, [closeAuthModal]);

  const loginWithGoogle = async () => {
    await signInWithGoogle();
    closeAuthModal();
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmail(email, pass);
    closeAuthModal();
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    await signUpWithEmail(email, pass, name);
    closeAuthModal();
  };

  const sendResetPasswordEmail = async (email: string) => {
    await resetPassword(email);
  };

  const logout = async () => {
    await logOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthReady,
        isFirebaseActive,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
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
