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
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@shared/ui/primitives";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  /* Line,
  LineChart, */
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: "primary" | "success" | "warning" | "info";
}

function KPICard({ label, value, subtitle, accent = "primary" }: KPICardProps) {
  const accentClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600",
    warning: "bg-yellow-500/10 text-yellow-600",
    info: "bg-blue-500/10 text-blue-600",
  };

  return (
    <Card className="overflow-hidden">
      <div className={`${accentClasses[accent]} h-1`} />
      <CardContent className="pt-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

interface InsightItemProps {
  icon: string;
  text: string;
}

function InsightItem({ icon, text }: InsightItemProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  );
}

export function GamesStatsDashboard() {
  const { user } = useAuthSession();
  const [games, setGames] = useState<CompletedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const platformChartData = stats.platformDistribution.slice(0, 6).map((item) => ({
    name: item.platform,
    value: item.count,
  }));

  const scoreDistributionChartData = stats.scoreDistribution.map((item) => ({
    name: item.range,
    value: item.count,
    percentage: item.percentage,
  }));

  const topGamesToChart = stats.topGamesByHours.map((item) => ({
    name: item.title.length > 20 ? item.title.substring(0, 20) + "..." : item.title,
    hours: item.hours,
    percentage: item.percentage,
  }));

  const monthlyActivityChartData = stats.monthlyActivity.map((item) => ({
    month: item.label,
    count: item.count,
  }));

  /* const monthlyScoresChartData = stats.monthlyAverageScore.map((item) => ({
    month: item.label,
    score: item.averageScore,
  })); */

  const PLATFORM_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

  const SCORE_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

  const hasStats = filteredGames.length > 0;

  return (
    <section className="space-y-6">
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
            Analiza tus hábitos de juego e identifica patrones para entender tu progreso.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
              <Skeleton className="h-60" />
            </div>
          ) : null}

          {!loading && errorMessage ? (
            <p className="state-danger-panel rounded-md border px-3 py-2 text-sm">{errorMessage}</p>
          ) : null}

          {!loading && !errorMessage && games.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no tienes datos suficientes. Añade juegos en tu biblioteca para ver
              estadísticas.
            </p>
          ) : null}

          {!loading && !errorMessage && games.length > 0 ? (
            <>
              {/* Filtros */}
              <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Filtrar por año
                  </label>
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
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Filtrar por plataforma
                  </label>
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
                </div>

                {!hasStats ? (
                  <div className="flex items-end">
                    <p className="text-xs text-muted-foreground">
                      No hay resultados. Intenta otros filtros.
                    </p>
                  </div>
                ) : null}
              </div>

              {hasStats ? (
                <>
                  {/* KPI Cards - 6 columnas */}
                  <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <KPICard label="Juegos" value={stats.totalGames} accent="primary" />
                    <KPICard label="Horas" value={stats.totalHours.toFixed(0)} accent="info" />
                    <KPICard
                      label="Puntuación"
                      value={formatAverageScore(stats.averageScore)}
                      subtitle={getScoreCategory(stats.averageScore)}
                      accent={
                        stats.averageScore && stats.averageScore >= 85
                          ? "success"
                          : stats.averageScore && stats.averageScore >= 75
                            ? "info"
                            : "warning"
                      }
                    />
                    <KPICard
                      label="Racha"
                      value={`${stats.currentStreak}d`}
                      subtitle="Desde último juego"
                      accent="primary"
                    />
                    <KPICard
                      label="Promedio"
                      value={`${stats.averageHoursPerGame.toFixed(1)}h`}
                      subtitle="Por juego"
                      accent="info"
                    />
                    <KPICard
                      label="Completitud"
                      value={`${stats.completenessRate}%`}
                      subtitle="Datos registrados"
                      accent={
                        stats.completenessRate >= 80
                          ? "success"
                          : stats.completenessRate >= 50
                            ? "info"
                            : "warning"
                      }
                    />
                  </div>

                  {/* Charts Grid - 2 columnas en desktop, 1 en móvil */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Distribución Plataformas - Donut */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Distribución por Plataforma</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={platformChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {platformChartData.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => `${value} juegos`}
                                contentStyle={{
                                  backgroundColor: "var(--color-surface)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: 8,
                                  fontSize: 12,
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                          {platformChartData.map((item, index) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      PLATFORM_COLORS[index % PLATFORM_COLORS.length],
                                  }}
                                />
                                <span className="font-medium">{item.name}</span>
                              </div>
                              <span className="text-muted-foreground">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Actividad Temporal - Area Chart 12 meses */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Últimos 12 Meses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyActivityChartData}>
                              <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                  <stop
                                    offset="5%"
                                    stopColor="var(--color-primary)"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="var(--color-primary)"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                              <XAxis
                                dataKey="month"
                                tick={{ fontSize: 11 }}
                                stroke="var(--color-muted-foreground)"
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11 }}
                                stroke="var(--color-muted-foreground)"
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "var(--color-surface)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: 8,
                                  fontSize: 12,
                                }}
                                formatter={(value) => `${value} juegos`}
                              />
                              <Area
                                type="monotone"
                                dataKey="count"
                                stroke="var(--color-primary)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Distribución de Scores - Histogram */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Distribución de Puntuaciones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreDistributionChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                stroke="var(--color-muted-foreground)"
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11 }}
                                stroke="var(--color-muted-foreground)"
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "var(--color-surface)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: 8,
                                  fontSize: 12,
                                }}
                                formatter={(value, _, props) => [
                                  `${value} juegos (${props.payload.percentage}%)`,
                                ]}
                              />
                              <Bar dataKey="value" fill="var(--color-primary)">
                                {scoreDistributionChartData.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={SCORE_COLORS[index % SCORE_COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top 10 Horas - Horizontal Bar */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top 10 - Horas Invertidas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={topGamesToChart}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                              <XAxis
                                type="number"
                                tick={{ fontSize: 10 }}
                                stroke="var(--color-muted-foreground)"
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 10 }}
                                stroke="var(--color-muted-foreground)"
                                width={95}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "var(--color-surface)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: 8,
                                  fontSize: 11,
                                }}
                                formatter={(value, _, props) => [
                                  `${value}h (${props.payload.percentage}%)`,
                                ]}
                              />
                              <Bar
                                dataKey="hours"
                                fill="var(--color-primary)"
                                radius={[0, 6, 6, 0]}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Insights Accionables */}
                    <Card className="mb-8 border-l-4 border-l-primary">
                      <CardHeader>
                        <CardTitle className="text-base">💡 Insights</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {stats.topPlatform ? (
                          <InsightItem
                            icon="🎮"
                            text={`Tu plataforma favorita es ${stats.topPlatform.platform} con ${stats.topPlatform.count} jueg${stats.topPlatform.count !== 1 ? "os" : "o"} completado${stats.topPlatform.count !== 1 ? "s" : ""}.`}
                          />
                        ) : null}

                        {stats.gamesWithHours > 0 ? (
                          <InsightItem
                            icon="⏱️"
                            text={`Inviertes ${stats.averageHoursPerGame.toFixed(1)} horas en promedio por juego (~${stats.totalHours.toFixed(0)} horas totales).`}
                          />
                        ) : null}

                        <InsightItem
                          icon="⭐"
                          text={`Tu puntuación promedio es ${formatAverageScore(stats.averageScore)} (${getScoreCategory(stats.averageScore)}).`}
                        />

                        <InsightItem
                          icon="📅"
                          text={`Has completado ${stats.gamesInLastMonth} jueg${stats.gamesInLastMonth !== 1 ? "os" : "o"} en los últimos 30 días.`}
                        />

                        {stats.currentStreak > 0 ? (
                          <InsightItem
                            icon="🔥"
                            text={`Hace ${stats.currentStreak} día${stats.currentStreak !== 1 ? "s" : ""} que no completas un juego. ¿Siguiente?`}
                          />
                        ) : null}
                      </CardContent>
                    </Card>
                    
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
