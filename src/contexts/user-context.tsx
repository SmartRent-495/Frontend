'use client';

import * as React from 'react';

import type { User } from '@/types/user';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';

export interface UserContextValue {
  user: User | null;
  error: string | null;
  isLoading: boolean;
  checkSession?: () => Promise<void>;
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps): React.JSX.Element {
  const [state, setState] = React.useState<{ user: User | null; error: string | null; isLoading: boolean }>({
    user: null,
    error: null,
    isLoading: true,
  });
  const checkingRef = React.useRef(false);

  const checkSession = React.useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous checks
    if (checkingRef.current) {
      return;
    }
    
    checkingRef.current = true;
    
    try {
      const { data, error } = await authClient.getUser();

      if (error) {
        logger.error('[UserContext] Error getting user:', error);
        setState((prev) => ({ ...prev, user: null, error: null, isLoading: false }));
        checkingRef.current = false;
        return;
      }

      logger.debug('[UserContext] User data:', data);
      setState((prev) => ({ ...prev, user: data ?? null, error: null, isLoading: false }));
      checkingRef.current = false;
    } catch (error) {
      logger.error('[UserContext] Exception getting user:', error);
      setState((prev) => ({ ...prev, user: null, error: null, isLoading: false }));
      checkingRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    logger.debug('[UserContext] Setting up Firebase auth state listener');
    
    // Listen to Firebase auth state changes
    const unsubscribe = authClient.onAuthStateChanged?.(async (user) => {
      logger.debug('[UserContext] Firebase auth state changed:', user ? 'User logged in' : 'User logged out');
      
      if (user) {
        // User is signed in, fetch full user data
        await checkSession();
      } else {
        // User is signed out
        setState({ user: null, error: null, isLoading: false });
      }
    });

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        logger.debug('[UserContext] Cleaning up auth state listener');
        unsubscribe();
      }
    };
  }, [checkSession]);

  return <UserContext.Provider value={{ ...state, checkSession }}>{children}</UserContext.Provider>;
}

export const UserConsumer = UserContext.Consumer;
