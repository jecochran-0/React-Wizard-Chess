import { Chess, Move, PieceSymbol, Square } from "chess.js";
import { PieceMeta, Effect, SpellId } from "../types/types";
import { SpellEngine } from "./SpellEngine";

// Define specialized target types for the castSpell method
type SingleTarget = Square;
type MultiTarget = Square[];
type FromToTarget = { from: Square; to: Square };
type SpellTargetData = SingleTarget | MultiTarget | FromToTarget;

class GameManager {
  private chess: Chess;
  private customBoardState: Map<Square, PieceMeta>;
  private effects: Effect[];
  private moveHistory: Move[];
  private spellEngine: SpellEngine;

  constructor() {
    this.chess = new Chess();
    this.customBoardState = new Map();
    this.effects = [];
    this.moveHistory = [];
    this.spellEngine = new SpellEngine(this);
    this.syncCustomBoardFromChess();
  }

  // Get the current player's turn
  getCurrentPlayer(): "w" | "b" {
    return this.chess.turn();
  }

  // Get a piece at a specific square
  getPieceAt(square: Square): PieceMeta | null {
    return this.customBoardState.get(square) || null;
  }

  // Get all legal moves from a specific square
  getLegalMovesFrom(square: Square): Square[] {
    const moves = this.chess.moves({ square, verbose: true });
    return moves.map((move) => move.to as Square);
  }

  // Make a chess move
  makeMove(from: Square, to: Square): boolean {
    try {
      const move = this.chess.move({ from, to, promotion: "q" });
      if (move) {
        this.moveHistory.push(move);
        this.syncCustomBoardFromChess();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Invalid move:", error);
      return false;
    }
  }

  // Check if the current player's king is in check
  isKingInCheck(): boolean {
    return this.chess.isCheck();
  }

  // Get the position of the king that is in check
  getKingInCheckPosition(): Square | null {
    if (!this.chess.isCheck()) return null;

    const currentPlayer = this.chess.turn();
    const board = this.chess.board();

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece && piece.type === "k" && piece.color === currentPlayer) {
          const files = "abcdefgh";
          return (files[file] + (8 - rank)) as Square;
        }
      }
    }

    return null;
  }

  // Synchronize the custom board state from chess.js
  private syncCustomBoardFromChess(): void {
    // Clear the current state
    this.customBoardState.clear();

    // Iterate through the chess.js board and add pieces to our custom state
    const board = this.chess.board();
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          const files = "abcdefgh";
          const square = (files[file] + (8 - rank)) as Square;

          // Check if we already have metadata for this piece
          const existingPiece = this.customBoardState.get(square);

          // Create or update the piece metadata
          const pieceMeta: PieceMeta = {
            type: piece.type,
            color: piece.color,
            square: square,
            effects: existingPiece ? existingPiece.effects : [],
            hasMoved: this.hasPieceMoved(square, piece.type, piece.color),
          };

          this.customBoardState.set(square, pieceMeta);
        }
      }
    }
  }

  // Check if a piece has moved
  private hasPieceMoved(
    square: Square,
    type: PieceSymbol,
    color: "w" | "b"
  ): boolean {
    // Kings and rooks need special tracking for castling
    if ((type === "k" || type === "r") && this.moveHistory.length > 0) {
      const initialPositions = {
        w: { k: "e1", r: ["a1", "h1"] },
        b: { k: "e8", r: ["a8", "h8"] },
      };

      const initialPos =
        type === "k" ? initialPositions[color].k : initialPositions[color].r;

      // For rooks, check if it's in one of the initial positions
      if (type === "r") {
        if (!(initialPos as string[]).includes(square)) {
          return true; // Not in initial position, so it has moved
        }
      } else if (square !== initialPos) {
        return true; // Not in initial position, so it has moved
      }

      // Check move history for this piece
      return this.moveHistory.some(
        (move) =>
          move.piece === type &&
          move.color === color &&
          (move.from === square || move.to === square)
      );
    }

    return false;
  }

  // Reset the game to initial state
  resetGame(): void {
    this.chess.reset();
    this.customBoardState.clear();
    this.effects = [];
    this.moveHistory = [];
    this.syncCustomBoardFromChess();
  }

  // Cast a spell
  castSpell(spellId: SpellId, targets: SpellTargetData): boolean {
    return this.spellEngine.castSpell(spellId, targets);
  }

  // Get the mana cost of a spell
  getSpellCost(spellId: SpellId): number {
    return this.spellEngine.getSpellCost(spellId);
  }

  // Process end of turn effects
  endTurn(): void {
    // Process active effects
    this.processEndOfTurnEffects();

    // Update the board state
    this.syncCustomBoardFromChess();
  }

  // Process effects at the end of a turn
  private processEndOfTurnEffects(): void {
    // Decrease duration of all effects
    this.effects = this.effects
      .map((effect) => ({ ...effect, duration: effect.duration - 1 }))
      .filter((effect) => effect.duration > 0); // Remove expired effects

    // Apply any end-of-turn effect logic
    // This will be expanded in the full implementation
  }

  // Add an effect to a piece
  addEffect(square: Square, effect: Effect): void {
    const piece = this.customBoardState.get(square);
    if (piece) {
      piece.effects.push(effect);
      this.effects.push(effect);
    }
  }

  // Remove an effect from a piece
  removeEffect(square: Square, effectId: string): void {
    const piece = this.customBoardState.get(square);
    if (piece) {
      piece.effects = piece.effects.filter((e) => e.id !== effectId);
    }

    // Also remove from global effects list
    this.effects = this.effects.filter((e) => e.id !== effectId);
  }

  // Get all pieces with a specific effect
  getPiecesWithEffect(effectType: string): PieceMeta[] {
    const pieces: PieceMeta[] = [];

    this.customBoardState.forEach((piece) => {
      if (piece.effects.some((effect) => effect.type === effectType)) {
        pieces.push(piece);
      }
    });

    return pieces;
  }
}

export default GameManager;
