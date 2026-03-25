import { useState } from "react";
import { AuthPageShell } from "@domains/auth/components/AuthPageShell";
import { ProtectedArea } from "@domains/auth/components/ProtectedArea";
import { AddGameForm } from "@domains/games/components/AddGameForm";
import { CompletedGamesList } from "@domains/games/components/CompletedGamesList";
import { GamesStatsTeaser } from "@domains/games/components/GamesStatsTeaser";

export function AppPrivateView() {
  const [listVersion, setListVersion] = useState(0);

  return (
    <AuthPageShell>
      <div className="space-y-6">
        <ProtectedArea>
          <div className="space-y-4">
            <GamesStatsTeaser />

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
