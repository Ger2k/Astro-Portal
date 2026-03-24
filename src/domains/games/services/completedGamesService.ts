import { ref, get, push, set, remove, update } from "firebase/database";
import { getFirebaseDb } from "@config/firebase/client";
import type { CompletedGame, NewGameInput } from "@domains/games/types/completedGame";

type CompletedGamesResult =
  | { ok: true; data: CompletedGame[] }
  | { ok: false; errorMessage: string };

type AddGameResult =
  | { ok: true; id: string }
  | { ok: false; errorMessage: string };

type DeleteGameResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

type UpdateGameResult =
  | { ok: true }
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
 * RTDB puede devolver objeto con keys push o indices numericos.
 * Se normaliza conservando la key real del nodo para operar (editar/eliminar).
 */
function normalizeGamesData(raw: unknown): Array<{ nodeKey: string; raw: RawGame }> {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.entries(raw as Record<string, unknown>)
    .filter(([, value]) => value !== null && typeof value === "object")
    .map(([nodeKey, value]) => ({ nodeKey, raw: value as RawGame }));
}

function mapToCompletedGame(raw: RawGame, nodeKey: string): CompletedGame {
  return {
    nodeKey,
    id: typeof raw.id === "string" ? raw.id : nodeKey,
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
      .map((entry) => mapToCompletedGame(entry.raw, entry.nodeKey))
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

export async function addGameForUser(userId: string, input: NewGameInput): Promise<AddGameResult> {
  try {
    const db = getFirebaseDb();
    const gamesRef = ref(db, `users/${userId}/games`);
    const itemRef = push(gamesRef);
    const generatedId = itemRef.key ?? String(Date.now());

    const payload: CompletedGame = {
      nodeKey: generatedId,
      id: generatedId,
      title: input.title.trim(),
      platform: input.platform.trim(),
      date: input.date,
      score: input.score,
      hours: input.hours,
      cover: input.cover.trim(),
      notes: input.notes.trim(),
    };

    await set(itemRef, payload);

    return { ok: true, id: payload.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo guardar el juego en Firebase Realtime Database.";

    return { ok: false, errorMessage };
  }
}

export async function deleteGameForUser(userId: string, nodeKey: string): Promise<DeleteGameResult> {
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

export async function updateGameForUser(
  userId: string,
  nodeKey: string,
  input: NewGameInput,
): Promise<UpdateGameResult> {
  try {
    const db = getFirebaseDb();
    const gameRef = ref(db, `users/${userId}/games/${nodeKey}`);

    const payload: Omit<CompletedGame, "nodeKey"> = {
      id: nodeKey,
      title: input.title.trim(),
      platform: input.platform.trim(),
      date: input.date,
      score: input.score,
      hours: input.hours,
      cover: input.cover.trim(),
      notes: input.notes.trim(),
    };

    await update(gameRef, payload);

    return { ok: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar el juego en Firebase Realtime Database.";

    return { ok: false, errorMessage };
  }
}
