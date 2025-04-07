import { Spell, SpellId } from "../types/types";

// Define all available spells in the game
const spells: Record<SpellId, Spell> = {
  // Astral Swap: Swap the positions of two pieces
  astralSwap: {
    id: "astralSwap",
    name: "Astral Swap",
    description: "Swap the positions of two pieces on the board.",
    manaCost: 4,
    targetType: "from-to",
    imagePath: "/assets/spells/astral_swap.png",
    mustTargetOwnPiece: true,
  },

  // Ember Crown: Add a damage effect to a piece
  emberCrown: {
    id: "emberCrown",
    name: "Ember Crown",
    description: "Enchant a piece with fire, dealing damage over time.",
    manaCost: 3,
    targetType: "single",
    imagePath: "/assets/spells/ember_crown.png",
  },

  // Frost Shield: Protect a piece from capture
  frostShield: {
    id: "frostShield",
    name: "Frost Shield",
    description: "Protect a piece with ice, preventing capture for 2 turns.",
    manaCost: 3,
    targetType: "single",
    imagePath: "/assets/spells/frost_shield.png",
    mustTargetOwnPiece: true,
  },

  // Shadow Strike: Directly capture an enemy piece
  shadowStrike: {
    id: "shadowStrike",
    name: "Shadow Strike",
    description: "Immediately capture an enemy piece.",
    manaCost: 6,
    targetType: "single",
    imagePath: "/assets/spells/shadow_strike.png",
    mustTargetOpponentPiece: true,
  },

  // Arcane Armor: Enhance a piece's defensive capabilities
  arcaneArmor: {
    id: "arcaneArmor",
    name: "Arcane Armor",
    description: "Enchant a piece with protective armor, enhancing defense.",
    manaCost: 2,
    targetType: "single",
    imagePath: "/assets/spells/arcane_armor.png",
    mustTargetOwnPiece: true,
  },

  // Time Warp: Move a piece again
  timeWarp: {
    id: "timeWarp",
    name: "Time Warp",
    description: "Bend time to move a piece twice in one turn.",
    manaCost: 5,
    targetType: "from-to",
    imagePath: "/assets/spells/time_warp.png",
    mustTargetOwnPiece: true,
  },
};

// Get a spell by its ID
export const getSpellById = (id: SpellId): Spell | undefined => {
  return spells[id];
};

// Get the initial spells for a player
export const getInitialSpells = (player: "w" | "b"): SpellId[] => {
  if (player === "w") {
    return ["astralSwap", "emberCrown", "frostShield"];
  } else {
    return ["shadowStrike", "arcaneArmor", "timeWarp"];
  }
};

// Get spells that match a specific criteria
export const getSpellsByProperty = <K extends keyof Spell, V extends Spell[K]>(
  property: K,
  value: V
): Spell[] => {
  return Object.values(spells).filter((spell) => spell[property] === value);
};

// Get all available spells
export const getAllSpells = (): Spell[] => {
  return Object.values(spells);
};
