// src/firebase/config.js
// ─────────────────────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project named "bitwasa"
// 3. Enable Firestore Database (Start in test mode)
// 4. Enable Authentication → Email/Password
// 5. Go to Project Settings → Your Apps → Add Web App → name it "bitwasa"
// 6. Copy your firebaseConfig values below
// 7. In Firestore, create these collections manually or let the app auto-create:
//    - users (managed by Firebase Auth)
//    - consumers
//    - bills
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDnPnBQfitbarJsTjPjWhs5DcMaRzLEk00",
  authDomain: "bitwasa-6f291.firebaseapp.com",
  projectId: "bitwasa-6f291",
  storageBucket: "bitwasa-6f291.firebasestorage.app",
  messagingSenderId: "507170054319",
  appId: "1:507170054319:web:087cd65a1b18450041345a",
  measurementId: "G-8Q7JQB3MJ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
