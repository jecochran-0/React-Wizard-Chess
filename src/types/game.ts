export type PlayerColor = "w" | "b";

export type Square = string; // e.g., 'e4'
export type PieceCode = string; // e.g., 'wP', 'bQ'

export interface PieceMeta {
  piece: PieceCode;
  effects?: string[]; // ["shielded", "anchor", etc.]
  buffs?: Record<string, number>; // { 'emberCrown': 2 }
  prevPositions?: Square[];
}

export type BoardState = Record<Square, PieceMeta>;

export interface Spell {
  id: string;
  name: string;
  manaCost: number;
  description: string;
  icon?: string;
}

export interface GameConfig {
  playerColor: PlayerColor;
  selectedSpells: Spell[];
  mana: number;
  maxMana: number;
}
