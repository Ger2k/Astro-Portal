import { ref, get, push, remove, update } from "firebase/database";
import { getFirebaseDb } from "@config/firebase/client";
import type { CompletedGame, NewGameInput } from "@domains/games/types/completedGame";

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
 * RTDB puede devolver un array real o un objeto con claves de push.
 * Devuelve pares { nodeKey, raw } para poder usar la clave en eliminaciones.
 */
function normalizeGamesData(raw: unknown): { nodeKey: string; raw: RawGame }[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.entries(raw as Record<string, unknown>)
    .filter((entry): entry is [string, RawGame] => entry[1] !== null && typeof entry[1] === "object")
    .map(([nodeKey, rawGame]) => ({ nodeKey, raw: rawGame as RawGame }));
}

function mapToCompletedGame(nodeKey: string, raw: RawGame, index: number): CompletedGame {
  return {
    nodeKey,
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
      .map(({ nodeKey, raw }, i) => mapToCompletedGame(nodeKey, raw, i))
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

type AddGameResult = { ok: true } | { ok: false; errorMessage: string };

export async function addGameForUser(
  userId: string,
  input: NewGameInput,
): Promise<AddGameResult> {
  try {
    const db = getFirebaseDb();
    const gamesRef = ref(db, `users/${userId}/games`);
    const id = String(Date.now());
    await push(gamesRef, { ...input, id });
    return { ok: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo guardar el juego en Firebase Realtime Database.";

    return { ok: false, errorMessage };
  }
}

type DeleteGameResult = { ok: true } | { ok: false; errorMessage: string };

export async function deleteGameForUser(
  userId: string,
  nodeKey: string,
): Promise<DeleteGameResult> {
  try {
    const db = getFirebaseDb();
    const gameRef = ref(db, `users/${userId}/games/${nodeKey}`);
    await remove(gameRef);
    return { ok: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo eliminar el juego de Firebase Realtime Database.";

    return { ok: false, errorMessage };
  }
}

type UpdateGameResult = { ok: true } | { ok: false; errorMessage: string };

export async function updateGameForUser(
  userId: string,
  nodeKey: string,
  input: NewGameInput,
): Promise<UpdateGameResult> {
  try {
    const db = getFirebaseDb();
    const gameRef = ref(db, `users/${userId}/games/${nodeKey}`);
    await update(gameRef, input);
    return { ok: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar el juego en Firebase Realtime Database.";

    return { ok: false, errorMessage };
  }
}
