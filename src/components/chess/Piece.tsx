import React from "react";
import pieceImages, { PieceCode } from "./pieceImages";

interface PieceProps {
  piece: PieceCode;
  effects?: string[];
  onClick?: () => void;
  isDragging?: boolean;
}

const Piece: React.FC<PieceProps> = ({
  piece,
  effects = [],
  onClick,
  isDragging = false,
}) => {
  if (!piece) return null;

  // Get the image for this piece
  const pieceImage = pieceImages[piece];

  if (!pieceImage) {
    console.error(`No image found for piece: ${piece}`);
    return null;
  }

  // Check for special effects
  const hasShield = effects.includes("shielded");
  const isAnchored = effects.includes("anchored");
  const isMistClone = effects.includes("mistClone");

  // Apply styling based on effects
  const effectStyle: React.CSSProperties = {
    position: "relative",
    width: "80%",
    height: "80%",
    transition: "transform 0.2s",
    filter: isMistClone
      ? "opacity(0.7) drop-shadow(0 0 8px #a78bfa)"
      : undefined,
    transform: isDragging ? "scale(1.1)" : "scale(1)",
  };

  return (
    <div
      className="piece-container"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <img src={pieceImage} alt={piece} style={effectStyle} draggable={false} />

      {/* Visual indicators for effects */}
      {hasShield && (
        <div
          style={{
            position: "absolute",
            inset: "0",
            borderRadius: "50%",
            border: "2px solid #38bdf8",
            boxShadow: "0 0 10px #38bdf8",
            animation: "pulse 2s infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {isAnchored && (
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            width: "100%",
            height: "30%",
            background: "linear-gradient(transparent, rgba(234, 179, 8, 0.3))",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

export default Piece;
