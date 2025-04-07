import { Chess, Move, Square as ChessSquare } from "chess.js";
import { BoardState, Square as SquareType, PlayerColor } from "../types/game";

interface GlyphInfo {
  turnsLeft: number;
  triggered?: boolean;
}

/**
 * GameManager handles all game state and communication between chess.js and our custom board state.
 * This follows the architecture outlined in implementation.md.
 */
export class GameManager {
  private chess: Chess;
  private customBoardState: BoardState;
  private currentPlayer: PlayerColor;
  private moveHistory: Move[] = [];
  private effectTimers: Record<string, unknown> = {}; // Tracks time-based effects
  private glyphs: Record<string, GlyphInfo> = {};

  constructor() {
    this.chess = new Chess();
    this.currentPlayer = "w"; // White starts
    this.customBoardState = {}; // Initialize with empty object first
    this.customBoardState = this.syncCustomBoardFromChess(); // Then populate it
  }

  /**
   * Syncs the chess.js state to our custom board state
   */
  private syncCustomBoardFromChess(): BoardState {
    const newBoardState: BoardState = {};
    const board = this.chess.board();

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          const square = this.squareFromCoords(file, rank);

          // Check if this piece already exists in our custom state to preserve metadata
          const existingPiece = this.customBoardState[square];

          newBoardState[square] = {
            piece: `${piece.color}${piece.type.toUpperCase()}`,
            // Preserve existing effects, buffs, and history if available
            effects: existingPiece?.effects || [],
            buffs: existingPiece?.buffs || {},
            // Add current square to history or start new history
            prevPositions: existingPiece?.prevPositions
              ? [...existingPiece.prevPositions, square]
              : [square],
          };
        }
      }
    }

    return newBoardState;
  }

  /**
   * Converts file (0-7) and rank (0-7) to algebraic notation (e.g., "e4")
   */
  private squareFromCoords(file: number, rank: number): SquareType {
    const files = "abcdefgh";
    const ranks = "87654321";
    return (files[file] + ranks[rank]) as SquareType;
  }

  /**
   * Makes a standard chess move, handling both chess.js and customBoardState
   */
  public makeMove(from: SquareType, to: SquareType): boolean {
    try {
      // 1. Try the move in chess.js
      const move = this.chess.move({
        from: from as ChessSquare,
        to: to as ChessSquare,
        promotion: "q",
      });

      if (!move) {
        return false; // Illegal move
      }

      // 2. Record the move
      this.moveHistory.push(move);

      // 3. Update our custom board state to match
      this.customBoardState = this.syncCustomBoardFromChess();

      // 4. Change current player
      this.currentPlayer = this.currentPlayer === "w" ? "b" : "w";

      // 5. Process any end-of-turn effects
      this.processTurnEffects();

      return true;
    } catch (error) {
      console.error("Error making move:", error);
      return false;
    }
  }

  /**
   * Process time-based effects at the end of a turn
   */
  private processTurnEffects() {
    // Decrement all buff durations
    for (const square in this.customBoardState) {
      const piece = this.customBoardState[square];
      if (piece.buffs) {
        for (const buffName in piece.buffs) {
          piece.buffs[buffName]--;

          // Remove expired buffs
          if (piece.buffs[buffName] <= 0) {
            delete piece.buffs[buffName];

            // Handle special cleanup for specific buffs
            if (buffName === "emberCrown") {
              // Piece with expired Ember Crown dies
              delete this.customBoardState[square];
            }
          }
        }
      }

      // Remove temporary effects marked for removal
      if (piece.effects && piece.effects.includes("mistClone")) {
        delete this.customBoardState[square];
      }
    }

    // Process glyphs
    this.processGlyphs();
  }

  /**
   * Process glyph-related effects
   */
  private processGlyphs() {
    for (const square in this.glyphs) {
      if (this.glyphs[square].triggered) {
        // Transform piece on triggered glyph
        if (this.customBoardState[square]) {
          const piece = this.customBoardState[square];
          piece.piece = piece.piece[0] + "P"; // Transform to pawn
        }

        // Remove the glyph after it's triggered
        delete this.glyphs[square];
      } else {
        // Decrement glyph timer
        this.glyphs[square].turnsLeft--;
        if (this.glyphs[square].turnsLeft <= 0) {
          delete this.glyphs[square];
        }
      }
    }
  }

  /**
   * Get all legally available moves for a piece on the given square
   */
  public getLegalMoves(square: SquareType): SquareType[] {
    try {
      const moves = this.chess.moves({
        square: square as ChessSquare,
        verbose: true,
      });
      return moves.map((move) => move.to as SquareType);
    } catch (error) {
      console.error("Error getting legal moves:", error);
      return [];
    }
  }

  /**
   * Check if the current player is in check
   */
  public isInCheck(): boolean {
    return this.chess.isCheck();
  }

  /**
   * Check if the current player is in checkmate
   */
  public isInCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  /**
   * Check if the game is drawn
   */
  public isGameDrawn(): boolean {
    return this.chess.isDraw();
  }

  /**
   * Get the current board state for rendering
   */
  public getBoardState(): BoardState {
    return { ...this.customBoardState };
  }

  /**
   * Get the current player's color
   */
  public getCurrentPlayer(): PlayerColor {
    return this.currentPlayer;
  }

  /**
   * Reset the game to initial state
   */
  public resetGame() {
    this.chess = new Chess();
    this.customBoardState = this.syncCustomBoardFromChess();
    this.currentPlayer = "w";
    this.moveHistory = [];
    this.effectTimers = {};
    this.glyphs = {};
  }

  /**
   * Add a glyph to a square (for Cursed Glyph spell)
   */
  public addGlyph(square: SquareType) {
    this.glyphs[square] = { turnsLeft: 1 };
  }

  /**
   * Check if a glyph has been triggered
   */
  public checkGlyphTrigger(square: SquareType) {
    if (this.glyphs[square]) {
      this.glyphs[square].triggered = true;
    }
  }

  /**
   * Get the FEN string representation of the current position
   */
  public getFen(): string {
    return this.chess.fen();
  }

  /**
   * Get all glyphed squares
   */
  public getGlyphs(): Record<string, GlyphInfo> {
    return { ...this.glyphs };
  }
}
