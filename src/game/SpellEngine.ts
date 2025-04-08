import { v4 as uuidv4 } from "uuid";
import { getSpellById } from "../utils/spells";
import { Effect, EffectModifiers, EffectType, SpellId } from "../types/types";
import { Chess, Square, PieceSymbol } from "chess.js";
import GameManager from "./GameManager";

// Define specialized target types
type SingleTarget = Square;
// Remove unused type
// type MultiTarget = Square[];
type FromToTarget = { from: Square; to: Square };

export class SpellEngine {
  private gameManager: GameManager;

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
  }

  /**
   * Cast a spell with the given targets
   */
  castSpell(spellId: string, targetInfo: FromToTarget | SingleTarget): boolean {
    console.log(`Casting spell ${spellId} with targets:`, targetInfo);

    try {
      let success = false;
      const mana = this.getSpellCost(spellId as SpellId);

      if (
        mana >
        this.gameManager.getPlayerMana()[this.gameManager.getCurrentPlayer()]
      ) {
        console.log("Not enough mana to cast spell");
        return false;
      }

      switch (spellId) {
        case "phantomStep":
          if (
            targetInfo &&
            typeof targetInfo === "object" &&
            "from" in targetInfo &&
            "to" in targetInfo
          ) {
            success = this.castPhantomStep(targetInfo.from, targetInfo.to);
          }
          break;
        case "arcaneArmor":
          if (typeof targetInfo === "string") {
            success = this.castArcaneArmor(targetInfo);
          }
          break;
        case "mistformKnight":
          if (
            targetInfo &&
            typeof targetInfo === "object" &&
            "from" in targetInfo &&
            "to" in targetInfo
          ) {
            success = this.castMistformKnight(targetInfo.from, targetInfo.to);
          }
          break;
        case "cursedGlyph":
          if (typeof targetInfo === "string") {
            success = this.castCursedGlyph(targetInfo);
          }
          break;
        case "astralSwap":
          if (Array.isArray(targetInfo) && targetInfo.length === 2) {
            success = this.castAstralSwap(targetInfo[0], targetInfo[1]);
          }
          break;
        case "emberCrown":
          if (targetInfo) {
            success = this.castEmberCrown(targetInfo as SingleTarget);
          }
          break;
        case "arcaneAnchor":
          if (targetInfo) {
            success = this.castArcaneAnchor(targetInfo as SingleTarget);
          }
          break;
        case "frostShield":
          if (targetInfo) {
            success = this.castFrostShield(targetInfo as SingleTarget);
          }
          break;
        case "shadowStrike":
          if (targetInfo) {
            success = this.castShadowStrike(targetInfo as SingleTarget);
          }
          break;
        case "chronoRecall":
          if (targetInfo) {
            success = this.castChronoRecall(targetInfo as SingleTarget);
          }
          break;
        default:
          console.error(`Unknown spell ID: ${spellId}`);
          return false;
      }

      // If spell was successful, spend mana
      if (success) {
        // Don't deduct mana here - GameManager will handle this after castSpell returns true
        console.log(`Successfully cast ${spellId}`);

        // Log a summary of all active effects after casting the spell
        if (typeof this.gameManager.logActiveEffectsSummary === "function") {
          this.gameManager.logActiveEffectsSummary();
        }
      } else {
        console.log(`Failed to cast ${spellId}`);
      }

      return success;
    } catch (error) {
      console.error(`Error casting spell ${spellId}:`, error);
      return false;
    }
  }

  // Get the mana cost of a spell
  getSpellCost(spellId: SpellId): number {
    const spell = getSpellById(spellId);
    return spell ? spell.manaCost : 0;
  }

  // Create a new effect
  private createEffect(
    type: EffectType,
    duration: number,
    spellId: SpellId,
    modifiers?: EffectModifiers
  ): Effect {
    return {
      id: uuidv4(),
      type,
      duration,
      source: spellId,
      modifiers,
    };
  }

  // ===== SPELL IMPLEMENTATIONS =====

  // Astral Swap: Swap the positions of two pieces
  private castAstralSwap(square1: Square, square2: Square): boolean {
    console.log(`Attempting to swap pieces between ${square1} and ${square2}`);

    // Get pieces at the source and destination
    const piece1 = this.gameManager.getPieceAt(square1);
    const piece2 = this.gameManager.getPieceAt(square2);

    // Both squares must have pieces
    if (!piece1 || !piece2) {
      console.error("Both squares must have pieces for Astral Swap");
      return false;
    }

    // Both pieces must belong to the current player
    const currentPlayer = this.gameManager.getCurrentPlayer();
    if (piece1.color !== currentPlayer || piece2.color !== currentPlayer) {
      console.error(
        "Both pieces must belong to the current player for Astral Swap"
      );
      return false;
    }

    // Check if the swap would result in a king in check
    const tempBoard = new Chess(this.gameManager.getFEN());

    // Get the piece objects as they are in chess.js format
    const chessPiece1 = tempBoard.get(square1);
    const chessPiece2 = tempBoard.get(square2);

    if (!chessPiece1 || !chessPiece2) {
      console.error("Failed to get chess.js pieces for swap");
      return false;
    }

    // Temporarily remove both pieces
    tempBoard.remove(square1);
    tempBoard.remove(square2);

    // Place them in swapped positions
    tempBoard.put(
      { type: chessPiece1.type, color: chessPiece1.color },
      square2
    );
    tempBoard.put(
      { type: chessPiece2.type, color: chessPiece2.color },
      square1
    );

    // Check if the king is in check after the swap
    if (tempBoard.isCheck()) {
      console.error("Cannot swap pieces as it would result in check");
      return false;
    }

    // Perform the actual swap
    this.gameManager.swapPieces(square1, square2);

    // Log the action
    console.log(
      `Successfully swapped pieces between ${square1} and ${square2}`
    );

    return true;
  }

  // Phantom Step: Move a piece ignoring collisions, no captures
  private castPhantomStep(from: Square, to: Square): boolean {
    console.log(`Attempting Phantom Step from ${from} to ${to}`);

    // Get the piece at the source
    const piece = this.gameManager.getPieceAt(from);

    // Source must have a piece owned by the current player
    const currentPlayer = this.gameManager.getCurrentPlayer();
    if (!piece || piece.color !== currentPlayer) {
      console.error("Source must have a piece owned by the current player");
      return false;
    }

    // Destination must be empty (no captures allowed)
    if (this.gameManager.getPieceAt(to)) {
      console.error("Destination must be empty for Phantom Step");
      return false;
    }

    // Validate that the move follows the piece's normal movement pattern
    if (!this.isValidPhantomStepMove(from, to, piece.type)) {
      console.error(
        "Invalid phantom step move - doesn't follow piece's movement pattern"
      );
      return false;
    }

    // Check if the move would result in a king in check
    const tempBoard = new Chess(this.gameManager.getFEN());

    // Get the piece object as it is in chess.js format
    const chessPiece = tempBoard.get(from);

    if (!chessPiece) {
      console.error("Failed to get chess.js piece for Phantom Step");
      return false;
    }

    // Temporarily remove the piece
    tempBoard.remove(from);

    // Place it at the destination
    tempBoard.put({ type: chessPiece.type, color: chessPiece.color }, to);

    // Check if the king is in check after the move
    if (tempBoard.isCheck()) {
      console.error("Cannot make this move as it would result in check");
      return false;
    }

    // Perform the move and end the turn in one operation
    this.gameManager.movePieceDirectly(from, to, true);

    // Log the action
    console.log(
      `Successfully moved piece from ${from} to ${to} using Phantom Step and ended turn`
    );

    return true;
  }

  // Helper method to validate phantom step moves based on piece type
  private isValidPhantomStepMove(
    from: Square,
    to: Square,
    pieceType: string
  ): boolean {
    // Extract file and rank
    const fromFile = from.charAt(0);
    const fromRank = parseInt(from.charAt(1));
    const toFile = to.charAt(0);
    const toRank = parseInt(to.charAt(1));

    // Calculate differences
    const fileDiff = Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0));
    const rankDiff = Math.abs(fromRank - toRank);

    // Can't move to the same square
    if (fileDiff === 0 && rankDiff === 0) {
      return false;
    }

    // For pawn movements - declare variables outside the switch
    const direction = this.gameManager.getCurrentPlayer() === "w" ? -1 : 1;
    const forwardMove = toRank - fromRank === direction;
    const doubleMove = toRank - fromRank === 2 * direction;
    const diagonalCapture = fileDiff === 1 && toRank - fromRank === direction;
    const hasMoved = this.gameManager.getPieceAt(from)?.hasMoved;

    switch (pieceType) {
      case "r": // Rook: move horizontally or vertically
        return fileDiff === 0 || rankDiff === 0;

      case "b": // Bishop: move diagonally
        return fileDiff === rankDiff;

      case "n": // Knight: move in L-shape
        return (
          (fileDiff === 1 && rankDiff === 2) ||
          (fileDiff === 2 && rankDiff === 1)
        );

      case "q": // Queen: move horizontally, vertically, or diagonally
        return fileDiff === 0 || rankDiff === 0 || fileDiff === rankDiff;

      case "k": // King: move one square in any direction
        return fileDiff <= 1 && rankDiff <= 1;

      case "p": // Pawn: move forward or diagonally
        // Pawns can't move backward with phantom step
        if (
          (this.gameManager.getCurrentPlayer() === "w" && toRank > fromRank) ||
          (this.gameManager.getCurrentPlayer() === "b" && toRank < fromRank)
        ) {
          return false;
        }

        // Regular forward move by 1
        if (forwardMove && fileDiff === 0) {
          return true;
        }

        // Double move if pawn hasn't moved yet
        if (doubleMove && fileDiff === 0 && !hasMoved) {
          return true;
        }

        // Diagonal move (allowed for Phantom Step even without capture)
        if (diagonalCapture) {
          return true;
        }

        return false;

      default:
        return false;
    }
  }

  // Ember Crown: Transform a pawn to a queen for 3 turns, then it dies
  private castEmberCrown(target: SingleTarget): boolean {
    console.log(`Attempting to cast Ember Crown on ${target}`);

    // Get the piece at the target square
    const piece = this.gameManager.getPieceAt(target);

    // Must target a piece owned by the current player
    const currentPlayer = this.gameManager.getCurrentPlayer();
    if (!piece || piece.color !== currentPlayer) {
      console.error("Target must be a piece owned by the current player");
      return false;
    }

    // Must target a pawn
    if (piece.type !== "p") {
      console.error("Ember Crown can only be cast on pawns");
      return false;
    }

    // Update chess.js board to change the pawn to a queen
    const tempBoard = new Chess(this.gameManager.getFEN());

    // Check if we can promote the pawn
    tempBoard.remove(target);
    tempBoard.put({ type: "q", color: piece.color }, target);

    // Check if the king would be in check after transformation
    if (tempBoard.isCheck()) {
      console.error("Cannot transform pawn as it would result in check");
      return false;
    }

    // Perform the transformation in the actual board
    // This adds the main transformation effect with duration=3 and removeOnExpire=true
    const success = this.gameManager.transformPiece(target, "q", "emberCrown");

    if (success) {
      console.log(
        `Successfully transformed pawn at ${target} to an Ember Queen with 3-turn duration`
      );

      // Add a second, visual-only effect that helps with rendering but doesn't affect game logic
      // This effect has a longer duration and won't cause piece removal
      const visualEffect: Effect = {
        id: `emberVisual-${Date.now()}`,
        type: "transform", // Using transform as the base type to match existing effect types
        duration: 999, // Long duration as this is just for visual tracking
        source: "emberCrown", // Same source to associate with the main effect
        modifiers: {
          visualType: "emberQueen",
          // This is just a visual marker, not a gameplay effect
          removeOnExpire: false, // Critical: this effect should NEVER remove the piece
        },
      };

      // Log the number of effects on the piece for debugging
      const updatedPiece = this.gameManager.getPieceAt(target);
      console.log(
        `Ember Queen at ${target} now has ${updatedPiece?.effects.length} effects:`,
        updatedPiece?.effects.map((e) => `${e.id} (${e.duration} turns)`)
      );

      // Add the visual effect to help with rendering
      this.gameManager.addEffect(target, visualEffect);
    }

    return success;
  }

  // Frost Shield: Protect a piece from capture
  private castFrostShield(target: SingleTarget): boolean {
    const piece = this.gameManager.getPieceAt(target);

    if (!piece) {
      return false;
    }

    // Create a shield effect on the piece
    const effect = this.createEffect("shield", 2, "frostShield", {
      preventCapture: true,
    });

    // Add the effect to the piece
    this.gameManager.addEffect(target, effect);

    return true;
  }

  // Shadow Strike: Directly capture an enemy piece
  private castShadowStrike(target: SingleTarget): boolean {
    const piece = this.gameManager.getPieceAt(target);

    // Must target an enemy piece
    if (!piece || piece.color === this.gameManager.getCurrentPlayer()) {
      return false;
    }

    // Implement the capture
    this.gameManager.removePiece(target);

    return true;
  }

  // Arcane Armor: Enhance a piece's defensive capabilities
  private castArcaneArmor(target: SingleTarget): boolean {
    const piece = this.gameManager.getPieceAt(target);

    if (!piece || piece.color !== this.gameManager.getCurrentPlayer()) {
      return false;
    }

    // Create a buff effect on the piece - increased to 3 turns to ensure it lasts through opponent's turn
    const effect = this.createEffect("buff", 2, "arcaneArmor", {
      defensiveBonus: true,
      preventCapture: true, // Cannot be captured
      preventMovement: true, // Cannot move (like Arcane Anchor)
    });

    console.log("Created Arcane Armor effect:", {
      id: effect.id,
      duration: effect.duration,
      modifiers: effect.modifiers,
    });

    // Add the effect to the piece
    this.gameManager.addEffect(target, effect);

    return true;
  }

  // Arcane Anchor: Make a piece immune to capture but prevents it from moving
  private castArcaneAnchor(target: SingleTarget): boolean {
    console.log(`Attempting to cast Arcane Anchor on ${target}`);

    // Get the piece at the target square
    const piece = this.gameManager.getPieceAt(target);

    // Validate the target piece
    const currentPlayer = this.gameManager.getCurrentPlayer();
    if (!piece || piece.color !== currentPlayer) {
      console.error(
        "Arcane Anchor must target a piece owned by the current player"
      );
      return false;
    }

    // Remove any existing Arcane Anchor effects on this piece
    if (piece.effects) {
      piece.effects = piece.effects.filter(
        (effect) => effect.source !== "arcaneAnchor"
      );
    }

    // Create the anchor effect - increased to 2 turns to ensure it lasts through opponent's turn
    const anchorEffect = this.createEffect("shield", 2, "arcaneAnchor", {
      preventCapture: true, // Cannot be captured
      preventMovement: true, // Cannot move
    });

    console.log("Created Arcane Anchor effect:", {
      id: anchorEffect.id,
      duration: anchorEffect.duration,
      modifiers: anchorEffect.modifiers,
    });

    // Add the effect to the piece
    this.gameManager.addEffect(target, anchorEffect);

    // Verify the effect was added correctly
    const updatedPiece = this.gameManager.getPieceAt(target);
    console.log("Piece after adding effect:", {
      square: target,
      effectCount: updatedPiece?.effects.length || 0,
      hasAnchorEffect:
        updatedPiece?.effects.some(
          (e) =>
            e.source === "arcaneAnchor" && e.modifiers?.preventCapture === true
        ) || false,
    });

    // Log the successful cast
    console.log(
      `Successfully cast Arcane Anchor on ${target}. Piece cannot be captured or moved for 3 turns.`
    );

    return true;
  }

  // Mistform Knight: Move a knight and create a clone that disappears after one turn
  private castMistformKnight(from: Square, to: Square): boolean {
    console.log(`Attempting Mistform Knight from ${from} to ${to}`);

    // Get the piece at the source
    const piece = this.gameManager.getPieceAt(from);

    // Source must have a knight piece owned by the current player
    const currentPlayer = this.gameManager.getCurrentPlayer();
    if (!piece || piece.color !== currentPlayer) {
      console.error("Source must have a piece owned by the current player");
      return false;
    }

    // Check that the piece is a knight
    if (piece.type !== "n") {
      console.error("Mistform Knight spell can only be cast on knight pieces");
      return false;
    }

    // Destination must be empty (no captures allowed)
    const destPiece = this.gameManager.getPieceAt(to);
    if (destPiece) {
      console.error(
        `Destination square ${to} already has a piece: ${destPiece.type} ${destPiece.color}`
      );
      return false;
    }

    // Validate that the move follows the knight's movement pattern
    if (!this.isValidMistformKnightMove(from, to)) {
      console.error(
        "Invalid mistform knight move - doesn't follow knight's movement pattern"
      );
      return false;
    }

    // Check if the move would result in a king in check
    const tempBoard = new Chess(this.gameManager.getFEN());

    // Get the piece object as it is in chess.js format
    const chessPiece = tempBoard.get(from);

    if (!chessPiece) {
      console.error("Failed to get chess.js piece for Mistform Knight");
      return false;
    }

    // Temporarily remove the piece
    tempBoard.remove(from);

    // Place it at the destination
    tempBoard.put({ type: chessPiece.type, color: chessPiece.color }, to);

    // Check if the king is in check after the move
    if (tempBoard.isCheck()) {
      console.error("Cannot make this move as it would result in check");
      return false;
    }

    try {
      // 1. Create a clone effect for the cloned knight
      const cloneEffect = this.createEffect(
        "transform",
        1, // Will disappear after 1 turns
        "mistformKnight",
        {
          isMistformClone: true,
          removeOnExpire: true,
          preventCapture: false, // Clone can be captured
        }
      );

      // 2. Move the original piece to the destination
      if (!this.gameManager.movePieceDirectly(from, to, true)) {
        console.error("Failed to move knight during Mistform Knight spell");
        return false;
      }

      // 3. Now add a new piece at the original position
      const addSuccess = this.gameManager.addPiece(
        from,
        "n" as PieceSymbol,
        piece.color as "w" | "b",
        [cloneEffect]
      );

      if (!addSuccess) {
        console.error("Failed to add clone piece at original position");
        return false;
      }

      console.log(
        `Successfully moved knight from ${from} to ${to} and created clone at ${from}`
      );
      return true;
    } catch (error) {
      console.error("Error creating mistform clone:", error);
      return false;
    }
  }

  // Helper method to validate mistform knight moves based on piece type
  private isValidMistformKnightMove(from: Square, to: Square): boolean {
    // Extract file and rank
    const fromFile = from.charAt(0);
    const fromRank = parseInt(from.charAt(1));
    const toFile = to.charAt(0);
    const toRank = parseInt(to.charAt(1));

    // Calculate differences
    const fileDiff = Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0));
    const rankDiff = Math.abs(fromRank - toRank);

    // Can't move to the same square
    if (fileDiff === 0 && rankDiff === 0) {
      return false;
    }

    // Knights move in an L shape: 2 squares in one direction and 1 in the other
    return (
      (fileDiff === 1 && rankDiff === 2) || (fileDiff === 2 && rankDiff === 1)
    );
  }

  // Chrono Recall: Return a piece to position 2 turns ago
  private castChronoRecall(target: SingleTarget): boolean {
    console.log(`Attempting to cast Chrono Recall on ${target}`);

    // Get the piece at the target square
    const piece = this.gameManager.getPieceAt(target);

    // Must target a piece owned by the current player
    const currentPlayer = this.gameManager.getCurrentPlayer();
    if (!piece || piece.color !== currentPlayer) {
      console.error("Target must be a piece owned by the current player");
      return false;
    }

    // Log the piece's position history
    console.log(`Piece position history:`, piece.prevPositions || "None");

    // Check if the piece has move history (needs at least one previous position)
    if (!piece.prevPositions || piece.prevPositions.length < 2) {
      console.error("Piece doesn't have enough move history");
      return false;
    }

    // Get the position from most recent previous position (index length-2)
    const destination = piece.prevPositions[piece.prevPositions.length - 3];
    console.log(
      `Attempting to recall piece to previous position: ${destination}`
    );

    // Destination must be empty
    if (this.gameManager.getPieceAt(destination)) {
      console.error("Cannot recall to occupied square");
      return false;
    }

    // Check if the move would result in a king in check
    const tempBoard = new Chess(this.gameManager.getFEN());
    tempBoard.remove(target);
    tempBoard.put(
      { type: piece.type as PieceSymbol, color: piece.color },
      destination
    );
    if (tempBoard.isCheck()) {
      console.error("Cannot recall as it would result in check");
      return false;
    }

    // Move the piece to the historical position and end the turn
    if (!this.gameManager.movePieceDirectly(target, destination, true)) {
      console.error(`Failed to recall piece from ${target} to ${destination}`);
      return false;
    }

    // Log the successful cast
    console.log(`Successfully recalled piece from ${target} to ${destination}`);

    return true;
  }

  /**
   * Implements the Cursed Glyph spell.
   * Creates a glyph on an empty square that transforms any piece that steps on it into a pawn.
   */
  private castCursedGlyph(target: SingleTarget): boolean {
    console.log(`Attempting to cast Cursed Glyph on ${target}`);

    // Verify the target square is empty
    if (this.gameManager.getPieceAt(target)) {
      console.log("Cannot place a glyph on an occupied square");
      return false;
    }

    // Create a glyph effect
    const effect: Effect = {
      id: uuidv4(),
      type: "glyph",
      duration: 10, // Lasts for 10 turns unless triggered
      source: "cursedGlyph",
      modifiers: {
        onPieceEnter: "transformToPawn", // Use a string identifier instead of a function
      },
    };

    // Add the effect to the square
    this.gameManager.addGlyphToSquare(target, effect);

    // Spend mana - use castSpell from gameManager to handle the mana deduction
    const spell = getSpellById("cursedGlyph" as SpellId);
    if (spell) {
      // The GameManager will handle the mana deduction when the spell is successful
      console.log(`Glyph placed successfully at ${target}`);
    }

    return true;
  }
}
