import { get, ref, set } from "firebase/database";
import { getFirebaseDb } from "@config/firebase/client";
import type { UserAchievement } from "@domains/games/types/achievement";

type AchievementsResult =
  | { ok: true; data: UserAchievement[] }
  | { ok: false; errorMessage: string };

type SaveAchievementsResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

type RawAchievement = {
  id?: unknown;
  key?: unknown;
  title?: unknown;
  description?: unknown;
  rarity?: unknown;
  unlockedAt?: unknown;
  placeholderIcon?: unknown;
  progress?: unknown;
  progressMax?: unknown;
};

function mapToAchievement(raw: RawAchievement, fallbackKey: string): UserAchievement {
  const key = typeof raw.key === "string" ? raw.key : fallbackKey;

  return {
    id: typeof raw.id === "string" ? raw.id : key,
    key,
    title: typeof raw.title === "string" ? raw.title : "Logro",
    description: typeof raw.description === "string" ? raw.description : "",
    rarity: raw.rarity === "common" || raw.rarity === "rare" || raw.rarity === "epic" ? raw.rarity : "common",
    unlockedAt: typeof raw.unlockedAt === "string" ? raw.unlockedAt : new Date(0).toISOString(),
    placeholderIcon: typeof raw.placeholderIcon === "string" ? raw.placeholderIcon : "/icons/achievements/default.svg",
    progress: typeof raw.progress === "number" ? raw.progress : 0,
    progressMax: typeof raw.progressMax === "number" ? raw.progressMax : 1,
  };
}

export async function fetchAchievementsForUser(userId: string): Promise<AchievementsResult> {
  try {
    const db = getFirebaseDb();
    const achievementsRef = ref(db, `users/${userId}/achievements`);
    const snapshot = await get(achievementsRef);

    if (!snapshot.exists()) {
      return { ok: true, data: [] };
    }

    const value = snapshot.val();
    if (!value || typeof value !== "object") {
      return { ok: true, data: [] };
    }

    const data = Object.entries(value as Record<string, unknown>)
      .filter(([, raw]) => raw !== null && typeof raw === "object")
      .map(([achievementId, raw]) => mapToAchievement(raw as RawAchievement, achievementId))
      .sort((a, b) => Date.parse(b.unlockedAt) - Date.parse(a.unlockedAt));

    return { ok: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar los logros del usuario.";

    return { ok: false, errorMessage };
  }
}

export async function saveAchievementsForUser(
  userId: string,
  achievements: UserAchievement[],
): Promise<SaveAchievementsResult> {
  try {
    const db = getFirebaseDb();
    const achievementsRef = ref(db, `users/${userId}/achievements`);

    const payload = achievements.reduce<Record<string, UserAchievement>>((acc, item) => {
      acc[item.key] = item;
      return acc;
    }, {});

    // Use set() instead of update() to handle both creation and updates
    // update() fails if the path doesn't exist yet on first login
    await set(achievementsRef, payload);

    return { ok: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudieron guardar los logros del usuario.";

    return { ok: false, errorMessage };
  }
}
