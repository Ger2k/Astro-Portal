import { AuthAccessPanel } from "@domains/auth/components/AuthAccessPanel";
import { AuthPageShell } from "@domains/auth/components/AuthPageShell";

export function AppHeaderSessionBar() {
  return (
    <AuthPageShell>
      <AuthAccessPanel variant="bar" />
    </AuthPageShell>
  );
}