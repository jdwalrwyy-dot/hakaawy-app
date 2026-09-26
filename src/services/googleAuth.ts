/**
 * Google Authentication Service for Hekawy
 * Powered by Firebase Authentication & Official Google Identity Services (GSI).
 * Uses the verified Google Cloud project OAuth credentials for gen-lang-client-0351585715.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithCredential,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: (options?: any) => void;
          };
          initCodeClient: (config: any) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

// Initialize Firebase App & Auth with official project configuration
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(firebaseApp);

// Try configuring persistence safely
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch {}

/**
 * Returns the exact, verified Google OAuth 2.0 Client ID for this Google Cloud Project.
 */
export function getValidGoogleClientId(): string {
  if (firebaseConfig?.oAuthClientId && firebaseConfig.oAuthClientId.endsWith('.apps.googleusercontent.com')) {
    return firebaseConfig.oAuthClientId.trim();
  }
  const envVal = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (typeof envVal === 'string' && envVal.endsWith('.apps.googleusercontent.com')) {
    return envVal.trim();
  }
  return '271777381853-i3jrp7m59hv5v3mof2o4ebjr94585uad.apps.googleusercontent.com';
}

export const GOOGLE_CLIENT_ID = getValidGoogleClientId();

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  name: string;
  avatar: string;
}

/**
 * Helper to dynamically ensure Google Identity Services (GSI) SDK is loaded
 */
export function ensureGsiLoaded(): Promise<boolean> {
  if (window.google?.accounts) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.google?.accounts) {
        clearInterval(interval);
        resolve(true);
      } else if (attempts > 30) {
        clearInterval(interval);
        resolve(false);
      }
      attempts++;
    }, 100);
  });
}

/**
 * Decode JWT token returned by Google Identity Services
 */
export function decodeGoogleJwt(token: string): GoogleUserProfile | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const data = JSON.parse(jsonPayload);
    return {
      googleId: data.sub || data.user_id || `g_${Date.now()}`,
      email: data.email || '',
      name: data.name || data.given_name || (data.email ? data.email.split('@')[0] : 'مستخدم Google'),
      avatar: data.picture || ''
    };
  } catch (err) {
    console.error('Failed to decode Google JWT token:', err);
    return null;
  }
}

/**
 * Render the official Google Sign-In Button directly into a DOM element.
 * Tapping this button on Android launches the native Google Play Services Account Picker.
 */
export function renderGoogleSignInButton(
  container: HTMLElement,
  onSuccess: (profile: GoogleUserProfile) => void,
  onError: (err: Error) => void
): () => void {
  const clientId = getValidGoogleClientId();
  let isCancelled = false;

  const initAndRender = () => {
    if (isCancelled || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response && response.credential) {
            const profile = decodeGoogleJwt(response.credential);
            if (profile) {
              onSuccess(profile);
            } else {
              onError(new Error('تعذر قراءة بيانات حساب Google'));
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });

      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: 320,
        locale: 'ar'
      });
    } catch (e: any) {
      console.warn('Error initializing Google Button:', e);
    }
  };

  ensureGsiLoaded().then(() => {
    if (!isCancelled) {
      initAndRender();
    }
  });

  return () => {
    isCancelled = true;
  };
}

/**
 * Trigger official Google Sign In.
 * Opens Google's native Account Picker displaying ALL accounts present on the device.
 */
export async function triggerGoogleSignIn(): Promise<GoogleUserProfile> {
  const clientId = getValidGoogleClientId();
  await ensureGsiLoaded();

  // Primary Flow: Google Identity Services (GSI) Token Client with prompt: 'select_account'
  if (window.google?.accounts?.oauth2?.initTokenClient) {
    try {
      const profile = await new Promise<GoogleUserProfile>((resolve, reject) => {
        try {
          const tokenClient = window.google!.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile openid',
            callback: async (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                let userInfo: any = null;
                
                // Attempt 1: Google OAuth2 v3 userinfo
                try {
                  const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  const ct = userinfoRes.headers.get('content-type') || '';
                  const txt = await userinfoRes.text();
                  if (userinfoRes.ok && ct.includes('application/json')) {
                    userInfo = JSON.parse(txt);
                  }
                } catch (e) {
                  console.warn('Failed Google v3 userinfo fetch:', e);
                }

                // Attempt 2: Google OAuth2 v2 userinfo fallback
                if (!userInfo) {
                  try {
                    const userinfoRes2 = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                      headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                    });
                    const ct2 = userinfoRes2.headers.get('content-type') || '';
                    const txt2 = await userinfoRes2.text();
                    if (userinfoRes2.ok && ct2.includes('application/json')) {
                      userInfo = JSON.parse(txt2);
                    }
                  } catch (e) {
                    console.warn('Failed Google v2 userinfo fetch:', e);
                  }
                }

                if (userInfo && (userInfo.sub || userInfo.id) && userInfo.email) {
                  try {
                    const credential = GoogleAuthProvider.credential(null, tokenResponse.access_token);
                    await signInWithCredential(auth, credential);
                  } catch (e) {
                    // non-critical Firebase session sync error
                  }
                  resolve({
                    googleId: userInfo.sub || userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name || (userInfo.email ? userInfo.email.split('@')[0] : 'مستخدم Google'),
                    avatar: userInfo.picture || userInfo.avatar || ''
                  });
                  return;
                }
              }

              if (tokenResponse?.error === 'access_denied') {
                reject(new Error('تم إلغاء اختيار الحساب'));
              } else if (tokenResponse?.error) {
                reject(new Error(`خطأ Google: ${tokenResponse.error}`));
              } else {
                reject(new Error('لم يتم تحديد حساب Google'));
              }
            },
            error_callback: (err: any) => {
              reject(new Error(err?.message || 'تعذر فتح نافذة اختيار حسابات Google'));
            }
          });

          // Forces Android & Desktop browsers to open the official Google Account Picker with all phone accounts
          tokenClient.requestAccessToken({ prompt: 'select_account' });
        } catch (err: any) {
          reject(err);
        }
      });

      return profile;
    } catch (gsiErr: any) {
      if (gsiErr.message?.includes('إلغاء') || gsiErr.message?.includes('access_denied')) {
        throw gsiErr;
      }
      console.warn('GSI Token Client flow failed or skipped, trying Firebase Popup fallback:', gsiErr);
    }
  }

  // Fallback Flow: Firebase Authentication Google Provider with prompt: 'select_account'
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    provider.addScope('email');
    provider.addScope('profile');
    provider.addScope('openid');

    const result = await signInWithPopup(auth, provider);
    if (result && result.user) {
      const user = result.user;
      return {
        googleId: user.providerData[0]?.uid || user.uid,
        email: user.email || '',
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'مستخدم Google'),
        avatar: user.photoURL || ''
      };
    }
  } catch (firebaseErr: any) {
    if (firebaseErr?.code === 'auth/popup-closed-by-user' || firebaseErr?.message?.includes('closed-by-user')) {
      throw new Error('تم إلغاء اختيار الحساب');
    }
    throw new Error(firebaseErr?.message || 'تعذر تسجيل الدخول بحساب Google');
  }

  throw new Error('تعذر إكمال تسجيل الدخول عبر Google');
}
