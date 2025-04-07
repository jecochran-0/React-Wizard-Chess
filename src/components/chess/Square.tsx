import React from "react";
import { Square as ChessSquare } from "chess.js";
import { PieceMeta } from "../../types/types";

// Define PieceMeta since we're having import issues
interface PieceMeta {
  type: string;
  color: "w" | "b";
  square: ChessSquare;
  effects: Effect[];
  hasMoved?: boolean;
}

// Define Effect for PieceMeta
interface Effect {
  id: string;
  type: string;
  duration: number;
  source: string;
  modifiers?: Record<string, unknown>;
}

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
    // Check for active effects to apply visual indicators
    const hasEffects = piece.effects && piece.effects.length > 0;

    // Get the piece image URL based on the piece color and type
    const pieceType = piece.type.toUpperCase();
    const pieceColor = piece.color === "w" ? "White" : "Black";
    const pieceImage = `/assets/Chess_Sprites/${pieceColor}_${pieceType}.png`;

    pieceElement = (
      <img
        src={pieceImage}
        alt={`${pieceColor} ${pieceType}`}
        style={{
          width: "85%",
          height: "85%",
          objectFit: "contain",
          filter: hasEffects ? "drop-shadow(0 0 4px #a855f7)" : "none",
        }}
      />
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
