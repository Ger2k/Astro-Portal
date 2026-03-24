import { AuthAccessPanel } from "@domains/auth/components/AuthAccessPanel";
import { AuthPageShell } from "@domains/auth/components/AuthPageShell";

export function HomeAuthCard() {
  return (
    <AuthPageShell>
      <AuthAccessPanel />
    </AuthPageShell>
  );
}
