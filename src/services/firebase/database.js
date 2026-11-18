import { getDatabase } from "firebase/database";
import { isRealtimeDatabaseEnabled } from "./config.js";
import { getFirebaseApp } from "./client.js";

export function getFirebaseDatabase(user) {
  if (!user?.uid) {
    throw new Error("Sign in before connecting to the Realtime Database.");
  }
  if (!isRealtimeDatabaseEnabled()) {
    throw new Error(
      "Realtime Database access is disabled. Deploy the secure database rules, then set VITE_FIREBASE_RULES_DEPLOYED=true.",
    );
  }

  return getDatabase(getFirebaseApp());
}
