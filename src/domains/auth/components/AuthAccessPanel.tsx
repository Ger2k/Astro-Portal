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
      <div className="rounded-xl border border-border/70 bg-surface/80 px-2.5 py-2 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`Avatar de ${displayName}`}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-foreground ring-1 ring-border">
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
              <p className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">
                Sesión
              </p>
              {isAuthenticated && user ? (
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
                    {displayName}
                  </p>
                  <p className="hidden max-w-48 truncate text-xs text-muted-foreground sm:block">
                    {user.email ?? "Sesión activa"}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {isBusy ? "Comprobando sesión..." : "Inicia sesión para sincronizar tu biblioteca."}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {!isAuthenticated ? (
              <Button onClick={loginWithGoogle} disabled={isBusy} size="sm" className="h-8 px-2.5 text-xs">
                {isBusy ? "..." : "Entrar"}
              </Button>
            ) : (
              <Button variant="secondary" onClick={logout} disabled={isBusy} size="sm" className="h-8 px-2.5 text-xs">
                {isBusy ? "..." : "Salir"}
              </Button>
            )}
          </div>
        </div>

        {errorMessage ? (
          <div className="state-danger-panel mt-2 flex items-center justify-between gap-2 rounded-lg border px-2 py-1 text-xs">
            <p className="truncate">{errorMessage}</p>
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

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {!isAuthenticated ? (
            <Button onClick={loginWithGoogle} disabled={isBusy} className="w-full sm:w-auto">
              {isBusy ? "Conectando..." : "Entrar con Google"}
            </Button>
          ) : (
            <Button variant="secondary" onClick={logout} disabled={isBusy} className="w-full sm:w-auto">
              {isBusy ? "Saliendo..." : "Cerrar sesión"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
