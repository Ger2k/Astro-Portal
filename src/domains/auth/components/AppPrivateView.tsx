import { useState } from "react";
import { AuthPageShell } from "@domains/auth/components/AuthPageShell";
import { ProtectedArea } from "@domains/auth/components/ProtectedArea";
import { AddGameForm } from "@domains/games/components/AddGameForm";
import { CompletedGamesList } from "@domains/games/components/CompletedGamesList";

export function AppPrivateView() {
  const [listVersion, setListVersion] = useState(0);

  return (
    <AuthPageShell>
      <div className="space-y-6">
        <ProtectedArea>
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
        </ProtectedArea>
      </div>
    </AuthPageShell>
  );
}
