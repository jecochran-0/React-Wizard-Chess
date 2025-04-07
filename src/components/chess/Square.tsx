import React from "react";
import { Square as ChessSquare } from "chess.js";

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

interface SquareProps {
  square: ChessSquare;
  piece: PieceMeta | null;
  isLight: boolean;
  isSelected: boolean;
  isLegalMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  isTargeted: boolean;
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
  onClick,
}) => {
  // Determine square background color
  const backgroundColor = isLight ? "#e2e8f0" : "#94a3b8";

  // Get square style object
  const getSquareStyle = () => {
    const style: React.CSSProperties = {
      width: "60px",
      height: "60px",
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor,
      fontSize: "36px",
      transition: "all 0.1s ease-in-out",
    };

    // Add highlight for selected piece
    if (isSelected) {
      style.boxShadow = "inset 0 0 0 3px rgba(59, 130, 246, 0.8)";
    }

    // Add highlight for king in check
    if (isCheck) {
      style.boxShadow = "inset 0 0 0 3px rgba(220, 38, 38, 0.8)";
    }

    // Add highlight for last move
    if (isLastMove) {
      style.backgroundColor = isLight
        ? "rgba(186, 230, 253, 0.8)"
        : "rgba(125, 211, 252, 0.6)";
    }

    // Add highlight for targeted squares
    if (isTargeted) {
      style.boxShadow = "inset 0 0 0 3px rgba(168, 85, 247, 0.8)";
      style.backgroundColor = isLight
        ? "rgba(233, 213, 255, 0.6)"
        : "rgba(192, 132, 252, 0.4)";
    }

    return style;
  };

  // Get piece display content
  const getPieceContent = () => {
    if (!piece) return null;

    // Map piece types to image paths
    const getPieceImagePath = (color: string, type: string): string => {
      return `/assets/Chess_Sprites/${color}_${type}.png`;
    };

    const pieceImagePath = getPieceImagePath(piece.color, piece.type);

    const hasEffects = piece.effects && piece.effects.length > 0;

    return (
      <div
        style={{
          height: "85%",
          width: "85%",
          position: "relative",
          zIndex: 2,
        }}
      >
        <img
          src={pieceImagePath}
          alt={`${piece.color}${piece.type}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: hasEffects
              ? "drop-shadow(0 0 4px rgba(168, 85, 247, 0.8))"
              : "none",
          }}
        />
      </div>
    );
  };

  // Render legal move indicator
  const renderLegalMoveIndicator = () => {
    if (!isLegalMove) return null;

    if (piece) {
      // Legal capture indicator - circle border
      return (
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            border: "3px solid rgba(0, 0, 0, 0.3)",
            borderRadius: "50%",
            zIndex: 1,
          }}
        />
      );
    } else {
      // Legal move indicator - dot
      return (
        <div
          style={{
            width: "15px",
            height: "15px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            zIndex: 1,
          }}
        />
      );
    }
  };

  return (
    <div style={getSquareStyle()} onClick={onClick}>
      {getPieceContent()}
      {renderLegalMoveIndicator()}

      {/* Square notation - small text in bottom-right corner */}
      <div
        style={{
          position: "absolute",
          bottom: "2px",
          right: "2px",
          fontSize: "8px",
          opacity: 0.6,
          color: isLight ? "#0f172a" : "#e2e8f0",
        }}
      >
        {square}
      </div>
    </div>
  );
};

export default Square;
