import { useState } from "react";
import { AuthAccessPanel } from "@domains/auth/components/AuthAccessPanel";
import { AuthPageShell } from "@domains/auth/components/AuthPageShell";
import { ProtectedArea } from "@domains/auth/components/ProtectedArea";
import { CompletedGamesList } from "@domains/games/components/CompletedGamesList";
import { AddGameForm } from "@domains/games/components/AddGameForm";

export function AppPrivateView() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AuthPageShell>
      <div className="space-y-6">
        <AuthAccessPanel />
        <ProtectedArea>
          <AddGameForm onSuccess={() => setRefreshKey((k) => k + 1)} />
          <CompletedGamesList refreshKey={refreshKey} />
        </ProtectedArea>
      </div>
    </AuthPageShell>
  );
}
