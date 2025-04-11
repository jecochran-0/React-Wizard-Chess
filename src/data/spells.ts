import { Spell } from "../types/game";

export const SPELLS: Spell[] = [
  {
    id: "astral-swap",
    name: "Astral Swap",
    manaCost: 4,
    description:
      "Swap any two of your own pieces. Neither piece may move into check.",
    icon: "🔄",
  },
  {
    id: "phantom-step",
    name: "Phantom Step",
    manaCost: 3,
    description: "Move a piece ignoring collisions, no captures.",
    icon: "👻",
  },
  {
    id: "ember-crown",
    name: "Ember Crown",
    manaCost: 6,
    description: "Transform a pawn to a queen for 3 turns → then it dies.",
    icon: "👑",
  },
  {
    id: "arcane-anchor",
    name: "Arcane Anchor",
    manaCost: 3,
    description: "Piece immune to capture, cannot move.",
    icon: "⚓",
  },
  {
    id: "mistform-knight",
    name: "Mistform Knight",
    manaCost: 4,
    description: "Move knight, then summon clone that disappears next turn.",
    icon: "🐴",
  },
  {
    id: "chrono-recall",
    name: "Chrono Recall",
    manaCost: 3,
    description: "Return a piece to position 2 turns ago.",
    icon: "⏪",
  },
  {
    id: "cursed-glyph",
    name: "Cursed Glyph",
    manaCost: 6,
    description: "Trap square. Delay transformation.",
    icon: "🔯",
  },
  {
    id: "kings-gambit",
    name: "Kings Gambit",
    manaCost: 7,
    description: "Move King twice in one turn.",
    icon: "♚",
  },
  {
    id: "dark-conversion",
    name: "Dark Conversion",
    manaCost: 6,
    description: "Sacrifice 3 pawns → summon Knight/Bishop.",
    icon: "🔮",
  },
  {
    id: "nullfield",
    name: "Nullfield",
    manaCost: 6,
    description: "Remove any spell effect.",
    icon: "❌",
  },
  {
    id: "veil-shadows",
    name: "Veil of Shadows",
    manaCost: 8,
    description: "Hide board from enemy",
    icon: "🌑",
  },
];
