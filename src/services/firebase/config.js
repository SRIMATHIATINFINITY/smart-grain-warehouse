export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isRealtimeDatabaseEnabled() {
  return import.meta.env.VITE_FIREBASE_RULES_DEPLOYED === "true";
}

const requiredConfigKeys = [
  "apiKey",
  "authDomain",
  "databaseURL",
  "projectId",
  "appId",
];

export function isFirebaseConfigured() {
  return requiredConfigKeys.every((key) => {
    const value = firebaseConfig[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}
