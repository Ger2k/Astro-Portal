import { useEffect, useState } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import {
  deleteGameForUser,
  fetchCompletedGamesForUser,
  updateGameForUser,
} from "@domains/games/services/completedGamesService";
import type { CompletedGame, NewGameInput } from "@domains/games/types/completedGame";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Modal,
} from "@shared/ui/primitives";

const PLATFORM_OPTIONS = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X/S",
  "Xbox One",
  "Nintendo Switch",
  "iOS",
  "Android",
  "Otro",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(isoDate: string | null) {
  if (!isoDate) return "Fecha no disponible";
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return isoDate;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(ts));
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;

  const colorClass =
    score >= 80
      ? "bg-emerald-100 text-emerald-800"
      : score >= 60
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${colorClass}`}
      aria-label={`Puntuacion: ${score} sobre 100`}
    >
      {score}/100
    </span>
  );
}

interface GameCardProps {
  game: CompletedGame;
  onDelete: (game: CompletedGame) => void;
  onEdit: (game: CompletedGame) => void;
}

function GameCard({ game, onDelete, onEdit }: GameCardProps) {
  return (
    <li className="flex gap-4 rounded-lg border border-border bg-surface p-4">
      {game.cover ? (
        <img
          src={game.cover}
          alt={`Portada de ${game.title}`}
          width={56}
          height={80}
          className="h-20 w-14 shrink-0 rounded object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-muted text-2xl"
          aria-hidden="true"
        >
          🎮
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{game.title}</p>
          <ScoreBadge score={game.score} />
        </div>

        <p className="text-sm text-muted-foreground">
          {game.platform || "Plataforma no especificada"}
        </p>

        <p className="text-xs text-muted-foreground">
          <span>Completado: {formatDate(game.date)}</span>
          {game.hours !== null ? (
            <span className="ml-3">{game.hours} h jugadas</span>
          ) : null}
        </p>

        {game.notes ? (
          <p className="mt-1 line-clamp-2 text-sm italic text-muted-foreground">
            {game.notes}
          </p>
        ) : null}

        <div className="pt-2">
          <Button
            type="button"
            variant="secondary"
            className="mr-2 h-8 px-3 text-xs"
            onClick={() => onEdit(game)}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => onDelete(game)}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </li>
  );
}

export function CompletedGamesList() {
  const { user } = useAuthSession();
  const [games, setGames] = useState<CompletedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<CompletedGame | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [pendingEdit, setPendingEdit] = useState<CompletedGame | null>(null);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<NewGameInput>({
    title: "",
    platform: "PC",
    date: todayISO(),
    score: 70,
    hours: null,
    cover: "",
    notes: "",
  });
  const [customPlatform, setCustomPlatform] = useState("");

  const loadGames = async () => {
    if (!user) {
      setGames([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const result = await fetchCompletedGamesForUser(user.uid);

    if (!result.ok) {
      console.error("[CompletedGamesList]", result.errorMessage);
      setGames([]);
      setErrorMessage(result.errorMessage);
      setLoading(false);
      return;
    }

    setGames(result.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadGames();
  }, [user?.uid]);

  async function confirmDelete() {
    if (!user || !pendingDelete) return;

    setDeleting(true);
    setErrorMessage(null);

    const result = await deleteGameForUser(user.uid, pendingDelete.nodeKey);

    if (!result.ok) {
      setErrorMessage(result.errorMessage);
      setDeleting(false);
      return;
    }

    setGames((prev) => prev.filter((g) => g.nodeKey !== pendingDelete.nodeKey));
    setPendingDelete(null);
    setDeleting(false);
  }

  function openEdit(game: CompletedGame) {
    const useCustomPlatform = !PLATFORM_OPTIONS.includes(game.platform);

    setPendingEdit(game);
    setEditError(null);
    setCustomPlatform(useCustomPlatform ? game.platform : "");
    setEditForm({
      title: game.title,
      platform: useCustomPlatform ? "Otro" : game.platform,
      date: game.date || todayISO(),
      score: game.score,
      hours: game.hours,
      cover: game.cover,
      notes: game.notes,
    });
  }

  function setEditField<K extends keyof NewGameInput>(key: K, value: NewGameInput[K]) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  async function confirmEdit() {
    if (!user || !pendingEdit) return;

    const platformValue =
      editForm.platform === "Otro" ? customPlatform.trim() : editForm.platform.trim();

    if (!editForm.title.trim()) {
      setEditError("El titulo es obligatorio.");
      return;
    }

    if (!platformValue) {
      setEditError("La plataforma es obligatoria.");
      return;
    }

    if (!editForm.date) {
      setEditError("La fecha es obligatoria.");
      return;
    }

    if (editForm.score !== null && (editForm.score < 0 || editForm.score > 100)) {
      setEditError("La puntuacion debe estar entre 0 y 100.");
      return;
    }

    const payload: NewGameInput = {
      ...editForm,
      title: editForm.title.trim(),
      platform: platformValue,
      cover: editForm.cover.trim(),
      notes: editForm.notes.trim(),
    };

    setEditing(true);
    setEditError(null);

    const result = await updateGameForUser(user.uid, pendingEdit.nodeKey, payload);

    if (!result.ok) {
      setEditError(result.errorMessage);
      setEditing(false);
      return;
    }

    setGames((prev) =>
      prev.map((game) =>
        game.nodeKey === pendingEdit.nodeKey
          ? {
              ...game,
              ...payload,
            }
          : game,
      ),
    );

    setEditing(false);
    setPendingEdit(null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Juegos completados</CardTitle>
            <CardDescription>
              {loading
                ? "Cargando desde Firebase..."
                : `${games.length} juego${games.length !== 1 ? "s" : ""} completado${games.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </div>

          <Button variant="secondary" onClick={() => void loadGames()} disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando juegos...</p>
        ) : null}

        {!loading && errorMessage ? (
          <p className="rounded-md border border-danger bg-red-50 px-3 py-2 text-sm text-red-900">
            {errorMessage}
          </p>
        ) : null}

        {!loading && !errorMessage && games.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aun no hay juegos completados en tu cuenta.
          </p>
        ) : null}

        {!loading && !errorMessage && games.length > 0 ? (
          <ul className="space-y-3" aria-label="Lista de juegos completados">
            {games.map((game) => (
              <GameCard
                key={game.nodeKey}
                game={game}
                onDelete={setPendingDelete}
                onEdit={openEdit}
              />
            ))}
          </ul>
        ) : null}
      </CardContent>

      <Modal
        isOpen={Boolean(pendingEdit)}
        title="Editar juego"
        onClose={() => {
          if (!editing) setPendingEdit(null);
        }}
        showCloseButton={false}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void confirmEdit();
          }}
          noValidate
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Titulo</label>
            <Input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditField("title", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Plataforma</label>
            <select
              className="h-10 w-full rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={editForm.platform}
              onChange={(e) => setEditField("platform", e.target.value)}
            >
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {editForm.platform === "Otro" ? (
              <Input
                type="text"
                placeholder="Escribe la plataforma"
                className="mt-2"
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
              />
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Fecha completado</label>
            <Input
              type="date"
              value={editForm.date ?? ""}
              max={todayISO()}
              onChange={(e) => setEditField("date", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Puntuacion</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={editForm.score ?? 0}
                onChange={(e) => setEditField("score", Number(e.target.value))}
                className="flex-1 accent-primary"
                aria-label={`Puntuacion: ${editForm.score ?? 0} de 100`}
              />
              <span className="w-9 text-right text-sm font-semibold tabular-nums text-foreground">
                {editForm.score ?? 0}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Horas jugadas</label>
            <Input
              type="number"
              min={0}
              value={editForm.hours ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setEditField("hours", value === "" ? null : Number(value));
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">URL de portada</label>
            <Input
              type="url"
              value={editForm.cover}
              onChange={(e) => setEditField("cover", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Notas</label>
            <textarea
              className="min-h-20 w-full resize-y rounded-(--radius-md) border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={editForm.notes}
              onChange={(e) => setEditField("notes", e.target.value)}
              rows={3}
            />
          </div>

          {editError ? (
            <p className="rounded-md border border-danger bg-red-50 px-3 py-2 text-sm text-red-900">
              {editError}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPendingEdit(null)}
              disabled={editing}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={editing}>
              {editing ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(pendingDelete)}
        title="Confirmar eliminacion"
        description={
          pendingDelete
            ? `Se eliminara \"${pendingDelete.title}\". Esta accion no se puede deshacer.`
            : undefined
        }
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        showCloseButton={false}
      >
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPendingDelete(null)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={() => void confirmDelete()} disabled={deleting}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}


