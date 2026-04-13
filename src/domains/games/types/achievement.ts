export type AchievementRarity = "common" | "rare" | "epic";

export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  rarity: AchievementRarity;
  target: number;
  metric: "games" | "hours" | "score" | "platforms";
  placeholderIcon: string;
}

export interface UserAchievement {
  id: string;
  key: string;
  title: string;
  description: string;
  rarity: AchievementRarity;
  unlockedAt: string;
  placeholderIcon: string;
  progress: number;
  progressMax: number;
}

export interface AchievementProgress {
  key: string;
  title: string;
  description: string;
  rarity: AchievementRarity;
  placeholderIcon: string;
  progress: number;
  progressMax: number;
  completed: boolean;
}
