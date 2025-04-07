import { v4 as uuidv4 } from "uuid";
import { getSpellById } from "../utils/spells";
import {
  Effect,
  EffectModifiers,
  EffectType,
  SpellId,
  SpellTargetType,
} from "../types/types";
import { Square } from "chess.js";
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

    // Validate targets based on spell type
    if (!this.validateTargets(spellId, targets)) {
      console.error(`Invalid targets for spell ${spellId}`);
      return false;
    }

    // Switch based on spell ID to call the appropriate spell function
    switch (spellId) {
      case "astralSwap":
        return this.castAstralSwap(targets as FromToTarget);
      case "emberCrown":
        return this.castEmberCrown(targets as SingleTarget);
      case "frostShield":
        return this.castFrostShield(targets as SingleTarget);
      case "shadowStrike":
        return this.castShadowStrike(targets as SingleTarget);
      case "arcaneArmor":
        return this.castArcaneArmor(targets as SingleTarget);
      case "timeWarp":
        return this.castTimeWarp(targets as FromToTarget);
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

  // Validate spell targets
  private validateTargets(spellId: SpellId, targets: SpellTargetData): boolean {
    const spell = getSpellById(spellId);
    if (!spell) return false;

    // Check that the target format matches the spell's target type
    if (spell.targetType === "single") {
      return typeof targets === "string"; // Square is a string in chess.js
    } else if (spell.targetType === "multi") {
      return Array.isArray(targets);
    } else if (spell.targetType === "from-to") {
      return (
        typeof targets === "object" && "from" in targets && "to" in targets
      );
    }

    return false;
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
  private castAstralSwap(targets: FromToTarget): boolean {
    const { from, to } = targets;

    // Get pieces at the source and destination
    const sourcePiece = this.gameManager.getPieceAt(from);
    const destPiece = this.gameManager.getPieceAt(to);

    // Both squares must have pieces
    if (!sourcePiece || !destPiece) {
      return false;
    }

    // Implementation would use chess.js API to remove and place pieces
    // This is a placeholder for the actual implementation that would
    // need to interact with the underlying chess library
    console.log(`Swapped pieces between ${from} and ${to}`);

    // For now, we'll simulate this being successful
    return true;
  }

  // Ember Crown: Add a damage effect to a piece
  private castEmberCrown(target: SingleTarget): boolean {
    const piece = this.gameManager.getPieceAt(target);

    if (!piece) {
      return false;
    }

    // Create a damage effect (flames) on the piece
    const effect = this.createEffect("damage", 3, "emberCrown", {
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

    // Implementation would use chess.js API to remove the piece
    // This is a placeholder
    console.log(`Captured enemy piece at ${target}`);

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

  // Time Warp: Move a piece again
  private castTimeWarp(targets: FromToTarget): boolean {
    const { from, to } = targets;

    // Get the piece at the source
    const piece = this.gameManager.getPieceAt(from);

    // Must be a friendly piece
    if (!piece || piece.color !== this.gameManager.getCurrentPlayer()) {
      return false;
    }

    // Execute the move
    const success = this.gameManager.makeMove(from, to);

    return success;
  }
}
