import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { SocialProvider, useSocial } from './SocialContext';
import { DataProvider, useData } from './DataContext';
import { UIProvider, useUI } from './UIContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <AuthProvider>
        <SocialProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </SocialProvider>
      </AuthProvider>
    </UIProvider>
  );
};

export const useApp = () => {
  const auth = useAuth();
  const social = useSocial();
  const data = useData();
  const ui = useUI();

  return {
    ...auth,
    ...social,
    ...data,
    ...ui,
  };
};
