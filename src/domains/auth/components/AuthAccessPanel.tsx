import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/primitives";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";

export function AuthAccessPanel() {
  const { status, user, errorMessage, loginWithGoogle, logout, clearError } = useAuthSession();

  const isBusy = status === "checking";
  const isAuthenticated = status === "authenticated";

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Sesión</CardTitle>
        <CardDescription>
          {isAuthenticated
            ? "Tu sesión está activa."
            : "Necesitas iniciar sesión con Google para usar funciones privadas."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {user ? (
          <p className="text-sm text-muted-foreground">
            Conectado como <strong>{user.displayName ?? user.email ?? "usuario"}</strong>
          </p>
        ) : null}

        {errorMessage ? (
          <div className="mt-3 rounded-md border border-danger bg-red-50 px-3 py-2 text-sm text-red-900">
            <p>{errorMessage}</p>
            <button type="button" className="mt-1 underline" onClick={clearError}>
              Ocultar mensaje
            </button>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          {!isAuthenticated ? (
            <Button onClick={loginWithGoogle} disabled={isBusy}>
              {isBusy ? "Conectando..." : "Entrar con Google"}
            </Button>
          ) : (
            <Button variant="secondary" onClick={logout} disabled={isBusy}>
              {isBusy ? "Saliendo..." : "Cerrar sesión"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
