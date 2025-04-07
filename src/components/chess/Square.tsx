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
  piece,
  isLight,
  isSelected,
  isValidMove,
  isLastMove,
  isCheck,
  hasGlyph,
  onClick,
}) => {
  // Determine background color based on square position and state
  const lightSquareColor = "#f0d9b5";
  const darkSquareColor = "#b58863";
  let backgroundColor = isLight ? lightSquareColor : darkSquareColor;

  // Add a subtle indicator for the last move
  const lastMoveStyle = isLastMove
    ? {
        boxShadow: "inset 0 0 0 3px rgba(255, 255, 0, 0.3)",
      }
    : {};

  // Check indicator (red border)
  const checkIndicator = isCheck
    ? {
        boxShadow: "inset 0 0 0 3px rgba(255, 0, 0, 0.6)",
      }
    : {};

  // Glyph indicator (purple glow)
  const glyphStyle = hasGlyph
    ? {
        backgroundImage:
          "radial-gradient(circle at center, rgba(168, 85, 247, 0.2) 0%, transparent 70%)",
      }
    : {};

  // Selected square indicator (blue border)
  const selectedStyle = isSelected
    ? {
        boxShadow: "inset 0 0 0 3px rgba(0, 0, 255, 0.4)",
      }
    : {};

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...lastMoveStyle,
        ...checkIndicator,
        ...glyphStyle,
        ...selectedStyle,
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

      {/* Valid move indicator - only show for empty squares */}
      {isValidMove && !piece && (
        <div
          style={{
            width: "25%",
            height: "25%",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Valid capture indicator - show for squares with opponent pieces */}
      {isValidMove && piece && (
        <div
          style={{
            position: "absolute",
            inset: "0",
            border: "3px solid rgba(0, 0, 0, 0.3)",
            borderRadius: "50%",
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
