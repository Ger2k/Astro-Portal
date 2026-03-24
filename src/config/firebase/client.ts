import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

type FirebaseEnv = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  databaseURL: string;
};

let appInstance: FirebaseApp | null = null;

function readFirebaseEnv(): FirebaseEnv {
  const apiKey = import.meta.env.PUBLIC_FIREBASE_API_KEY;
  const authDomain = import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID;
  const appId = import.meta.env.PUBLIC_FIREBASE_APP_ID;
  const databaseURL = import.meta.env.PUBLIC_FIREBASE_DATABASE_URL;

  if (!apiKey || !authDomain || !projectId || !appId || !databaseURL) {
    throw new Error(
      "Configuracion Firebase incompleta. Define PUBLIC_FIREBASE_API_KEY, PUBLIC_FIREBASE_AUTH_DOMAIN, PUBLIC_FIREBASE_PROJECT_ID, PUBLIC_FIREBASE_APP_ID y PUBLIC_FIREBASE_DATABASE_URL en tu entorno.",
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    databaseURL,
  };
}

export function getFirebaseApp() {
  if (appInstance) {
    return appInstance;
  }

  appInstance = initializeApp(readFirebaseEnv());
  return appInstance;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb() {
  return getDatabase(getFirebaseApp());
}
