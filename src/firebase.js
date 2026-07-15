import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCEkVK21-OSqE857hzbEBmVNOqpYY0Oays',
  authDomain: 'jifunze.solidaridadnetwork.org',
  projectId: 'jifunze-7dbfe',
  storageBucket: 'jifunze-7dbfe.firebasestorage.app',
  messagingSenderId: '691453522651',
  appId: '1:691453522651:web:153605cba36d5ae27d52fe',
};

export const ALLOWED_DOMAIN = 'solidaridadnetwork.org';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: ALLOWED_DOMAIN,
  prompt: 'select_account',
});

// IndexedDB cache so progress survives offline use and refreshes (single-tab).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({}),
  }),
});
