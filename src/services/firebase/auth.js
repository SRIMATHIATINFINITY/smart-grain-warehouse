import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth } from "./client.js";

export function observeFirebaseAuth(onUser, onError) {
  return onAuthStateChanged(getFirebaseAuth(), onUser, onError);
}

export function signInWithEmailPassword(email, password) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export function signOutFirebaseUser() {
  return signOut(getFirebaseAuth());
}

export async function hasDashboardReaderClaim(user) {
  const tokenResult = await getIdTokenResult(user);
  return tokenResult.claims.dashboardReader === true;
}
