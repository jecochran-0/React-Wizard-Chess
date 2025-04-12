import { Chess, Square as ChessSquare } from "chess.js";
import {
  BoardState,
  Square as SquareType,
  PlayerColor,
  MoveResult,
  SpellTarget,
  SpellCastResult,
  GameState,
} from "../types/game";
import { SpellEngine } from "./SpellEngine";
import { getSpellById } from "./spells";

interface GlyphInfo {
  square: string;
  remaining: number;
  triggered?: boolean;
  turnsLeft: number;
}

/**
 * GameManager handles all game state and communication between chess.js and our custom board state.
 * This follows the architecture outlined in implementation.md.
 */
export class GameManager {
  private chess: Chess;
  private customBoardState: BoardState;
  private currentPlayer: PlayerColor = "w";
  private lastMove: { from: SquareType; to: SquareType } | null = null;
  // Kept for future implementation but marked as ignored for TypeScript
  // @ts-expect-error - Will be used in future implementations
  private effectTimers: Record<string, unknown> = {};
  private glyphs: Record<string, GlyphInfo> = {};
  private playerMana: Record<PlayerColor, number> = { w: 10, b: 10 };
  private turn = 1;
  private gameLog: string[] = [];
  private spellEngine: SpellEngine;
  private selectedSpell: string | null = null;
  private kingPositions: Record<PlayerColor, SquareType> = {
    w: "e1",
    b: "e8",
  };

  constructor() {
    this.chess = new Chess();
    this.customBoardState = {}; // Initialize with empty object first
    this.customBoardState = this.syncCustomBoardFromChess(); // Then populate it
    this.spellEngine = new SpellEngine(
      this.customBoardState,
      this.chess,
      this.currentPlayer
    );
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
  public makeMove(from: SquareType, to: SquareType): MoveResult {
    try {
      // Check for special effects that might prevent moves
      if (this.hasAnchoredEffect(from)) {
        return { success: false };
      }

      // Check pressure field effect
      if (
        this.spellEngine.hasPressureField() &&
        this.spellEngine.isAdjacentToRook(to, this.currentPlayer)
      ) {
        return { success: false };
      }

      // 1. Try the move in chess.js
      const move = this.chess.move({
        from: from as ChessSquare,
        to: to as ChessSquare,
        promotion: "q",
      });

      if (!move) {
        return { success: false };
      }

      // 2. Record the move
      this.lastMove = { from, to };

      // 3. Update our custom board state to match
      this.customBoardState = this.syncCustomBoardFromChess();

      // 4. Change current player
      this.currentPlayer = this.currentPlayer === "w" ? "b" : "w";

      // 5. Process any end-of-turn effects
      this.processTurnEffects();

      // Check if a piece was captured
      if (move.captured) {
        // If the captured piece was part of a spirit link, handle the special effects
        this.spellEngine.onCapture(to);
      }

      // Check if a pawn was moved onto a glyph
      if (this.customBoardState[to]?.piece[1] === "P") {
        this.spellEngine.checkGlyphTrigger(to);
      }

      // Update king positions if a king moved
      if (this.customBoardState[to]?.piece[1] === "K") {
        this.kingPositions[this.customBoardState[to].piece[0] as PlayerColor] =
          to;
      }

      // Log the move
      this.gameLog.push(
        `${
          this.currentPlayer === "w" ? "White" : "Black"
        } moved ${from} to ${to}`
      );

      return {
        success: true,
        isCheck: this.chess.isCheck(),
        isCheckmate: this.chess.isCheckmate(),
      };
    } catch (error) {
      console.error("Error making move:", error);
      return { success: false };
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
    this.lastMove = null;
    this.effectTimers = {};
    this.glyphs = {};
  }

  /**
   * Add a glyph to a square (for Cursed Glyph spell)
   */
  public addGlyph(square: SquareType) {
    this.glyphs[square] = {
      square: square,
      remaining: 1,
      turnsLeft: 1,
    };
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

  /**
   * Get the current game state.
   */
  public getGameState(): GameState {
    return {
      boardState: this.customBoardState,
      currentPlayer: this.currentPlayer,
      playerMana: this.playerMana,
      turn: this.turn,
      status: this.getGameStatus(),
      kingPositions: this.kingPositions,
      gameLog: [...this.gameLog],
    };
  }

  /**
   * Get the current game status.
   */
  private getGameStatus() {
    if (this.chess.isCheckmate()) return "checkmate";
    if (this.chess.isDraw()) return "draw";
    if (this.chess.isStalemate()) return "stalemate";
    if (this.chess.isCheck()) return "check";
    return "active";
  }

  /**
   * End the current player's turn and switch to the other player
   */
  public endTurn(): void {
    // Process end of turn effects
    this.spellEngine.processEndOfTurnEffects();

    // Switch player
    this.currentPlayer = this.currentPlayer === "w" ? "b" : "w";

    // Update turn counter if switching back to white
    if (this.currentPlayer === "w") {
      this.turn++;
    }

    // Add mana for the new turn (capped at 10)
    this.playerMana[this.currentPlayer] = Math.min(
      10,
      this.playerMana[this.currentPlayer] + 2
    );

    // Update spell engine with new current player
    this.spellEngine.updateReferences(
      this.customBoardState,
      this.chess,
      this.currentPlayer
    );

    // Log the turn change
    this.gameLog.push(
      `Turn ${this.turn}: ${
        this.currentPlayer === "w" ? "White" : "Black"
      }'s turn`
    );
  }

  /**
   * Get valid moves for a given piece
   */
  public getValidMoves(square: SquareType): SquareType[] {
    // If piece is anchored, it can't move
    if (this.hasAnchoredEffect(square)) {
      return [];
    }

    // Get all legal moves from chess.js
    const moves = this.chess.moves({
      square: square as ChessSquare,
      verbose: true,
    });

    // Convert to an array of target squares
    const validSquares = moves.map((move) => move.to as SquareType);

    // Filter out moves that would end adjacent to a rook (if pressure field is active)
    if (this.spellEngine.hasPressureField()) {
      return validSquares.filter(
        (sq) => !this.spellEngine.isAdjacentToRook(sq, this.currentPlayer)
      );
    }

    return validSquares;
  }

  /**
   * Select a spell for casting
   */
  public selectSpell(spellId: string): boolean {
    const spell = getSpellById(spellId);
    if (!spell) {
      return false;
    }

    // Check if player has enough mana
    if (this.playerMana[this.currentPlayer] < spell.manaCost) {
      return false;
    }

    this.selectedSpell = spellId;
    return true;
  }

  /**
   * Get the currently selected spell ID
   */
  public getSelectedSpell(): string | null {
    return this.selectedSpell;
  }

  /**
   * Clear the selected spell
   */
  public clearSelectedSpell(): void {
    this.selectedSpell = null;
  }

  /**
   * Cast the selected spell with the provided targets
   */
  public castSpell(targets: SpellTarget): SpellCastResult {
    // Make sure a spell is selected
    if (!this.selectedSpell) {
      return { success: false, error: "No spell selected" };
    }

    const spell = getSpellById(this.selectedSpell);
    if (!spell) {
      return { success: false, error: "Invalid spell" };
    }

    // Check if player has enough mana
    if (this.playerMana[this.currentPlayer] < spell.manaCost) {
      return { success: false, error: "Not enough mana" };
    }

    // Result of the spell casting
    let success = false;
    let affectedSquares: SquareType[] = [];

    // Declare variables that will be used in multiple cases
    let pawnSquares: SquareType[];
    let summonSquare: SquareType;
    let primarySquare: SquareType;
    let backupSquares: SquareType[];
    let moves: Array<{ from: SquareType; to: SquareType }>;

    // Cast the spell based on its ID
    switch (this.selectedSpell) {
      case "astral_swap":
        if (!targets.squares || targets.squares.length !== 2) {
          return { success: false, error: "Astral Swap requires two pieces" };
        }
        success = this.spellEngine.castAstralSwap(
          targets.squares[0],
          targets.squares[1]
        );
        affectedSquares = targets.squares;
        break;

      case "phantom_step":
        if (!targets.from || !targets.to) {
          return {
            success: false,
            error: "Phantom Step requires source and destination squares",
          };
        }
        success = this.spellEngine.castPhantomStep(targets.from, targets.to);
        affectedSquares = [targets.from, targets.to];
        break;

      case "ember_crown":
        if (!targets.squares || targets.squares.length === 0) {
          return {
            success: false,
            error: "Ember Crown requires a target pawn",
          };
        }
        success = this.spellEngine.castEmberCrown(targets.squares[0]);
        affectedSquares = [targets.squares[0]];
        break;

      case "arcane_anchor":
        if (!targets.squares || targets.squares.length === 0) {
          return {
            success: false,
            error: "Arcane Anchor requires a target piece",
          };
        }
        success = this.spellEngine.castArcaneAnchor(targets.squares[0]);
        affectedSquares = [targets.squares[0]];
        break;

      case "mistform_knight":
        if (!targets.from || !targets.to) {
          return {
            success: false,
            error: "Mistform Knight requires source and destination squares",
          };
        }
        success = this.spellEngine.castMistformKnight(targets.from, targets.to);
        affectedSquares = [targets.from, targets.to];
        break;

      case "chrono_recall":
        if (!targets.squares || targets.squares.length === 0) {
          return {
            success: false,
            error: "Chrono Recall requires a target piece",
          };
        }
        success = this.spellEngine.castChronoRecall(targets.squares[0]);
        affectedSquares = [targets.squares[0]];
        break;

      case "cursed_glyph":
        if (!targets.squares || targets.squares.length === 0) {
          return {
            success: false,
            error: "Cursed Glyph requires a target square",
          };
        }
        success = this.spellEngine.castCursedGlyph(targets.squares[0]);
        affectedSquares = [targets.squares[0]];
        break;

      case "kings_gambit":
        if (!targets.from || !targets.to) {
          return {
            success: false,
            error: "King's Gambit requires source and destination squares",
          };
        }
        success = this.spellEngine.castKingsGambit(targets.from, targets.to);
        affectedSquares = [targets.from, targets.to];
        break;

      case "dark_conversion":
        if (
          !targets.squares ||
          targets.squares.length < 4 ||
          !targets.pieceType
        ) {
          return {
            success: false,
            error:
              "Dark Conversion requires 3 pawns, a target square, and a piece type",
          };
        }
        pawnSquares = targets.squares.slice(0, 3);
        summonSquare = targets.squares[3];
        success = this.spellEngine.castDarkConversion(
          pawnSquares,
          targets.pieceType as "N" | "B",
          summonSquare
        );
        affectedSquares = targets.squares;
        break;

      case "spirit_link":
        if (!targets.squares || targets.squares.length < 2) {
          return {
            success: false,
            error:
              "Spirit Link requires a primary piece and at least one backup",
          };
        }
        primarySquare = targets.squares[0];
        backupSquares = targets.squares.slice(1);
        success = this.spellEngine.castSpiritLink(primarySquare, backupSquares);
        affectedSquares = targets.squares;
        break;

      case "second_wind":
        if (!targets.squares || targets.squares.length !== 4) {
          return {
            success: false,
            error:
              "Second Wind requires two source and two destination squares",
          };
        }
        moves = [
          { from: targets.squares[0], to: targets.squares[1] },
          { from: targets.squares[2], to: targets.squares[3] },
        ];
        success = this.spellEngine.castSecondWind(moves);
        affectedSquares = targets.squares;
        break;

      case "pressure_field":
        success = this.spellEngine.castPressureField();
        break;

      case "nullfield":
        if (!targets.squares || targets.squares.length === 0) {
          return {
            success: false,
            error: "Nullfield requires a target square",
          };
        }
        success = this.spellEngine.castNullfield(targets.squares[0]);
        affectedSquares = [targets.squares[0]];
        break;

      case "veil_of_shadows":
        success = this.spellEngine.castVeilOfShadows();
        break;

      case "raise_the_bonewalker":
        if (!targets.squares || targets.squares.length === 0) {
          return {
            success: false,
            error: "Raise the Bonewalker requires a target square",
          };
        }
        success = this.spellEngine.castRaiseTheBonewalker(targets.squares[0]);
        affectedSquares = [targets.squares[0]];
        break;

      default:
        return { success: false, error: "Unimplemented spell" };
    }

    if (success) {
      // Deduct mana cost
      this.playerMana[this.currentPlayer] -= spell.manaCost;

      // Log the spell cast
      this.gameLog.push(
        `${this.currentPlayer === "w" ? "White" : "Black"} cast ${spell.name}`
      );

      // Clear selected spell
      this.clearSelectedSpell();

      return {
        success: true,
        affectedSquares,
        message: `${spell.name} cast successfully`,
      };
    } else {
      return {
        success: false,
        error: `Failed to cast ${spell.name}. Check spell requirements.`,
      };
    }
  }

  private hasAnchoredEffect(square: SquareType): boolean {
    const piece = this.customBoardState[square];
    return piece?.effects?.includes("anchored") || false;
  }

  /**
   * Check if the board should be hidden due to Veil of Shadows
   */
  public hasVeilOfShadows(): boolean {
    return this.spellEngine.hasVeilOfShadows();
  }
}
