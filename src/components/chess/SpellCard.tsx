import React from "react";
import { Spell } from "../../types/game";

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

  // Card style varies based on selection and disabled state
  const cardStyle: React.CSSProperties = {
    position: "relative",
    padding: "0.5rem",
    borderRadius: "0.5rem",
    backgroundColor: isSelected
      ? "rgba(139, 92, 246, 0.3)"
      : "rgba(15, 23, 42, 0.7)",
    border: isSelected
      ? "2px solid #a855f7"
      : "1px solid rgba(100, 116, 139, 0.5)",
    boxShadow: isSelected
      ? "0 0 15px rgba(168, 85, 247, 0.4)"
      : "0 4px 6px rgba(0, 0, 0, 0.1)",
    transition: "all 0.2s ease",
    opacity: isDisabled ? 0.6 : 1,
    cursor: isDisabled ? "not-allowed" : "pointer",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div
      style={cardStyle}
      onClick={isCastable ? onClick : undefined}
      className="spell-card"
    >
      {/* Spell Name */}
      <div
        style={{
          fontWeight: "bold",
          fontSize: "0.9rem",
          marginBottom: "0.3rem",
          textAlign: "center",
          color: isSelected ? "#d8b4fe" : "white",
        }}
      >
        {spell.name}
      </div>

      {/* Mana Cost */}
      <div
        style={{
          position: "absolute",
          top: "0.3rem",
          right: "0.3rem",
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          color: "white",
          fontSize: "0.75rem",
          borderRadius: "0.3rem",
          padding: "0.1rem 0.3rem",
          fontWeight: "bold",
        }}
      >
        {spell.manaCost}
      </div>

      {/* Spell Description */}
      <div
        style={{
          fontSize: "0.75rem",
          color: "#e2e8f0",
          marginTop: "auto",
          lineHeight: "1.1",
        }}
      >
        {spell.description.length > 70
          ? `${spell.description.substring(0, 70)}...`
          : spell.description}
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            bottom: "0.4rem",
            right: "0.4rem",
            width: "0.5rem",
            height: "0.5rem",
            borderRadius: "50%",
            backgroundColor: "#a855f7",
            boxShadow: "0 0 5px #a855f7",
          }}
        ></div>
      )}
    </div>
  );
};

export default SpellCard;
