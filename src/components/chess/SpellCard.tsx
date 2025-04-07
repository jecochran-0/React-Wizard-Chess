import React from "react";
import { Spell } from "../../types/types";

// Clean mapping from SpellId to image filename
const spellIdToFileMap: Record<string, string> = {
  // CamelCase IDs mapped to their respective image files
  astralSwap: "ChatGPT Image Apr 4, 2025, 05_35_35 PM.png",
  phantomStep: "Phantom_Step.png",
  emberCrown: "Ember_Crown.png",
  arcaneArmor: "Arcane_Anchor.png",
  frostShield: "Arcane_Anchor.png",
  shadowStrike: "Veil_Of_Shadows.png",
  timeWarp: "Chrono_Recall.png",
  mistformKnight: "Mistform_Knight.png",
  kingsGambit: "Kings_Gambit.png",
  darkConversion: "Dark_Conversion.png",
  spiritLink: "Spirit_Link.png",
  secondWind: "Second_Wind.png",
  pressureField: "Pressure_Field.png",
  nullfield: "nullfield.png",
  veilOfShadows: "Veil_Of_Shadows.png",
  raiseBonewalker: "Raise_The_Bonewalker.png",
  cursedGlyph: "Cursed_Glyph.png",
};

interface SpellCardProps {
  spell: Spell;
  isSelected: boolean;
  isDisabled: boolean;
  playerMana: number;
  onSelect: (spellId: string) => void;
}

const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  isSelected,
  isDisabled,
  playerMana,
  onSelect,
}) => {
  // Check if player has enough mana
  const hasEnoughMana = playerMana >= spell.manaCost;
  // Determine if the card is usable
  const isUsable = !isDisabled && hasEnoughMana;

  // Handle click on spell card
  const handleClick = () => {
    if (isUsable) {
      onSelect(spell.id);
    }
  };

  // Get the spell's image
  const getSpellImage = () => {
    // Find the appropriate filename for the spell ID or use the default
    const filename = spellIdToFileMap[spell.id] || "spell_card_back.png";
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
            borderRadius: "4px 4px 0 0",
          }}
        />
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
      </div>
    );
  };

  return (
    <div
      className={`spell-card ${isSelected ? "selected" : ""} ${
        !isUsable ? "disabled" : ""
      }`}
      onClick={handleClick}
      title={`${spell.name}: ${spell.description} (Cost: ${spell.manaCost})`}
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
              borderRadius: "4px",
            }}
          >
            {!hasEnoughMana ? "Need Mana" : "Cannot Cast"}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpellCard;
