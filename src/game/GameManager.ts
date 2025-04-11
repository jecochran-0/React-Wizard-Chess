import { Chess, Move, PieceSymbol, Square, Color } from "chess.js";
import { PieceMeta, Effect, SpellId, PlayerSpells } from "../types/types";
import { ChessGameStatus } from "../types/game";
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

// Define a structure to store glyph information
interface GlyphInfo {
  effect: Effect;
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
  private glyphs: Record<string, GlyphInfo>;
  private turnNumber: number = 1; // Add turn counter
  private positionHistory: string[] = []; // Track last few FENs
  private currentLastMove: { from: Square; to: Square } | null = null;
  private readonly MAX_POSITION_HISTORY = 10; // Store last 5 full moves (10 positions)

  constructor(playerSpells: PlayerSpells) {
    this.chess = new Chess();
    this.customBoardState = this.initializeCustomBoardState();
    this.effects = [];
    this.moveHistory = [];
    this.currentPlayerMana = { w: 5, b: 5 };
    this.playerSpells = playerSpells;
    this.gameLog = [];
    this.glyphs = {}; // Initialize empty glyphs object
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

    // Create a map to track pieces by their effects and position history
    const effectsMap = new Map<string, Effect[]>();
    const positionHistoryMap = new Map<string, string[]>();

    // Store all effects and position history from the current board state
    for (const square in this.customBoardState) {
      const piece = this.customBoardState[square];
      if (piece) {
        if (piece.effects.length > 0) {
          // Store effects by square
          effectsMap.set(square, [...piece.effects]);
        }

        // Store position history by square
        if (piece.prevPositions && piece.prevPositions.length > 0) {
          positionHistoryMap.set(square, [...piece.prevPositions]);
          console.log(
            `Saving position history for ${square}:`,
            piece.prevPositions
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

          // Check if this is a moved piece that had effects or position history
          let pieceEffects: Effect[] = [];
          let positionHistory: string[] = [];

          // First try to get effects and history from the same square
          if (effectsMap.has(square)) {
            pieceEffects = effectsMap.get(square) || [];
          }

          if (positionHistoryMap.has(square)) {
            positionHistory = positionHistoryMap.get(square) || [];
            console.log(
              `Found position history for piece at ${square}:`,
              positionHistory
            );
          }

          // If no effects or history found but piece exists, preserve what it had
          if (existingPiece) {
            if (!pieceEffects.length && existingPiece.effects.length > 0) {
              pieceEffects = existingPiece.effects;
            }

            if (
              !positionHistory.length &&
              existingPiece.prevPositions &&
              existingPiece.prevPositions.length > 0
            ) {
              positionHistory = existingPiece.prevPositions;
              console.log(
                `Preserving existing position history for piece at ${square}:`,
                positionHistory
              );
            }
          }

          // Create the updated piece state
          newCustomBoardState[square] = {
            type: piece.type,
            color: piece.color,
            square: square as Square,
            effects: pieceEffects,
            hasMoved: existingPiece?.hasMoved || false,
            prevPositions:
              positionHistory.length > 0
                ? (positionHistory as Square[])
                : undefined,
          };

          // Log preserved position history
          if (positionHistory.length > 0) {
            console.log(
              `Successfully preserved position history for piece at ${square}:`,
              positionHistory
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

  // Initialize player color - this doesn't change the game state
  // but helps track which color the human player has chosen
  initializePlayerColor(color: Color): void {
    // This is primarily used to indicate the player's preference
    // for board orientation in the UI, not changing game logic
    console.log(
      `Initializing player perspective as ${color === "w" ? "White" : "Black"}`
    );

    // We don't actually change the game's turn or board state here
    // The board rendering will use this information to flip the board if needed
  }

  // Make a chess move
  makeMove(from: Square, to: Square, promotionPiece?: PieceSymbol): boolean {
    try {
      // Get the player making the move
      const currentPlayer = this.getCurrentPlayer();

      // First check if the piece is anchored and cannot move
      const pieceBeforeMove = this.customBoardState[from];
      if (
        pieceBeforeMove &&
        this.hasPieceEffect(pieceBeforeMove, "preventMovement")
      ) {
        console.log(`Cannot move piece at ${from} due to Arcane Anchor effect`);
        return false;
      }

      // Check if this is a king with the Kings Gambit effect
      const isKing = pieceBeforeMove && pieceBeforeMove.type === "k";
      const hasKingsGambitEffect =
        isKing &&
        pieceBeforeMove.effects.some(
          (effect) =>
            effect.source === "kingsGambit" &&
            effect.modifiers?.allowSecondKingMove === true
        );

      // Add detailed logging for debugging the issue with Arcane Anchor
      const targetPiece = this.customBoardState[to];
      if (targetPiece) {
        console.log(`Target piece at ${to}:`, {
          color: targetPiece.color,
          type: targetPiece.type,
          effectCount: targetPiece.effects.length,
          effects: targetPiece.effects.map(
            (e) =>
              `${e.source} (${e.duration}) [${Object.keys(
                e.modifiers || {}
              ).join(",")}]`
          ),
        });

        // Check each effect explicitly
        targetPiece.effects.forEach((effect) => {
          if (effect.modifiers?.preventCapture) {
            console.log(
              `Found preventCapture effect on ${to}: ${effect.source}, duration: ${effect.duration}`
            );
          }
        });
      }

      // Check if the target square has a piece that's protected from capture
      if (targetPiece) {
        // Check for Arcane Anchor effect specifically
        const hasAnchorProtection = targetPiece.effects.some(
          (effect) =>
            effect.source === "arcaneAnchor" &&
            effect.modifiers?.preventCapture === true &&
            effect.duration > 0
        );

        if (hasAnchorProtection) {
          console.log(
            `Cannot capture piece at ${to} as it's protected by Arcane Anchor effect`
          );
          return false;
        }

        // Check any other protection effects
        if (this.isPieceProtectedFromCapture(to)) {
          console.log(
            `Cannot capture piece at ${to} as it's protected by an effect`
          );
          return false;
        }
      }

      // Store piece effects before move since they might be lost during the move
      const pieceEffects = pieceBeforeMove?.effects || [];
      const hasEmberCrown = pieceEffects.some(
        (effect) => effect.source === "emberCrown"
      );

      // Check for cursed glyph visual effect for debugging
      const hasCursedGlyph = pieceEffects.some(
        (effect) =>
          effect.source === "cursedGlyph" && effect.modifiers?.visualCurse
      );
      if (hasCursedGlyph) {
        console.log(
          `Moving piece from ${from} to ${to} has cursed glyph visual effect`
        );
      }

      console.log(
        `Moving piece from ${from} to ${to}, has emberCrown effect: ${hasEmberCrown}`
      );

      // Check if the move is legal according to chess rules
      const legalMoves = this.chess.moves({ square: from, verbose: true });
      const isLegalMove = legalMoves.some((move) => move.to === to);

      if (!isLegalMove) {
        console.log(`Move from ${from} to ${to} is not legal`);
        return false;
      }

      // Make the move in chess.js
      const move = this.chess.move({ from, to, promotion: promotionPiece });

      if (move) {
        // Record the move
        this.moveHistory.push(move);

        // Increment turn counter when a black piece moves
        if (currentPlayer === "b") {
          this.turnNumber++;
          console.log(
            `Black piece moved - Incrementing turn to ${this.turnNumber}`
          );
        }

        // Update the custom board state
        this.syncCustomBoardFromChess();

        // BUGFIX: Check if this was a capture move (indicated by move.captured)
        // When capturing a piece with effects like Ember Crown, we must make sure those effects
        // don't transfer to the capturing piece
        if (move.captured) {
          console.log(
            `Capture detected: ${from} took piece at ${to} (${move.captured})`
          );

          // If there's a piece at the destination now, ensure it doesn't have any leftover effects
          // from the piece that was captured
          if (this.customBoardState[to]) {
            console.log(
              `Clearing any effects from captured piece at ${to} before applying effects from capturing piece`
            );
            this.customBoardState[to].effects = [];
          }
        }

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

          // Debug log for cursed glyph
          if (hasCursedGlyph) {
            console.log(`Preserved cursed glyph effect on piece at ${to}`);
            // Log all effects to verify they transferred correctly
            console.log(
              `Current effects on piece at ${to}:`,
              this.customBoardState[to].effects.map(
                (e) =>
                  `${e.source} (${e.type}) [${
                    e.modifiers ? Object.keys(e.modifiers).join(",") : "none"
                  }]`
              )
            );
          }
        }

        // Update hasMoved flag
        if (this.customBoardState[to]) {
          this.customBoardState[to].hasMoved = true;

          // Track position history for Chrono Recall spell
          // Get the full position history from the original piece
          let positionHistory: Square[] = [];
          if (pieceBeforeMove && pieceBeforeMove.prevPositions) {
            // Copy the existing history from the piece at the original position
            positionHistory = [...(pieceBeforeMove.prevPositions as Square[])];
          }

          // If there was no history or it wasn't properly transferred, initialize with the from position
          if (positionHistory.length === 0) {
            positionHistory.push(from);
          }

          // Add the new position
          positionHistory.push(to);

          // Set the full history on the piece at the new position
          this.customBoardState[to].prevPositions = positionHistory;

          console.log(
            `Updated full position history for piece at ${to}:`,
            this.customBoardState[to].prevPositions
          );
        }

        // Log the move
        this.logMove(from, to);

        // IMPORTANT: Now check if there's a glyph on the destination square AFTER the piece is moved there
        this.checkForGlyphs(to);

        // Add mana after a successful move
        this.currentPlayerMana[currentPlayer] = Math.min(
          this.currentPlayerMana[currentPlayer] + 1,
          10
        );

        // IMPORTANT: If this is a king with Kings Gambit effect, don't end turn or process effects
        if (hasKingsGambitEffect) {
          console.log("King with Kings Gambit effect moved - not ending turn");

          // Force the turn back to the original player
          // This is necessary because chess.js automatically switches turns after a move
          const originalPlayer = currentPlayer;
          if (this.chess.turn() !== originalPlayer) {
            console.log(
              `Restoring turn to ${originalPlayer} after Kings Gambit move`
            );
            // Manually switch turns in chess.js back to the original player
            this.chess.load(
              this.chess
                .fen()
                .replace(` ${this.chess.turn()} `, ` ${originalPlayer} `)
            );
          }

          // Mark the effect as having been used by removing it
          // This ensures the king can only move twice, not infinitely
          if (this.customBoardState[to]) {
            console.log("Removing Kings Gambit effect after first move");
            this.customBoardState[to].effects = this.customBoardState[
              to
            ].effects.filter(
              (effect) =>
                !(
                  effect.source === "kingsGambit" &&
                  effect.modifiers?.allowSecondKingMove
                )
            );
          }

          return true;
        }

        // IMPORTANT: Count this move as a turn completion for the current player
        // This is critical for effects like Ember Crown that should count down based on player turns
        this.updatePositionHistory(); // Update position history after a move
        let effectsUpdated = false;

        // Process effects on all pieces belonging to the current player
        for (const square in this.customBoardState) {
          const piece = this.customBoardState[square];
          if (piece && piece.color === currentPlayer) {
            // Find all effects that should be decremented
            const effectsToUpdate = piece.effects.filter(
              (effect) =>
                (effect.source === "emberCrown" ||
                  effect.source === "arcaneArmor" ||
                  effect.source === "arcaneAnchor" ||
                  effect.source === "veilOfShadows" ||
                  (effect.source === "mistformKnight" &&
                    effect.modifiers?.isMistformClone)) &&
                !effect.id.includes("emberVisual")
            );

            if (effectsToUpdate.length > 0) {
              // Update all effects for this player's pieces
              piece.effects = piece.effects.map((effect) => {
                if (
                  (effect.source === "emberCrown" ||
                    effect.source === "arcaneArmor" ||
                    effect.source === "arcaneAnchor" ||
                    effect.source === "veilOfShadows" ||
                    (effect.source === "mistformKnight" &&
                      effect.modifiers?.isMistformClone)) &&
                  !effect.id.includes("emberVisual")
                ) {
                  effectsUpdated = true;
                  const newDuration = effect.duration - 1;

                  // Add special logging for Veil of Shadows
                  if (effect.source === "veilOfShadows") {
                    console.log(
                      `Decremented veilOfShadows effect to ${newDuration} turns remaining`
                    );
                  } else if (
                    effect.source === "mistformKnight" &&
                    effect.modifiers?.isMistformClone
                  ) {
                    console.log(
                      `Decremented Mistform Knight clone effect from ${effect.duration} to ${newDuration} turns remaining`
                    );
                  } else {
                    console.log(
                      `Decremented effect ${effect.id} from ${effect.source} from ${effect.duration} to ${newDuration} turns`
                    );
                  }
                  return { ...effect, duration: newDuration };
                }
                return effect;
              });

              // Also update the global effects list
              this.effects = this.effects.map((effect) => {
                if (effectsToUpdate.some((e) => e.id === effect.id)) {
                  return (
                    piece.effects.find((e) => e.id === effect.id) || effect
                  );
                }
                return effect;
              });
            }
          }
        }

        // Process cursedGlyph effects separately - cursed effects decrement when the piece owner moves
        let cursedEffectsUpdated = false;
        for (const square in this.customBoardState) {
          const piece = this.customBoardState[square];
          // Only process cursor effects for the current player's pieces
          if (piece && piece.color === currentPlayer) {
            const cursedEffects = piece.effects.filter(
              (effect) =>
                effect.source === "cursedGlyph" &&
                !effect.id.includes("emberVisual")
            );

            if (cursedEffects.length > 0) {
              // Update cursed effects
              piece.effects = piece.effects
                .map((effect) => {
                  if (
                    effect.source === "cursedGlyph" &&
                    !effect.id.includes("emberVisual")
                  ) {
                    cursedEffectsUpdated = true;
                    const newDuration = effect.duration - 1;
                    console.log(
                      `Decremented Cursed Glyph effect from ${effect.duration} to ${newDuration} turns remaining`
                    );

                    // If the effect has expired, transform to pawn IMMEDIATELY
                    if (newDuration <= 0) {
                      console.log(
                        `Cursed Glyph effect on piece at ${square} has expired, transforming to pawn immediately`
                      );
                      // Store effect ID since we'll remove it in the transformation
                      const effectId = effect.id;

                      // Apply the transformation immediately, don't wait
                      this.transformPieceToPawn(
                        square as Square,
                        piece,
                        effectId
                      );

                      // Return null so this effect gets filtered out later
                      return null;
                    }
                    return { ...effect, duration: newDuration };
                  }
                  return effect;
                })
                .filter((e): e is Effect => e !== null); // Type-safe filter for nulls
            }
          }
        }

        // Consider either type of effect update for the rest of the processing
        effectsUpdated = effectsUpdated || cursedEffectsUpdated;

        // After updating effects, check if any pieces have expired effects
        if (effectsUpdated) {
          // Find expired effects that should remove pieces
          const squaresToRemove: Square[] = [];

          for (const square in this.customBoardState) {
            const piece = this.customBoardState[square];
            if (piece && piece.color === currentPlayer) {
              const expiredEffects = piece.effects.filter(
                (effect) =>
                  effect.duration <= 0 &&
                  (effect.source === "emberCrown" ||
                    effect.source === "arcaneArmor" ||
                    effect.source === "arcaneAnchor" ||
                    (effect.source === "mistformKnight" &&
                      effect.modifiers?.isMistformClone)) &&
                  !effect.id.includes("emberVisual")
              );

              if (expiredEffects.length > 0) {
                console.log(
                  `Found piece at ${square} with expired effect(s): ${expiredEffects
                    .map((e) => e.source)
                    .join(", ")}`
                );

                // Only add to removal list if the effect has removeOnExpire
                const shouldRemovePiece = expiredEffects.some(
                  (e) =>
                    e.source === "emberCrown" || e.modifiers?.removeOnExpire
                );

                if (shouldRemovePiece) {
                  squaresToRemove.push(square as Square);

                  // Log the expiration
                  const pieceName = this.getPieceTypeName(
                    piece.type as PieceSymbol
                  );
                  const color = piece.color === "w" ? "White" : "Black";
                  this.gameLog.push(
                    `${color}'s ${pieceName} at ${square} expired from effect and was removed`
                  );
                }
              }

              // Remove expired effects from the piece
              piece.effects = piece.effects.filter(
                (effect) =>
                  effect.duration > 0 || effect.id.includes("emberVisual")
              );
            }
          }

          // Remove expired ember queens
          squaresToRemove.forEach((square) => {
            console.log(`Removing expired ember queen at ${square}`);
            this.removePiece(square);
          });

          // Update the global effects list
          this.effects = this.effects.filter(
            (effect) => effect.duration > 0 || effect.id.includes("emberVisual")
          );
        }

        // If this piece has ember crown effects, log them
        if (
          pieceBeforeMove &&
          pieceBeforeMove.effects.some((e) => e.source === "emberCrown")
        ) {
          const emberEffect = pieceBeforeMove.effects.find(
            (e) => e.source === "emberCrown" && !e.id.includes("emberVisual")
          );
          if (emberEffect) {
            console.log(
              `Ember Crown at ${from} now has ${emberEffect.duration} turns remaining`
            );
          }
        }

        // If this piece is a Mistform Knight clone, log the remaining duration
        if (
          pieceBeforeMove &&
          pieceBeforeMove.effects.some(
            (e) => e.source === "mistformKnight" && e.modifiers?.isMistformClone
          )
        ) {
          const mistformEffect = pieceBeforeMove.effects.find(
            (e) => e.source === "mistformKnight" && e.modifiers?.isMistformClone
          );
          if (mistformEffect) {
            console.log(
              `Mistform Knight clone at ${from} has ${mistformEffect.duration} turns remaining`
            );
          }
        }

        // Print a summary of all active effects after the move
        this.logActiveEffectsSummary();

        // After the move is made and the board is updated
        // Check if destination square has a glyph effect
        const glyph = this.glyphs[to];
        if (glyph) {
          console.log(`Piece stepped on glyph at ${to}:`, glyph);

          // Apply effect to the piece that stepped on the glyph
          const piece = this.customBoardState[to];
          if (piece) {
            console.log(`Applying glyph effect to piece at ${to}:`, piece);

            // If this is a cursed glyph that transforms pieces to pawns
            if (
              glyph.effect.source === "cursedGlyph" &&
              glyph.effect.modifiers?.transformToPawn
            ) {
              console.log(
                `Immediate transformation triggered for piece at ${to}`
              );
              // Transform piece to pawn immediately
              piece.type = "p";
              piece.hasMoved = true;

              // Remove the glyph from the board
              delete this.glyphs[to];

              // Update UI
              // Rely on context state updates, remove this call
            }
          }
        }

        // Store the move details
        this.moveHistory.push(move);
        this.currentLastMove = { from, to }; // Update last move

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error making move:", error);
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
      const pieceType = this.getPieceTypeName(piece.type as PieceSymbol);
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
  castSpell(
    spellId: SpellId,
    targets: SpellTargetData,
    pieceType?: "n" | "b"
  ): boolean {
    const currentPlayer = this.getCurrentPlayer();
    const spellCost = this.spellEngine.getSpellCost(spellId);

    // Check if player has enough mana
    if (this.currentPlayerMana[currentPlayer] < spellCost) {
      return false;
    }

    // Special handling for Dark Conversion with pieceType
    if (spellId === "darkConversion" && pieceType && Array.isArray(targets)) {
      console.log(`Casting Dark Conversion with piece type: ${pieceType}`);
      const success = this.spellEngine.castSpell(spellId, targets, pieceType);

      if (success) {
        // Deduct mana cost
        this.currentPlayerMana[currentPlayer] -= spellCost;

        // Log the spell cast
        const targetDesc = targets.join(", ");
        this.logSpellCast(
          spellId,
          `${targetDesc} (${pieceType === "n" ? "Knight" : "Bishop"})`
        );

        this.updatePositionHistory(); // Update position history after a spell cast
        return true;
      }

      return false;
    }

    // Regular spell handling
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

      this.updatePositionHistory(); // Update position history after a spell cast
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
    console.log("Processing end of turn effects...");
    const playerEndingTurn = this.getCurrentPlayer() === "w" ? "b" : "w"; // The player who just ended their turn

    // First process piece effects
    for (const square in this.customBoardState) {
      const piece = this.customBoardState[square];
      if (!piece || !piece.effects || piece.effects.length === 0) continue;

      // For regular effects, only process those for the player ending their turn
      const mistformCloneEffect = piece.effects.find(
        (e) => e.source === "mistformKnight" && e.modifiers?.isMistformClone
      );

      // Special handling for Mistform Knight clones - check the cloneCreator property
      if (mistformCloneEffect) {
        const cloneCreator =
          mistformCloneEffect.modifiers?.cloneCreator || piece.color;

        // Only process this clone if it belongs to the player ending their turn
        if (cloneCreator !== playerEndingTurn) {
          console.log(
            `Skipping Mistform clone at ${square} as it belongs to player ${cloneCreator} not ${playerEndingTurn}`
          );
          continue;
        }

        console.log(
          `Processing Mistform Knight clone at ${square} for player ${playerEndingTurn}`
        );
      }
      // For non-mistform effects, only process those belonging to the player ending their turn
      else if (piece.color !== playerEndingTurn) {
        continue;
      }

      console.log(`Processing effects for piece at ${square}`);

      // Process all effects on the piece
      piece.effects.forEach((effect) => {
        // Skip visual-only effects that don't need to decrement
        if (effect.id.includes("emberVisual")) return;

        // Decrement the effect duration
        effect.duration -= 1;

        if (
          effect.source === "mistformKnight" &&
          effect.modifiers?.isMistformClone
        ) {
          console.log(
            `Decremented Mistform Knight clone effect from ${
              effect.duration + 1
            } to ${
              effect.duration
            } turns remaining for player ${playerEndingTurn}`
          );
        } else {
          console.log(
            `Decremented ${effect.source} effect to ${effect.duration} turns remaining`
          );
        }

        // Log specific effects for debugging
        if (
          effect.source === "mistformKnight" &&
          effect.modifiers?.isMistformClone
        ) {
          console.log(
            `Mistform Knight clone at ${square} now has ${effect.duration} turns remaining`
          );
        } else if (effect.source === "veilOfShadows") {
          console.log(
            `Veil of Shadows effect on ${square} now has ${effect.duration} turns remaining`
          );
        }
      });

      // Find any cursed glyph effects on the piece
      const cursedGlyphEffect = piece.effects.find(
        (effect) => effect.source === "cursedGlyph"
      );

      if (cursedGlyphEffect) {
        console.log(
          `Found cursed glyph effect on piece at ${square} with ${cursedGlyphEffect.duration} turns remaining`
        );

        // If the effect has expired, transform the piece to a pawn immediately
        if (cursedGlyphEffect.duration <= 0) {
          console.log(
            `Cursed Glyph effect on piece at ${square} has expired, transforming to pawn immediately`
          );

          // Transform piece immediately
          this.transformPieceToPawn(
            square as Square,
            piece,
            cursedGlyphEffect.id
          );

          // Remove this effect to prevent double-processing
          piece.effects = piece.effects.filter(
            (effect) => effect.id !== cursedGlyphEffect.id
          );
        }
      }

      // Remove any expired effects (except visual indicators)
      piece.effects = piece.effects.filter(
        (effect) => effect.duration > 0 || effect.id.includes("emberVisual")
      );
    }

    // Process the glyphs themselves (remove expired ones)
    for (const square in this.glyphs) {
      const glyph = this.glyphs[square];
      if (glyph) {
        const effect = glyph.effect;

        // Decrement the duration
        effect.duration -= 1;
        console.log(
          `Glyph at ${square} has ${effect.duration} turns remaining`
        );

        // Remove expired glyphs
        if (effect.duration <= 0) {
          console.log(`Glyph at ${square} has expired and will be removed`);
          delete this.glyphs[square];
          console.log(
            `After removal, glyph at ${square} exists: ${!!this.glyphs[square]}`
          );

          // Force a UI refresh after removing the glyph
          setTimeout(() => {
            this.syncCustomBoardFromChess();
          }, 50);
        }
      }
    }

    // Print a summary of effects after processing
    setTimeout(() => {
      this.logActiveEffectsSummary();
    }, 100);

    this.updatePositionHistory(); // Update position history after turn ends
  }

  // Print a summary of all active effects on the board
  public logActiveEffectsSummary(): void {
    console.log("=== ACTIVE EFFECTS SUMMARY ===");

    let hasActiveEffects = false;
    const whiteEffects: string[] = [];
    const blackEffects: string[] = [];

    // Collect all pieces with effects
    for (const square in this.customBoardState) {
      const piece = this.customBoardState[square];
      if (piece && piece.effects.length > 0) {
        hasActiveEffects = true;
        const pieceType = this.getPieceTypeName(piece.type as PieceSymbol);
        const effectList = piece.effects
          .filter(
            (effect) =>
              effect.duration > 0 && !effect.id.includes("emberVisual")
          )
          .map((effect) => `${effect.source} (${effect.duration} turns)`);

        if (effectList.length > 0) {
          const summary = `${pieceType} at ${square}: ${effectList.join(", ")}`;
          if (piece.color === "w") {
            whiteEffects.push(summary);
          } else {
            blackEffects.push(summary);
          }
        }
      }
    }

    // Collect all glyphs
    const glyphs: string[] = [];
    for (const square in this.glyphs) {
      const glyph = this.glyphs[square];
      if (glyph) {
        hasActiveEffects = true;
        glyphs.push(
          `${square}: ${glyph.effect.source} (${glyph.effect.duration} turns)`
        );
      }
    }

    // Print the summary
    if (hasActiveEffects) {
      if (whiteEffects.length > 0) {
        console.log("White pieces with effects:");
        whiteEffects.forEach((effect) => console.log(`  • ${effect}`));
      }

      if (blackEffects.length > 0) {
        console.log("Black pieces with effects:");
        blackEffects.forEach((effect) => console.log(`  • ${effect}`));
      }

      if (glyphs.length > 0) {
        console.log("Active glyphs on board:");
        glyphs.forEach((glyph) => console.log(`  • ${glyph}`));
      }
    } else {
      console.log("No active effects on the board");
    }

    console.log("=============================");
  }

  // Process effects for a specific player's pieces
  private processPlayerEffects(player: Color): void {
    // Decrement durations for effects on pieces owned by the specified player
    for (const square in this.customBoardState) {
      const piece = this.customBoardState[square];
      if (piece && piece.color === player) {
        piece.effects.forEach((effect) => {
          if (
            effect.source === "emberCrown" &&
            !effect.id.includes("emberVisual")
          ) {
            console.log(
              `Processing ${player}'s ember crown effect: current duration = ${effect.duration}`
            );
          }
        });
      }
    }
  }

  // Check for glyphs at a square and apply their effects
  private checkForGlyphs(square: Square): void {
    console.log(`Checking for glyphs at ${square}`);
    const glyph = this.glyphs[square];

    if (glyph) {
      console.log(`Found glyph at ${square}: `, glyph);

      // If this is a cursed glyph, apply its effect to the piece
      if (glyph.effect.source === "cursedGlyph") {
        console.log(`Cursed Glyph triggered at ${square}`);

        // Get the piece that landed on the glyph
        const targetPiece = this.getPieceAt(square);
        if (targetPiece) {
          // Check if the piece is a king - kings are immune to curse effects
          if (targetPiece.type === "k") {
            console.log(`King at ${square} is immune to Cursed Glyph effect`);

            // Remove the glyph but don't apply the curse
            console.log(
              `Removing triggered glyph from ${square} (king immunity)`
            );
            delete this.glyphs[square];

            // Log the immunity
            const pieceColor = targetPiece.color === "w" ? "White" : "Black";
            this.gameLog.push(
              `${pieceColor}'s King at ${square} was immune to Cursed Glyph effect`
            );

            // Force a UI refresh
            this.syncCustomBoardFromChess();
            return;
          }

          // For non-king pieces, apply the curse effect
          // Create a curse effect with visual indicator
          const curseEffect: Effect = {
            id: `curse-${Date.now()}`,
            type: "transform", // Required property for Effect interface
            duration: 2, // Last for 2 turns - one turn to show the icon, one turn to transform
            source: "cursedGlyph", // This is what the UI will check for
            modifiers: {
              triggered: true, // Mark as triggered
              transformToPawn: true, // Will transform at end of duration
              visualCurse: true, // Add a visual indicator to the piece
            },
          };

          console.log(
            `Adding cursed glyph effect to piece at ${square}`,
            curseEffect
          );

          // Force removal of any previous cursed glyph effects on this piece
          if (targetPiece.effects) {
            targetPiece.effects = targetPiece.effects.filter(
              (effect) => effect.source !== "cursedGlyph"
            );
          }

          // Add the effect to the piece
          this.addEffect(square, curseEffect);

          // Verify the effect was added correctly
          const updatedPiece = this.getPieceAt(square);
          console.log(
            `VERIFICATION: Piece at ${square} now has ${updatedPiece?.effects.length} effects:`,
            updatedPiece?.effects.map((e) => e.source)
          );

          // Log the curse
          const pieceColor = targetPiece.color === "w" ? "White" : "Black";
          const pieceType = this.getPieceTypeName(
            targetPiece.type as PieceSymbol
          );
          this.gameLog.push(
            `${pieceColor}'s ${pieceType} at ${square} was cursed by Cursed Glyph`
          );

          // Remove the glyph from the square since it's been triggered
          console.log(`Removing triggered glyph from ${square}`);
          delete this.glyphs[square];

          // Force a UI refresh and print effects summary
          this.syncCustomBoardFromChess();
          setTimeout(() => {
            // Force UI update
            const currentFen = this.chess.fen();
            this.chess.load(currentFen);
            console.log("Refreshed UI after applying cursed glyph effect");
            this.logActiveEffectsSummary();
          }, 100);
        } else {
          console.error(`No piece found at ${square} to apply curse effect to`);
        }
      }
    }
  }

  // Add a glyph to a square
  addGlyphToSquare(square: Square, effect: Effect): void {
    console.log(`Adding glyph to square ${square}:`, effect);
    this.glyphs[square] = { effect };
  }

  // Get all glyphs on the board
  getGlyphs(): Record<string, GlyphInfo> {
    return { ...this.glyphs };
  }

  // Remove a glyph from a square
  removeGlyph(square: Square): void {
    if (this.glyphs[square]) {
      delete this.glyphs[square];
    }
  }

  // Get a glyph at a specific square
  getGlyphAt(square: Square): Effect | null {
    return this.glyphs[square]?.effect || null;
  }

  // Add an effect to a piece
  addEffect(square: Square, effect: Effect): void {
    const piece = this.customBoardState[square];
    if (piece) {
      console.log(`Adding effect to piece at ${square}:`, {
        effectId: effect.id,
        effectSource: effect.source,
        effectDuration: effect.duration,
        pieceType: piece.type,
        pieceColor: piece.color,
      });

      // Initialize effects array if it doesn't exist
      if (!piece.effects) {
        piece.effects = [];
      }

      piece.effects.push(effect);
      this.effects.push(effect);

      console.log(`Piece at ${square} now has ${piece.effects.length} effects`);
    } else {
      console.error(`Failed to add effect: No piece found at ${square}`);
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
      // First check if the piece has any effects that prevent movement
      const piece = this.customBoardState[from];
      if (piece && this.hasPieceEffect(piece, "preventMovement")) {
        console.log(`Piece at ${from} cannot move due to Arcane Anchor effect`);
        return false;
      }

      // Then check standard move legality
      const moves = this.chess.moves({ square: from, verbose: true });
      return moves.some((move) => move.to === to);
    } catch (error) {
      console.error("Error checking move legality:", error);
      return false;
    }
  }

  // Check if a piece has a specific effect modifier
  hasPieceEffect(piece: PieceMeta, effectProperty: string): boolean {
    return piece.effects.some(
      (effect) => effect.modifiers && effect.modifiers[effectProperty] === true
    );
  }

  // Check if a piece is protected from capture
  isPieceProtectedFromCapture(square: Square): boolean {
    const piece = this.customBoardState[square];
    if (!piece) return false;

    // First check specifically for Arcane Anchor
    const hasArcaneAnchorProtection = piece.effects.some(
      (effect) =>
        effect.source === "arcaneAnchor" &&
        effect.modifiers?.preventCapture === true &&
        effect.duration > 0
    );

    if (hasArcaneAnchorProtection) {
      console.log(`Piece at ${square} is protected by Arcane Anchor`);
      return true;
    }

    // Then check for any other protection effects
    const hasOtherProtection = piece.effects.some(
      (effect) =>
        effect.modifiers?.preventCapture === true && effect.duration > 0
    );

    if (hasOtherProtection) {
      console.log(`Piece at ${square} is protected by another effect`);
      return true;
    }

    return false;
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

      // Track position history for Chrono Recall spell
      if (!updatedPiece.prevPositions) {
        updatedPiece.prevPositions = [from];
      }
      updatedPiece.prevPositions.push(to);

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
      } else {
        // If we're not ending the turn, still print the effect summary
        this.logActiveEffectsSummary();
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

  // Add a new piece to the board
  addPiece(
    square: Square,
    pieceType: PieceSymbol,
    pieceColor: "w" | "b",
    effects: Effect[] = []
  ): boolean {
    try {
      // Check if the square is already occupied
      if (this.customBoardState[square]) {
        console.error(`Cannot add piece: Square ${square} is already occupied`);
        return false;
      }

      // Add the piece to the chess.js board
      this.chess.put({ type: pieceType, color: pieceColor }, square);

      // Add the piece to the custom board state
      this.customBoardState[square] = {
        type: pieceType,
        color: pieceColor,
        square: square as Square,
        effects: [...effects],
        hasMoved: false,
      };

      // Log the addition
      this.gameLog.push(
        `Added ${
          pieceColor === "w" ? "White" : "Black"
        } ${this.getPieceTypeName(pieceType)} at ${square}`
      );

      return true;
    } catch (error) {
      console.error("Error adding piece:", error);
      return false;
    }
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

  // End the current turn and process turn-end effects
  endTurn(): void {
    console.log("Processing end of turn...");

    // Get current player before switch (this is the player ending their turn)
    const playerEndingTurn = this.getCurrentPlayer();
    console.log(`Player ${playerEndingTurn} is ending their turn`);

    // Process active effects for the player ending their turn
    this.processEndOfTurnEffects();

    // Update the board state
    this.syncCustomBoardFromChess();

    // Switch turns - The next player becomes the current player after this operation
    if (playerEndingTurn === "w") {
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
      `${playerEndingTurn === "w" ? "White" : "Black"} ended their turn`
    );

    // Print summary of all active effects
    this.logActiveEffectsSummary();

    console.log("Turn ended. New player:", newPlayer);

    this.updatePositionHistory(); // Update position history after turn ends
  }

  // The root issue: effects need to be decremented on each player's turn,
  // but a regular move from one player to another doesn't count as
  // a full "end turn" for that piece's effect duration.
  //
  // Let's modify endTurn to track which player ended their turn, so effects
  // only decrement for the player who cast them
  endPlayerTurn(player: Color): void {
    // Track turn count for each player
    console.log(`Player ${player} ended their turn`);

    // Process effects for this player's pieces only
    this.processPlayerEffects(player);

    // Then call the regular endTurn method
    this.endTurn();
  }

  // Transform a piece to a pawn (for Cursed Glyph effect)
  private transformPieceToPawn(
    square: Square,
    piece: PieceMeta,
    effectId: string
  ): boolean {
    try {
      console.log(
        `Transforming piece at ${square} to pawn due to Cursed Glyph`
      );

      // Transform the piece to a pawn while keeping the same color
      const pawnType = "p" as PieceSymbol;

      // Use chess.js to update the piece
      this.chess.remove(square);
      this.chess.put({ type: pawnType, color: piece.color }, square);

      // Update our custom board state
      piece.type = pawnType;

      // Keep the piece's hasMoved property
      piece.hasMoved = true;

      // Remove the cursed glyph effect
      piece.effects = piece.effects.filter((e) => e.id !== effectId);

      // Also remove from global effects list
      this.effects = this.effects.filter((e) => e.id !== effectId);

      // Log the transformation in the game log
      this.gameLog.push(
        `${
          piece.color === "w" ? "White" : "Black"
        }'s piece at ${square} was transformed to a pawn by the Cursed Glyph spell`
      );

      console.log(
        `Transformed piece at ${square} to pawn and removed curse effect`
      );

      // Force a UI refresh after transformation
      this.syncCustomBoardFromChess();

      // Additional refresh with a small delay to ensure the UI updates
      setTimeout(() => {
        this.syncCustomBoardFromChess();
        // Force additional refresh to ensure UI is updated
        const currentFen = this.chess.fen();
        this.chess.load(currentFen);
      }, 100);

      return true;
    } catch (error) {
      console.error("Error transforming piece to pawn:", error);
      return false;
    }
  }

  // Get the current turn number
  getCurrentTurnNumber(): number {
    return this.turnNumber;
  }

  // Get the current game status
  getGameStatus(): ChessGameStatus {
    if (this.chess.isCheckmate()) return "checkmate";
    if (this.chess.isStalemate()) return "stalemate";
    if (this.chess.isDraw()) return "draw";
    if (this.chess.isCheck()) return "check";
    return "active"; // Default status
  }

  // Method to add current position to history
  private updatePositionHistory(): void {
    const currentFEN = this.chess.fen();
    this.positionHistory.push(currentFEN);
    // Keep history size limited
    if (this.positionHistory.length > this.MAX_POSITION_HISTORY) {
      this.positionHistory.shift(); // Remove the oldest position
    }
  }

  // Method to check if a position has been repeated recently
  public isPositionRepeated(fen: string): boolean {
    // Check if the FEN exists in the last few positions
    // Simple check: Look at the last 6 positions (3 full moves)
    const recentHistory = this.positionHistory.slice(-6);
    return recentHistory.includes(fen);
  }

  // Get the last recorded move
  getLastMove(): { from: Square; to: Square } | null {
    return this.currentLastMove;
  }
}

export default GameManager;
