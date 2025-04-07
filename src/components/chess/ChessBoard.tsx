import React, { useState, useEffect } from "react";
import Square from "./Square";
import { useChess } from "../../context/ChessContext";
import { Square as ChessSquare } from "chess.js";
import { getSpellById } from "../../utils/spells";
import { SpellTarget, SpellTargetType } from "../../types/types";

const ChessBoard: React.FC = () => {
  const {
    boardState,
    legalMoves,
    selectedPiece,
    selectedSpell,
    currentPlayer,
    makeMove,
    selectPiece,
    castSpell,
  } = useChess();

  // State for spell targeting
  const [spellTargets, setSpellTargets] = useState<SpellTarget[]>([]);
  const [targetingMode, setTargetingMode] = useState<boolean>(false);

  // Get the selected spell's details
  const selectedSpellDetails = selectedSpell
    ? getSpellById(selectedSpell)
    : null;

  // Enter targeting mode when a spell is selected
  useEffect(() => {
    if (selectedSpell) {
      setTargetingMode(true);
      setSpellTargets([]);
    } else {
      setTargetingMode(false);
      setSpellTargets([]);
    }
  }, [selectedSpell]);

  // Handle square click
  const handleSquareClick = (square: ChessSquare) => {
    // If we're in spell targeting mode, handle spell targeting
    if (targetingMode && selectedSpellDetails) {
      handleSpellTargeting(square);
    } else {
      // Regular chess move
      handleChessMove(square);
    }
  };

  // Handle spell targeting based on the spell type
  const handleSpellTargeting = (square: ChessSquare) => {
    if (!selectedSpellDetails) return;

    const targetType = selectedSpellDetails.targetType;
    const piece = boardState[square];

    // Check if the clicked square is a valid source for the spell
    const isValidSource = () => {
      // For most spells, the source must be a friendly piece
      if (piece && piece.color === currentPlayer) {
        return true;
      }
      return false;
    };

    // Handle targeting based on spell type
    switch (targetType) {
      case "single":
        // Single target spells like Ember Crown
        setSpellTargets([{ square, type: "target" }]);
        // Attempt to cast the spell
        if (selectedSpell) {
          castSpell(selectedSpell, square);
          setTargetingMode(false);
          setSpellTargets([]);
        }
        break;

      case "multi":
        // Multi-target spells
        const maxTargets = selectedSpellDetails.requiredTargets || 1;

        // Check if the square is already targeted
        const alreadyTargeted = spellTargets.some(
          (target) => target.square === square
        );

        if (alreadyTargeted) {
          // Remove the target if clicked again
          setSpellTargets(
            spellTargets.filter((target) => target.square !== square)
          );
        } else if (spellTargets.length < maxTargets) {
          // Add as a new target if we haven't reached the max
          const newTarget: SpellTarget = { square, type: "target" };
          const updatedTargets = [...spellTargets, newTarget];
          setSpellTargets(updatedTargets);

          // If we've reached the max targets and it's a multi-target spell, cast it
          if (updatedTargets.length === maxTargets && selectedSpell) {
            castSpell(
              selectedSpell,
              updatedTargets.map((t) => t.square)
            );
            setTargetingMode(false);
            setSpellTargets([]);
          }
        }
        break;

      case "from-to":
        // From-to spells like Astral Swap
        if (spellTargets.length === 0) {
          // First click - select source
          if (isValidSource()) {
            setSpellTargets([{ square, type: "source" }]);
          }
        } else {
          // Second click - select destination
          const sourceSquare = spellTargets[0].square;

          // Cast the spell with both squares
          if (selectedSpell) {
            castSpell(selectedSpell, [sourceSquare, square]);
            setTargetingMode(false);
            setSpellTargets([]);
          }
        }
        break;

      default:
        break;
    }
  };

  // Handle standard chess move
  const handleChessMove = (square: ChessSquare) => {
    const piece = boardState[square];

    // If we've already selected a piece and this is a legal move
    if (selectedPiece && legalMoves.includes(square)) {
      makeMove(selectedPiece, square);
      selectPiece(null);
      return;
    }

    // Otherwise, select/deselect a piece
    if (piece && piece.color === currentPlayer) {
      // Select this piece if it belongs to current player
      selectPiece(square);
    } else {
      // Deselect if clicking elsewhere
      selectPiece(null);
    }
  };

  // Create the chessboard UI
  const renderBoard = () => {
    const board = [];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

    // Render each rank
    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      const rank = ranks[rankIndex];
      const rankSquares = [];

      // Render squares in this rank
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const file = files[fileIndex];
        const square = (file + rank) as ChessSquare;
        const isLightSquare = (rankIndex + fileIndex) % 2 === 1;
        const piece = boardState[square] || null;
        const isSelected = selectedPiece === square;
        const isLegalMove = selectedPiece ? legalMoves.includes(square) : false;

        // Check if this square is part of the last move
        const isLastMove = false; // Implement this with move history

        // Check if king is in check
        const isCheck = false; // Implement this with chess.js

        // Check if the square is being targeted for a spell
        const isTargeted = spellTargets.some(
          (target) => target.square === square
        );

        rankSquares.push(
          <Square
            key={square}
            square={square}
            piece={piece}
            isLight={isLightSquare}
            isSelected={isSelected}
            isLegalMove={isLegalMove}
            isLastMove={isLastMove}
            isCheck={isCheck}
            isTargeted={isTargeted}
            onClick={() => handleSquareClick(square)}
          />
        );
      }

      // Add the rank to the board
      board.push(
        <div
          key={`rank-${rank}`}
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          {rankSquares}
        </div>
      );
    }

    return board;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          border: "2px solid #334155",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {renderBoard()}
      </div>

      {/* Display targeting instructions */}
      {targetingMode && selectedSpellDetails && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            backgroundColor: "rgba(168, 85, 247, 0.2)",
            borderRadius: "4px",
            color: "#fff",
            fontWeight: "500",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          {selectedSpellDetails.targetType === "single" && (
            <p>Select a target for {selectedSpellDetails.name}.</p>
          )}
          {selectedSpellDetails.targetType === "multi" && (
            <p>
              Select {selectedSpellDetails.requiredTargets} targets for{" "}
              {selectedSpellDetails.name}. Selected: {spellTargets.length}/
              {selectedSpellDetails.requiredTargets}
            </p>
          )}
          {selectedSpellDetails.targetType === "from-to" &&
            spellTargets.length === 0 && (
              <p>Select your first piece to swap.</p>
            )}
          {selectedSpellDetails.targetType === "from-to" &&
            spellTargets.length === 1 && (
              <p>
                Now select your second piece to swap with{" "}
                {spellTargets[0].square}.
              </p>
            )}
        </div>
      )}
    </div>
  );
};

export default ChessBoard;
