import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@config/firebase/client";
import { logoutCurrentUser, signInWithGooglePopup } from "@domains/auth/services/authService";
import type { AuthState } from "@domains/auth/types/session";

type AuthContextValue = AuthState & {
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const initialState: AuthState = {
  user: null,
  status: "checking",
  errorMessage: null,
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      const auth = getFirebaseAuth();

      unsubscribe = onAuthStateChanged(auth, (user) => {
        setState({
          user,
          status: user ? "authenticated" : "unauthenticated",
          errorMessage: null,
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inicializando autenticación";
      setState({
        user: null,
        status: "error",
        errorMessage: message,
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setState((current) => ({ ...current, status: "checking", errorMessage: null }));

    const result = await signInWithGooglePopup();

    if (!result.ok) {
      setState((current) => ({
        ...current,
        status: "error",
        errorMessage: result.errorMessage,
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    const result = await logoutCurrentUser();

    if (!result.ok) {
      setState((current) => ({
        ...current,
        status: "error",
        errorMessage: result.errorMessage,
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((current) => ({
      ...current,
      errorMessage: null,
      status: current.user ? "authenticated" : "unauthenticated",
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loginWithGoogle,
      logout,
      clearError,
    }),
    [state, loginWithGoogle, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
