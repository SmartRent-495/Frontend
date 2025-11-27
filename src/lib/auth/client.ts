'use client';

import type { User } from '@/types/user';
import { auth } from '@/lib/firebase/config';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
  updatePassword as firebaseUpdatePassword,
  convertFirebaseUser,
  getIdToken
} from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

export interface SignUpParams {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'landlord' | 'tenant';
  landlordCode?: string;
}

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

class AuthClient {
  async signUp(params: SignUpParams): Promise<{ error?: string }> {
    const { username, firstName, lastName, email, password, phone, role, landlordCode } = params;
    
   
    const result = await signUpWithEmail(email, password, {
      username,
      firstName,
      lastName,
      phone,
      role,
      landlordCode
    });

    if (result.error) {
      return { error: result.error };
    }

    return {};
  }

  async signInWithOAuth(params: SignInWithOAuthParams): Promise<{ error?: string }> {
    if (params.provider === 'google') {
      const result = await signInWithGoogle();
      if (result.error) {
        return { error: result.error };
      }
      return {};
    }
    
    return { error: 'Only Google authentication is supported' };
  }

  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
    const { email, password } = params;
    
   
    const result = await signInWithEmail(email, password);
    
    if (result.error) {
      return { error: result.error };
    }

    return {};
  }

  async resetPassword(params: ResetPasswordParams): Promise<{ error?: string }> {
    const result = await firebaseResetPassword(params.email);
    return result;
  }

  async updatePassword(params: { password: string }): Promise<{ error?: string }> {
    const result = await firebaseUpdatePassword(params.password);
    return result;
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    try {
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        return { data: null };
      }

      const user = await convertFirebaseUser(firebaseUser);
      return { data: user };
    } catch (err: any) {
      console.error('Get user error:', err);
      return { data: null, error: err.message || 'Failed to get user' };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    const result = await firebaseSignOut();
    return result;
  }


  async getIdToken(): Promise<string | null> {
    return await getIdToken();
  }


  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await convertFirebaseUser(firebaseUser);
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const authClient = new AuthClient();
