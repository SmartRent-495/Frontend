/**
 * Firebase Authentication Helper Functions
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { auth } from './config';
import type { User } from '@/types/user';

const googleProvider = new GoogleAuthProvider();

/**
 * Convert Firebase user to our User type
 * Fetches role and additional data from backend SQLite
 */
export async function convertFirebaseUser(firebaseUser: FirebaseUser): Promise<User | null> {
  try {
    // Get Firebase ID token
    const token = await firebaseUser.getIdToken();
    
    // Fetch user data from backend (which has the correct role from SQLite)
    // Retry logic for newly created users (registration might still be processing)
    const maxRetries = 3;
    const retryDelay = 500; // ms
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${backendUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && result.data) {
            const backendUser = result.data;
            console.log('[convertFirebaseUser] User data fetched successfully:', { email: backendUser.email, role: backendUser.role });
            return {
              id: backendUser.id?.toString() || firebaseUser.uid,
              username: backendUser.username || firebaseUser.email?.split('@')[0] || '',
              email: backendUser.email || firebaseUser.email || '',
              role: backendUser.role || 'tenant',
              first_name: backendUser.first_name || '',
              last_name: backendUser.last_name || '',
              phone: backendUser.phone || '',
              avatar_url: backendUser.avatar_url || firebaseUser.photoURL || '',
              created_at: backendUser.created_at || new Date().toISOString(),
              name: `${backendUser.first_name || ''} ${backendUser.last_name || ''}`.trim() || firebaseUser.displayName || '',
              avatar: backendUser.avatar_url || firebaseUser.photoURL || ''
            };
          }
        } else if (response.status === 404 && attempt < maxRetries - 1) {
          // User not found yet - registration might still be processing
          console.log(`[convertFirebaseUser] User not found (attempt ${attempt + 1}/${maxRetries}), retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      } catch (backendError) {
        console.log('[convertFirebaseUser] Backend call failed:', backendError);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
    }
    
    // All retries failed - use Firebase data as fallback
    console.log('[convertFirebaseUser] Backend not available after retries, using Firebase data only');
    const nameParts = (firebaseUser.displayName || '').split(' ');
    return {
      id: firebaseUser.uid,
      username: firebaseUser.email?.split('@')[0] || '',
      email: firebaseUser.email || '',
      role: 'tenant', // Default role if backend unavailable
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      phone: firebaseUser.phoneNumber || '',
      avatar_url: firebaseUser.photoURL || '',
      created_at: new Date().toISOString(),
      name: firebaseUser.displayName || firebaseUser.email || '',
      avatar: firebaseUser.photoURL || ''
    };
  } catch (error) {
    console.error('Error converting Firebase user:', error);
    return null;
  }
}

/**
 * Sign up a new user with email and password
 */
/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  userData: {
    username: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'landlord' | 'tenant';
    landlordCode?: string;
  }
) {
  try {
    // Normalize email before creating account
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log('📝 Creating Firebase account with:', {
      email: normalizedEmail,
      role: userData.role,
      username: userData.username
    });
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const user = userCredential.user;

    console.log('✅ Firebase user created:', user.uid);

    // Update display name
    await updateProfile(user, {
      displayName: `${userData.firstName} ${userData.lastName}`
    });

    // IMPORTANT: Get the Firebase ID token
    console.log('🔑 Getting Firebase ID token...');
    const token = await user.getIdToken(true); // Force refresh
    console.log('🔑 Token obtained, length:', token.length);

    // Call backend to register user in Firestore database (REQUIRED for role)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      const requestBody = {
        username: userData.username,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone || '',
        role: userData.role,
        landlordCode: userData.landlordCode
      };
      
      console.log('📤 Sending to backend:', backendUrl + '/auth/firebase-register');
      console.log('📤 Request body:', requestBody);
      console.log('📤 Token (first 50 chars):', token.substring(0, 50) + '...');
      
      const response = await fetch(`${backendUrl}/auth/firebase-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Use the token we just got
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 Backend response status:', response.status);
      
      const responseText = await response.text();
      console.log('📥 Backend response:', responseText);
      
      if (response.ok) {
        const result = JSON.parse(responseText);
        console.log('✅ User registered in backend database with role:', result.data?.role);
        return { user, error: null };
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { message: responseText || 'Unknown error' };
        }
        console.error('❌ Backend registration failed:', errorData);
        console.error('❌ Status code:', response.status);
        
        // Delete Firebase user if backend registration fails
        await user.delete();
        return { error: errorData.message || 'Registration failed. Please check your details.' };
      }
    } catch (backendError) {
      console.error('⚠️ Backend registration error:', backendError);
      console.error('⚠️ Error details:', {
        name: backendError instanceof Error ? backendError.name : 'unknown',
        message: backendError instanceof Error ? backendError.message : String(backendError)
      });
      
      // Delete the Firebase user since backend registration failed
      await user.delete();
      return { error: 'Backend server is not responding. Please make sure the server is running.' };
    }
  } catch (error: any) {
    console.error('Sign up error:', error);
    let errorMessage = error.message;
    
    // User-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please sign in instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    
    return { user: null, error: errorMessage };
  }
}

/**
 * Sign in with email and password
 */
/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    // Add logging to see exactly what we're sending
    console.log('🔐 Attempting sign in with:', {
      email: email,
      emailLength: email.length,
      passwordLength: password.length
    });
    
    // Trim and normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log('🔐 Normalized email:', normalizedEmail);
    
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    
    console.log('✅ Sign in successful:', userCredential.user.uid);
    
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('❌ Sign in error:', error.code, error.message);
    let errorMessage = 'Invalid email or password';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password. Please check your credentials.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later';
    }
    
    return { user: null, error: errorMessage };
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Register user in backend (will create if doesn't exist)
    try {
      const token = await user.getIdToken();
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const nameParts = user.displayName?.split(' ') || ['', ''];
      
      await fetch(`${backendUrl}/auth/firebase-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: user.email?.split('@')[0] || '',
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          phone: user.phoneNumber || '',
          role: 'tenant' // Default role for Google sign-in
        })
      });
      console.log('✅ Google user registered/updated in backend');
    } catch (e) {
      console.log('Backend registration will happen on first API call');
    }

    return { user, error: null };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    return { user: null, error: error.message };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error: error.message };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { error: error.message };
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { error: 'No user is currently signed in' };
    }
    
    await firebaseUpdatePassword(user, newPassword);
    return { error: null };
  } catch (error: any) {
    console.error('Update password error:', error);
    return { error: error.message };
  }
}

/**
 * Get current user's Firebase ID token (for backend API calls)
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}
