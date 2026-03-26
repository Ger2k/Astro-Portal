export interface CompletedGame {
  nodeKey: string;
  id: string;
  title: string;
  platform: string;
  date: string | null;
  score: number | null;
  hours: number | null;
  cover: string;
  coverPositionX: number;
  coverPositionY: number;
  notes: string;
}

export interface NewGameInput {
  title: string;
  platform: string;
  date: string | null;
  score: number | null;
  hours: number | null;
  cover: string;
  coverPositionX: number;
  coverPositionY: number;
  notes: string;
}
