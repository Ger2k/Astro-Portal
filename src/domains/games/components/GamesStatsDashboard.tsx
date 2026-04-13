import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import { fetchCompletedGamesForUser } from "@domains/games/services/completedGamesService";
import { fetchAchievementsForUser } from "@domains/games/services/achievementsService";
import { evaluateAchievements } from "@domains/games/lib/achievementsEngine";
import { syncAchievementsForUser } from "@domains/games/lib/syncAchievementsForUser";
import { AchievementsPanel } from "@domains/games/components/AchievementsPanel";
import type { CompletedGame } from "@domains/games/types/completedGame";
import type { AchievementProgress, UserAchievement } from "@domains/games/types/achievement";
import {
  buildGamesStats,
  filterGamesForStats,
  getAvailablePlatforms,
  getAvailableYears,
} from "@domains/games/lib/stats";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@shared/ui/primitives";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatAverageScore(score: number | null) {
  if (score === null) return "N/D";
  return score.toFixed(1);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value);
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

type StatsView = "platforms" | "timeline";

export function GamesStatsDashboard() {
  const { user } = useAuthSession();
  const [games, setGames] = useState<CompletedGame[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UserAchievement[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [achievementError, setAchievementError] = useState<string | null>(null);
  const [view, setView] = useState<StatsView>("platforms");
  const [selectedYear, setSelectedYear] = useState("Todos");
  const [selectedPlatform, setSelectedPlatform] = useState("Todas");
  const [activityMonths, setActivityMonths] = useState("6");

  async function loadGames() {
    if (!user) {
      setGames([]);
      setUnlockedAchievements([]);
      setAchievementProgress([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setAchievementError(null);

    const result = await fetchCompletedGamesForUser(user.uid);

    if (!result.ok) {
      setGames([]);
      setErrorMessage(result.errorMessage);
      setLoading(false);
      return;
    }

    setGames(result.data);

    const syncResult = await syncAchievementsForUser(user.uid);
    if (!syncResult.ok) {
      setAchievementError(syncResult.errorMessage);
    }

    const achievementsResult = await fetchAchievementsForUser(user.uid);
    if (!achievementsResult.ok) {
      setUnlockedAchievements([]);
      setAchievementProgress([]);
      setAchievementError(achievementsResult.errorMessage);
      setLoading(false);
      return;
    }

    const evaluated = evaluateAchievements(result.data, achievementsResult.data);
    setUnlockedAchievements(evaluated.unlockedAll);
    setAchievementProgress(evaluated.progressList);
    setLoading(false);
  }

  useEffect(() => {
    void loadGames();
  }, [user?.uid]);

  const availableYears = useMemo(() => getAvailableYears(games), [games]);
  const availablePlatforms = useMemo(() => getAvailablePlatforms(games), [games]);

  const filteredGames = useMemo(
    () =>
      filterGamesForStats(games, {
        year: selectedYear,
        platform: selectedPlatform,
      }),
    [games, selectedPlatform, selectedYear],
  );

  const stats = useMemo(
    () => buildGamesStats(filteredGames, { activityMonths: Number(activityMonths) }),
    [activityMonths, filteredGames],
  );

  const topPlatforms = stats.platformDistribution.slice(0, 8).map((item) => ({
    platform: item.platform,
    count: item.count,
  }));

  const monthlyActivity = stats.monthlyActivity.map((item) => ({
    month: item.label,
    count: item.count,
  }));

  const highlight =
    stats.topPlatform === null
      ? "Añade algunos juegos para desbloquear tus insights personalizados."
      : `Tu plataforma más fuerte es ${stats.topPlatform.platform} con ${stats.topPlatform.count} juegos completados.`;

  const hasStats = filteredGames.length > 0;
  const scoreCoverage = stats.totalGames > 0 ? Math.round((stats.scoredGamesCount / stats.totalGames) * 100) : 0;
  const hoursCoverage = stats.totalGames > 0 ? Math.round((stats.gamesWithHoursCount / stats.totalGames) * 100) : 0;

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
          {loading ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-40" />
            </div>
          ) : null}

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
              <div className="grid gap-3 md:grid-cols-[200px_200px_minmax(0,1fr)]">
                <select
                  className="h-10 w-full rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  aria-label="Filtrar por año"
                >
                  <option value="Todos">Todos los años</option>
                  {availableYears.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>

                <select
                  className="h-10 w-full rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  aria-label="Filtrar por plataforma"
                >
                  <option value="Todas">Todas las plataformas</option>
                  {availablePlatforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>

                <Tabs value={view} onValueChange={(next) => setView(next as StatsView)}>
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="platforms" currentValue={view} onSelect={(next) => setView(next as StatsView)}>
                      Plataformas
                    </TabsTrigger>
                    <TabsTrigger value="timeline" currentValue={view} onSelect={(next) => setView(next as StatsView)}>
                      Evolución
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                <select
                  className="h-10 w-full rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={activityMonths}
                  onChange={(e) => setActivityMonths(e.target.value)}
                  aria-label="Ventana de actividad"
                >
                  <option value="6">Ultimos 6 meses</option>
                  <option value="12">Ultimos 12 meses</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Ventana temporal para analizar evolución y ritmo de completación.
                </p>
              </div>

              <Card className="stats-hero-panel p-5 reveal-up">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Panel de rendimiento</p>
                    <p className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                      {stats.totalGames === 0
                        ? "Tu panel esta listo para arrancar"
                        : `Has completado ${stats.totalGames} juegos con ${stats.totalHours} horas acumuladas`}
                    </p>
                    <p className="text-sm text-muted-foreground">{highlight}</p>
                  </div>

                  <div className="grid gap-2 text-right">
                    <div className="rounded-lg border border-border/70 bg-surface/80 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cobertura score</p>
                      <p className="text-xl font-semibold text-foreground">{scoreCoverage}%</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-surface/80 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cobertura horas</p>
                      <p className="text-xl font-semibold text-foreground">{hoursCoverage}%</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 reveal-up" style={{ animationDelay: "40ms" }}>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Juegos completados</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.totalGames}</p>
                </Card>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Horas registradas</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.totalHours}</p>
                </Card>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Puntuación media</p>
                  <p className="text-2xl font-semibold text-foreground">{formatAverageScore(stats.averageScore)}</p>
                </Card>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Plataforma top</p>
                  <p className="line-clamp-1 text-lg font-semibold text-foreground">
                    {stats.topPlatform?.platform ?? "Sin datos"}
                  </p>
                </Card>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 reveal-up" style={{ animationDelay: "80ms" }}>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Horas por juego</p>
                  <p className="text-2xl font-semibold text-foreground">{formatNumber(stats.averageHoursPerGame)}</p>
                </Card>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Juegos con score</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.scoredGamesCount}</p>
                </Card>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mejor score</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {stats.bestScore === null ? "N/D" : stats.bestScore}
                  </p>
                </Card>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Completados este mes</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.completionThisMonth}</p>
                </Card>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 reveal-up" style={{ animationDelay: "120ms" }}>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Diversidad de plataformas</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.platformsDiversity}</p>
                </Card>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Juegos con horas</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.gamesWithHoursCount}</p>
                </Card>
                <Card className="stats-kpi-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Logros desbloqueados</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {unlockedAchievements.length}/{achievementProgress.length}
                  </p>
                </Card>
              </div>

              {achievementError ? (
                <Card className="p-4">
                  <p className="state-danger-panel rounded-md border px-3 py-2 text-sm">{achievementError}</p>
                </Card>
              ) : null}

              <AchievementsPanel unlocked={unlockedAchievements} progress={achievementProgress} />

              {!hasStats ? (
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">
                    No hay resultados para los filtros actuales. Prueba otro año o plataforma.
                  </p>
                </Card>
              ) : null}

              {hasStats && view === "platforms" ? (
                <Card className="p-4">
                  <CardHeader className="mb-3 p-0">
                    <CardTitle className="text-base">Distribución por plataforma</CardTitle>
                  </CardHeader>
                  <CardContent className="h-70 p-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topPlatforms} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="platform" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          cursor={{ fill: "var(--color-muted)" }}
                          contentStyle={{
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : null}

              {hasStats && view === "timeline" ? (
                <Card className="p-4">
                  <CardHeader className="mb-3 p-0">
                    <CardTitle className="text-base">Evolución ({activityMonths === "6" ? "ultimos 6 meses" : "ultimos 12 meses"})</CardTitle>
                  </CardHeader>
                  <CardContent className="h-70 p-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyActivity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          cursor={{ stroke: "var(--color-primary)", strokeWidth: 1 }}
                          contentStyle={{
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="var(--color-primary)"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
