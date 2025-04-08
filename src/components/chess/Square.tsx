import React from "react";
import { Square as ChessSquare } from "chess.js";
import { PieceMeta } from "../../types/types";
import "./square.css"; // Import the CSS for animations

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

  // If we have a piece, display it
  let pieceElement = null;
  if (piece) {
    // Determine if piece has effects
    const hasEffects = piece.effects && piece.effects.length > 0;

    // Check for specific effects
    const hasEmberCrownEffect = piece.effects?.some(
      (effect) => effect.source === "emberCrown"
    );

    const hasArcaneAnchorEffect = piece.effects?.some(
      (effect) => effect.source === "arcaneAnchor"
    );

    // Find the main ember crown effect (the one that expires) for debugging
    const mainEmberEffect = piece.effects?.find(
      (effect) =>
        effect.source === "emberCrown" && !effect.id.includes("emberVisual")
    );

    // Log effect details for debugging
    if (hasEffects) {
      if (hasEmberCrownEffect) {
        console.log(`EMBER CROWN at ${square}:`, {
          type: piece.type,
          mainEffectTurns: mainEmberEffect?.duration || "N/A",
          effectCount: piece.effects.length,
          allEffects: piece.effects.map(
            (e) => `${e.id.substring(0, 10)}... (${e.duration})`
          ),
        });
      }

      if (hasArcaneAnchorEffect) {
        console.log(`ARCANE ANCHOR at ${square}:`, {
          type: piece.type,
          effects: piece.effects
            .filter((e) => e.source === "arcaneAnchor")
            .map((e) => `${e.id.substring(0, 10)}... (${e.duration})`),
        });
      }
    }

    // Get the piece color for the image path
    const pieceColor = piece.color === "w" ? "White" : "Black";

    // Determine the piece type
    const displayType = piece.type.toUpperCase();
    let pieceImage;

    // If this piece has an ember crown effect, ALWAYS use the ember queen image
    if (hasEmberCrownEffect) {
      pieceImage =
        piece.color === "w"
          ? "/assets/Chess_Sprites/W_Ember_Q.png"
          : "/assets/Chess_Sprites/B_Ember_Queen.png";
    } else {
      // Standard image based on piece type
      pieceImage = `/assets/Chess_Sprites/${pieceColor}_${displayType}.png`;
    }

    // Apply visual effects based on active effects
    let filterStyle = "none";
    if (hasEmberCrownEffect) {
      // Visual indicator for remaining turns
      const turnsLeft = mainEmberEffect?.duration || 0;

      // Apply a fiery glow effect for ember queens, with intensity based on remaining turns
      const intensity = Math.max(0.5, turnsLeft / 3); // Scale with remaining turns
      filterStyle = `drop-shadow(0 0 ${
        6 * intensity
      }px #ef4444) drop-shadow(0 0 ${10 * intensity}px #f97316)`;
    } else if (hasArcaneAnchorEffect) {
      // Blue shield glow for anchored pieces
      filterStyle =
        "drop-shadow(0 0 8px #3b82f6) drop-shadow(0 0 12px #2563eb)";
    } else if (hasEffects) {
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
          }}
        />

        {/* Add a pulsing flame effect for Ember Crown */}
        {hasEmberCrownEffect && (
          <div className="ember-crown-effect">
            {/* Add turn counter */}
            {mainEmberEffect && mainEmberEffect.duration > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "-15px",
                  right: "-10px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                  border: "2px solid #7f1d1d",
                }}
              >
                {mainEmberEffect.duration}
              </div>
            )}
          </div>
        )}

        {/* Add arcane shield effect for Arcane Anchor */}
        {hasArcaneAnchorEffect && (
          <div className="arcane-anchor-effect">
            {/* Add an anchor icon or shield indicator */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                right: "-12px",
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: "bold",
                border: "2px solid #1e40af",
                boxShadow: "0 0 8px #3b82f6",
              }}
            >
              ⚓
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={style} onClick={onClick}>
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
