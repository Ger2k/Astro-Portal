import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import { fetchCompletedGamesForUser } from "@domains/games/services/completedGamesService";
import { buildGamesStats } from "@domains/games/lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/primitives";
import type { CompletedGame } from "@domains/games/types/completedGame";

function formatAverageScore(score: number | null) {
  if (score === null) return "N/D";
  return score.toFixed(1);
}

export function GamesStatsTeaser() {
  const { user } = useAuthSession();
  const [games, setGames] = useState<CompletedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setGames([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const result = await fetchCompletedGamesForUser(user.uid);

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setGames([]);
        setError(result.errorMessage);
        setLoading(false);
        return;
      }

      setGames(result.data);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const stats = useMemo(() => buildGamesStats(games), [games]);

  return (
    <Card className="p-4 sm:p-5">
      <CardHeader className="mb-2 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">Resumen rápido</CardTitle>
          <a
            href="/app/stats"
            className="rounded-(--radius-md) border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Ver estadísticas
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          Un vistazo rápido de tu progreso. Para análisis completo, entra en estadísticas.
        </p>
      </CardHeader>

      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Cargando resumen...</p> : null}

        {!loading && error ? <p className="state-danger-text text-sm">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-surface px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Juegos</p>
              <p className="text-lg font-semibold text-foreground">{stats.totalGames}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-surface px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Horas</p>
              <p className="text-lg font-semibold text-foreground">{stats.totalHours}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-surface px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Media score</p>
              <p className="text-lg font-semibold text-foreground">{formatAverageScore(stats.averageScore)}</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
