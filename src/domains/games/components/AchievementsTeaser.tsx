import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/primitives";
import type { AchievementProgress, UserAchievement } from "@domains/games/types/achievement";

interface AchievementsTeaserProps {
  unlocked: UserAchievement[];
  progress: AchievementProgress[];
  loading: boolean;
  errorMessage: string | null;
}

export function AchievementsTeaser({
  unlocked,
  progress,
  loading,
  errorMessage,
}: AchievementsTeaserProps) {
  const latest = unlocked[0] ?? null;
  const next = progress.find((item) => !item.completed) ?? null;

  return (
    <Card className="p-4 sm:p-5">
      <CardHeader className="mb-2 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">Logros</CardTitle>
          <a
            href="/app/stats"
            className="rounded-(--radius-md) border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Ver panel completo
          </a>
        </div>
        <p className="text-sm text-muted-foreground">Desbloquea hitos y sigue tu progreso global.</p>
      </CardHeader>

      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Cargando logros...</p> : null}

        {!loading && errorMessage ? <p className="state-danger-text text-sm">{errorMessage}</p> : null}

        {!loading && !errorMessage ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/70 bg-surface px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Desbloqueados</p>
              <p className="text-lg font-semibold text-foreground">
                {unlocked.length}/{progress.length}
              </p>
            </div>

            {latest ? (
              <div className="rounded-lg border border-border/70 bg-surface px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ultimo logro</p>
                <p className="text-sm font-semibold text-foreground">{latest.title}</p>
                <p className="text-xs text-muted-foreground">{latest.description}</p>
              </div>
            ) : null}

            {next ? (
              <div className="rounded-lg border border-border/70 bg-surface px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Siguiente objetivo</p>
                <p className="text-sm font-semibold text-foreground">{next.title}</p>
                <p className="text-xs text-muted-foreground">
                  Progreso {next.progress}/{next.progressMax}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
