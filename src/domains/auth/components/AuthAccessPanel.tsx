import { Button, Card, CardContent, CardHeader, CardTitle } from "@shared/ui/primitives";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";

interface AuthAccessPanelProps {
  variant?: "card" | "bar";
}

export function AuthAccessPanel({ variant = "card" }: AuthAccessPanelProps) {
  const { status, user, errorMessage, loginWithGoogle, logout, clearError } = useAuthSession();

  const isBusy = status === "checking";
  const isAuthenticated = status === "authenticated";
  const displayName = user?.displayName ?? user?.email ?? "usuario";
  const userInitial = displayName.trim().charAt(0).toUpperCase() || "U";
  const photoUrl = user?.photoURL?.trim();

  if (variant === "bar") {
    return (
      <div className="rounded-2xl border border-border/70 bg-surface/80 px-3 py-3 shadow-sm backdrop-blur sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`Avatar de ${displayName}`}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-foreground ring-1 ring-border">
                  {userInitial}
                </div>
              )}

              {isAuthenticated ? (
                <span
                  className="state-success-dot absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface"
                  aria-hidden="true"
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Sesión
              </p>
              {isAuthenticated && user ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email ?? "Sesión activa"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isBusy ? "Comprobando sesión..." : "Inicia sesión para sincronizar tu biblioteca."}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:pl-4">
            {!isAuthenticated ? (
              <Button onClick={loginWithGoogle} disabled={isBusy} size="sm">
                {isBusy ? "Conectando..." : "Entrar con Google"}
              </Button>
            ) : (
              <Button variant="secondary" onClick={logout} disabled={isBusy} size="sm">
                {isBusy ? "Saliendo..." : "Cerrar sesión"}
              </Button>
            )}
          </div>
        </div>

        {errorMessage ? (
          <div className="state-danger-panel mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm">
            <p>{errorMessage}</p>
            <button type="button" className="state-panel-action rounded px-1 py-0.5 underline" onClick={clearError}>
              Ocultar
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Sesión</CardTitle>
      </CardHeader>

      <CardContent>
        {user ? (
          <p className="text-sm text-muted-foreground">
            Conectado como <strong>{user.displayName ?? user.email ?? "usuario"}</strong>
          </p>
        ) : null}

        {errorMessage ? (
          <div className="state-danger-panel mt-3 rounded-md border px-3 py-2 text-sm">
            <p>{errorMessage}</p>
            <button type="button" className="state-panel-action mt-1 rounded px-1 py-0.5 underline" onClick={clearError}>
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
