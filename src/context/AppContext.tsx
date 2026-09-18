import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { DataProvider, useData } from './DataContext';
import { UIProvider, useUI } from './UIContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <AuthProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </AuthProvider>
    </UIProvider>
  );
};

export const useApp = () => {
  const auth = useAuth();
  const data = useData();
  const ui = useUI();
  
  return {
    ...auth,
    ...data,
    ...ui,
  };
};
