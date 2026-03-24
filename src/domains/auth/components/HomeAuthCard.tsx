import { useEffect } from "react";
import { AuthAccessPanel } from "@domains/auth/components/AuthAccessPanel";
import { AuthPageShell } from "@domains/auth/components/AuthPageShell";
import { useAuthSession } from "@domains/auth/hooks/useAuthSession";

function HomeAuthContent() {
  const { status } = useAuthSession();

  useEffect(() => {
    if (status === "authenticated" && window.location.pathname === "/") {
      window.location.replace("/app");
    }
  }, [status]);

  return <AuthAccessPanel />;
}

export function HomeAuthCard() {
  return (
    <AuthPageShell>
      <HomeAuthContent />
    </AuthPageShell>
  );
}
