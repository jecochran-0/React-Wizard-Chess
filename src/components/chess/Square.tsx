import React from "react";
import { Square as ChessSquare } from "chess.js";
import { PieceMeta } from "../../types/types";
import "./square.css"; // Import the CSS for animations
import arcaneAnchorIcon from "/assets/Chess_Effects/arcaneAnchorIcon.png";

export interface SquareProps {
  square: ChessSquare;
  piece: PieceMeta | null;
  isLight: boolean;
  isSelected: boolean;
  isLegalMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  isTargeted: boolean;
  isValidTarget?: boolean;
  onClick: () => void;
}

// Helper function to get the display type of a piece
const getPieceDisplayType = (type: string): string => {
  const pieceTypes: Record<string, string> = {
    p: "Pawn",
    r: "Rook",
    n: "Knight",
    b: "Bishop",
    q: "Queen",
    k: "King",
  };
  return pieceTypes[type] || type.toUpperCase();
};

// Helper function to get the piece image path
const getPieceImage = (piece: PieceMeta): string => {
  const pieceColor = piece.color === "w" ? "White" : "Black";

  // If this piece has an ember crown effect, ALWAYS use the ember queen image
  if (piece.effects?.some((effect) => effect.source === "emberCrown")) {
    return piece.color === "w"
      ? "/assets/Chess_Sprites/W_Ember_Q.png"
      : "/assets/Chess_Sprites/B_Ember_Queen.png";
  }

  // Standard image based on piece type
  return `/assets/Chess_Sprites/${pieceColor}_${piece.type.toUpperCase()}.png`;
};

const Square: React.FC<SquareProps> = ({
  square,
  piece,
  isLight,
  isSelected,
  isLegalMove,
  isLastMove,
  isCheck,
  isTargeted,
  isValidTarget,
  onClick,
}) => {
  // Square color determined by position
  const bgColor = isLight ? "#f0f9ff" : "#1e293b";

  // Base square style
  const style: React.CSSProperties = {
    width: "50px",
    height: "50px",
    backgroundColor: bgColor,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    cursor: "pointer",
  };

  // Apply styles based on square state (in order of priority)
  if (isSelected) {
    style.backgroundColor = "#3b82f6"; // Selected piece
    style.boxShadow = "inset 0 0 0 3px #2563eb";
  } else if (isCheck) {
    style.backgroundColor = "#ef4444"; // King in check
  } else if (isLastMove) {
    style.boxShadow = "inset 0 0 0 3px #f59e0b"; // Last move
  }

  // Handle spell targeting visual indicators
  if (isTargeted) {
    style.boxShadow = "inset 0 0 0 3px #a855f7";
    style.backgroundColor = isLight ? "#f5f3ff" : "#4c1d95";
  }

  // Visual indicator for valid targets during spell casting
  if (isValidTarget) {
    style.boxShadow = "inset 0 0 0 3px #10b981";
    style.backgroundColor = isLight ? "#ecfdf5" : "#064e3b";
  }

  // Check for Arcane Anchor/Armor effect
  const hasArcaneArmorEffect = piece?.effects?.some(
    (effect) => effect.source === "arcaneArmor"
  );

  // Log when we detect an Arcane Armor effect for debugging
  if (hasArcaneArmorEffect) {
    console.log(`Arcane Armor effect detected on ${square}`, {
      piece: piece?.type,
      color: piece?.color,
      effects: piece?.effects
        ?.filter((e) => e.source === "arcaneArmor")
        .map((e) => ({
          id: e.id,
          duration: e.duration,
          modifiers: e.modifiers,
        })),
    });
  }

  // Check for Ember Crown effect
  const hasEmberCrownEffect = piece?.effects?.some(
    (effect) => effect.source === "emberCrown"
  );

  // Find the main ember crown effect (for duration)
  const mainEmberEffect = piece?.effects?.find(
    (effect) =>
      effect.source === "emberCrown" && !effect.id.includes("emberVisual")
  );

  // Check if the piece has any effects
  const hasEffects = hasEmberCrownEffect || hasArcaneArmorEffect;

  // Prepare piece element if there is a piece
  let pieceElement = null;
  if (piece) {
    // Get piece display type (for alt text)
    const displayType = getPieceDisplayType(piece.type);
    const pieceColor = piece.color === "w" ? "white" : "black";

    // Get the appropriate piece image
    const pieceImage = getPieceImage(piece);

    // Determine any special styling for pieces with effects
    let filterStyle = "";

    if (hasEmberCrownEffect) {
      // Visual indicator for remaining turns
      const turnsLeft = mainEmberEffect?.duration || 0;

      // Apply a fiery glow effect for ember queens, with intensity based on remaining turns
      const intensity = Math.max(0.5, turnsLeft / 3); // Scale with remaining turns
      filterStyle = `drop-shadow(0 0 ${
        6 * intensity
      }px #ef4444) drop-shadow(0 0 ${10 * intensity}px #f97316)`;
    } else if (hasEffects && !hasArcaneArmorEffect) {
      // Generic effect for other spells
      filterStyle = "drop-shadow(0 0 4px #a855f7)";
    }

    pieceElement = (
      <div style={{ position: "relative", width: "85%", height: "85%" }}>
        <img
          src={pieceImage}
          alt={`${pieceColor} ${displayType}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: filterStyle,
            position: "relative",
            zIndex: 1,
          }}
        />

        {/* Add a pulsing flame effect for Ember Crown */}
        {hasEmberCrownEffect && <div className="ember-crown-effect" />}

        {/* Add light blue glow effect for Arcane Armor */}
        {hasArcaneArmorEffect && <div className="arcane-anchor-glow" />}

        {/* Add ember queen icon for ember crown pieces */}
        {hasEmberCrownEffect && (
          <div
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              fontSize: "16px",
              color: "#f97316",
              textShadow: "0 0 3px #000",
              background: "rgba(0,0,0,0.5)",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            🔥
          </div>
        )}

        {/* Add anchor icon for arcane armor pieces */}
        {hasArcaneArmorEffect && (
          <div
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              width: "26px",
              height: "26px",
              borderRadius: "50%",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              fontSize: "16px",
              color: "white",
              fontWeight: "bold",

              textShadow: "0 0 4px #3b82f6",
            }}
          >
            <img
              src={arcaneAnchorIcon}
              alt="Arcane Anchor Icon"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="square" style={style} onClick={onClick}>
      {pieceElement}

      {/* Legal move indicator (dot) */}
      {isLegalMove && !piece && (
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "#6366f1",
            opacity: 0.6,
          }}
        />
      )}

      {/* Legal capture indicator (border) */}
      {isLegalMove && piece && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            border: "3px solid #6366f1",
            borderRadius: "4px",
            boxSizing: "border-box",
            opacity: 0.8,
          }}
        />
      )}

      {/* Square notation */}
      <div
        style={{
          position: "absolute",
          bottom: "2px",
          right: "2px",
          fontSize: "8px",
          color: isLight ? "#64748b" : "#cbd5e1",
          opacity: 0.8,
        }}
      >
        {square}
      </div>
    </div>
  );
};

export default Square;
