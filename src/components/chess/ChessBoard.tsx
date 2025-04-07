import React, { useState, useEffect } from "react";
import Square from "./Square";
import { useChess } from "../../context/ChessContext";
import { Square as ChessSquare } from "chess.js";
import { getSpellById } from "../../utils/spells";

// Define the SpellTarget and SpellTargetType types here since we're having import issues
interface SpellTarget {
  square: ChessSquare;
  type: "source" | "target";
}

type SpellTargetType = "single" | "multi" | "from-to";

const ChessBoard: React.FC = () => {
  const {
    gameManager,
    currentPlayer,
    selectedPiece,
    setSelectedPiece,
    legalMoves,
    lastMove,
    kingInCheck,
    selectedSpell,
    castSpell,
    addToGameLog,
  } = useChess();

  // State for spell targeting
  const [spellTargets, setSpellTargets] = useState<SpellTarget[]>([]);
  const [targetingMode, setTargetingMode] = useState<string | null>(null);

  // Enter targeting mode when a spell is selected
  useEffect(() => {
    if (selectedSpell) {
      const spell = getSpellById(selectedSpell);
      if (spell) {
        setTargetingMode(spell.targetType);
        setSpellTargets([]);
      }
    } else {
      setTargetingMode(null);
      setSpellTargets([]);
    }
  }, [selectedSpell]);

  // Handle square click - either for regular chess moves or for spell targeting
  const handleSquareClick = (square: ChessSquare) => {
    // If we're in targeting mode (casting a spell)
    if (targetingMode && selectedSpell) {
      handleSpellTargeting(square);
      return;
    }

    // Regular chess move logic
    const piece = gameManager.getPieceAt(square);

    // No piece is selected and the clicked square has a piece
    if (!selectedPiece && piece && piece.color === currentPlayer) {
      setSelectedPiece(square);
      return;
    }

    // A piece is selected
    if (selectedPiece) {
      // Clicking the same square or a different owned piece
      if (square === selectedPiece) {
        setSelectedPiece(null);
        return;
      }

      // Clicked on another piece of the same color
      if (piece && piece.color === currentPlayer) {
        setSelectedPiece(square);
        return;
      }

      // Check if this is a legal move
      if (legalMoves.includes(square)) {
        // Try to make the move
        const result = gameManager.makeMove(selectedPiece, square);

        if (result) {
          // Add to game log
          const movedPiece = gameManager.getPieceAt(square);
          const pieceType = movedPiece?.type.toUpperCase() || "";
          addToGameLog(
            `${
              currentPlayer === "w" ? "White" : "Black"
            } moved ${pieceType} ${selectedPiece}-${square}`
          );

          // Clear selection
          setSelectedPiece(null);
        }
      }
    }
  };

  // Handle spell targeting
  const handleSpellTargeting = (square: ChessSquare) => {
    if (!selectedSpell) return;

    const spell = getSpellById(selectedSpell);
    if (!spell) return;

    // Handle different targeting types
    switch (spell.targetType) {
      case "single":
        // For single-target spells, just cast the spell immediately
        if (isValidTarget(square, spell.targetType)) {
          if (castSpell(selectedSpell, [square])) {
            setSpellTargets([]);
            setTargetingMode(null);
          }
        }
        break;

      case "multi":
        // For multi-target spells, add to the target list
        if (isValidTarget(square, spell.targetType)) {
          // Check if this square is already targeted
          const alreadyTargeted = spellTargets.some(
            (target) => target.square === square
          );

          if (alreadyTargeted) {
            // Remove from targets if already selected
            setSpellTargets((prev) =>
              prev.filter((target) => target.square !== square)
            );
          } else {
            // Add to targets
            setSpellTargets((prev) => [...prev, { square, type: "target" }]);

            // If we've reached the required number of targets, cast the spell
            if (
              spell.requiredTargets &&
              spellTargets.length + 1 >= spell.requiredTargets
            ) {
              const targetSquares = [
                ...spellTargets.map((t) => t.square),
                square,
              ];
              if (castSpell(selectedSpell, targetSquares)) {
                setSpellTargets([]);
                setTargetingMode(null);
              }
            }
          }
        }
        break;

      case "from-to":
        // For from-to spells, first select the source, then the destination
        if (spellTargets.length === 0) {
          // First click - select the "from" square
          if (isValidSource(square)) {
            setSpellTargets([{ square, type: "source" }]);
          }
        } else {
          // Second click - select the "to" square and cast the spell
          if (isValidTarget(square, spell.targetType)) {
            const fromSquare = spellTargets[0].square;
            if (castSpell(selectedSpell, { from: fromSquare, to: square })) {
              setSpellTargets([]);
              setTargetingMode(null);
            }
          }
        }
        break;
    }
  };

  // Check if a square is a valid source for a spell
  const isValidSource = (square: ChessSquare): boolean => {
    if (!selectedSpell) return false;

    const piece = gameManager.getPieceAt(square);
    const spell = getSpellById(selectedSpell);

    if (!spell) return false;

    // Check if the piece belongs to the current player
    if (spell.mustTargetOwnPiece && (!piece || piece.color !== currentPlayer)) {
      return false;
    }

    return true;
  };

  // Check if a square is a valid target for a spell
  const isValidTarget = (
    square: ChessSquare,
    targetType: SpellTargetType
  ): boolean => {
    if (!selectedSpell) return false;

    const piece = gameManager.getPieceAt(square);
    const spell = getSpellById(selectedSpell);

    if (!spell) return false;

    // For from-to targeting, check that the target is not the same as the source
    if (
      targetType === "from-to" &&
      spellTargets.length > 0 &&
      spellTargets[0].square === square
    ) {
      return false;
    }

    // Check target requirements based on spell properties
    if (spell.mustTargetOwnPiece && (!piece || piece.color !== currentPlayer)) {
      return false;
    }

    if (spell.mustTargetEmptySquare && piece) {
      return false;
    }

    if (
      spell.mustTargetOpponentPiece &&
      (!piece || piece.color === currentPlayer)
    ) {
      return false;
    }

    return true;
  };

  // Build the chessboard
  const boardRows = [];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  for (let i = 0; i < 8; i++) {
    const row = [];
    for (let j = 0; j < 8; j++) {
      const square = (files[j] + ranks[i]) as ChessSquare;
      const piece = gameManager.getPieceAt(square);
      const isLight = (i + j) % 2 === 1;

      // Check if this square is in the last move
      const isLastMove =
        lastMove !== null &&
        (lastMove.from === square || lastMove.to === square);

      // Check if square is being targeted for a spell
      const isTargeted = spellTargets.some(
        (target) => target.square === square
      );

      row.push(
        <Square
          key={square}
          square={square}
          piece={piece}
          isLight={isLight}
          isSelected={square === selectedPiece}
          isLegalMove={legalMoves.includes(square)}
          isLastMove={isLastMove}
          isCheck={kingInCheck === square}
          isTargeted={isTargeted}
          onClick={() => handleSquareClick(square)}
        />
      );
    }
    boardRows.push(
      <div key={i} className="board-row" style={{ display: "flex" }}>
        {row}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-block",
        border: "2px solid #475569",
        borderRadius: "4px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
      }}
    >
      {boardRows}
    </div>
  );
};

export default ChessBoard;
