import { useEffect, useState } from "react";
import { AuthPageShell } from "@domains/auth/components/AuthPageShell";
import { ProtectedArea } from "@domains/auth/components/ProtectedArea";
import { AddGameForm } from "@domains/games/components/AddGameForm";
import { CompletedGamesList } from "@domains/games/components/CompletedGamesList";
import { GamesStatsTeaser } from "@domains/games/components/GamesStatsTeaser";
import { AchievementsTeaser } from "@domains/games/components/AchievementsTeaser";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";
import { fetchCompletedGamesForUser } from "@domains/games/services/completedGamesService";
import { fetchAchievementsForUser } from "@domains/games/services/achievementsService";
import { evaluateAchievements } from "@domains/games/lib/achievementsEngine";
import { syncAchievementsForUser } from "@domains/games/lib/syncAchievementsForUser";
import type { AchievementProgress, UserAchievement } from "@domains/games/types/achievement";

export function AppPrivateView() {
  const { user } = useAuthSession();
  const [listVersion, setListVersion] = useState(0);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [achievementsError, setAchievementsError] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UserAchievement[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAchievements() {
      if (!user) {
        if (!cancelled) {
          setUnlockedAchievements([]);
          setAchievementProgress([]);
          setAchievementsLoading(false);
        }
        return;
      }

      setAchievementsLoading(true);
      setAchievementsError(null);

      const syncResult = await syncAchievementsForUser(user.uid);

      if (!syncResult.ok && !cancelled) {
        setAchievementsError(syncResult.errorMessage);
      }

      const [gamesResult, achievementsResult] = await Promise.all([
        fetchCompletedGamesForUser(user.uid),
        fetchAchievementsForUser(user.uid),
      ]);

      if (cancelled) {
        return;
      }

      if (!gamesResult.ok) {
        setAchievementsError(gamesResult.errorMessage);
        setUnlockedAchievements([]);
        setAchievementProgress([]);
        setAchievementsLoading(false);
        return;
      }

      if (!achievementsResult.ok) {
        setAchievementsError(achievementsResult.errorMessage);
        setUnlockedAchievements([]);
        setAchievementProgress([]);
        setAchievementsLoading(false);
        return;
      }

      const evaluation = evaluateAchievements(gamesResult.data, achievementsResult.data);
      setUnlockedAchievements(evaluation.unlockedAll);
      setAchievementProgress(evaluation.progressList);
      setAchievementsLoading(false);
    }

    void loadAchievements();

    return () => {
      cancelled = true;
    };
  }, [listVersion, user?.uid]);

  return (
    <AuthPageShell>
      <div className="space-y-6">
        <ProtectedArea>
          <div className="space-y-4">
            <GamesStatsTeaser />
            <AchievementsTeaser
              unlocked={unlockedAchievements}
              progress={achievementProgress}
              loading={achievementsLoading}
              errorMessage={achievementsError}
            />

            <CompletedGamesList
              key={listVersion}
              addGameAction={
                <AddGameForm
                  onSuccess={() => setListVersion((v) => v + 1)}
                  triggerVariant="primary"
                  triggerSize="md"
                  triggerClassName="w-full sm:w-auto"
                />
              }
            />
          </div>
        </ProtectedArea>
      </div>
    </AuthPageShell>
  );
}
