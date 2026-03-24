import { ref, get } from "firebase/database";
import { getFirebaseDb } from "@config/firebase/client";
import type { CompletedGame } from "@domains/games/types/completedGame";

type CompletedGamesResult =
  | { ok: true; data: CompletedGame[] }
  | { ok: false; errorMessage: string };

type RawGame = {
  id?: unknown;
  title?: unknown;
  platform?: unknown;
  date?: unknown;
  score?: unknown;
  hours?: unknown;
  cover?: unknown;
  notes?: unknown;
};

/**
 * RTDB puede devolver un array real o un objeto con claves numericas.
 * Ambos casos se normalizan a un array plano de objetos.
 */
function normalizeGamesData(raw: unknown): RawGame[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.values(raw as Record<string, unknown>).filter(
    (v): v is RawGame => v !== null && typeof v === "object",
  );
}

function mapToCompletedGame(raw: RawGame, index: number): CompletedGame {
  return {
    id: typeof raw.id === "string" ? raw.id : String(index),
    title: typeof raw.title === "string" && raw.title ? raw.title : "Juego sin titulo",
    platform: typeof raw.platform === "string" ? raw.platform : "",
    date: typeof raw.date === "string" && raw.date ? raw.date : null,
    score: typeof raw.score === "number" ? raw.score : null,
    hours: typeof raw.hours === "number" ? raw.hours : null,
    cover: typeof raw.cover === "string" ? raw.cover : "",
    notes: typeof raw.notes === "string" ? raw.notes : "",
  };
}

export async function fetchCompletedGamesForUser(userId: string): Promise<CompletedGamesResult> {
  try {
    const db = getFirebaseDb();
    const gamesRef = ref(db, `users/${userId}/games`);
    const snapshot = await get(gamesRef);

    if (!snapshot.exists()) {
      return { ok: true, data: [] };
    }

    const rawGames = normalizeGamesData(snapshot.val());
    const data = rawGames
      .map((raw, i) => mapToCompletedGame(raw, i))
      .sort((a, b) => {
        const aTime = a.date ? Date.parse(a.date) : 0;
        const bTime = b.date ? Date.parse(b.date) : 0;
        return bTime - aTime;
      });

    return { ok: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la lista de juegos desde Firebase Realtime Database.";

    return { ok: false, errorMessage };
  }
}
