import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCEkVK21-OSqE857hzbEBmVNOqpYY0Oays',
  authDomain: 'jifunze-7dbfe.firebaseapp.com',
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
