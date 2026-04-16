import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC5JtCGieuOK-eigZ_3dhgrODiyMfD7C4s",
  authDomain: "hmp-masala.firebaseapp.com",
  projectId: "hmp-masala",
  storageBucket: "hmp-masala.firebasestorage.app",
  messagingSenderId: "141186355260",
  appId: "1:141186355260:web:e54c5e81c0cbdd02d47339"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
