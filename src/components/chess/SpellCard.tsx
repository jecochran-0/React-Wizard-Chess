import React from "react";
import { Spell } from "../../types/types";

// Clean mapping from SpellId to image filename
const spellIdToFileMap: Record<string, string> = {
  // CamelCase IDs mapped to their respective image files
  astralSwap: "Astral_Swap.jpg",
  phantomStep: "Phantom_Step.jpg",
  emberCrown: "Ember_Crown.jpg",
  arcaneArmor: "Arcane_Anchor.jpg",
  frostShield: "Arcane_Anchor.jpg",
  shadowStrike: "Veil_Of_Shadows.jpg",
  chronoRecall: "Chrono_Recall.jpg",
  mistformKnight: "Mistform_Knight.jpg",
  kingsGambit: "Kings_Gambit.jpg",
  darkConversion: "Dark_Conversion.jpg",
  spiritLink: "Spirit_Link.jpg",
  secondWind: "Second_Wind.jpg",
  pressureField: "Pressure_Field.jpg",
  nullfield: "nullfield.jpg",
  veilOfShadows: "Veil_Of_Shadows.jpg",
  raiseBonewalker: "Raise_The_Bonewalker.jpg",
  cursedGlyph: "Cursed_Glyph.jpg",
};

interface SpellCardProps {
  spell: Spell;
  isSelected: boolean;
  isDisabled: boolean;
  playerMana: number;
  onSelect: (spellId: string) => void;
  showText?: boolean;
  currentTurn?: number; // Add current turn number prop
}

const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  isSelected,
  isDisabled,
  playerMana,
  onSelect,
  showText = true,
  currentTurn = 0, // Default to 0
}) => {
  // Check if player has enough mana
  const hasEnoughMana = playerMana >= spell.manaCost;
  // Check if spells are allowed yet (after turn 5)
  const spellsAllowed = currentTurn > 5;
  // Determine if the card is usable
  const isUsable = !isDisabled && hasEnoughMana && spellsAllowed;

  // Handle click on spell card
  const handleClick = () => {
    if (isUsable) {
      onSelect(spell.id);
    }
  };

  // Get the spell's image
  const getSpellImage = () => {
    // Find the appropriate filename for the spell ID or use the default
    const filename = spellIdToFileMap[spell.id] || "spell_card_back.jpg";
    const imagePath = `/assets/Chess_Spells/${filename}`;

    return (
      <div className="spell-card-image">
        <img
          src={imagePath}
          alt={spell.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "0px",
          }}
        />
        {showText && (
          <div
            style={{
              position: "absolute",
              bottom: "0",
              width: "100%",
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              padding: "2px 4px",
              fontSize: "9px",
              color: "white",
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {spell.name}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`spell-card ${isSelected ? "selected" : ""} ${
        !isUsable ? "disabled" : ""
      }`}
      onClick={handleClick}
      title={`${spell.name}: ${spell.description} (Cost: ${spell.manaCost}${
        !spellsAllowed ? " - Spells unlock after turn 5" : ""
      })`}
    >
      <div className="spell-card-inner">
        {getSpellImage()}
        <div className="mana-cost">{spell.manaCost}</div>

        {/* Disabled overlay when spell can't be cast */}
        {!isUsable && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "10px",
              borderRadius: "0px",
            }}
          >
            {!hasEnoughMana
              ? "Need Mana"
              : !spellsAllowed
              ? "Unlock T5"
              : "Cannot Cast"}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpellCard;
