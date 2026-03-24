import { useContext } from "react";
import { AuthContext } from "@domains/auth/context/AuthContext";

export function useAuthSession() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthSession debe usarse dentro de AuthProvider.");
  }

  return context;
}
