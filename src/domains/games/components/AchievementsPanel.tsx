import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/primitives";
import type { AchievementProgress, UserAchievement } from "@domains/games/types/achievement";

function rarityClass(rarity: string) {
  if (rarity === "epic") return "border-primary/50 bg-primary/5";
  if (rarity === "rare") return "border-accent/50 bg-accent/5";
  return "border-border/70 bg-surface";
}

interface AchievementsPanelProps {
  unlocked: UserAchievement[];
  progress: AchievementProgress[];
}

export function AchievementsPanel({ unlocked, progress }: AchievementsPanelProps) {
  const nextGoals = progress.filter((item) => !item.completed).slice(0, 3);

  return (
    <Card className="p-4 reveal-up" style={{ animationDelay: "150ms" }}>
      <CardHeader className="mb-3 p-0">
        <CardTitle className="text-base">Logros</CardTitle>
        <p className="text-sm text-muted-foreground">
          Desbloqueados {unlocked.length} de {progress.length}. Sigue progresando para completar tu panel.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 p-0">
        {unlocked.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {unlocked.slice(0, 6).map((achievement) => (
              <article
                key={achievement.key}
                className={`rounded-lg border p-3 ${rarityClass(achievement.rarity)}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <img
                    src={achievement.placeholderIcon}
                    alt={`Icono de ${achievement.title}`}
                    className="h-8 w-8 rounded"
                    loading="lazy"
                  />
                  <p className="text-sm font-semibold text-foreground">{achievement.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aun no hay logros desbloqueados. Completa tu primer juego para empezar.
          </p>
        )}

        {nextGoals.length > 0 ? (
          <div className="space-y-2 border-t border-border/70 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Proximos objetivos
            </p>
            <div className="space-y-2">
              {nextGoals.map((goal) => {
                const percentage = Math.round((goal.progress / goal.progressMax) * 100);

                return (
                  <div key={goal.key} className="rounded-lg border border-border/70 bg-surface px-3 py-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.progress}/{goal.progressMax}
                      </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
