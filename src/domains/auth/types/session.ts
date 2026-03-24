import type { User } from "firebase/auth";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated" | "error";

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  errorMessage: string | null;
}
