import { v4 as uuidv4 } from "uuid";
import { getSpellById } from "../utils/spells";
import {
  Effect,
  EffectModifiers,
  EffectType,
  SpellId,
  SpellTargetType,
} from "../types/types";
import { Chess, Square } from "chess.js";
import GameManager from "./GameManager";

// Define specialized target types
type SingleTarget = Square;
type MultiTarget = Square[];
type FromToTarget = { from: Square; to: Square };

// Union type for all possible target formats
type SpellTargetData = SingleTarget | MultiTarget | FromToTarget;

export class SpellEngine {
  private gameManager: GameManager;

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
  }

  // Cast a spell with the given targets
  castSpell(spellId: SpellId, targets: SpellTargetData): boolean {
    const spell = getSpellById(spellId);
    if (!spell) {
      console.error(`Spell ${spellId} not found`);
      return false;
    }

    // Switch based on spell ID to call the appropriate spell function
    switch (spellId) {
      case "astralSwap":
        if (Array.isArray(targets) && targets.length === 2) {
          return this.castAstralSwap(targets[0], targets[1]);
        }
        return false;
      case "phantomStep":
        if (
          typeof targets === "object" &&
          "from" in targets &&
          "to" in targets
        ) {
          return this.castPhantomStep(targets.from, targets.to);
        }
        return false;
      case "emberCrown":
        return this.castEmberCrown(targets as SingleTarget);
      case "frostShield":
        return this.castFrostShield(targets as SingleTarget);
      case "shadowStrike":
        return this.castShadowStrike(targets as SingleTarget);
      case "arcaneArmor":
        return this.castArcaneArmor(targets as SingleTarget);
      default:
        console.error(`Implementation for spell ${spellId} not found`);
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

  // Ember Crown: Add a damage effect to a piece
  private castEmberCrown(target: SingleTarget): boolean {
    const piece = this.gameManager.getPieceAt(target);

    if (!piece) {
      return false;
    }

    // Create a damage effect (flames) on the piece
    const effect = this.createEffect("transform", 3, "emberCrown", {
      damagePerTurn: 1,
    });

    // Add the effect to the piece
    this.gameManager.addEffect(target, effect);

    return true;
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

    // Create a buff effect on the piece
    const effect = this.createEffect("buff", 5, "arcaneArmor", {
      defensiveBonus: true,
    });

    // Add the effect to the piece
    this.gameManager.addEffect(target, effect);

    return true;
  }
}
