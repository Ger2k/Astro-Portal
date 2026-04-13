import { ACHIEVEMENTS_CATALOG } from "@domains/games/lib/achievementsCatalog";
import type { CompletedGame } from "@domains/games/types/completedGame";
import type {
  AchievementDefinition,
  AchievementProgress,
  UserAchievement,
} from "@domains/games/types/achievement";

interface MetricsSnapshot {
  games: number;
  hours: number;
  score: number;
  platforms: number;
}

function getMetricsSnapshot(games: CompletedGame[]): MetricsSnapshot {
  const platformSet = new Set<string>();

  let totalHours = 0;
  let maxScore = 0;

  for (const game of games) {
    const platform = game.platform.trim();
    if (platform) {
      platformSet.add(platform);
    }

    if (typeof game.hours === "number") {
      totalHours += game.hours;
    }

    if (typeof game.score === "number" && game.score > maxScore) {
      maxScore = game.score;
    }
  }

  return {
    games: games.length,
    hours: totalHours,
    score: maxScore,
    platforms: platformSet.size,
  };
}

function getProgressValue(definition: AchievementDefinition, metrics: MetricsSnapshot) {
  return metrics[definition.metric];
}

function clampProgress(current: number, target: number) {
  if (current <= 0) return 0;
  return Math.min(current, target);
}

function buildUnlockedAchievement(definition: AchievementDefinition, nowISO: string): UserAchievement {
  return {
    id: definition.key,
    key: definition.key,
    title: definition.title,
    description: definition.description,
    rarity: definition.rarity,
    unlockedAt: nowISO,
    placeholderIcon: definition.placeholderIcon,
    progress: definition.target,
    progressMax: definition.target,
  };
}

export function evaluateAchievements(
  games: CompletedGame[],
  currentUnlocked: UserAchievement[],
): {
  unlockedNow: UserAchievement[];
  unlockedAll: UserAchievement[];
  progressList: AchievementProgress[];
} {
  const nowISO = new Date().toISOString();
  const metrics = getMetricsSnapshot(games);

  const unlockedMap = new Map(currentUnlocked.map((item) => [item.key, item]));
  const unlockedNow: UserAchievement[] = [];
  const progressList: AchievementProgress[] = [];

  for (const definition of ACHIEVEMENTS_CATALOG) {
    const current = getProgressValue(definition, metrics);
    const completed = current >= definition.target;

    progressList.push({
      key: definition.key,
      title: definition.title,
      description: definition.description,
      rarity: definition.rarity,
      placeholderIcon: definition.placeholderIcon,
      progress: clampProgress(current, definition.target),
      progressMax: definition.target,
      completed,
    });

    if (!completed) {
      continue;
    }

    if (unlockedMap.has(definition.key)) {
      continue;
    }

    const unlocked = buildUnlockedAchievement(definition, nowISO);
    unlockedMap.set(definition.key, unlocked);
    unlockedNow.push(unlocked);
  }

  const unlockedAll = Array.from(unlockedMap.values()).sort((a, b) => {
    const aTime = Date.parse(a.unlockedAt);
    const bTime = Date.parse(b.unlockedAt);
    return bTime - aTime;
  });

  const normalizedProgress = progressList.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? -1 : 1;
    }
    return a.progressMax - b.progressMax;
  });

  return {
    unlockedNow,
    unlockedAll,
    progressList: normalizedProgress,
  };
}
