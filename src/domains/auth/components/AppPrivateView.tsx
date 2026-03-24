import { useState } from "react";
import ComponentShowcase from "@domains/design-system/components/ComponentShowcase";
import { AuthAccessPanel } from "@domains/auth/components/AuthAccessPanel";
import { AuthPageShell } from "@domains/auth/components/AuthPageShell";
import { ProtectedArea } from "@domains/auth/components/ProtectedArea";
import { AddGameForm } from "@domains/games/components/AddGameForm";
import { CompletedGamesList } from "@domains/games/components/CompletedGamesList";

export function AppPrivateView() {
  const [listVersion, setListVersion] = useState(0);

  return (
    <AuthPageShell>
      <div className="space-y-6">
        <AuthAccessPanel />
        <ProtectedArea>
          <AddGameForm onSuccess={() => setListVersion((v) => v + 1)} />
          <CompletedGamesList key={listVersion} />
          <ComponentShowcase />
        </ProtectedArea>
      </div>
    </AuthPageShell>
  );
}
