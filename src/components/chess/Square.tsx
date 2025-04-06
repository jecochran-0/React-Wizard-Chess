import React from "react";
import Piece from "./Piece";
import { PieceCode } from "./pieceImages";
import { PieceMeta, Square as SquareType } from "../../types/game";

interface SquareProps {
  square: SquareType;
  piece: PieceMeta | null;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  hasGlyph: boolean;
  onClick: (square: SquareType) => void;
}

const Square: React.FC<SquareProps> = ({
  square,
  piece = null,
  isLight,
  isSelected,
  isValidMove,
  isLastMove,
  isCheck,
  hasGlyph,
  onClick,
}) => {
  // Determine the background color based on the square properties
  let backgroundColor: string;

  if (isSelected) {
    backgroundColor = isLight ? "#f0d9b5" : "#b58863";
  } else if (isValidMove) {
    backgroundColor = isLight
      ? "rgba(100, 255, 100, 0.5)"
      : "rgba(100, 200, 100, 0.4)";
  } else if (isLastMove) {
    backgroundColor = isLight
      ? "rgba(255, 255, 0, 0.2)"
      : "rgba(255, 255, 0, 0.15)";
  } else {
    backgroundColor = isLight ? "#f0d9b5" : "#b58863";
  }

  // Check indicator
  const checkIndicator: React.CSSProperties =
    isCheck && piece && piece.piece.endsWith("K")
      ? {
          boxShadow: "inset 0 0 15px rgba(255, 0, 0, 0.7)",
          border: "2px solid rgba(255, 0, 0, 0.6)",
        }
      : {};

  // Glyph indicator
  const glyphStyle: React.CSSProperties = hasGlyph
    ? {
        backgroundImage:
          "radial-gradient(circle, transparent 60%, rgba(128, 0, 128, 0.3) 90%)",
        boxShadow: "inset 0 0 5px purple",
      }
    : {};

  return (
    <div
      className="square"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...checkIndicator,
        ...glyphStyle,
      }}
      onClick={() => onClick(square)}
    >
      {/* Square notation (e.g., a1, h8) - visible in corners */}
      <div
        style={{
          position: "absolute",
          bottom: "2px",
          left: "2px",
          fontSize: "10px",
          color: isLight ? "#b58863" : "#f0d9b5",
          opacity: 0.7,
          pointerEvents: "none",
        }}
      >
        {square}
      </div>

      {/* Move indicator */}
      {isValidMove && !piece && (
        <div
          style={{
            width: "30%",
            height: "30%",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Render piece if present */}
      {piece && (
        <Piece
          piece={piece.piece as PieceCode}
          effects={piece.effects || []}
          onClick={() => onClick(square)}
        />
      )}
    </div>
  );
};

export default Square;
