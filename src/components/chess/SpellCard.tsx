import React from "react";
import { Spell } from "../../types/game";

// Import spell card images
import astralSwapImg from "/assets/Chess_Spells/ChatGPT Image Apr 4, 2025, 05_35_35 PM.png";
import phantomStepImg from "/assets/Chess_Spells/Phantom_Step.png";
import emberCrownImg from "/assets/Chess_Spells/Ember_Crown.png";
import arcaneAnchorImg from "/assets/Chess_Spells/Arcane_Anchor.png";
import mistformKnightImg from "/assets/Chess_Spells/Mistform_Knight.png";
import chronoRecallImg from "/assets/Chess_Spells/Chrono_Recall.png";
import cursedGlyphImg from "/assets/Chess_Spells/Cursed_Glyph.png";
import kingsGambitImg from "/assets/Chess_Spells/Kings_Gambit.png";
import darkConversionImg from "/assets/Chess_Spells/Dark_Conversion.png";
import spiritLinkImg from "/assets/Chess_Spells/Spirit_Link.png";
import secondWindImg from "/assets/Chess_Spells/Second_Wind.png";
import pressureFieldImg from "/assets/Chess_Spells/Pressure_Field.png";
import nullfieldImg from "/assets/Chess_Spells/nullfield.png";
import veilOfShadowsImg from "/assets/Chess_Spells/Veil_Of_Shadows.png";
import bonewalkerImg from "/assets/Chess_Spells/Raise_The_Bonewalker.png";
import cardBackImg from "/assets/Chess_Spells/spell_card_back.png";

// Map spell IDs to their respective images
const spellImages: Record<string, string> = {
  "astral-swap": astralSwapImg,
  "phantom-step": phantomStepImg,
  "ember-crown": emberCrownImg,
  "arcane-anchor": arcaneAnchorImg,
  "mistform-knight": mistformKnightImg,
  "chrono-recall": chronoRecallImg,
  "cursed-glyph": cursedGlyphImg,
  "kings-gambit": kingsGambitImg,
  "dark-conversion": darkConversionImg,
  "spirit-link": spiritLinkImg,
  "second-wind": secondWindImg,
  "pressure-field": pressureFieldImg,
  nullfield: nullfieldImg,
  "veil-shadows": veilOfShadowsImg,
  bonewalker: bonewalkerImg,
};

interface SpellCardProps {
  spell: Spell;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  isSelected = false,
  isDisabled = false,
  onClick,
}) => {
  // Function to determine if the spell is castable (has enough mana)
  const isCastable = !isDisabled;
  const spellImage = spellImages[spell.id] || cardBackImg;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "40px",
        marginBottom: "5px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.7 : 1,
        transform: isSelected ? "translateY(-1px)" : "none",
        transition: "all 0.2s ease",
      }}
      onClick={isCastable ? onClick : undefined}
    >
      {/* Card Image */}
      <img
        src={spellImage}
        alt={spell.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "3px",
          border: isSelected
            ? "1px solid #a855f7"
            : "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: isSelected
            ? "0 0 5px rgba(168, 85, 247, 0.4)"
            : "0 1px 3px rgba(0, 0, 0, 0.2)",
          transition: "all 0.2s ease",
        }}
      />

      {/* Mana Cost Badge */}
      <div
        style={{
          position: "absolute",
          top: "2px",
          right: "2px",
          backgroundColor: "rgba(59, 130, 246, 0.9)",
          color: "white",
          fontSize: "9px",
          fontWeight: "bold",
          padding: "1px 3px",
          borderRadius: "2px",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          lineHeight: 1,
        }}
      >
        {spell.manaCost}
      </div>

      {/* Selected Glow Effect */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            inset: "-1px",
            borderRadius: "4px",
            background:
              "radial-gradient(circle at center, rgba(168, 85, 247, 0.3) 0%, transparent 70%)",
            pointerEvents: "none",
            animation: "pulse 2s infinite",
          }}
        />
      )}

      {/* Disabled Overlay */}
      {isDisabled && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "3px",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "8px",
            textAlign: "center",
            padding: "2px",
          }}
        >
          No mana
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default SpellCard;
