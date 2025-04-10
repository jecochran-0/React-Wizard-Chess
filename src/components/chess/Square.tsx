import React from "react";
import { Square as ChessSquare } from "chess.js";
import { PieceMeta } from "../../types/types";
import { useChess } from "../../context/ChessContext";
import "./square.css"; // Import the CSS for animations

// Import glyph image
// import cursedGlyphIcon from "/assets/Chess_Effects/cursedGlyphIcon.png";

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

  // If this piece is a Mistform Knight clone, use the special mist knight image
  if (
    piece.effects?.some(
      (effect) =>
        effect.source === "mistformKnight" && effect.modifiers?.isMistformClone
    )
  ) {
    return `/assets/Chess_Effects/Mist_K.png`;
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
  // Access the chess context
  const { boardGlyphs, currentPlayer } = useChess();

  // Check if this square has a glyph with more detailed debugging
  const squareHasGlyph = boardGlyphs && square in boardGlyphs;

  // Check if this square should be hidden by Veil of Shadows
  const shouldHideSquare = () => {
    // Get all the piece's effects
    if (!piece) return false;

    // Check if the piece has a Veil of Shadows effect
    const hasVeilEffect = piece.effects?.some(
      (effect) => effect.source === "veilOfShadows" && effect.duration > 0
    );

    // If the piece is not the current player's and has veil effect, it should be hidden
    if (hasVeilEffect && piece.color !== currentPlayer) {
      // Get the rank (row number)
      const rank = parseInt(square.charAt(1));

      // For white player, hide black's back ranks (1-4)
      if (currentPlayer === "w" && rank <= 4) {
        return true;
      }

      // For black player, hide white's back ranks (5-8)
      if (currentPlayer === "b" && rank >= 5) {
        return true;
      }
    }

    return false;
  };

  // Check if the square should be hidden
  const isHidden = shouldHideSquare();

  // Debug logging for glyph detection
  if (squareHasGlyph) {
    console.log(`Square ${square} has a glyph:`, {
      hasGlyph: squareHasGlyph,
      glyphDetails: boardGlyphs?.[square],
      glyphEffect: boardGlyphs?.[square]?.effect,
    });
  }

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

  // If the square is hidden by Veil of Shadows, override all other styling
  if (isHidden) {
    style.backgroundColor = "#0f172a"; // Dark background
    style.boxShadow = "inset 0 0 15px rgba(0, 0, 0, 0.8)";
    style.filter = "brightness(0.3) contrast(0.7)";
    style.pointerEvents = "none"; // Disable interaction
  } else {
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

      // Debug log for valid targets
      if (piece) {
        console.log(
          `Square ${square} is marked as valid target, has piece: ${piece.color} ${piece.type}`
        );
      } else {
        console.log(`Square ${square} is marked as valid target, empty square`);
      }
    }
  }

  // Check for Ember Crown effect
  const hasEmberCrownEffect = piece?.effects?.some(
    (effect) => effect.source === "emberCrown"
  );

  // Check for Arcane Anchor/Armor effect
  const hasArcaneArmorEffect = piece?.effects?.some(
    (effect) => effect.source === "arcaneArmor"
  );

  // Check for Cursed Glyph effect on the piece (not the square)
  const hasCursedGlyphEffect = piece?.effects?.some(
    (effect) => effect.source === "cursedGlyph" && effect.modifiers?.visualCurse
  );

  // Check for Mistform Knight clone effect
  const hasMistformCloneEffect = piece?.effects?.some(
    (effect) =>
      effect.source === "mistformKnight" && effect.modifiers?.isMistformClone
  );

  // Log when we detect a Cursed Glyph effect for debugging
  if (hasCursedGlyphEffect) {
    console.log(`Cursed Glyph effect detected on piece at ${square}`, {
      piece: piece?.type,
      color: piece?.color,
      effects: piece?.effects
        ?.filter((e) => e.source === "cursedGlyph")
        .map((e) => ({
          id: e.id,
          duration: e.duration,
          modifiers: e.modifiers,
        })),
    });
  }

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

  // Log when we detect a Mistform Knight clone for debugging
  if (hasMistformCloneEffect) {
    console.log(`Mistform Knight clone detected on ${square}`, {
      piece: piece?.type,
      color: piece?.color,
      effects: piece?.effects
        ?.filter((e) => e.source === "mistformKnight")
        .map((e) => ({
          id: e.id,
          duration: e.duration,
          modifiers: e.modifiers,
        })),
    });
  }

  // Find the main ember crown effect (for duration)
  const mainEmberEffect = piece?.effects?.find(
    (effect) =>
      effect.source === "emberCrown" && !effect.id.includes("emberVisual")
  );

  // Check if the piece has any effects
  const hasEffects =
    hasEmberCrownEffect || hasArcaneArmorEffect || hasMistformCloneEffect;

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
    } else if (hasMistformCloneEffect) {
      // Apply a misty blue glow effect for mistform clones
      filterStyle = `drop-shadow(0 0 8px #818cf8) brightness(1.2)`;
    } else if (hasCursedGlyphEffect) {
      // Apply a purple glow effect for cursed pieces
      filterStyle = `drop-shadow(0 0 6px #a855f7) brightness(0.9)`;
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

        {/* Add misty effect for Mistform Knight clones */}
        {hasMistformCloneEffect && <div className="mistform-clone-effect" />}

        {/* Add purple curse effect for Cursed Glyph */}
        {hasCursedGlyphEffect && <div className="cursed-piece-effect" />}

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
              src="/assets/Chess_Effects/arcaneAnchorIcon.png"
              alt="Arcane Anchor Icon"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        )}

        {/* Add cursed glyph icon for pieces afflicted with the curse */}
        {hasCursedGlyphEffect && (
          <div
            style={{
              position: "absolute",
              top: "-8px",
              right: hasArcaneArmorEffect ? "18px" : "-8px", // Offset if arcane armor is also present
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              animation: "pulse-glyph 2s infinite ease-in-out",
            }}
          >
            <img
              src="/assets/Chess_Effects/cursedGlyphIcon.png"
              alt="Cursed Glyph Icon"
              style={{
                width: "100%",
                height: "100%",
                filter: "drop-shadow(0 0 4px #a855f7)",
              }}
            />
          </div>
        )}
      </div>
    );
  }

  const renderPieceEffects = () => {
    // Check if piece has any effects
    const pieceEffects = piece?.effects;
    if (!pieceEffects || pieceEffects.length === 0) return null;

    // Check for specific effects
    const hasArcaneArmor = pieceEffects.some(
      (effect) => effect.source === "arcaneArmor"
    );
    const hasCursedGlyph = pieceEffects.some(
      (effect) => effect.source === "cursedGlyph"
    );

    console.log("Piece effects:", pieceEffects);
    if (hasArcaneArmor) console.log("Piece has arcane armor!");
    if (hasCursedGlyph) console.log("Piece has cursed glyph!");

    return (
      <>
        {hasArcaneArmor && (
          <div
            className="arcane-anchor-glow"
            style={{
              position: "absolute",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: "2px solid #00ffff",
              backgroundColor: "rgba(0, 255, 255, 0.2)",
              animation: "anchor-glow 1.5s alternate infinite",
              zIndex: 2,
              top: "-5px",
              right: "-5px",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#00ffff",
            }}
          >
            ⚓
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className={`square ${isHidden ? "hidden" : ""}`}
      style={style}
      onClick={onClick}
    >
      {pieceElement}

      {/* Display Cursed Glyph image */}
      {squareHasGlyph && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: piece ? 0 : 1, // Place under pieces but above empty squares
          }}
          data-testid={`glyph-${square}`}
          className="glyph-container"
        >
          <img
            src="/assets/Chess_Effects/cursedGlyphIcon.png"
            alt="Cursed Glyph"
            className="cursed-glyph"
            style={{
              width: "85%",
              height: "85%",
              objectFit: "contain",
              filter: "drop-shadow(0 0 8px #a855f7)",
            }}
          />
        </div>
      )}

      {/* Legal move indicator (dot) */}
      {isLegalMove && !piece && (
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "#6366f1",
            opacity: 0.6,
            zIndex: 2,
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

      {renderPieceEffects()}
    </div>
  );
};

export default Square;
