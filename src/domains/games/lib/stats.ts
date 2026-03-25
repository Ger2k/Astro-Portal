import type { CompletedGame } from "@domains/games/types/completedGame";

export interface PlatformDistributionItem {
  platform: string;
  count: number;
}

export interface MonthlyActivityItem {
  key: string;
  label: string;
  count: number;
}

export interface GamesStatsSummary {
  totalGames: number;
  totalHours: number;
  averageScore: number | null;
  topPlatform: PlatformDistributionItem | null;
  platformDistribution: PlatformDistributionItem[];
  monthlyActivity: MonthlyActivityItem[];
}

export interface GamesStatsFilters {
  year: string;
  platform: string;
}

function parseValidDate(date: string | null) {
  if (!date) return null;
  const time = Date.parse(date);
  if (Number.isNaN(time)) return null;
  return new Date(time);
}

export function getAvailableYears(games: CompletedGame[]) {
  const years = new Set<number>();

  for (const game of games) {
    const parsed = parseValidDate(game.date);
    if (!parsed) continue;
    years.add(parsed.getFullYear());
  }

  return Array.from(years).sort((a, b) => b - a);
}

export function getAvailablePlatforms(games: CompletedGame[]) {
  const platforms = new Set<string>();

  for (const game of games) {
    const platform = game.platform.trim();
    if (!platform) continue;
    platforms.add(platform);
  }

  return Array.from(platforms).sort((a, b) => a.localeCompare(b, "es"));
}

export function filterGamesForStats(games: CompletedGame[], filters: GamesStatsFilters) {
  return games.filter((game) => {
    const matchesPlatform = filters.platform === "Todas" || game.platform === filters.platform;

    if (!matchesPlatform) {
      return false;
    }

    if (filters.year === "Todos") {
      return true;
    }

    const parsed = parseValidDate(game.date);
    if (!parsed) {
      return false;
    }

    return String(parsed.getFullYear()) === filters.year;
  });
}

function getPlatformDistribution(games: CompletedGame[]) {
  const counters = new Map<string, number>();

  for (const game of games) {
    const platform = game.platform.trim() || "Sin plataforma";
    counters.set(platform, (counters.get(platform) ?? 0) + 1);
  }

  return Array.from(counters.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count || a.platform.localeCompare(b.platform, "es"));
}

function getMonthlyActivity(games: CompletedGame[], months = 6): MonthlyActivityItem[] {
  const now = new Date();
  const baseMonths: Array<{ key: string; date: Date }> = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    baseMonths.push({ key, date });
  }

  const counters = new Map<string, number>(baseMonths.map((item) => [item.key, 0]));

  for (const game of games) {
    const parsedDate = parseValidDate(game.date);
    if (!parsedDate) continue;

    const key = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
    if (!counters.has(key)) continue;
    counters.set(key, (counters.get(key) ?? 0) + 1);
  }

  return baseMonths.map((item) => ({
    key: item.key,
    label: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(item.date),
    count: counters.get(item.key) ?? 0,
  }));
}

export function buildGamesStats(games: CompletedGame[]): GamesStatsSummary {
  const totalGames = games.length;

  const totalHours = games.reduce((acc, game) => acc + (typeof game.hours === "number" ? game.hours : 0), 0);

  const scoredGames = games
    .map((game) => game.score)
    .filter((score): score is number => typeof score === "number");

  const averageScore =
    scoredGames.length > 0
      ? scoredGames.reduce((acc, score) => acc + score, 0) / scoredGames.length
      : null;

  const platformDistribution = getPlatformDistribution(games);

  return {
    totalGames,
    totalHours,
    averageScore,
    topPlatform: platformDistribution[0] ?? null,
    platformDistribution,
    monthlyActivity: getMonthlyActivity(games),
  };
}
