export type Square = string; // e.g., 'e4'
export type PieceCode = string; // e.g., 'wP', 'bQ'
export type PlayerColor = "w" | "b";

export interface PieceMeta {
  piece: PieceCode;
  effects?: string[]; // ["shielded", "anchor", etc.]
  buffs?: Record<string, number>; // { 'emberCrown': 2 }
  prevPositions?: Square[];
}

export type BoardState = Record<Square, PieceMeta>;

export type ChessGameStatus =
  | "active"
  | "check"
  | "checkmate"
  | "draw"
  | "stalemate";

export interface Spell {
  id: string;
  name: string;
  manaCost: number;
  description: string;
  targetType?: SpellTargetType;
  maxTargets?: number;
  icon?: string;
}

export type SpellTargetType =
  | "self" // No target selection, affects the player
  | "square" // Target a single square
  | "piece" // Target a piece
  | "friendly" // Target friendly piece
  | "enemy" // Target enemy piece
  | "empty" // Target empty square
  | "multi-square" // Target multiple squares
  | "multi-piece" // Target multiple pieces
  | "from-to"; // Select source and destination squares

export interface MoveResult {
  success: boolean;
  error?: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isDraw?: boolean;
}

export interface SpellTarget {
  from?: Square;
  to?: Square;
  squares?: Square[];
  pieceType?: string;
}

export interface SpellCastResult {
  success: boolean;
  error?: string;
  affectedSquares?: Square[];
  message?: string;
}

export interface GameState {
  boardState: BoardState;
  currentPlayer: PlayerColor;
  playerMana: Record<PlayerColor, number>;
  turn: number;
  status: ChessGameStatus;
  selectedPiece?: Square;
  selectedSpell?: string;
  legalMoves?: Record<Square, Square[]>;
  lastMove?: { from: Square; to: Square };
  kingPositions: Record<PlayerColor, Square>;
  gameLog: string[];
}

// Configuration set in the main menu
export interface GameConfig {
  playerColor: PlayerColor;
  computerOpponent: ComputerOpponent | null; // Add computer opponent config
  selectedSpells: Spell[];
  mana: number; // Starting mana (consider if this is needed here or just in ChessContext)
  maxMana: number;
}

// Configuration for the computer opponent
export interface ComputerOpponent {
  enabled: boolean;
  color: PlayerColor; // Automatically set based on player's choice
  difficulty: "easy" | "medium" | "hard";
}

// AI difficulty levels for the chessAI utility
export type AIDifficulty = "none" | "apprentice" | "novice" | "master";
