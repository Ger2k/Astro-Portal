import type { UserAchievement } from "@domains/games/types/achievement";
import type { ToastMessage } from "@shared/ui/primitives";

type PushToast = (toast: Omit<ToastMessage, "id">) => void;

export function pushAchievementToast(push: PushToast, unlockedNow: UserAchievement[]) {
  if (unlockedNow.length === 0) {
    return;
  }

  const first = unlockedNow[0];

  if (unlockedNow.length === 1) {
    push({
      variant: "success",
      title: `Logro desbloqueado: ${first.title}`,
      description: first.description,
      iconUrl: first.placeholderIcon,
      iconAlt: `Icono de ${first.title}`,
    });
    return;
  }

  push({
    variant: "success",
    title: `Has desbloqueado ${unlockedNow.length} logros`,
    description: `Ultimo desbloqueado: ${first.title}`,
    iconUrl: first.placeholderIcon,
    iconAlt: `Icono de ${first.title}`,
  });
}
