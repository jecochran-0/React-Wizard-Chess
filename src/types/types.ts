import { Square } from "chess.js";

// Piece-related types
export interface PieceMeta {
  type: string;
  color: "w" | "b";
  square: Square;
  effects: Effect[];
  hasMoved?: boolean;
  prevPositions?: Square[]; // Track previous positions for Chrono Recall spell
}

// Spell system types
export type SpellId = string;

export interface Spell {
  id: SpellId;
  name: string;
  description: string;
  manaCost: number;
  targetType: SpellTargetType;
  requiredTargets?: number;
  imagePath?: string;
  mustTargetOwnPiece?: boolean;
  mustTargetOpponentPiece?: boolean;
  mustTargetEmptySquare?: boolean;
}

export type SpellTargetType = "single" | "multi" | "from-to";

export interface SpellTarget {
  square: Square;
  type: "source" | "target";
}

export type PlayerSpells = {
  w: SpellId[];
  b: SpellId[];
};

// Effect system types
export interface Effect {
  id: string;
  type: EffectType;
  duration: number; // number of turns
  source: SpellId;
  modifiers?: EffectModifiers;
}

export type EffectType =
  | "shield"
  | "damage"
  | "movement"
  | "heal"
  | "buff"
  | "debuff"
  | "teleport"
  | "transform"
  | "glyph"
  | "visual";

// Effect modifiers interface
export interface EffectModifiers {
  damagePerTurn?: number;
  preventCapture?: boolean;
  defensiveBonus?: boolean;
  movementBonus?: number;
  // Allow additional properties not explicitly listed
  [key: string]: number | boolean | string | undefined;
}

export interface GameState {
  turn: "w" | "b";
  playerMana: { w: number; b: number };
  playerSpells: PlayerSpells;
  selectedSpell: SpellId | null;
  board: Record<Square, PieceMeta | null>;
  effects: Effect[];
}
