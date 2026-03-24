export interface CompletedGame {
  /** Clave generada por Firebase push (usada para eliminar el nodo). */
  nodeKey: string;
  /** Timestamp de creacion: String(Date.now()). */
  id: string;
  title: string;
  platform: string;
  date: string | null;
  score: number | null;
  hours: number | null;
  cover: string;
  notes: string;
}

export type NewGameInput = {
  title: string;
  platform: string;
  date: string;
  score: number | null;
  hours: number | null;
  cover: string;
  notes: string;
};

