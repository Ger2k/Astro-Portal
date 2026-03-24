import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { getFirebaseAuth } from "@config/firebase/client";

function humanizeAuthError(error: unknown) {
  const firebaseError = error as FirebaseError | undefined;
  const code = firebaseError?.code ?? "";

  if (code === "auth/popup-closed-by-user") {
    return "Se cerró la ventana de Google antes de terminar el login.";
  }

  if (code === "auth/popup-blocked") {
    return "El navegador bloqueó la ventana emergente. Habilita popups para continuar.";
  }

  if (code === "auth/network-request-failed") {
    return "Fallo de red al conectar con Google. Revisa tu conexión e intenta otra vez.";
  }

  if (code === "auth/unauthorized-domain") {
    return "Este dominio no está autorizado en Firebase Authentication. Agrega el dominio de Netlify en Authentication > Settings > Authorized domains.";
  }

  if (code === "auth/operation-not-allowed") {
    return "El proveedor Google no está habilitado en Firebase Authentication > Sign-in method.";
  }

  if (!(error instanceof Error)) {
    return "No se pudo completar la autenticación. Intenta nuevamente.";
  }

  return error.message;
}

export async function signInWithGooglePopup() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const auth = getFirebaseAuth();
    const result = await signInWithPopup(auth, provider);

    return {
      ok: true as const,
      user: result.user,
      errorMessage: null,
    };
  } catch (error) {
    // Deja información útil en consola para depurar entorno (dominios, provider, etc.).
    console.error("[auth] Google sign-in failed", error);
    return {
      ok: false as const,
      user: null,
      errorMessage: humanizeAuthError(error),
    };
  }
}

export async function logoutCurrentUser() {
  try {
    const auth = getFirebaseAuth();
    await signOut(auth);

    return {
      ok: true as const,
      errorMessage: null,
    };
  } catch (error) {
    return {
      ok: false as const,
      errorMessage: humanizeAuthError(error),
    };
  }
}

export type AuthServiceResult =
  | { ok: true; user: User; errorMessage: null }
  | { ok: false; user: null; errorMessage: string };
