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

export interface ScoreRangeItem {
  range: string;
  count: number;
  percentage: number;
}

export interface GameHoursItem {
  title: string;
  hours: number;
  percentage: number;
}

export interface MonthlyScoreItem {
  key: string;
  label: string;
  averageScore: number | null;
}

export interface PlatformConsistencyItem {
  platform: string;
  totalGames: number;
  totalHours: number;
  averageScore: number | null;
}

export interface GamesStatsSummary {
  totalGames: number;
  totalHours: number;
  averageScore: number | null;
  topPlatform: PlatformDistributionItem | null;
  platformDistribution: PlatformDistributionItem[];
  monthlyActivity: MonthlyActivityItem[];
  currentStreak: number;
  averageHoursPerGame: number;
  completenessRate: number;
  gamesWithScores: number;
  gamesWithHours: number;
  scoreDistribution: ScoreRangeItem[];
  topGamesByHours: GameHoursItem[];
  monthlyAverageScore: MonthlyScoreItem[];
  gamesInLastMonth: number;
  platformConsistency: PlatformConsistencyItem[];
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

function getCurrentStreak(games: CompletedGame[]): number {
  if (games.length === 0) return 0;

  const gamesWithDates = games
    .map((game) => ({ game, date: parseValidDate(game.date) }))
    .filter((item): item is { game: CompletedGame; date: Date } => item.date !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  if (gamesWithDates.length === 0) return 0;

  const lastGame = gamesWithDates[0].date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  lastGame.setHours(0, 0, 0, 0);

  return Math.floor((now.getTime() - lastGame.getTime()) / (1000 * 60 * 60 * 24));
}

function getScoreDistribution(games: CompletedGame[]): ScoreRangeItem[] {
  const ranges = [
    { range: "<50", min: 0, max: 49, label: "Pobre" },
    { range: "50-70", min: 50, max: 70, label: "Regular" },
    { range: "71-85", min: 71, max: 85, label: "Bueno" },
    { range: "86-95", min: 86, max: 95, label: "Muy Bueno" },
    { range: "96-100", min: 96, max: 100, label: "Excelente" },
  ];

  const counters = new Map<string, number>(ranges.map((r) => [r.range, 0]));
  let totalScored = 0;

  for (const game of games) {
    if (typeof game.score !== "number") continue;
    totalScored += 1;

    for (const { range, min, max } of ranges) {
      if (game.score >= min && game.score <= max) {
        counters.set(range, (counters.get(range) ?? 0) + 1);
        break;
      }
    }
  }

  return ranges.map(({ range }) => {
    const count = counters.get(range) ?? 0;
    return {
      range,
      count,
      percentage: totalScored > 0 ? Math.round((count / totalScored) * 100) : 0,
    };
  });
}

function getTopGamesByHours(games: CompletedGame[]): GameHoursItem[] {
  const totalHours = games.reduce((acc, game) => acc + (typeof game.hours === "number" ? game.hours : 0), 0);

  const gamesWithHours = games
    .filter((game): game is CompletedGame => typeof game.hours === "number" && game.hours > 0)
    .sort((a, b) => (b.hours ?? 0) - (a.hours ?? 0))
    .slice(0, 10);

  return gamesWithHours.map((game) => ({
    title: game.title,
    hours: game.hours ?? 0,
    percentage: totalHours > 0 ? Math.round(((game.hours ?? 0) / totalHours) * 100) : 0,
  }));
}

function getMonthlyAverageScore(games: CompletedGame[], months = 12): MonthlyScoreItem[] {
  const now = new Date();
  const baseMonths: Array<{ key: string; date: Date }> = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    baseMonths.push({ key, date });
  }

  const scoresMap = new Map<string, number[]>(baseMonths.map((item) => [item.key, []]));

  for (const game of games) {
    const parsedDate = parseValidDate(game.date);
    if (!parsedDate || typeof game.score !== "number") continue;

    const key = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
    if (!scoresMap.has(key)) continue;

    const scores = scoresMap.get(key) ?? [];
    scores.push(game.score);
    scoresMap.set(key, scores);
  }

  return baseMonths.map((item) => {
    const scores = scoresMap.get(item.key) ?? [];
    const averageScore =
      scores.length > 0 ? scores.reduce((acc, s) => acc + s, 0) / scores.length : null;

    return {
      key: item.key,
      label: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(item.date),
      averageScore: averageScore ? Math.round(averageScore * 10) / 10 : null,
    };
  });
}

function getPlatformConsistency(games: CompletedGame[]): PlatformConsistencyItem[] {
  const platformMap = new Map<
    string,
    { games: CompletedGame[]; hours: number; scores: number[] }
  >();

  for (const game of games) {
    const platform = game.platform.trim() || "Sin plataforma";
    const existing = platformMap.get(platform) ?? {
      games: [],
      hours: 0,
      scores: [],
    };

    existing.games.push(game);
    if (typeof game.hours === "number") {
      existing.hours += game.hours;
    }
    if (typeof game.score === "number") {
      existing.scores.push(game.score);
    }

    platformMap.set(platform, existing);
  }

  return Array.from(platformMap.entries())
    .map(([platform, { games: platformGames, hours, scores }]) => ({
      platform,
      totalGames: platformGames.length,
      totalHours: hours,
      averageScore: scores.length > 0 ? scores.reduce((a, s) => a + s, 0) / scores.length : null,
    }))
    .sort((a, b) => b.totalGames - a.totalGames);
}

function getGamesInLastMonth(games: CompletedGame[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return games.filter((game) => {
    const parsed = parseValidDate(game.date);
    if (!parsed) return false;
    return parsed >= thirtyDaysAgo;
  }).length;
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
  const gamesWithScores = scoredGames.length;
  const gamesWithHours = games.filter((g) => typeof g.hours === "number").length;
  const gamesWithDates = games.filter((g) => parseValidDate(g.date) !== null).length;

  const completenessRate =
    totalGames > 0
      ? Math.round(
          ((gamesWithScores + gamesWithHours + gamesWithDates) / (totalGames * 3)) * 100,
        )
      : 0;

  const averageHoursPerGame = totalGames > 0 && gamesWithHours > 0 ? totalHours / gamesWithHours : 0;

  return {
    totalGames,
    totalHours,
    averageScore: averageScore ? Math.round(averageScore * 10) / 10 : null,
    topPlatform: platformDistribution[0] ?? null,
    platformDistribution,
    monthlyActivity: getMonthlyActivity(games, 12),
    currentStreak: getCurrentStreak(games),
    averageHoursPerGame: Math.round(averageHoursPerGame * 10) / 10,
    completenessRate,
    gamesWithScores,
    gamesWithHours,
    scoreDistribution: getScoreDistribution(games),
    topGamesByHours: getTopGamesByHours(games),
    monthlyAverageScore: getMonthlyAverageScore(games),
    gamesInLastMonth: getGamesInLastMonth(games),
    platformConsistency: getPlatformConsistency(games),
  };
}
