import { Spell, SpellId } from "../types/types";

// Define all spells in the game
const spells: Spell[] = [
  {
    id: "astralSwap",
    name: "Astral Swap",
    description: "Swap any two of your own pieces.",
    manaCost: 4,
    targetType: "multi",
    requiredTargets: 2,
    mustTargetOwnPiece: true,
  },
  {
    id: "emberCrown",
    name: "Ember Crown",
    description: "Transform a pawn to a queen for 3 turns, then it dies.",
    manaCost: 6,
    targetType: "single",
    mustTargetOwnPiece: true,
  },
  {
    id: "frostShield",
    name: "Frost Shield",
    description: "Protect a piece from capture for 2 turns.",
    manaCost: 3,
    targetType: "single",
    mustTargetOwnPiece: true,
  },
  {
    id: "shadowStrike",
    name: "Shadow Strike",
    description: "Capture an enemy piece directly.",
    manaCost: 5,
    targetType: "single",
    mustTargetOpponentPiece: true,
  },
  {
    id: "arcaneArmor",
    name: "Arcane Armor",
    description: "Enhance a piece's defensive capabilities for 5 turns.",
    manaCost: 3,
    targetType: "single",
    mustTargetOwnPiece: true,
  },
  {
    id: "chronoRecall",
    name: "Chrono Recall",
    description: "Return a piece to its position from 2 turns ago.",
    manaCost: 3,
    targetType: "single",
    mustTargetOwnPiece: true,
  },
  {
    id: "phantomStep",
    name: "Phantom Step",
    description: "Move a piece ignoring collisions, no captures.",
    manaCost: 3,
    targetType: "from-to",
    mustTargetOwnPiece: true,
  },
  {
    id: "mistformKnight",
    name: "Mistform Knight",
    description: "Move knight, then summon clone that disappears next turn.",
    manaCost: 4,
    targetType: "from-to",
    mustTargetOwnPiece: true,
  },
  {
    id: "kingsGambit",
    name: "King's Gambit",
    description: "Move King twice in one turn.",
    manaCost: 7,
    targetType: "single",
    mustTargetOwnPiece: true,
  },
  {
    id: "nullfield",
    name: "Nullfield",
    description:
      "Remove all spell effects from the board. Purges all active effects, cancels transformations, and removes glyphs.",
    manaCost: 6,
    targetType: "none",
  },
  {
    id: "veilOfShadows",
    name: "Veil of Shadows",
    description: "Hide half of your board from the opponent for 2 turns.",
    manaCost: 8,
    targetType: "none",
  },
  {
    id: "cursedGlyph",
    name: "Cursed Glyph",
    description: "Trap square. Transform any piece that moves there.",
    manaCost: 6,
    targetType: "single",
    mustTargetEmptySquare: true,
  },
  {
    id: "darkConversion",
    name: "Dark Conversion",
    description: "Sacrifice 3 pawns to summon a Knight or Bishop.",
    manaCost: 6,
    targetType: "multi",
    requiredTargets: 3,
    mustTargetOwnPiece: true,
  },
];

// Get a spell by ID
export const getSpellById = (id: SpellId): Spell | undefined => {
  return spells.find((spell) => spell.id === id);
};

// Get all spells
export const getAllSpells = (): Spell[] => {
  return [...spells];
};

// Get random spells (for spell selection phase)
export const getRandomSpells = (count: number): Spell[] => {
  const shuffled = [...spells].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Get default spells for a player
export const getDefaultSpells = (player: "w" | "b"): SpellId[] => {
  if (player === "w") {
    return [
      "astralSwap",
      "emberCrown",
      "frostShield",
      "shadowStrike",
      "arcaneArmor",
      "nullfield",
    ];
  } else {
    return [
      "astralSwap",
      "emberCrown",
      "frostShield",
      "shadowStrike",
      "arcaneArmor",
      "nullfield",
    ];
  }
};
