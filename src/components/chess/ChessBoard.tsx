import React, { useState, useEffect } from "react";
import Square from "./Square";
import { useChess } from "../../context/ChessContext";
import { Square as ChessSquare } from "chess.js";
import { getSpellById } from "../../utils/spells";
import { SpellTarget } from "../../types/types";

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
  const [validTargets, setValidTargets] = useState<ChessSquare[]>([]);

  // Get the selected spell's details
  const selectedSpellDetails = selectedSpell
    ? getSpellById(selectedSpell)
    : null;

  // Enter targeting mode when a spell is selected
  useEffect(() => {
    if (selectedSpell) {
      setTargetingMode(true);
      setSpellTargets([]);

      // If it's Astral Swap, find all owned pieces as potential first targets
      if (selectedSpell === "astralSwap") {
        const ownedPieces: ChessSquare[] = [];
        for (const square in boardState) {
          const squareKey = square as ChessSquare;
          if (
            boardState[squareKey] &&
            boardState[squareKey].color === currentPlayer
          ) {
            ownedPieces.push(squareKey);
          }
        }
        setValidTargets(ownedPieces);
      }
      // If it's Phantom Step, find all owned pieces as potential sources
      else if (selectedSpell === "phantomStep") {
        const ownedPieces: ChessSquare[] = [];
        for (const square in boardState) {
          const squareKey = square as ChessSquare;
          if (
            boardState[squareKey] &&
            boardState[squareKey].color === currentPlayer
          ) {
            ownedPieces.push(squareKey);
          }
        }
        setValidTargets(ownedPieces);
      } else {
        setValidTargets([]);
      }
    } else {
      setTargetingMode(false);
      setSpellTargets([]);
      setValidTargets([]);
    }
  }, [selectedSpell, currentPlayer, boardState]);

  // Update valid targets when the first piece is selected for spells requiring multiple targets
  useEffect(() => {
    if (selectedSpell && spellTargets.length === 1) {
      const firstSquare = spellTargets[0].square;

      // For Astral Swap, find valid second pieces
      if (selectedSpell === "astralSwap") {
        const firstPiece = boardState[firstSquare];

        // Find all owned pieces as potential second targets, excluding the first piece
        const ownedPieces: ChessSquare[] = [];
        for (const square in boardState) {
          const squareKey = square as ChessSquare;
          if (
            squareKey !== firstSquare &&
            boardState[squareKey] &&
            boardState[squareKey].color === currentPlayer &&
            // For pawns, prevent swapping to the opposite end (causing promotion issues)
            !(
              firstPiece.type === "p" &&
              (squareKey.endsWith("1") || squareKey.endsWith("8"))
            ) &&
            !(
              boardState[squareKey].type === "p" &&
              (firstSquare.endsWith("1") || firstSquare.endsWith("8"))
            )
          ) {
            ownedPieces.push(squareKey);
          }
        }
        setValidTargets(ownedPieces);
      }
      // For Phantom Step, find valid destinations (empty squares)
      else if (selectedSpell === "phantomStep") {
        // Find all empty squares as potential destinations
        const emptySquares: ChessSquare[] = [];
        const files = "abcdefgh";
        const ranks = "12345678";

        // Check all possible squares
        for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
          for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
            const squareKey = (files[fileIndex] +
              ranks[rankIndex]) as ChessSquare;

            // If it's empty, add it as a valid target
            if (!boardState[squareKey]) {
              emptySquares.push(squareKey);
            }
          }
        }

        setValidTargets(emptySquares);
      } else {
        setValidTargets([]);
      }
    }
  }, [spellTargets, selectedSpell, currentPlayer, boardState]);

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

    // For Astral Swap (special case for multi-target spell)
    if (selectedSpell === "astralSwap") {
      // First selection - only allow selecting valid first targets
      if (spellTargets.length === 0 && validTargets.includes(square)) {
        setSpellTargets([{ square, type: "source" }]);
      }
      // Second selection - only allow selecting valid second targets
      else if (spellTargets.length === 1 && validTargets.includes(square)) {
        const sourceSquare = spellTargets[0].square;
        // Cast the spell with both squares
        castSpell(selectedSpell, [sourceSquare, square]);
        setTargetingMode(false);
        setSpellTargets([]);
        setValidTargets([]);
      }
      return;
    }

    // For Phantom Step (using from-to targeting)
    if (selectedSpell === "phantomStep") {
      if (spellTargets.length === 0) {
        // First click - only allow selecting valid source pieces
        if (validTargets.includes(square)) {
          setSpellTargets([{ square, type: "source" }]);
        }
      } else if (spellTargets.length === 1) {
        // Second click - only allow selecting valid destination squares
        if (validTargets.includes(square)) {
          const sourceSquare = spellTargets[0].square;
          // Cast the spell with from-to format
          castSpell(selectedSpell, { from: sourceSquare, to: square });
          setTargetingMode(false);
          setSpellTargets([]);
          setValidTargets([]);
        }
      }
      return;
    }

    // Other spell types
    switch (targetType) {
      case "single": {
        // Single target spells like Ember Crown
        const piece = boardState[square];
        const isValidTarget =
          piece &&
          ((selectedSpellDetails.mustTargetOwnPiece &&
            piece.color === currentPlayer) ||
            (selectedSpellDetails.mustTargetOpponentPiece &&
              piece.color !== currentPlayer) ||
            (!selectedSpellDetails.mustTargetOwnPiece &&
              !selectedSpellDetails.mustTargetOpponentPiece));

        if (isValidTarget) {
          setSpellTargets([{ square, type: "target" }]);
          // Attempt to cast the spell
          if (selectedSpell) {
            castSpell(selectedSpell, square);
            setTargetingMode(false);
            setSpellTargets([]);
            setValidTargets([]);
          }
        }
        break;
      }

      case "multi": {
        // Multi-target spells
        const maxTargets = selectedSpellDetails.requiredTargets || 1;
        const piece = boardState[square];

        const isValidTarget =
          piece &&
          ((selectedSpellDetails.mustTargetOwnPiece &&
            piece.color === currentPlayer) ||
            (selectedSpellDetails.mustTargetOpponentPiece &&
              piece.color !== currentPlayer) ||
            (!selectedSpellDetails.mustTargetOwnPiece &&
              !selectedSpellDetails.mustTargetOpponentPiece));

        if (!isValidTarget) return;

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
            setValidTargets([]);
          }
        }
        break;
      }

      case "from-to": {
        if (spellTargets.length === 0) {
          // First click - validate source
          const piece = boardState[square];
          if (piece && piece.color === currentPlayer) {
            setSpellTargets([{ square, type: "source" }]);
          }
        } else {
          // Second click - validate destination
          const sourceSquare = spellTargets[0].square;

          // Check if destination is valid (for now, just ensure it's not the same square)
          if (square !== sourceSquare) {
            // Cast the spell with from-to format
            castSpell(selectedSpell, { from: sourceSquare, to: square });
            setTargetingMode(false);
            setSpellTargets([]);
            setValidTargets([]);
          }
        }
        break;
      }

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
        const isLastMove = false;
        const isCheck = false;

        // Check if the square is being targeted for a spell
        const isTargeted = spellTargets.some(
          (target) => target.square === square
        );

        // Check if this is a valid target for the current targeting phase
        const isValidSpellTarget = validTargets.includes(square);

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
            isValidTarget={isValidSpellTarget}
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
          {selectedSpell === "astralSwap" && spellTargets.length === 0 && (
            <p>Select the first piece to swap (highlighted in green).</p>
          )}
          {selectedSpell === "astralSwap" && spellTargets.length === 1 && (
            <p>
              Select the second piece to swap with {spellTargets[0].square}{" "}
              (highlighted in green).
            </p>
          )}
          {selectedSpell === "phantomStep" && spellTargets.length === 0 && (
            <p>
              Select a piece to move with Phantom Step (highlighted in green).
            </p>
          )}
          {selectedSpell === "phantomStep" && spellTargets.length === 1 && (
            <p>
              Select a destination square for the piece at{" "}
              {spellTargets[0].square} (highlighted in green).
            </p>
          )}
          {selectedSpellDetails.targetType === "multi" &&
            selectedSpell !== "astralSwap" && (
              <p>
                Select {selectedSpellDetails.requiredTargets} targets for{" "}
                {selectedSpellDetails.name}. Selected: {spellTargets.length}/
                {selectedSpellDetails.requiredTargets}
              </p>
            )}
          {selectedSpellDetails.targetType === "from-to" &&
            selectedSpell !== "phantomStep" &&
            spellTargets.length === 0 && <p>Select your piece to move.</p>}
          {selectedSpellDetails.targetType === "from-to" &&
            selectedSpell !== "phantomStep" &&
            spellTargets.length === 1 && (
              <p>Select destination for piece at {spellTargets[0].square}</p>
            )}
        </div>
      )}
    </div>
  );
};

export default ChessBoard;
