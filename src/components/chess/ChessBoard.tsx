import React, { useState, useEffect } from "react";
import { Square as ChessSquare } from "chess.js";
import { useChess } from "../../context/ChessContext";
import Square from "./Square";
import { getSpellById } from "../../utils/spells";
import { SpellId, SpellTargetType, Effect } from "../../types/types";
import Popup from "../ui/Popup";

// Interface for from-to type spell targets
interface FromToTarget {
  from: ChessSquare;
  to: ChessSquare;
}

// Type for tracking targeting mode
type TargetingMode = SpellTargetType | null;

const ChessBoard: React.FC = () => {
  const {
    currentPlayer,
    boardState,
    selectedPiece,
    selectedSpell,
    legalMoves,
    selectPiece,
    makeMove,
    castSpell,
  } = useChess();

  // State for spell targeting
  const [spellTargets, setSpellTargets] = useState<
    ChessSquare[] | FromToTarget[]
  >([]);
  const [targetingMode, setTargetingMode] = useState<TargetingMode>(null);
  const [validTargets, setValidTargets] = useState<ChessSquare[]>([]);

  // State for popup
  const [popupMessage, setPopupMessage] = useState<string>("");
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  // Get the position of the king that is in check (if any)
  // Using a state variable to track if the king is in check or not
  const [kingInCheck, setKingInCheck] = useState<ChessSquare | null>(null);

  // Check if king is in check using the chess.js library
  useEffect(() => {
    // We would use GameManager's isKingInCheck method in a real implementation
    // For now, we'll just set it to null (no king in check) to avoid the red highlight
    setKingInCheck(null);
  }, [boardState, currentPlayer]);

  // Get spell targeting mode
  useEffect(() => {
    if (selectedSpell) {
      const spell = getSpellById(selectedSpell);
      if (spell) {
        setTargetingMode(spell.targetType);

        // Clear previous valid targets
        setValidTargets([]);

        // Find valid targets for the selected spell
        findValidTargetsForSpell(selectedSpell);
      }
    } else {
      setTargetingMode(null);
      setSpellTargets([]);
      setValidTargets([]);
    }
  }, [selectedSpell, currentPlayer, boardState]);

  // Find valid targets for a spell
  const findValidTargetsForSpell = (spellId: SpellId) => {
    const spell = getSpellById(spellId);
    if (!spell) return;

    const validSquares: ChessSquare[] = [];

    switch (spellId) {
      case "emberCrown":
        // Find pawns owned by the current player
        for (const square in boardState) {
          const squareKey = square as ChessSquare;
          const piece = boardState[squareKey];
          if (piece && piece.color === currentPlayer && piece.type === "p") {
            validSquares.push(squareKey);
          }
        }
        break;

      case "arcaneAnchor":
      case "arcaneArmor":
        // Find any pieces owned by the current player
        for (const square in boardState) {
          const squareKey = square as ChessSquare;
          const piece = boardState[squareKey];
          if (piece && piece.color === currentPlayer) {
            validSquares.push(squareKey);
          }
        }
        break;

      case "astralSwap":
        // For first target, find any pieces owned by the current player
        if (spellTargets.length === 0) {
          for (const square in boardState) {
            const squareKey = square as ChessSquare;
            const piece = boardState[squareKey];
            if (piece && piece.color === currentPlayer) {
              validSquares.push(squareKey);
            }
          }
        }
        // For second target, find other owned pieces (not the first selected one)
        else if (
          spellTargets.length === 1 &&
          !isFromToTarget(spellTargets[0])
        ) {
          for (const square in boardState) {
            const squareKey = square as ChessSquare;
            const piece = boardState[squareKey];
            if (
              piece &&
              piece.color === currentPlayer &&
              squareKey !== spellTargets[0]
            ) {
              // Check if it's a pawn on the back row (special restriction)
              const isPawnOnBackRow =
                piece.type === "p" &&
                ((piece.color === "w" && squareKey[1] === "1") ||
                  (piece.color === "b" && squareKey[1] === "8"));

              // Don't allow pawns on back row for Astral Swap
              if (!isPawnOnBackRow) {
                validSquares.push(squareKey);
              }
            }
          }
        }
        break;

      case "phantomStep":
        // For the first target (source), find owned pieces that can move
        if (spellTargets.length === 0) {
          for (const square in boardState) {
            const squareKey = square as ChessSquare;
            const piece = boardState[squareKey];
            if (piece && piece.color === currentPlayer) {
              validSquares.push(squareKey);
            }
          }
        }
        // For the second target (destination), find empty squares
        else if (spellTargets.length === 1 && isFromToTarget(spellTargets[0])) {
          // Find all empty squares for the destination
          for (let rank = 1; rank <= 8; rank++) {
            for (const file of "abcdefgh") {
              const square = `${file}${rank}` as ChessSquare;
              // Check if the square is empty
              if (!boardState[square]) {
                validSquares.push(square);
              }
            }
          }
        }
        break;

      // Add handling for other spells
      case "frostShield":
      case "shadowStrike":
        // Default to finding all valid targets based on spell requirements
        for (const square in boardState) {
          const squareKey = square as ChessSquare;
          const piece = boardState[squareKey];

          // For spells targeting friendly pieces
          if (spellId === "frostShield") {
            if (piece && piece.color === currentPlayer) {
              validSquares.push(squareKey);
            }
          }
          // For spells targeting enemy pieces
          else if (spellId === "shadowStrike") {
            if (piece && piece.color !== currentPlayer) {
              validSquares.push(squareKey);
            }
          }
        }
        break;

      default:
        // Default behavior for other spells - allow targeting any square with pieces
        for (const square in boardState) {
          const squareKey = square as ChessSquare;
          if (boardState[squareKey]) {
            validSquares.push(squareKey);
          }
        }
        break;
    }

    setValidTargets(validSquares);
  };

  // Helper function to check if a target is a FromToTarget
  const isFromToTarget = (target: unknown): target is FromToTarget => {
    return (
      typeof target === "object" &&
      target !== null &&
      "from" in target &&
      "to" in target
    );
  };

  // Handle square click
  const handleSquareClick = (square: ChessSquare) => {
    // If a spell is selected, handle spell targeting
    if (selectedSpell) {
      handleSpellTargeting(square);
      return;
    }

    // If a piece is already selected, try to move it
    if (selectedPiece) {
      // Check if the clicked square is a legal move
      if (legalMoves.includes(square)) {
        // Check if the target square has a piece with ANY protection effect
        const targetPiece = boardState[square];

        if (targetPiece) {
          console.log(
            `Checking piece at ${square} for protection effects:`,
            targetPiece
          );

          // Log piece effects for debugging
          if (targetPiece.effects && targetPiece.effects.length > 0) {
            console.log(
              `Piece has ${targetPiece.effects.length} effects:`,
              targetPiece.effects.map((e: Effect) => ({
                source: e.source,
                duration: e.duration,
                modifiers: e.modifiers,
              }))
            );
          }

          // Check for ANY protection effect (arcaneArmor, arcaneAnchor, etc.)
          const hasProtection =
            targetPiece.effects &&
            targetPiece.effects.some(
              (e: Effect) => e.modifiers && e.modifiers.preventCapture === true
            );

          if (hasProtection) {
            // Show a popup message that the piece cannot be captured
            setPopupMessage(
              "This piece cannot be captured due to a protection effect!"
            );
            setIsPopupOpen(true);
            console.log(
              `Cannot capture piece at ${square} due to protection effect`
            );
            return;
          }
        }

        // If we get here, the move is valid - make the move
        makeMove(selectedPiece, square);
      } else {
        // If it's not a legal move, either select a new piece or deselect
        const piece = boardState[square as keyof typeof boardState];
        if (piece && piece.color === currentPlayer) {
          selectPiece(square);
        } else {
          selectPiece(null);
        }
      }
    } else {
      // If no piece is selected, try to select one
      const piece = boardState[square as keyof typeof boardState];
      if (piece && piece.color === currentPlayer) {
        // Check if the piece has the Arcane Anchor effect (preventMovement)
        const hasPreventMovementEffect = piece.effects?.some(
          (effect: Effect) => effect.modifiers?.preventMovement === true
        );

        if (hasPreventMovementEffect) {
          // Show a popup message that the piece cannot move
          setPopupMessage(
            "This piece cannot move due to the Arcane Anchor effect!"
          );
          setIsPopupOpen(true);
          console.log(
            `Cannot select piece at ${square} with Arcane Anchor effect for movement`
          );
          return;
        }

        selectPiece(square);
      }
    }
  };

  // Handle spell targeting
  const handleSpellTargeting = (square: ChessSquare) => {
    // If not in targeting mode, do nothing
    if (!targetingMode || !selectedSpell) return;

    const spell = getSpellById(selectedSpell);
    if (!spell) return;

    // Check if this square is a valid target
    const isValidTarget = validTargets.includes(square);
    if (!isValidTarget) {
      console.log(`${square} is not a valid target for ${selectedSpell}`);
      return;
    }

    let success: boolean;
    let updatedTargets: ChessSquare[];
    let fromToTarget: FromToTarget;

    // Logic based on the spell's targeting mode
    switch (targetingMode) {
      case "single":
        // For single-target spells like Ember Crown or Arcane Anchor
        success = castSpell(selectedSpell, square);
        if (success) {
          console.log(`Successfully cast ${selectedSpell} on ${square}`);
          setSpellTargets([]);
          setTargetingMode(null);
        }
        break;

      case "multi":
        // For multi-target spells
        if (isFromToTarget(spellTargets[0])) {
          // Reset targets if we have a FromToTarget (wrong state)
          setSpellTargets([]);
        }

        // Cast as ChessSquare[] to handle the multi-target case correctly
        updatedTargets = [...(spellTargets as ChessSquare[]), square];
        setSpellTargets(updatedTargets);

        // If we have the required number of targets, cast the spell
        if (
          spell.requiredTargets &&
          updatedTargets.length === spell.requiredTargets
        ) {
          success = castSpell(selectedSpell, updatedTargets);
          if (success) {
            console.log(
              `Successfully cast ${selectedSpell} on multiple targets`
            );
            setSpellTargets([]);
            setTargetingMode(null);
          }
        }
        break;

      case "from-to":
        // For spells like Phantom Step that require a source and destination
        if (spellTargets.length === 0) {
          // First click - select source
          setSpellTargets([{ from: square, to: "" as ChessSquare }]);
          // Find valid destinations for the second click
          findValidTargetsForSpell(selectedSpell);
        } else if (
          spellTargets.length === 1 &&
          isFromToTarget(spellTargets[0])
        ) {
          // Second click - select destination
          fromToTarget = {
            from: (spellTargets[0] as FromToTarget).from,
            to: square,
          };

          success = castSpell(selectedSpell, fromToTarget);
          if (success) {
            console.log(
              `Successfully cast ${selectedSpell} from ${fromToTarget.from} to ${fromToTarget.to}`
            );
            setSpellTargets([]);
            setTargetingMode(null);
          }
        }
        break;
    }
  };

  // Render the chessboard
  const renderBoard = () => {
    const board = [];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

    for (const rank of ranks) {
      const row = [];
      for (const file of files) {
        const square = `${file}${rank}` as ChessSquare;
        const piece = boardState[square];
        const isLight = (file.charCodeAt(0) - 97 + rank) % 2 === 0;
        const isSelected = selectedPiece === square;
        const isLegalMove = selectedPiece ? legalMoves.includes(square) : false;
        const isLastMove = false; // TODO: Implement last move tracking
        const isCheck = square === kingInCheck;

        // Check if this square is a target for a spell
        const isTargeted = spellTargets.some((target) => {
          if (isFromToTarget(target)) {
            return target.from === square || target.to === square;
          }
          return target === square;
        });

        // Check if this square is a valid target for the current spell
        const isValidSpellTarget = validTargets.includes(square);

        row.push(
          <Square
            key={square}
            square={square}
            piece={piece}
            isLight={isLight}
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
      board.push(
        <div key={`rank-${rank}`} style={{ display: "flex" }}>
          {row}
        </div>
      );
    }

    return board;
  };

  // Display targeting instructions based on selected spell
  const renderTargetingInstructions = () => {
    if (!selectedSpell || !targetingMode) return null;

    const spell = getSpellById(selectedSpell);
    if (!spell) return null;

    let instruction = "";
    switch (targetingMode) {
      case "single":
        instruction = `Select a target for ${spell.name}`;
        break;
      case "multi": {
        const remaining = (spell.requiredTargets || 0) - spellTargets.length;
        instruction = `Select ${remaining} more target${
          remaining !== 1 ? "s" : ""
        } for ${spell.name}`;
        break;
      }
      case "from-to":
        instruction =
          spellTargets.length === 0
            ? `Select a piece to move with ${spell.name}`
            : `Select a destination for ${spell.name}`;
        break;
    }

    return (
      <div
        className="targeting-instructions"
        style={{
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          padding: "8px",
          borderRadius: "4px",
          marginBottom: "10px",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        {instruction}
      </div>
    );
  };

  return (
    <div className="chess-board-container">
      {renderTargetingInstructions()}
      <div className="chess-board">{renderBoard()}</div>

      {/* Add the Popup component */}
      <Popup
        message={popupMessage}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </div>
  );
};

export default ChessBoard;
