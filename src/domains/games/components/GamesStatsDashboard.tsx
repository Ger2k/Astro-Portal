import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import { fetchCompletedGamesForUser } from "@domains/games/services/completedGamesService";
import type { CompletedGame } from "@domains/games/types/completedGame";
import { buildGamesStats } from "@domains/games/lib/stats";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@shared/ui/primitives";

function formatAverageScore(score: number | null) {
  if (score === null) return "N/D";
  return score.toFixed(1);
}

function RefreshIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

function DistributionBars({
  items,
}: {
  items: Array<{ label: string; count: number }>;
}) {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate pr-2 text-foreground">{item.label}</span>
            <span>{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${(item.count / max) * 100}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GamesStatsDashboard() {
  const { user } = useAuthSession();
  const [games, setGames] = useState<CompletedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadGames() {
    if (!user) {
      setGames([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const result = await fetchCompletedGamesForUser(user.uid);

    if (!result.ok) {
      setGames([]);
      setErrorMessage(result.errorMessage);
      setLoading(false);
      return;
    }

    setGames(result.data);
    setLoading(false);
  }

  useEffect(() => {
    void loadGames();
  }, [user?.uid]);

  const stats = useMemo(() => buildGamesStats(games), [games]);

  const topPlatforms = stats.platformDistribution.slice(0, 5).map((item) => ({
    label: item.platform,
    count: item.count,
  }));

  const monthlyActivity = stats.monthlyActivity.map((item) => ({
    label: item.label,
    count: item.count,
  }));

  const highlight =
    stats.topPlatform === null
      ? "Añade algunos juegos para desbloquear tus insights personalizados."
      : `Tu plataforma más fuerte es ${stats.topPlatform.platform} con ${stats.topPlatform.count} juegos completados.`;

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Estadísticas</CardTitle>
            <div className="flex items-center gap-2">
              <a
                href="/app"
                className="rounded-(--radius-md) border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Volver a la biblioteca
              </a>
              <Button
                variant="ghost"
                onClick={() => void loadGames()}
                disabled={loading}
                className="h-10 w-10 p-0 hover:bg-transparent"
                aria-label={loading ? "Actualizando estadísticas" : "Actualizar estadísticas"}
                title={loading ? "Actualizando..." : "Actualizar"}
              >
                <RefreshIcon className={loading ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Insights de tu progreso para entender hábitos y evolución de tu biblioteca.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Calculando métricas...</p> : null}

          {!loading && errorMessage ? (
            <p className="state-danger-panel rounded-md border px-3 py-2 text-sm">{errorMessage}</p>
          ) : null}

          {!loading && !errorMessage && games.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no tienes datos suficientes. Añade juegos en tu biblioteca para ver estadísticas.
            </p>
          ) : null}

          {!loading && !errorMessage && games.length > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Juegos completados</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.totalGames}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Horas registradas</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.totalHours}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Puntuación media</p>
                  <p className="text-2xl font-semibold text-foreground">{formatAverageScore(stats.averageScore)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Plataforma top</p>
                  <p className="line-clamp-1 text-lg font-semibold text-foreground">
                    {stats.topPlatform?.platform ?? "Sin datos"}
                  </p>
                </Card>
              </div>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{highlight}</p>
              </Card>

              <div className="grid gap-3 lg:grid-cols-2">
                <Card className="p-4">
                  <CardHeader className="mb-3 p-0">
                    <CardTitle className="text-base">Distribución por plataforma</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DistributionBars items={topPlatforms} />
                  </CardContent>
                </Card>

                <Card className="p-4">
                  <CardHeader className="mb-3 p-0">
                    <CardTitle className="text-base">Evolución (últimos 6 meses)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DistributionBars items={monthlyActivity} />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
