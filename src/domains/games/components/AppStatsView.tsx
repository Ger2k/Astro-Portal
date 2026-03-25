import { AuthPageShell } from "@domains/auth/components/AuthPageShell";
import { ProtectedArea } from "@domains/auth/components/ProtectedArea";
import { GamesStatsDashboard } from "@domains/games/components/GamesStatsDashboard";

export function AppStatsView() {
  return (
    <AuthPageShell>
      <ProtectedArea>
        <GamesStatsDashboard />
      </ProtectedArea>
    </AuthPageShell>
  );
}
