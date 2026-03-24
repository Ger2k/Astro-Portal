import type { ReactNode } from "react";
import { AuthProvider } from "@domains/auth/context/AuthContext";

interface AuthPageShellProps {
  children: ReactNode;
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
