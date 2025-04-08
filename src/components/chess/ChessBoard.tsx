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
    console.log(
      `Finding valid targets for ${spellId}, spellTargets length: ${spellTargets.length}`
    );

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
        // Only find first targets here - second targets are handled in handleSpellTargeting
        console.log("Finding initial targets for Astral Swap");
        for (const square in boardState) {
          const squareKey = square as ChessSquare;
          const piece = boardState[squareKey];
          if (piece && piece.color === currentPlayer) {
            // Allow any owned piece as first target
            validSquares.push(squareKey);
          }
        }
        break;

      case "phantomStep":
        // Only handle the initial target selection here
        // The second target (destination) is handled directly in handleSpellTargeting
        if (spellTargets.length === 0) {
          console.log("Finding initial piece selection for Phantom Step");
          for (const square in boardState) {
            const squareKey = square as ChessSquare;
            const piece = boardState[squareKey];
            if (piece && piece.color === currentPlayer) {
              validSquares.push(squareKey);
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

        // For Astral Swap, handle the transition from first to second target specially
        if (selectedSpell === "astralSwap" && spellTargets.length === 0) {
          console.log("Selected first target for Astral Swap:", square);

          // Set the first target
          setSpellTargets([square]);

          // Immediately calculate the valid second targets based on the first selection
          const firstPiece = boardState[square];
          if (!firstPiece) return;

          // Calculate valid second targets based on the first selection
          const validSecondTargets: ChessSquare[] = [];
          const firstPieceIsPawn = firstPiece.type === "p";
          const firstPieceOnBackRow =
            (firstPiece.color === "w" && square[1] === "1") ||
            (firstPiece.color === "b" && square[1] === "8");

          console.log("First piece:", {
            type: firstPiece.type,
            backRow: firstPieceOnBackRow,
          });

          // Find valid second targets
          for (const sqKey in boardState) {
            const squareKey = sqKey as ChessSquare;
            const piece = boardState[squareKey];

            if (
              piece &&
              piece.color === currentPlayer &&
              squareKey !== square
            ) {
              // Skip if already selected as first target
              let isValidSecondTarget = true;

              // Conditions that make a second target invalid:

              // 1. If first piece is a pawn, don't allow targeting back row
              if (firstPieceIsPawn) {
                const isBackRow =
                  (firstPiece.color === "w" && squareKey[1] === "1") ||
                  (firstPiece.color === "b" && squareKey[1] === "8");

                if (isBackRow) {
                  console.log(
                    `Excluding ${squareKey}: can't swap pawn to player's back row`
                  );
                  isValidSecondTarget = false;
                }
              }

              // 2. If first piece is on back row, don't allow targeting pawns
              if (firstPieceOnBackRow && piece.type === "p") {
                console.log(
                  `Excluding ${squareKey}: can't swap back row piece with pawn`
                );
                isValidSecondTarget = false;
              }

              // 3. Don't allow pawns on back row as second target
              const isPawnOnBackRow =
                piece.type === "p" &&
                ((piece.color === "w" && squareKey[1] === "1") ||
                  (piece.color === "b" && squareKey[1] === "8"));

              if (isPawnOnBackRow) {
                console.log(
                  `Excluding ${squareKey}: can't swap with pawn already on back row`
                );
                isValidSecondTarget = false;
              }

              if (isValidSecondTarget) {
                validSecondTargets.push(squareKey);
              }
            }
          }

          console.log("Valid second targets:", validSecondTargets);
          setValidTargets(validSecondTargets);
          return;
        }
        // For the second selection of Astral Swap or other multi-target spells
        else {
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
              setValidTargets([]);
            }
          }
        }
        break;

      case "from-to":
        // For spells like Phantom Step that require a source and destination
        if (spellTargets.length === 0) {
          // First click - select source
          console.log(
            `Selected source piece for ${selectedSpell} at ${square}`
          );

          // For from-to type spells, store the first target as a simple square
          setSpellTargets([square]);

          // For Phantom Step, we need to show valid piece moves as destinations
          if (selectedSpell === "phantomStep") {
            const piece = boardState[square];
            if (!piece) return;

            console.log(
              `Finding valid Phantom Step destinations for ${piece.type} at ${square}`
            );

            // Get possible moves for this piece that follow its normal movement pattern
            const possibleMoves = getPhantomStepMoves(
              square,
              piece,
              boardState
            );

            console.log(
              `Found ${possibleMoves.length} valid moves for Phantom Step following piece pattern`
            );
            setValidTargets(possibleMoves);
          } else {
            // For other from-to spells, use the standard valid target finding
            findValidTargetsForSpell(selectedSpell);
          }
        } else if (spellTargets.length === 1) {
          // Second click - select destination
          const fromSquare = spellTargets[0] as ChessSquare;
          const toSquare = square;

          console.log(
            `Casting ${selectedSpell} from ${fromSquare} to ${toSquare}`
          );

          // Create fromToTarget object for the spell
          fromToTarget = {
            from: fromSquare,
            to: toSquare,
          };

          success = castSpell(selectedSpell, fromToTarget);
          if (success) {
            console.log(
              `Successfully cast ${selectedSpell} from ${fromToTarget.from} to ${fromToTarget.to}`
            );
            setSpellTargets([]);
            setTargetingMode(null);
            setValidTargets([]);
          }
        }
        break;
    }
  };

  // Helper function to get valid moves for Phantom Step
  // This finds moves that follow the piece's movement pattern but ignores pieces in the way
  const getPhantomStepMoves = (
    square: ChessSquare,
    piece: { type: string; color: string },
    boardState: Record<string, any>
  ): ChessSquare[] => {
    const validMoves: ChessSquare[] = [];
    const [file, rank] = [square.charAt(0), parseInt(square.charAt(1))];
    const fileIndex = file.charCodeAt(0) - "a".charCodeAt(0);

    // Based on piece type, calculate possible moves
    switch (piece.type) {
      case "p": {
        // Pawns can move 1 or 2 squares forward
        const direction = piece.color === "w" ? 1 : -1;
        const startingRank = piece.color === "w" ? 2 : 7;

        // One square forward
        const oneForward = `${file}${rank + direction}` as ChessSquare;
        if (
          rank + direction >= 1 &&
          rank + direction <= 8 &&
          !boardState[oneForward]
        ) {
          validMoves.push(oneForward);

          // Two squares forward from starting position
          if (rank === startingRank) {
            const twoForward = `${file}${rank + 2 * direction}` as ChessSquare;
            if (!boardState[twoForward]) {
              validMoves.push(twoForward);
            }
          }
        }
        break;
      }

      case "r": {
        // Rooks move horizontally and vertically
        // Horizontal moves (same rank)
        for (let f = 0; f < 8; f++) {
          const newFile = String.fromCharCode("a".charCodeAt(0) + f);
          if (newFile !== file) {
            const newSquare = `${newFile}${rank}` as ChessSquare;
            if (!boardState[newSquare]) {
              validMoves.push(newSquare);
            }
          }
        }

        // Vertical moves (same file)
        for (let r = 1; r <= 8; r++) {
          if (r !== rank) {
            const newSquare = `${file}${r}` as ChessSquare;
            if (!boardState[newSquare]) {
              validMoves.push(newSquare);
            }
          }
        }
        break;
      }

      case "n": {
        // Knights move in L-shape: 2 squares in one direction, 1 square perpendicular
        const knightMoves = [
          { fileOffset: 1, rankOffset: 2 },
          { fileOffset: 2, rankOffset: 1 },
          { fileOffset: 2, rankOffset: -1 },
          { fileOffset: 1, rankOffset: -2 },
          { fileOffset: -1, rankOffset: -2 },
          { fileOffset: -2, rankOffset: -1 },
          { fileOffset: -2, rankOffset: 1 },
          { fileOffset: -1, rankOffset: 2 },
        ];

        for (const move of knightMoves) {
          const newFileIndex = fileIndex + move.fileOffset;
          const newRank = rank + move.rankOffset;

          if (
            newFileIndex >= 0 &&
            newFileIndex < 8 &&
            newRank >= 1 &&
            newRank <= 8
          ) {
            const newFile = String.fromCharCode(
              "a".charCodeAt(0) + newFileIndex
            );
            const newSquare = `${newFile}${newRank}` as ChessSquare;

            if (!boardState[newSquare]) {
              validMoves.push(newSquare);
            }
          }
        }
        break;
      }

      case "b": {
        // Bishops move diagonally
        for (let offset = 1; offset <= 7; offset++) {
          // Check all four diagonal directions
          const directions = [
            { fileOffset: offset, rankOffset: offset },
            { fileOffset: offset, rankOffset: -offset },
            { fileOffset: -offset, rankOffset: offset },
            { fileOffset: -offset, rankOffset: -offset },
          ];

          for (const dir of directions) {
            const newFileIndex = fileIndex + dir.fileOffset;
            const newRank = rank + dir.rankOffset;

            if (
              newFileIndex >= 0 &&
              newFileIndex < 8 &&
              newRank >= 1 &&
              newRank <= 8
            ) {
              const newFile = String.fromCharCode(
                "a".charCodeAt(0) + newFileIndex
              );
              const newSquare = `${newFile}${newRank}` as ChessSquare;

              if (!boardState[newSquare]) {
                validMoves.push(newSquare);
              }
            }
          }
        }
        break;
      }

      case "q": {
        // Queen (combines rook and bishop moves)
        // Horizontal & vertical moves (rook-like)
        for (let f = 0; f < 8; f++) {
          const newFile = String.fromCharCode("a".charCodeAt(0) + f);
          if (newFile !== file) {
            const newSquare = `${newFile}${rank}` as ChessSquare;
            if (!boardState[newSquare]) {
              validMoves.push(newSquare);
            }
          }
        }

        for (let r = 1; r <= 8; r++) {
          if (r !== rank) {
            const newSquare = `${file}${r}` as ChessSquare;
            if (!boardState[newSquare]) {
              validMoves.push(newSquare);
            }
          }
        }

        // Diagonal moves (bishop-like)
        for (let offset = 1; offset <= 7; offset++) {
          const directions = [
            { fileOffset: offset, rankOffset: offset },
            { fileOffset: offset, rankOffset: -offset },
            { fileOffset: -offset, rankOffset: offset },
            { fileOffset: -offset, rankOffset: -offset },
          ];

          for (const dir of directions) {
            const newFileIndex = fileIndex + dir.fileOffset;
            const newRank = rank + dir.rankOffset;

            if (
              newFileIndex >= 0 &&
              newFileIndex < 8 &&
              newRank >= 1 &&
              newRank <= 8
            ) {
              const newFile = String.fromCharCode(
                "a".charCodeAt(0) + newFileIndex
              );
              const newSquare = `${newFile}${newRank}` as ChessSquare;

              if (!boardState[newSquare]) {
                validMoves.push(newSquare);
              }
            }
          }
        }
        break;
      }

      case "k": {
        // Kings move one square in any direction
        const kingMoves = [
          { fileOffset: 0, rankOffset: 1 }, // Up
          { fileOffset: 1, rankOffset: 1 }, // Up-Right
          { fileOffset: 1, rankOffset: 0 }, // Right
          { fileOffset: 1, rankOffset: -1 }, // Down-Right
          { fileOffset: 0, rankOffset: -1 }, // Down
          { fileOffset: -1, rankOffset: -1 }, // Down-Left
          { fileOffset: -1, rankOffset: 0 }, // Left
          { fileOffset: -1, rankOffset: 1 }, // Up-Left
        ];

        for (const move of kingMoves) {
          const newFileIndex = fileIndex + move.fileOffset;
          const newRank = rank + move.rankOffset;

          if (
            newFileIndex >= 0 &&
            newFileIndex < 8 &&
            newRank >= 1 &&
            newRank <= 8
          ) {
            const newFile = String.fromCharCode(
              "a".charCodeAt(0) + newFileIndex
            );
            const newSquare = `${newFile}${newRank}` as ChessSquare;

            if (!boardState[newSquare]) {
              validMoves.push(newSquare);
            }
          }
        }
        break;
      }
    }

    return validMoves;
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
