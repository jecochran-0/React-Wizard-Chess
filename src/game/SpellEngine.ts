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
