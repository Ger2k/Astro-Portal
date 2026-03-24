import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import {
  fetchCompletedGamesForUser,
  deleteGameForUser,
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
  ToastViewport,
  useToast,
} from "@shared/ui/primitives";
import { CoverPicker } from "@domains/games/components/CoverPicker";

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

type SortOption = "date-desc" | "date-asc" | "score-desc" | "hours-desc";

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
  onEditRequest: (game: CompletedGame) => void;
  onDeleteRequest: (game: CompletedGame) => void;
}

function GameCard({ game, onEditRequest, onDeleteRequest }: GameCardProps) {
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
      </div>

      <div className="shrink-0 self-start">
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Editar ${game.title}`}
          onClick={() => onEditRequest(game)}
        >
          ✏️
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Eliminar ${game.title}`}
          onClick={() => onDeleteRequest(game)}
          className="text-danger hover:bg-red-50"
        >
          🗑
        </Button>
      </div>
    </li>
  );
}

export function CompletedGamesList({ refreshKey }: { refreshKey?: number }) {
  const { user } = useAuthSession();
  const { toasts, push, dismiss } = useToast();
  const [games, setGames] = useState<CompletedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Eliminación
  const [pendingDelete, setPendingDelete] = useState<CompletedGame | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edición
  const [pendingEdit, setPendingEdit] = useState<CompletedGame | null>(null);
  const [editForm, setEditForm] = useState<NewGameInput>({
    title: "",
    platform: "PC",
    date: todayISO(),
    score: 70,
    hours: null,
    cover: "",
    notes: "",
  });
  const [customEditPlatform, setCustomEditPlatform] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadGames = async (showToast = false) => {
    if (!user) {
      setGames([]);
      setLoading(false);
      return;
    }

    if (showToast) {
      setIsRefreshing(true);
    }

    setLoading(true);
    setErrorMessage(null);

    const result = await fetchCompletedGamesForUser(user.uid);

    if (!result.ok) {
      console.error("[CompletedGamesList]", result.errorMessage);
      setGames([]);
      setErrorMessage(result.errorMessage);
      setLoading(false);
      if (showToast) {
        push({
          variant: "error",
          title: "Error al actualizar",
          description: result.errorMessage,
        });
        setIsRefreshing(false);
      }
      return;
    }

    setGames(result.data);
    setLoading(false);
    if (showToast) {
      push({
        variant: "success",
        title: "Lista actualizada",
        description: `Se cargaron ${result.data.length} juego${result.data.length !== 1 ? "s" : ""}.`,
      });
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadGames();
  }, [user?.uid, refreshKey]);

  const platforms = useMemo(() => {
    const set = new Set(games.map((g) => g.platform).filter(Boolean));
    return Array.from(set).sort();
  }, [games]);

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    return games.filter((g) => {
      const matchesSearch = !q || g.title.toLowerCase().includes(q);
      const matchesPlatform = !platformFilter || g.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    });
  }, [games, search, platformFilter]);

  const sortedGames = useMemo(() => {
    const list = [...filteredGames];

    list.sort((a, b) => {
      switch (sortBy) {
        case "date-asc": {
          const aTime = a.date ? Date.parse(a.date) : 0;
          const bTime = b.date ? Date.parse(b.date) : 0;
          return aTime - bTime;
        }
        case "score-desc":
          return (b.score ?? -1) - (a.score ?? -1);
        case "hours-desc":
          return (b.hours ?? -1) - (a.hours ?? -1);
        case "date-desc":
        default: {
          const aTime = a.date ? Date.parse(a.date) : 0;
          const bTime = b.date ? Date.parse(b.date) : 0;
          return bTime - aTime;
        }
      }
    });

    return list;
  }, [filteredGames, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedGames.length / pageSize));

  const paginatedGames = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedGames.slice(start, start + pageSize);
  }, [sortedGames, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, platformFilter, sortBy, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const isCustomEditPlatform = editForm.platform === "Otro";

  function setEditField<K extends keyof NewGameInput>(key: K, value: NewGameInput[K]) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function openEditModal(game: CompletedGame) {
    const useCustomPlatform =
      game.platform && !PLATFORM_OPTIONS.includes(game.platform) ? game.platform : "";

    setPendingEdit(game);
    setEditForm({
      title: game.title,
      platform: useCustomPlatform ? "Otro" : (game.platform || "PC"),
      date: game.date || todayISO(),
      score: game.score ?? 70,
      hours: game.hours,
      cover: game.cover,
      notes: game.notes,
    });
    setCustomEditPlatform(useCustomPlatform);
    setEditError(null);
  }

  function closeEditModal() {
    if (savingEdit) return;
    setPendingEdit(null);
    setEditError(null);
  }

  async function confirmEdit() {
    if (!user || !pendingEdit) return;

    const title = editForm.title.trim();
    const platform = (isCustomEditPlatform ? customEditPlatform : editForm.platform).trim();
    let cover = "";
    const notes = editForm.notes.trim();

    if (!title) {
      setEditError("El título es obligatorio.");
      return;
    }

    if (!platform) {
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

    setSavingEdit(true);
    setEditError(null);

    cover = editForm.cover.trim();
    if (!cover.startsWith("https://")) cover = "";
    if (!cover) {
      try {
        const res = await fetch(`/api/rawg-cover?title=${encodeURIComponent(title)}`);
        const data = (await res.json()) as { images?: string[] };
        cover = data.images?.[0] ?? "";
      } catch {
        cover = "";
      }
    }

    const payload: NewGameInput = {
      ...editForm,
      title,
      platform,
      cover,
      notes,
    };

    const result = await updateGameForUser(user.uid, pendingEdit.nodeKey, payload);

    if (!result.ok) {
      setEditError(result.errorMessage);
      setSavingEdit(false);
      push({
        variant: "error",
        title: "No se pudo guardar",
        description: result.errorMessage,
      });
      return;
    }

    setGames((prev) =>
      prev.map((g) =>
        g.nodeKey === pendingEdit.nodeKey
          ? {
              ...g,
              ...payload,
            }
          : g,
      ),
    );

    setSavingEdit(false);
    setPendingEdit(null);
    push({
      variant: "success",
      title: "Juego actualizado",
      description: "Los cambios se guardaron correctamente.",
    });
  }

  async function confirmDelete() {
    if (!user || !pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);

    const result = await deleteGameForUser(user.uid, pendingDelete.nodeKey);

    if (!result.ok) {
      setDeleteError(result.errorMessage);
      setDeleting(false);
      push({
        variant: "error",
        title: "No se pudo eliminar",
        description: result.errorMessage,
      });
      return;
    }

    // Eliminar localmente sin recargar
    setGames((prev) => prev.filter((g) => g.nodeKey !== pendingDelete.nodeKey));
    setPendingDelete(null);
    setDeleting(false);
    push({
      variant: "success",
      title: "Juego eliminado",
      description: "El juego se eliminó correctamente.",
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Juegos completados</CardTitle>
              <CardDescription>
                {loading
                  ? "Cargando desde Firebase..."
                  : `${filteredGames.length} de ${games.length} juego${
                      games.length !== 1 ? "s" : ""
                    }`}
              </CardDescription>
            </div>

            <Button
              variant="secondary"
              onClick={() => void loadGames(true)}
              disabled={loading || isRefreshing}
            >
              {loading || isRefreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>

          {/* Buscador + filtro + orden */}
          {!loading && games.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                type="search"
                placeholder="Buscar por título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar juego por título"
              />
              <select
                className="h-10 w-full rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-52"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                aria-label="Filtrar por plataforma"
              >
                <option value="">Todas las plataformas</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                className="h-10 w-full rounded-(--radius-md) border border-input bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-52"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Ordenar juegos"
              >
                <option value="date-desc">Mas recientes</option>
                <option value="date-asc">Mas antiguos</option>
                <option value="score-desc">Mejor puntuación</option>
                <option value="hours-desc">Mas horas jugadas</option>
              </select>
            </div>
          ) : null}
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

          {!loading && !errorMessage && games.length > 0 && filteredGames.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ningun juego coincide con los filtros actuales.
            </p>
          ) : null}

          {!loading && !errorMessage && sortedGames.length > 0 ? (
            <>
              <ul className="space-y-3" aria-label="Lista de juegos completados">
                {paginatedGames.map((game) => (
                  <GameCard
                    key={game.nodeKey}
                    game={game}
                    onEditRequest={openEditModal}
                    onDeleteRequest={setPendingDelete}
                  />
                ))}
              </ul>

              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sortedGames.length)} de {sortedGames.length}
                </p>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground" htmlFor="games-page-size">
                    Por página
                  </label>
                  <select
                    id="games-page-size"
                    className="h-9 rounded-(--radius-md) border border-input bg-surface px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    aria-label="Cantidad de juegos por página"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="min-w-20 text-center text-sm text-foreground">
                    Página {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={pendingDelete !== null}
        title="Eliminar juego"
        description={`¿Seguro que quieres eliminar "${pendingDelete?.title ?? ""}"? Esta accion no se puede deshacer.`}
        showCloseButton={false}
        onClose={() => {
          if (!deleting) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
      >
        {deleteError ? (
          <p className="mb-4 rounded-md border border-danger bg-red-50 px-3 py-2 text-sm text-red-900">
            {deleteError}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setPendingDelete(null);
              setDeleteError(null);
            }}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void confirmDelete()} disabled={deleting}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={pendingEdit !== null}
        title={pendingEdit ? `Editar: ${pendingEdit.title}` : "Editar juego"}
        description="Actualiza los datos del juego y guarda los cambios."
        showCloseButton={false}
        onClose={closeEditModal}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void confirmEdit();
          }}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Título</label>
            <Input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditField("title", e.target.value)}
              autoFocus
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
            {isCustomEditPlatform ? (
              <Input
                type="text"
                placeholder="Escribe la plataforma"
                className="mt-2"
                value={customEditPlatform}
                onChange={(e) => setCustomEditPlatform(e.target.value)}
              />
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Fecha completado</label>
            <Input
              type="date"
              value={editForm.date}
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
            <CoverPicker title={editForm.title} value={editForm.cover} onChange={(url) => setEditField("cover", url)} />
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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeEditModal} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button type="submit" disabled={savingEdit}>
              {savingEdit ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

