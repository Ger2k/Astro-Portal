import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import { fetchCompletedGamesForUser } from "@domains/games/services/completedGamesService";
import { buildGamesStats } from "@domains/games/lib/stats";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@shared/ui/primitives";
import type { CompletedGame } from "@domains/games/types/completedGame";

function formatAverageScore(score: number | null) {
  if (score === null) return "N/D";
  return score.toFixed(1);
}

function getScoreCategory(score: number | null): string {
  if (score === null) return "Sin datos";
  if (score >= 90) return "Excelente";
  if (score >= 85) return "Muy Bueno";
  if (score >= 75) return "Bueno";
  if (score >= 50) return "Regular";
  return "Pobre";
}

interface StatBoxProps {
  label: string;
  value: string | number;
  icon: string;
  color?: "primary" | "success" | "warning" | "info";
}

function StatBox({ label, value, icon, color = "primary" }: StatBoxProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-green-500/10 text-green-600 border-green-200",
    warning: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    info: "bg-blue-500/10 text-blue-600 border-blue-200",
  };

  return (
    <div className={`rounded-lg border ${colorClasses[color]} px-3 py-3 backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-current opacity-70">{label}</p>
          <p className="mt-1.5 text-lg font-bold text-current">{value}</p>
        </div>
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      </div>
    </div>
  );
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
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">📊 Tu Avance</CardTitle>
          <a
            href="/app/stats"
            className="rounded-(--radius-md) border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Ver todo →
          </a>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : null}

        {!loading && error ? (
          <p className="state-danger-text text-sm">{error}</p>
        ) : null}

        {!loading && !error ? (
          <>
            {/* Stats Grid - 4 items en desktop, 2 en móvil */}
            <div className="grid gap-3 sm:grid-cols-2">
              <StatBox
                label="Juegos"
                value={stats.totalGames}
                icon="🎮"
                color="primary"
              />
              <StatBox
                label="Horas"
                value={stats.totalHours.toFixed(0)}
                icon="⏱️"
                color="info"
              />
              <StatBox
                label="Puntuación"
                value={formatAverageScore(stats.averageScore)}
                icon="⭐"
                color={
                  stats.averageScore && stats.averageScore >= 85
                    ? "success"
                    : stats.averageScore && stats.averageScore >= 75
                      ? "info"
                      : "warning"
                }
              />
              <StatBox
                label="Racha"
                value={`${stats.currentStreak}d`}
                icon="🔥"
                color="warning"
              />
            </div>

            {/* Highlight Insight */}
            {stats.topPlatform ? (
              <div className="rounded-lg border-l-4 border-l-primary bg-primary/5 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  💡 Highlight
                </p>
                <p className="mt-2 text-sm text-foreground">
                  Tu plataforma favorita es <span className="font-semibold">{stats.topPlatform.platform}</span>{" "}
                  con <span className="font-semibold">{stats.topPlatform.count}</span> jueg
                  {stats.topPlatform.count !== 1 ? "os" : "o"} completado
                  {stats.topPlatform.count !== 1 ? "s" : ""}.
                </p>
              </div>
            ) : null}

            {/* Category Badge */}
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-surface p-3">
              <span className="text-sm font-medium text-foreground">Categoría:</span>
              <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                {getScoreCategory(stats.averageScore)}
              </span>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
