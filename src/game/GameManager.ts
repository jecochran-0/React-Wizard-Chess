import { Chess, Move, PieceSymbol, Square, Color } from "chess.js";
import { PieceMeta, Effect, SpellId, PlayerSpells } from "../types/types";
import { SpellEngine } from "./SpellEngine";

// Define specialized target types for the castSpell method
type SingleTarget = Square;
type MultiTarget = Square[];
type FromToTarget = { from: Square; to: Square };
type SpellTargetData = SingleTarget | MultiTarget | FromToTarget;

// Define a structure to store custom state
interface CustomBoardState {
  [square: string]: PieceMeta;
}

class GameManager {
  private chess: Chess;
  private customBoardState: CustomBoardState;
  private effects: Effect[];
  private moveHistory: Move[];
  private spellEngine: SpellEngine;
  private currentPlayerMana: { w: number; b: number };
  private playerSpells: PlayerSpells;
  private gameLog: string[];

  constructor(playerSpells: PlayerSpells) {
    this.chess = new Chess();
    this.customBoardState = this.initializeCustomBoardState();
    this.effects = [];
    this.moveHistory = [];
    this.currentPlayerMana = { w: 5, b: 5 };
    this.playerSpells = playerSpells;
    this.gameLog = [];
    this.spellEngine = new SpellEngine(this);
    this.syncCustomBoardFromChess();
  }

  // Initialize custom board state from chess.js board
  private initializeCustomBoardState(): CustomBoardState {
    const boardState: CustomBoardState = {};
    const board = this.chess.board();

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          const square = this.coordsToSquare(file, rank);
          boardState[square] = {
            type: piece.type,
            color: piece.color,
            square: square as Square,
            effects: [],
            hasMoved: false,
          };
        }
      }
    }

    return boardState;
  }

  // Convert array coordinates to algebraic notation
  private coordsToSquare(file: number, rank: number): string {
    const files = "abcdefgh";
    const ranks = "87654321";
    return files[file] + ranks[rank];
  }

  // Sync custom board state with chess.js
  private syncCustomBoardFromChess(): void {
    const newCustomBoardState: CustomBoardState = {};
    const board = this.chess.board();

    // Create a map to track pieces by their effects
    const effectsMap = new Map<string, Effect[]>();

    // Store all effects from the current board state
    for (const square in this.customBoardState) {
      const piece = this.customBoardState[square];
      if (piece && piece.effects.length > 0) {
        // Store by square initially
        effectsMap.set(square, [...piece.effects]);

        // For ember crown pieces, also log details
        if (piece.effects.some((effect) => effect.source === "emberCrown")) {
          console.log(
            `Tracking emberCrown piece at ${square} with ${piece.effects.length} effects`
          );
        }
      }
    }

    // Build new board state from chess.js
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          const square = this.coordsToSquare(file, rank);
          const existingPiece = this.customBoardState[square];

          // Check if this is a moved piece that had effects
          let pieceEffects: Effect[] = [];

          // First try to get effects from the same square
          if (effectsMap.has(square)) {
            pieceEffects = effectsMap.get(square) || [];
          }
          // If no effects found but this is the only piece of this type+color, try to find matching effects
          else if (existingPiece?.effects.length > 0) {
            pieceEffects = existingPiece.effects;
          }

          // Create the updated piece state
          newCustomBoardState[square] = {
            type: piece.type,
            color: piece.color,
            square: square as Square,
            effects: pieceEffects,
            hasMoved: existingPiece?.hasMoved || false,
          };

          // Log if we've successfully preserved an ember crown effect
          if (pieceEffects.some((effect) => effect.source === "emberCrown")) {
            console.log(
              `Preserved emberCrown effect on piece at ${square} during sync`
            );
          }
        }
      }
    }

    this.customBoardState = newCustomBoardState;
  }

  // Get the current player's turn
  getCurrentPlayer(): Color {
    return this.chess.turn();
  }

  // Get a piece at a specific square
  getPieceAt(square: Square): PieceMeta | null {
    return this.customBoardState[square] || null;
  }

  // Get all legal moves from a specific square
  getLegalMovesFrom(square: Square): Square[] {
    const moves = this.chess.moves({ square, verbose: true });
    return moves.map((move) => move.to as Square);
  }

  // Make a chess move
  makeMove(from: Square, to: Square): boolean {
    try {
      // Store piece effects before move since they might be lost during the move
      const pieceBeforeMove = this.customBoardState[from];
      const pieceEffects = pieceBeforeMove?.effects || [];
      const hasEmberCrown = pieceEffects.some(
        (effect) => effect.source === "emberCrown"
      );

      console.log(
        `Moving piece from ${from} to ${to}, has emberCrown effect: ${hasEmberCrown}`
      );

      // Make the move in chess.js
      const move = this.chess.move({ from, to, promotion: "q" });

      if (move) {
        // Record the move
        this.moveHistory.push(move);

        // Update the custom board state
        this.syncCustomBoardFromChess();

        // Important: Preserve effects from the original piece to the moved piece
        if (pieceEffects.length > 0 && this.customBoardState[to]) {
          console.log(
            `Transferring ${pieceEffects.length} effects to the piece at ${to}`
          );
          this.customBoardState[to].effects = [...pieceEffects];

          // Debug log for ember crown specifically
          if (hasEmberCrown) {
            console.log(`Preserved emberCrown effect on piece at ${to}`);
          }
        }

        // Update hasMoved flag
        if (this.customBoardState[to]) {
          this.customBoardState[to].hasMoved = true;
        }

        // Log the move
        this.logMove(from, to);

        // Add mana after a successful move
        const currentPlayer = this.getCurrentPlayer();
        this.currentPlayerMana[currentPlayer] = Math.min(
          this.currentPlayerMana[currentPlayer] + 1,
          10
        );

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

  // Log a move to the game log
  private logMove(from: Square, to: Square): void {
    const piece = this.getPieceAt(to);
    if (piece) {
      const playerName = piece.color === "w" ? "White" : "Black";
      const pieceType = this.getPieceTypeName(piece.type);
      this.gameLog.push(
        `${playerName} moved ${pieceType} from ${from} to ${to}`
      );
    }
  }

  // Log a spell cast to the game log
  private logSpellCast(spellId: SpellId, target: string): void {
    const player = this.getCurrentPlayer() === "w" ? "White" : "Black";
    this.gameLog.push(`${player} cast ${spellId} on ${target}`);
  }

  // Get the name of a piece type
  private getPieceTypeName(type: PieceSymbol): string {
    const pieceNames: Record<PieceSymbol, string> = {
      p: "Pawn",
      n: "Knight",
      b: "Bishop",
      r: "Rook",
      q: "Queen",
      k: "King",
    };
    return pieceNames[type] || "Piece";
  }

  // Reset the game to initial state
  resetGame(): void {
    this.chess.reset();
    this.customBoardState = this.initializeCustomBoardState();
    this.effects = [];
    this.moveHistory = [];
    this.syncCustomBoardFromChess();
  }

  // Cast a spell
  castSpell(spellId: SpellId, targets: SpellTargetData): boolean {
    const currentPlayer = this.getCurrentPlayer();
    const spellCost = this.spellEngine.getSpellCost(spellId);

    // Check if player has enough mana
    if (this.currentPlayerMana[currentPlayer] < spellCost) {
      return false;
    }

    // Attempt to cast the spell
    const success = this.spellEngine.castSpell(spellId, targets);

    if (success) {
      // Deduct mana cost
      this.currentPlayerMana[currentPlayer] -= spellCost;

      // Log the spell cast
      const targetDesc = Array.isArray(targets)
        ? targets.join(", ")
        : typeof targets === "object"
        ? `from ${targets.from} to ${targets.to}`
        : targets;

      this.logSpellCast(spellId, targetDesc);

      return true;
    }

    return false;
  }

  // Get the mana cost of a spell
  getSpellCost(spellId: SpellId): number {
    return this.spellEngine.getSpellCost(spellId);
  }

  // Process end of turn effects
  private processEndOfTurnEffects(): void {
    // Track squares with effects that need to be removed
    const squaresToRemovePieces: Square[] = [];

    // Debug the active effects to ensure they're being tracked properly
    console.log(
      "Processing end of turn effects, current effects:",
      this.effects.length
    );

    // Log all active effects before processing
    this.effects.forEach((effect) => {
      console.log(
        `Effect ${effect.id} from ${effect.source} has ${effect.duration} turns remaining, removeOnExpire=${effect.modifiers?.removeOnExpire}`
      );
    });

    // Process all effects first
    this.effects = this.effects
      .map((effect) => {
        const newDuration = effect.duration - 1;
        console.log(
          `Effect ${effect.id} from ${effect.source} has ${newDuration} turns remaining after decrement`
        );
        return { ...effect, duration: newDuration };
      })
      .filter((effect) => {
        const keepEffect = effect.duration > 0;

        // If the effect is expiring and should remove the piece
        if (
          !keepEffect &&
          (effect.modifiers?.removeOnExpire || effect.source === "emberCrown")
        ) {
          console.log(
            `Effect ${effect.id} from ${effect.source} is expiring and will remove its piece`
          );
          // Find the square this effect is on
          for (const square in this.customBoardState) {
            const piece = this.customBoardState[square];
            if (piece.effects.some((e) => e.id === effect.id)) {
              squaresToRemovePieces.push(square as Square);

              // Log the expiration
              const pieceName = this.getPieceTypeName(
                piece.type as PieceSymbol
              );
              const color = piece.color === "w" ? "White" : "Black";
              this.gameLog.push(
                `${color}'s ${pieceName} at ${square} expired from ${effect.source} effect and was removed`
              );
              console.log(
                `Found piece with expiring effect at ${square}, marking for removal`
              );
              break;
            }
          }
        }

        // Also update the effects list in the corresponding piece
        for (const square in this.customBoardState) {
          const piece = this.customBoardState[square];
          if (piece.effects.some((e) => e.id === effect.id)) {
            if (!keepEffect) {
              // Remove expired effects from pieces
              piece.effects = piece.effects.filter((e) => e.id !== effect.id);
              console.log(
                `Removed expired effect ${effect.id} from piece at ${square}`
              );
            } else {
              // Update duration for effects that are kept
              piece.effects = piece.effects.map((e) =>
                e.id === effect.id ? { ...e, duration: effect.duration } : e
              );
            }
          }
        }

        return keepEffect;
      });

    // Remove pieces for expired effects
    console.log(`Removing pieces at squares:`, squaresToRemovePieces);
    squaresToRemovePieces.forEach((square) => {
      this.removePiece(square);
    });
  }

  // Add an effect to a piece
  addEffect(square: Square, effect: Effect): void {
    const piece = this.customBoardState[square];
    if (piece) {
      piece.effects.push(effect);
      this.effects.push(effect);
    }
  }

  // Remove an effect from a piece
  removeEffect(square: Square, effectId: string): void {
    const piece = this.customBoardState[square];
    if (piece) {
      piece.effects = piece.effects.filter((e) => e.id !== effectId);
    }

    // Also remove from global effects list
    this.effects = this.effects.filter((e) => e.id !== effectId);
  }

  // Get all pieces with a specific effect
  getPiecesWithEffect(effectType: string): PieceMeta[] {
    const pieces: PieceMeta[] = [];

    for (const square in this.customBoardState) {
      const piece = this.customBoardState[square];
      if (piece.effects.some((effect) => effect.type === effectType)) {
        pieces.push(piece);
      }
    }

    return pieces;
  }

  // Get the current player's mana
  getPlayerMana(): { w: number; b: number } {
    return this.currentPlayerMana;
  }

  // Get the player's spells
  getPlayerSpells(): PlayerSpells {
    return this.playerSpells;
  }

  // Get the game log
  getGameLog(): string[] {
    return this.gameLog;
  }

  // Check if a move is legal
  isMoveLegal(from: Square, to: Square): boolean {
    try {
      const moves = this.chess.moves({ square: from, verbose: true });
      return moves.some((move) => move.to === to);
    } catch (_) {
      return false;
    }
  }

  // Get the current FEN string
  getFEN(): string {
    return this.chess.fen();
  }

  // Swap two pieces on the board (for Astral Swap spell)
  swapPieces(square1: Square, square2: Square): boolean {
    try {
      // Get the pieces
      const piece1 = this.customBoardState[square1];
      const piece2 = this.customBoardState[square2];

      if (!piece1 || !piece2) {
        return false;
      }

      // Update the chess.js board
      const chessPiece1 = this.chess.get(square1);
      const chessPiece2 = this.chess.get(square2);

      if (!chessPiece1 || !chessPiece2) {
        return false;
      }

      // Remove both pieces
      this.chess.remove(square1);
      this.chess.remove(square2);

      // Place them in swapped positions
      this.chess.put(
        { type: chessPiece1.type, color: chessPiece1.color },
        square2
      );
      this.chess.put(
        { type: chessPiece2.type, color: chessPiece2.color },
        square1
      );

      // Update custom board state
      const updatedPiece1 = { ...piece1, square: square2 as Square };
      const updatedPiece2 = { ...piece2, square: square1 as Square };

      this.customBoardState[square2] = updatedPiece1;
      this.customBoardState[square1] = updatedPiece2;

      // Log the swap
      this.gameLog.push(`Swapped pieces between ${square1} and ${square2}`);

      return true;
    } catch (error) {
      console.error("Error swapping pieces:", error);
      return false;
    }
  }

  // Remove a piece from the board
  removePiece(square: Square): boolean {
    try {
      // Remove from chess.js
      this.chess.remove(square);

      // Remove from custom board state
      delete this.customBoardState[square];

      // Log the removal
      this.gameLog.push(`Removed piece at ${square}`);

      return true;
    } catch (error) {
      console.error("Error removing piece:", error);
      return false;
    }
  }

  // Get all board pieces as an array
  getAllPieces(): { square: Square; piece: PieceMeta }[] {
    const pieces: { square: Square; piece: PieceMeta }[] = [];

    for (const square in this.customBoardState) {
      pieces.push({
        square: square as Square,
        piece: this.customBoardState[square],
      });
    }

    return pieces;
  }

  // Get the current state of the board
  getBoardState(): CustomBoardState {
    return this.customBoardState;
  }

  // Move a piece directly for spells like Phantom Step
  movePieceDirectly(
    from: Square,
    to: Square,
    endTurnAfterMove: boolean = false
  ): boolean {
    try {
      // Get the piece
      const piece = this.customBoardState[from];

      if (!piece) {
        console.error("No piece at source square");
        return false;
      }

      // Check that destination is empty
      if (this.customBoardState[to]) {
        console.error("Destination square is not empty");
        return false;
      }

      // Update chess.js board
      const chessPiece = this.chess.get(from);

      if (!chessPiece) {
        console.error("Failed to get chess.js piece");
        return false;
      }

      // Remove from source
      this.chess.remove(from);

      // Place at destination
      this.chess.put({ type: chessPiece.type, color: chessPiece.color }, to);

      // Update custom board state
      const updatedPiece = { ...piece, square: to as Square, hasMoved: true };
      delete this.customBoardState[from];
      this.customBoardState[to] = updatedPiece;

      // Add mana for the current player before potentially switching turns
      const currentPlayer = this.chess.turn();
      this.currentPlayerMana[currentPlayer] = Math.min(
        this.currentPlayerMana[currentPlayer] + 1,
        10
      );

      // Log the move
      this.gameLog.push(
        `${
          piece.color === "w" ? "White" : "Black"
        } cast phantomStep on from ${from} to ${to}`
      );

      // If specified, end the turn after moving the piece
      // This is used by spells like Phantom Step
      if (endTurnAfterMove) {
        // Manually switch turns in the chess.js board
        if (this.chess.turn() === "w") {
          this.chess.load(this.chess.fen().replace(" w ", " b "));
        } else {
          this.chess.load(this.chess.fen().replace(" b ", " w "));
        }

        // Process end of turn effects
        this.processEndOfTurnEffects();

        // Add mana to the next player
        const nextPlayer = this.chess.turn();
        this.currentPlayerMana[nextPlayer] = Math.min(
          this.currentPlayerMana[nextPlayer] + 1,
          10
        );

        this.gameLog.push(
          `${this.chess.turn() === "w" ? "Black" : "White"} ended their turn`
        );
      }

      return true;
    } catch (error) {
      console.error("Error moving piece directly:", error);
      return false;
    }
  }

  // Method to update player spells after initialization
  updatePlayerSpells(newSpells: PlayerSpells): void {
    this.playerSpells = newSpells;
  }

  // Transform a piece from one type to another (for spells like Ember Crown)
  transformPiece(
    square: Square,
    newType: PieceSymbol,
    spellId: SpellId
  ): boolean {
    try {
      // Get the piece
      const piece = this.customBoardState[square];

      if (!piece) {
        console.error("No piece at square to transform");
        return false;
      }

      // Update chess.js board
      const chessPiece = this.chess.get(square);

      if (!chessPiece) {
        console.error("Failed to get chess.js piece for transformation");
        return false;
      }

      // Remove the original piece
      this.chess.remove(square);

      // Place the transformed piece
      this.chess.put({ type: newType, color: chessPiece.color }, square);

      // Update custom board state - keep the piece's position and effects
      const updatedPiece = {
        ...piece,
        type: newType,
        effects: [...piece.effects],
      };

      // Add the transformation effect with a duration
      const transformEffect: Effect = {
        id: `${spellId}-${Date.now()}`,
        type: "transform", // This matches the EffectType in types.ts
        duration: 3, // 3 turns
        source: spellId,
        modifiers: {
          originalType: piece.type, // Keep track of the original piece type
          removeOnExpire: true, // This is crucial - make sure the piece is removed when effect expires
        },
      };

      console.log(
        `Created ${spellId} effect with duration ${transformEffect.duration} turns and removeOnExpire=true`
      );

      updatedPiece.effects.push(transformEffect);
      this.effects.push(transformEffect);

      // Update the custom board state
      this.customBoardState[square] = updatedPiece;

      // Log the transformation
      this.gameLog.push(
        `${piece.color === "w" ? "White" : "Black"}'s ${this.getPieceTypeName(
          piece.type as PieceSymbol
        )} at ${square} was transformed to ${this.getPieceTypeName(
          newType
        )} by ${spellId}`
      );

      return true;
    } catch (error) {
      console.error("Error transforming piece:", error);
      return false;
    }
  }

  // Process end of turn effects
  endTurn(): void {
    // Process active effects
    this.processEndOfTurnEffects();

    // Get current player before switch
    const currentPlayer = this.getCurrentPlayer();

    // Update the board state
    this.syncCustomBoardFromChess();

    // Switch turns - The next player becomes the current player after this operation
    if (currentPlayer === "w") {
      this.chess.load(this.chess.fen().replace(" w ", " b "));
    } else {
      this.chess.load(this.chess.fen().replace(" b ", " w "));
    }

    // Get the new current player (which is the player whose turn it now is)
    const newPlayer = this.getCurrentPlayer();

    // Add mana to the new current player (consistent with move and spell casting)
    this.currentPlayerMana[newPlayer] = Math.min(
      this.currentPlayerMana[newPlayer] + 1,
      10
    );

    this.gameLog.push(
      `${currentPlayer === "w" ? "White" : "Black"} ended their turn`
    );
  }
}

export default GameManager;
