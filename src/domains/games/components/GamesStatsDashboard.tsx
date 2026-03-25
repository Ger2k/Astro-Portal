import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import { fetchCompletedGamesForUser } from "@domains/games/services/completedGamesService";
import type { CompletedGame } from "@domains/games/types/completedGame";
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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [view, setView] = useState<StatsView>("platforms");
  const [selectedYear, setSelectedYear] = useState("Todos");
  const [selectedPlatform, setSelectedPlatform] = useState("Todas");

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

  const stats = useMemo(() => buildGamesStats(filteredGames), [filteredGames]);

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
                    <CardTitle className="text-base">Evolución (últimos 6 meses)</CardTitle>
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
