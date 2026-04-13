import { evaluateAchievements } from "@domains/games/lib/achievementsEngine";
import { fetchCompletedGamesForUser } from "@domains/games/services/completedGamesService";
import {
  fetchAchievementsForUser,
  saveAchievementsForUser,
} from "@domains/games/services/achievementsService";
import type { UserAchievement } from "@domains/games/types/achievement";

export type SyncAchievementsResult =
  | { ok: true; unlockedNowCount: number; unlockedNow: UserAchievement[] }
  | { ok: false; errorMessage: string };

export async function syncAchievementsForUser(userId: string): Promise<SyncAchievementsResult> {
  const gamesResult = await fetchCompletedGamesForUser(userId);
  if (!gamesResult.ok) {
    return { ok: false, errorMessage: gamesResult.errorMessage };
  }

  const achievementsResult = await fetchAchievementsForUser(userId);
  if (!achievementsResult.ok) {
    return { ok: false, errorMessage: achievementsResult.errorMessage };
  }

  const evaluation = evaluateAchievements(gamesResult.data, achievementsResult.data);
  if (evaluation.unlockedNow.length === 0) {
    return { ok: true, unlockedNowCount: 0, unlockedNow: [] };
  }

  const saveResult = await saveAchievementsForUser(userId, evaluation.unlockedAll);
  if (!saveResult.ok) {
    return { ok: false, errorMessage: saveResult.errorMessage };
  }

  return {
    ok: true,
    unlockedNowCount: evaluation.unlockedNow.length,
    unlockedNow: evaluation.unlockedNow,
  };
}
