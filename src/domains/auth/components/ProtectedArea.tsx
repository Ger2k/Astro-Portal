import type { ReactNode } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@shared/ui/primitives";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";

interface ProtectedAreaProps {
  children: ReactNode;
}

export function ProtectedArea({ children }: ProtectedAreaProps) {
  const { status, errorMessage, loginWithGoogle } = useAuthSession();

  if (status === "checking") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificando sesion...</CardTitle>
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
            Debes iniciar sesion con Google para abrir esta seccion privada.
          </p>
          {errorMessage ? <p className="mt-2 text-sm text-red-700">{errorMessage}</p> : null}
          <Button className="mt-4" onClick={loginWithGoogle}>
            Iniciar sesion
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
