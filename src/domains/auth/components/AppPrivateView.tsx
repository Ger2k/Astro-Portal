import ComponentShowcase from "@domains/design-system/components/ComponentShowcase";
import { AuthAccessPanel } from "@domains/auth/components/AuthAccessPanel";
import { AuthPageShell } from "@domains/auth/components/AuthPageShell";
import { ProtectedArea } from "@domains/auth/components/ProtectedArea";
import { CompletedGamesList } from "@domains/games/components/CompletedGamesList";

export function AppPrivateView() {
  return (
    <AuthPageShell>
      <div className="space-y-6">
        <AuthAccessPanel />
        <ProtectedArea>
          <CompletedGamesList />
          <ComponentShowcase />
        </ProtectedArea>
      </div>
    </AuthPageShell>
  );
}
