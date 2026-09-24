// Multi-Tier Sync Engine: BroadcastChannel + Optional Cloud Firebase Sync
import { store } from '../state/store.js';

let broadcast = null;
let isBroadcasting = false;

// Dynamic Firebase reference
let firebaseApp = null;
let firestoreDb = null;
let firestoreUnsubscribe = null;

export function initSyncEngine() {
  // 1. Browser Tab Broadcast Sync
  try {
    if ('BroadcastChannel' in window) {
      broadcast = new BroadcastChannel('hackathon_g16_sync');
      broadcast.onmessage = (event) => {
        if (isBroadcasting) return;
        const { type, payload } = event.data;
        if (type === 'SYNC_STATE' && payload) {
          isBroadcasting = true;
          store.importData(payload);
          isBroadcasting = false;
        }
      };
    }
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }

  // Listen to local store mutations and broadcast to other tabs
  store.subscribe((event, payload, state) => {
    if (isBroadcasting) return;
    
    // Broadcast locally to tabs
    if (broadcast) {
      try {
        broadcast.postMessage({
          type: 'SYNC_STATE',
          payload: {
            teamMembers: state.teamMembers,
            ideas: state.ideas,
            messages: state.messages,
            resources: state.resources,
            teamName: state.teamName,
            targetTime: state.targetTime
          }
        });
      } catch (e) {}
    }

    // Push to Firebase if configured
    if (firestoreDb && !window._isApplyingRemote) {
      pushStateToCloud(state);
    }
  });

  // Check environment variables first (e.g. from Vercel deploy)
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  if (envConfig.apiKey && envConfig.projectId) {
    connectFirebase(envConfig).catch(err => {
      console.warn('Failed connecting Firebase via environment variables:', err);
    });
  } else {
    // Check if Firebase config exists in store
    const state = store.getState();
    if (state.firebaseConfig) {
      connectFirebase(state.firebaseConfig).catch(err => {
        console.warn('Failed auto-connecting Firebase from store:', err);
      });
    }
  }
}

export async function connectFirebase(config) {
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getFirestore, doc, setDoc, onSnapshot } = await import('firebase/firestore');

    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    firestoreDb = getFirestore(firebaseApp);

    const roomCode = store.getState().roomCode || 'g16-vanguard';
    const roomRef = doc(firestoreDb, 'hackathons', roomCode);

    // Subscribe to cloud updates
    if (firestoreUnsubscribe) firestoreUnsubscribe();
    
    firestoreUnsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        if (cloudData) {
          window._isApplyingRemote = true;
          store.importData(cloudData);
          window._isApplyingRemote = false;
        }
      } else {
        // Document doesn't exist yet, seed initial
        pushStateToCloud(store.getState());
      }
    }, (error) => {
      console.error('Firebase snapshot error:', error);
    });

    store.setFirebaseConfig(config);
    window.dispatchEvent(new CustomEvent('cloud-sync-status', { detail: { connected: true } }));
    return { success: true };
  } catch (error) {
    console.error('Firebase connection failed:', error);
    window.dispatchEvent(new CustomEvent('cloud-sync-status', { detail: { connected: false, error: error.message } }));
    return { success: false, error: error.message };
  }
}

export async function pushStateToCloud(state) {
  if (!firestoreDb) return;
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const roomCode = state.roomCode || 'g16-vanguard';
    const roomRef = doc(firestoreDb, 'hackathons', roomCode);

    await setDoc(roomRef, {
      teamMembers: state.teamMembers,
      ideas: state.ideas,
      messages: state.messages,
      resources: state.resources,
      teamName: state.teamName,
      targetTime: state.targetTime,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Failed pushing state to cloud:', err);
  }
}

let firebaseAuth = null;

export async function getFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;
  if (!firebaseApp) {
    const envConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    const cfg = (envConfig.apiKey && envConfig.projectId) ? envConfig : store.getState().firebaseConfig;
    if (cfg) {
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      firebaseApp = getApps().length === 0 ? initializeApp(cfg) : getApp();
    }
  }
  if (firebaseApp) {
    const { getAuth } = await import('firebase/auth');
    firebaseAuth = getAuth(firebaseApp);
    return firebaseAuth;
  }
  return null;
}

export async function signInWithGoogle() {
  const auth = await getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase configuration not found. Please set Vercel environment variables or enter Firebase config.');
  }
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export function isCloudConnected() {
  return !!firestoreDb;
}
