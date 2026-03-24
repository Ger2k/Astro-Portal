export interface CompletedGame {
  id: string;
  title: string;
  platform: string;
  date: string | null;
  score: number | null;
  hours: number | null;
  cover: string;
  notes: string;
}

export interface NewGameInput {
  title: string;
  platform: string;
  date: string | null;
  score: number | null;
  hours: number | null;
  cover: string;
  notes: string;
}
