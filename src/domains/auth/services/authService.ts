import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@config/firebase/client";

function humanizeAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return "No se pudo completar la autenticacion. Intenta nuevamente.";
  }

  if (error.message.includes("popup-closed-by-user")) {
    return "Se cerro la ventana de Google antes de terminar el login.";
  }

  if (error.message.includes("popup-blocked")) {
    return "El navegador bloqueo la ventana emergente. Habilita popups para continuar.";
  }

  if (error.message.includes("network-request-failed")) {
    return "Fallo de red al conectar con Google. Revisa tu conexion e intenta otra vez.";
  }

  return error.message;
}

export async function signInWithGooglePopup() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const auth = getFirebaseAuth();
    const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);

    return {
      ok: true as const,
      user: result.user,
      errorMessage: null,
    };
  } catch (error) {
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
