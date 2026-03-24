import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/primitives";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";

interface ProtectedAreaProps {
  children: ReactNode;
}

export function ProtectedArea({ children }: ProtectedAreaProps) {
  const { status, errorMessage } = useAuthSession();

  if (status === "checking") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificando sesión...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (status !== "authenticated") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Debes iniciar sesión con Google para abrir esta sección privada.
          </p>
          {errorMessage ? <p className="state-error-text mt-2 text-sm">{errorMessage}</p> : null}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
