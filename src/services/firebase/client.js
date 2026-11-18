import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig, isFirebaseConfigured } from "./config.js";

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Set the required VITE_FIREBASE_* variables in .env.local.",
    );
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
