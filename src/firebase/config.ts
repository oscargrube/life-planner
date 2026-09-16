import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDROUf9k1Uv3uT6prtOghCiEyViGxgQK-w",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "life-planner-backend.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://life-planner-backend-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "life-planner-backend",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "life-planner-backend.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "189661267406",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:189661267406:web:81e1b3b6f13e2a8567179f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3QJPC6S0KT"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics if supported in environment
export const analyticsPromise = isSupported().then((supported) => (supported ? getAnalytics(app) : null));


