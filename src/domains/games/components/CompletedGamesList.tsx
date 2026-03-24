import { useEffect, useState } from "react";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import {
  deleteGameForUser,
  fetchCompletedGamesForUser,
} from "@domains/games/services/completedGamesService";
import type { CompletedGame } from "@domains/games/types/completedGame";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Modal,
} from "@shared/ui/primitives";

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
}

function GameCard({ game, onDelete }: GameCardProps) {
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
              <GameCard key={game.nodeKey} game={game} onDelete={setPendingDelete} />
            ))}
          </ul>
        ) : null}
      </CardContent>

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


