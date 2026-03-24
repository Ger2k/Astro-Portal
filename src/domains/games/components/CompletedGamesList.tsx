import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import {
  deleteGameForUser,
  fetchCompletedGamesForUser,
  updateGameForUser,
} from "@domains/games/services/completedGamesService";
import { CoverPicker } from "@domains/games/components/CoverPicker";
import type { CompletedGame, NewGameInput } from "@domains/games/types/completedGame";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  ToastViewport,
  useToast,
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
      ? "state-success-badge"
      : score >= 60
        ? "state-warning-badge"
        : "state-danger-badge";

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${colorClass}`}
      aria-label={`Puntuación: ${score} sobre 100`}
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
    <li className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:gap-4">
      {game.cover ? (
        <div className="overflow-hidden rounded-lg ring-1 ring-border/80 shadow-sm sm:self-start">
          <img
            src={game.cover}
            alt={`Portada de ${game.title}`}
            width={56}
            height={80}
            className="h-20 w-14 shrink-0 object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="flex h-20 w-14 items-center justify-center rounded-lg bg-muted text-2xl ring-1 ring-border/80 sm:self-start"
          aria-hidden="true"
        >
          🎮
        </div>
      )}

      <div className="min-w-0 space-y-1 sm:self-stretch">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{game.title}</p>
            <ScoreBadge score={game.score} />
          </div>

          <p className="text-sm text-muted-foreground">
            {game.platform || "Plataforma no especificada"}
          </p>

          <p className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1">
            <span>Completado: {formatDate(game.date)}</span>
            {game.hours !== null ? <span>{game.hours} h jugadas</span> : null}
          </p>

          {game.notes ? (
            <p className="pt-1 line-clamp-2 text-sm italic text-muted-foreground">
              {game.notes}
            </p>
          ) : null}
        </div>
      </div>

      <div className="col-span-2 flex justify-end border-t border-border/70 pt-3 sm:col-span-1 sm:row-span-2 sm:border-t-0 sm:pt-0">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <Button
            type="button"
            variant="secondary"
            className="h-8 w-full px-3 text-xs sm:w-auto"
            onClick={() => onEdit(game)}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8 w-full px-3 text-xs sm:w-auto"
            onClick={() => onDelete(game)}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </li>
  );
}

interface CompletedGamesListProps {
  addGameAction?: ReactNode;
}

export function CompletedGamesList({ addGameAction }: CompletedGamesListProps) {
  const { user } = useAuthSession();
  const { toasts, push, dismiss } = useToast();
  const [games, setGames] = useState<CompletedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("Todas");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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
      push({
        variant: "error",
        title: "No se pudo cargar la lista",
        description: result.errorMessage,
      });
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
      push({
        variant: "error",
        title: "No se pudo eliminar",
        description: result.errorMessage,
      });
      return;
    }

    setGames((prev) => prev.filter((g) => g.nodeKey !== pendingDelete.nodeKey));
    push({
      variant: "success",
      title: "Juego eliminado",
      description: `Se elimino "${pendingDelete.title}" correctamente.`,
    });
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

  const availablePlatforms = useMemo(() => {
    const values = Array.from(
      new Set(games.map((game) => game.platform.trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "es"));

    return ["Todas", ...values];
  }, [games]);

  const visibleGames = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = games.filter((game) => {
      const matchesPlatform = platformFilter === "Todas" || game.platform === platformFilter;

      if (!matchesPlatform) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [game.title, game.platform, game.notes]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "oldest") {
        const aTime = a.date ? Date.parse(a.date) : 0;
        const bTime = b.date ? Date.parse(b.date) : 0;
        return aTime - bTime;
      }

      if (sortBy === "score") {
        return (b.score ?? -1) - (a.score ?? -1);
      }

      if (sortBy === "hours") {
        return (b.hours ?? -1) - (a.hours ?? -1);
      }

      const aTime = a.date ? Date.parse(a.date) : 0;
      const bTime = b.date ? Date.parse(b.date) : 0;
      return bTime - aTime;
    });
  }, [games, platformFilter, search, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, platformFilter, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(visibleGames.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = visibleGames.length === 0 ? 0 : (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, visibleGames.length);
  const paginatedGames = visibleGames.slice(pageStart, pageEnd);

  async function confirmEdit() {
    if (!user || !pendingEdit) return;

    const platformValue =
      editForm.platform === "Otro" ? customPlatform.trim() : editForm.platform.trim();

    if (!editForm.title.trim()) {
      setEditError("El título es obligatorio.");
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
      setEditError("La puntuación debe estar entre 0 y 100.");
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
      push({
        variant: "error",
        title: "No se pudo guardar",
        description: result.errorMessage,
      });
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

    push({
      variant: "success",
      title: "Juego actualizado",
      description: `Se actualizo "${payload.title}" correctamente.`,
    });
    setEditing(false);
    setPendingEdit(null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Juegos completados</CardTitle>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {addGameAction}
            <Button variant="secondary" onClick={() => void loadGames()} disabled={loading} className="w-full sm:w-auto">
              {loading ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, plataforma o notas"
            aria-label="Buscar juegos"
          />

          <select
            className="h-10 w-full rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            aria-label="Filtrar por plataforma"
          >
            {availablePlatforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>

          <select
            className="h-10 w-full rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Ordenar juegos"
          >
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="score">Mejor puntuación</option>
            <option value="hours">Más horas</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando juegos...</p>
        ) : null}

        {!loading && errorMessage ? (
          <p className="state-danger-panel rounded-md border px-3 py-2 text-sm">
            {errorMessage}
          </p>
        ) : null}

        {!loading && !errorMessage && games.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay juegos completados en tu cuenta.
          </p>
        ) : null}

        {!loading && !errorMessage && games.length > 0 && visibleGames.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay resultados con los filtros actuales.
          </p>
        ) : null}

        {!loading && !errorMessage && visibleGames.length > 0 ? (
          <ul className="space-y-3" aria-label="Lista de juegos completados">
            {paginatedGames.map((game) => (
              <GameCard
                key={game.nodeKey}
                game={game}
                onDelete={setPendingDelete}
                onEdit={openEdit}
              />
            ))}
          </ul>
        ) : null}

        {!loading && !errorMessage && games.length > 0 ? (
          <div className="mt-5 space-y-3 border-t border-border pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {visibleGames.length > 0
                  ? `Mostrando ${pageStart + 1}-${pageEnd} de ${visibleGames.length}`
                  : "Mostrando 0 resultados"}
              </p>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <label className="text-sm text-muted-foreground" htmlFor="page-size">
                  Por página
                </label>
                <select
                  id="page-size"
                  className="h-10 rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <span className="text-center text-sm text-muted-foreground sm:text-left">
                Página {currentPage} de {totalPages}
              </span>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || visibleGames.length === 0}
                  className="w-full sm:w-auto"
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || visibleGames.length === 0}
                  className="w-full sm:w-auto"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
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
            <label className="block text-sm font-medium text-foreground">Título</label>
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
            <label className="block text-sm font-medium text-foreground">Puntuación</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={editForm.score ?? 0}
                onChange={(e) => setEditField("score", Number(e.target.value))}
                className="flex-1 accent-primary"
                aria-label={`Puntuación: ${editForm.score ?? 0} de 100`}
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
            <label className="block text-sm font-medium text-foreground">Portada</label>
            <CoverPicker
              suggestedTitle={editForm.title}
              value={editForm.cover}
              onChange={(nextValue) => setEditField("cover", nextValue)}
              disabled={editing}
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
            <p className="state-danger-panel rounded-md border px-3 py-2 text-sm">
              {editError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPendingEdit(null)}
              disabled={editing}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={editing} className="w-full sm:w-auto">
              {editing ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(pendingDelete)}
        title="Confirmar eliminación"
        description={
          pendingDelete
            ? `Se eliminara "${pendingDelete.title}". Esta accion no se puede deshacer.`
            : undefined
        }
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        showCloseButton={false}
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPendingDelete(null)}
            disabled={deleting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button type="button" onClick={() => void confirmDelete()} disabled={deleting} className="w-full sm:w-auto">
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </Modal>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </Card>
  );
}


