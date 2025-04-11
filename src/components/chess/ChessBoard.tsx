import React, { useState, useEffect } from "react";
import { Square } from "chess.js";
import { useChess } from "../../context/ChessContext";
import SquareComponent from "./Square";
import { getSpellById } from "../../utils/spells";
import { SpellTargetType, Effect } from "../../types/types";
import PieceTypeSelector from "./PieceTypeSelector";
import { useSound } from "../../context/SoundContext";

// Define a type for chess piece that matches the board state structure
interface ChessPiece {
  type: string;
  color: string;
  effects?: Effect[];
  hasMoved?: boolean;
  prevPositions?: string[]; // Historical positions for Chrono Recall
}

// Interface for from-to type spell targets
interface FromToTarget {
  from: Square;
  to: Square;
}

// Type for tracking targeting mode
type TargetingMode = SpellTargetType | null;

interface ChessBoardProps {
  playerPerspective?: string; // Optional prop for determining board orientation
}

const ChessBoard: React.FC<ChessBoardProps> = ({ playerPerspective }) => {
  const {
    boardState,
    currentPlayer,
    lastMove,
    selectedPiece,
    selectedSpell,
    legalMoves,
    selectPiece,
    makeMove,
    castSpell,
  } = useChess();

  // State for spell targeting
  const [spellTargets, setSpellTargets] = useState<Square[]>([]);
  const [targetingMode, setTargetingMode] = useState<TargetingMode>(null);
  const [validTargets, setValidTargets] = useState<Square[]>([]);

  // Replace popup with a message indicator
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [showStatus, setShowStatus] = useState<boolean>(false);

  // Get the position of the king that is in check (if any)
  // Using a state variable to track if the king is in check or not
  const [kingInCheck, setKingInCheck] = useState<Square | null>(null);

  // Add state for Dark Conversion piece selection
  const [showPieceConversionDialog, setShowPieceConversionDialog] =
    useState(false);
  const [darkConversionTargets, setDarkConversionTargets] = useState<Square[]>(
    []
  );

  // Add sound effects
  const { playSelectSound, playMoveSound, playSpellSound } = useSound();

  // Show a status message with automatic timeout
  const showStatusMessage = (message: string, duration = 3000) => {
    setStatusMessage(message);
    setShowStatus(true);

    // Auto-hide after duration
    setTimeout(() => {
      setShowStatus(false);
    }, duration);
  };

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

  // Get valid targets for the selected spell
  const findValidTargetsForSpell = (spellId: string): Square[] => {
    const spell = getSpellById(spellId);
    if (!spell) return [];

    const validSquares: Square[] = [];

    // For spells that don't require targets, don't highlight any squares
    if (spell.targetType === "none") {
      console.log(`Spell ${spellId} doesn't require targets`);
      return validSquares;
    }

    // Special case for each spell
    switch (spellId) {
      case "veilOfShadows": {
        console.log("Veil of Shadows doesn't need specific targets");
        setValidTargets([]);
        return [];
      }

      case "darkConversion": {
        console.log("Finding pawns for Dark Conversion");

        // For Dark Conversion, we're only targeting our own pawns
        for (const square in boardState) {
          const squareKey = square as Square;
          const piece = boardState[squareKey];

          // Check if the square has a pawn owned by the current player
          if (piece && piece.color === currentPlayer && piece.type === "p") {
            // Allow only pawns owned by the current player
            validSquares.push(squareKey);
          }
        }

        console.log(`Found ${validSquares.length} pawns as valid targets`);
        setValidTargets(validSquares);
        return validSquares;
      }

      case "cursedGlyph": {
        console.log(`${spellId} must target empty squares`);
        // Iterate through all squares on the board
        const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
        const ranks = [1, 2, 3, 4, 5, 6, 7, 8];

        for (const file of files) {
          for (const rank of ranks) {
            const squareKey = `${file}${rank}` as Square;
            // Check if the square is empty (no piece in boardState)
            if (!boardState[squareKey]) {
              // Only empty squares are valid
              validSquares.push(squareKey);
            }
          }
        }

        console.log(
          `Found ${validSquares.length} empty squares as valid targets`
        );
        setValidTargets(validSquares);
        return validSquares;
      }

      case "kingsGambit": {
        // Find the king owned by the current player
        for (const square in boardState) {
          const squareKey = square as Square;
          const piece = boardState[squareKey];
          if (piece && piece.color === currentPlayer && piece.type === "k") {
            validSquares.push(squareKey);
            break; // Only need one king
          }
        }
        console.log(`Found king at ${validSquares[0]} for King's Gambit spell`);
        break;
      }

      case "emberCrown": {
        // Find pawns owned by the current player
        for (const square in boardState) {
          const squareKey = square as Square;
          const piece = boardState[squareKey];
          if (piece && piece.color === currentPlayer && piece.type === "p") {
            validSquares.push(squareKey);
          }
        }
        break;
      }

      // Add blocks for other cases to follow the pattern
      case "mistformKnight": {
        // Find knights owned by the current player
        if (spellTargets.length === 0) {
          console.log("Finding knights for Mistform Knight spell");
          for (const square in boardState) {
            const squareKey = square as Square;
            const piece = boardState[squareKey];
            if (piece && piece.color === currentPlayer && piece.type === "n") {
              validSquares.push(squareKey);
            }
          }
        }
        break;
      }

      case "arcaneAnchor":
      case "arcaneArmor": {
        // Find any pieces owned by the current player
        for (const square in boardState) {
          const squareKey = square as Square;
          const piece = boardState[squareKey];
          if (piece && piece.color === currentPlayer) {
            validSquares.push(squareKey);
          }
        }
        break;
      }

      case "astralSwap": {
        // Only find first targets here - second targets are handled in handleSpellTargeting
        console.log("Finding initial targets for Astral Swap");
        for (const square in boardState) {
          const squareKey = square as Square;
          const piece = boardState[squareKey];
          if (piece && piece.color === currentPlayer) {
            // Allow any owned piece as first target
            validSquares.push(squareKey);
          }
        }
        break;
      }

      case "phantomStep": {
        // Only handle the initial target selection here
        // The second target (destination) is handled directly in handleSpellTargeting
        if (spellTargets.length === 0) {
          console.log("Finding initial piece selection for Phantom Step");
          for (const square in boardState) {
            const squareKey = square as Square;
            const piece = boardState[squareKey];
            if (piece && piece.color === currentPlayer) {
              validSquares.push(squareKey);
            }
          }
        }
        break;
      }

      // Add handling for other spells
      case "frostShield":
      case "shadowStrike": {
        // Default to finding all valid targets based on spell requirements
        for (const square in boardState) {
          const squareKey = square as Square;
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
      }

      case "chronoRecall": {
        console.log("Finding valid targets for Chrono Recall");
        console.log("Current player:", currentPlayer);
        console.log("BoardState type:", typeof boardState);

        // Log all pieces owned by the current player for debugging
        console.log("All pieces owned by current player:");

        // Find pieces owned by the current player that have move history
        for (const square in boardState) {
          const squareKey = square as Square;
          const piece = boardState[squareKey];

          // Must have a piece owned by the current player
          if (piece && piece.color === currentPlayer) {
            // Log the piece details
            console.log(`Piece at ${squareKey}:`, {
              type: piece.type,
              color: piece.color,
              effects: piece.effects?.length || 0,
              prevPositions: piece.prevPositions || "No history",
              hasMoved: piece.hasMoved,
              fullPiece: piece,
            });

            // Log the piece's position history
            console.log(
              `Piece at ${squareKey} position history:`,
              piece.prevPositions || "No history"
            );

            // Check if the piece has move history (prevPositions is used in GameManager)
            if (piece.prevPositions && piece.prevPositions.length >= 2) {
              console.log(
                `Piece at ${squareKey} has sufficient move history for Chrono Recall: ${JSON.stringify(
                  piece.prevPositions
                )}`
              );
              validSquares.push(squareKey);
            }
          }
        }

        console.log(
          `Found ${validSquares.length} valid targets with sufficient history for Chrono Recall`
        );
        break;
      }

      default: {
        // Default behavior for other spells - allow targeting any square with pieces
        for (const square in boardState) {
          const squareKey = square as Square;
          if (boardState[squareKey]) {
            validSquares.push(squareKey);
          }
        }
        break;
      }
    }

    setValidTargets(validSquares);
    return validSquares;
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
  const handleSquareClick = (square: Square) => {
    // If we need to show a piece conversion dialog, don't do anything else
    if (showPieceConversionDialog) {
      return;
    }

    // If we're in targeting mode, handle spell targeting
    if (targetingMode) {
      handleSpellTargeting(square);
      playSelectSound(); // Play selection sound for targeting
      return;
    }

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
            // Show a message that the piece cannot be captured
            showStatusMessage(
              "This piece cannot be captured due to a protection effect!"
            );
            console.log(
              `Cannot capture piece at ${square} due to protection effect`
            );
            return;
          }
        }

        // Check if we're moving a king and need to track for King's Gambit
        const movingPiece = boardState[selectedPiece];
        const isKing = movingPiece && movingPiece.type === "k";
        const hasKingsGambitEffect =
          isKing &&
          movingPiece.effects?.some(
            (effect: Effect) =>
              effect.source === "kingsGambit" &&
              effect.modifiers?.allowSecondKingMove === true
          );

        // Track if this is the first king move with Kings Gambit
        const isFirstKingMove = isKing && hasKingsGambitEffect;

        console.log(
          `Moving piece: ${movingPiece?.type}, isKing: ${isKing}, hasKingsGambitEffect: ${hasKingsGambitEffect}`
        );

        // If we get here, the move is valid - make the move
        const moveSuccess = makeMove(selectedPiece, square);

        // If the move was successful and this was a king with King's Gambit effect
        if (moveSuccess && isFirstKingMove) {
          console.log(
            "First king move with King's Gambit. King can move again this turn."
          );

          // After the king moves, we need to select it again to allow a second move
          // Get the new position of the king (which is the destination square)
          setTimeout(() => {
            // Select the king at its new position
            selectPiece(square);
            showStatusMessage(
              "King's Gambit active: You can move your king once more this turn.",
              5000
            );
          }, 100);
        }

        // Play move sound (the actual move sound will be triggered by game log updates,
        // but this ensures the user gets immediate feedback)
        setTimeout(() => playMoveSound(), 50);
      } else {
        // If it's not a legal move, either select a new piece or deselect
        const piece = boardState[square as keyof typeof boardState];
        if (piece && piece.color === currentPlayer) {
          playSelectSound(); // Play selection sound when selecting a piece
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
          // Show a message that the piece cannot move
          showStatusMessage(
            "This piece cannot move due to the Arcane Anchor effect!"
          );
          console.log(
            `Cannot select piece at ${square} with Arcane Anchor effect for movement`
          );
          return;
        }

        playSelectSound(); // Play selection sound when selecting a piece
        selectPiece(square);
      }
    }
  };

  // Handle piece type selection for Dark Conversion
  const handlePieceTypeSelect = (pieceType: "n" | "b") => {
    if (
      selectedSpell === "darkConversion" &&
      darkConversionTargets.length === 3
    ) {
      const targetMessage = `Selected ${
        pieceType === "n" ? "Knight" : "Bishop"
      } for Dark Conversion`;
      console.log(targetMessage);

      // Need to select a summoning location from the three pawn squares
      const pawnSquares = [...darkConversionTargets];
      const summonLocation = pawnSquares[0]; // Using first pawn square as summon location

      console.log(`Using ${summonLocation} as summoning location`);

      // Pass the targets with the piece type for the Dark Conversion spell
      const success = castSpell(selectedSpell, pawnSquares, pieceType);

      if (success) {
        playSpellSound(selectedSpell);
        setDarkConversionTargets([]);
        setShowPieceConversionDialog(false);
        resetUI();
      }
    }
  };

  // Handle cancellation of piece type selection
  const handlePieceTypeSelectorCancel = () => {
    setShowPieceConversionDialog(false);

    // Reset Dark Conversion targets
    setDarkConversionTargets([]);

    // Restore all valid pawn targets by re-running the target finder
    findValidTargetsForSpell("darkConversion");

    console.log("Dark Conversion selection canceled - targets reset");
  };

  // Handle spell targeting
  const handleSpellTargeting = (square: Square) => {
    if (!selectedSpell) return;

    const spell = getSpellById(selectedSpell);
    if (!spell) return;

    // Log the targeting action for debugging
    console.log(`Targeting with spell ${selectedSpell}, clicked ${square}`);

    // For spells that don't need targets
    if (spell.targetType === "none") {
      const success = castSpell(selectedSpell, []);
      if (success) {
        console.log(`Successfully cast ${selectedSpell}`);
        setSpellTargets([]);
        setTargetingMode(null);
        setValidTargets([]);
        showStatusMessage(`${spell.name} cast successfully!`, 5000);
        playSpellSound(selectedSpell);
      }
      return;
    }

    switch (spell.targetType) {
      case "single":
        if (selectedSpell === "cursedGlyph") {
          console.log(`Casting Cursed Glyph on ${square}`);

          // Check if the target is valid (empty square)
          if (!boardState[square]) {
            // Cast the spell on the empty square
            const success = castSpell(selectedSpell, square);

            if (success) {
              console.log(`Successfully cast Cursed Glyph on ${square}`);
              // The castSpell method in ChessContext will update the UI with the new glyph
              playSpellSound(selectedSpell);
            } else {
              console.log(`Failed to cast Cursed Glyph on ${square}`);
              showStatusMessage(
                "Failed to cast Cursed Glyph. Try another location."
              );
            }
            return;
          } else {
            showStatusMessage(
              "Cursed Glyph must be placed on an empty square."
            );
            return;
          }
        }
        // For single-target spells like Ember Crown or Kings Gambit
        else {
          const success = castSpell(selectedSpell, square);
          if (success) {
            console.log(`Successfully cast ${selectedSpell} on ${square}`);
            setSpellTargets([]);
            setTargetingMode(null);
            playSpellSound(selectedSpell);

            // Show success message for Kings Gambit
            if (selectedSpell === "kingsGambit") {
              showStatusMessage(
                "King's Gambit cast! You can now move your king twice in one turn.",
                5000
              );
            }
          }
        }
        break;

      // For from-to type spells
      case "from-to":
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
          } else if (selectedSpell === "mistformKnight") {
            const piece = boardState[square];
            if (!piece || piece.type !== "n") return;

            console.log(
              `Finding valid Mistform Knight destinations for knight at ${square}`
            );

            // Get knight moves
            const knightMoves = getMistformKnightMoves(square, boardState);

            console.log(
              `Found ${knightMoves.length} valid moves for Mistform Knight`
            );
            setValidTargets(knightMoves);
          } else {
            // For other from-to spells, use the standard valid target finding
            findValidTargetsForSpell(selectedSpell);
          }
        } else if (spellTargets.length === 1) {
          // Second click - select destination
          const fromSquare = spellTargets[0] as Square;
          const toSquare = square;

          console.log(
            `Casting ${selectedSpell} from ${fromSquare} to ${toSquare}`
          );

          // Create fromToTarget object for the spell
          const fromToTarget: FromToTarget = {
            from: fromSquare,
            to: toSquare,
          };

          const success = castSpell(selectedSpell, fromToTarget);
          if (success) {
            console.log(
              `Successfully cast ${selectedSpell} from ${fromToTarget.from} to ${fromToTarget.to}`
            );
            setSpellTargets([]);
            setTargetingMode(null);
            setValidTargets([]);
            playSpellSound(selectedSpell);
          }
        }
        break;

      // Special case for Dark Conversion
      case "multi":
        if (selectedSpell === "darkConversion") {
          console.log(
            `Processing Dark Conversion targeting, clicked ${square}`
          );

          // Check if this square is a valid target
          const isValidTarget = validTargets.includes(square);
          if (!isValidTarget) {
            console.log(`${square} is not a valid target for Dark Conversion`);
            return;
          }

          // Add the pawn to the targets
          const updatedTargets = [...darkConversionTargets, square];
          setDarkConversionTargets(updatedTargets);
          console.log(
            `Added pawn at ${square} to Dark Conversion targets (${updatedTargets.length}/3)`
          );

          // Update valid targets to exclude the one we just selected
          const newValidTargets = validTargets.filter((sq) => sq !== square);
          setValidTargets(newValidTargets);

          // If we have all three pawns selected, open the piece selector immediately
          if (updatedTargets.length === 3) {
            console.log("All three pawns selected, opening piece selector");
            setShowPieceConversionDialog(true);
          }

          return;
        }
        // For the second selection of Astral Swap or other multi-target spells
        else {
          // First, check if this square is a valid target
          const isValidTarget = validTargets.includes(square);
          if (!isValidTarget) {
            console.log(`${square} is not a valid target for ${selectedSpell}`);
            return;
          }

          // Cast as Square[] to handle the multi-target case correctly
          const updatedTargets = [...(spellTargets as Square[]), square];
          setSpellTargets(updatedTargets);

          // If this is the first target for Astral Swap, update valid targets for second selection
          if (selectedSpell === "astralSwap" && updatedTargets.length === 1) {
            console.log(`First piece selected for Astral Swap: ${square}`);

            // Get the selected piece
            const selectedPiece = boardState[square];

            // Find valid targets for the second selection
            const secondSelectionTargets: Square[] = [];

            for (const squareKey in boardState) {
              const targetSquare = squareKey as Square;
              const targetPiece = boardState[targetSquare];

              // Skip the square we already selected
              if (targetSquare === square) continue;

              // Make sure it's a valid piece owned by current player
              if (targetPiece && targetPiece.color === currentPlayer) {
                // If the first selection is a pawn, don't allow swapping with pieces on rank 1 or 8
                if (selectedPiece.type === "p") {
                  const rank = parseInt(targetSquare.charAt(1));
                  if (rank !== 1 && rank !== 8) {
                    secondSelectionTargets.push(targetSquare);
                  }
                }
                // If the first selection is on rank 1 or 8, don't allow swapping with pawns
                else {
                  const selectedRank = parseInt(square.charAt(1));
                  if (selectedRank === 1 || selectedRank === 8) {
                    if (targetPiece.type !== "p") {
                      secondSelectionTargets.push(targetSquare);
                    }
                  } else {
                    secondSelectionTargets.push(targetSquare);
                  }
                }
              }
            }

            console.log(
              `Found ${secondSelectionTargets.length} valid targets for second Astral Swap selection`
            );
            setValidTargets(secondSelectionTargets);
            return;
          }

          // If we have the required number of targets, cast the spell
          if (
            spell.requiredTargets &&
            updatedTargets.length === spell.requiredTargets
          ) {
            const success = castSpell(selectedSpell, updatedTargets);
            if (success) {
              console.log(
                `Successfully cast ${selectedSpell} on multiple targets`
              );
              setSpellTargets([]);
              setTargetingMode(null);
              setValidTargets([]);
              playSpellSound(selectedSpell);
            }
          }
        }
        break;
    }
  };

  // Helper function to get valid moves for Phantom Step
  // This finds moves that follow the piece's movement pattern but ignores pieces in the way
  const getPhantomStepMoves = (
    square: Square,
    piece: { type: string; color: string },
    boardState: Record<string, ChessPiece | undefined>
  ): Square[] => {
    const validMoves: Square[] = [];
    const [file, rank] = [square.charAt(0), parseInt(square.charAt(1))];
    const fileIndex = file.charCodeAt(0) - "a".charCodeAt(0);

    // Based on piece type, calculate possible moves
    switch (piece.type) {
      case "p": {
        // Pawns can move 1 or 2 squares forward
        const direction = piece.color === "w" ? 1 : -1;
        const startingRank = piece.color === "w" ? 2 : 7;

        // One square forward
        const oneForward = `${file}${rank + direction}` as Square;
        if (
          rank + direction >= 1 &&
          rank + direction <= 8 &&
          !boardState[oneForward]
        ) {
          validMoves.push(oneForward);

          // Two squares forward from starting position
          if (rank === startingRank) {
            const twoForward = `${file}${rank + 2 * direction}` as Square;
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
            const newSquare = `${newFile}${rank}` as Square;
            if (!boardState[newSquare]) {
              validMoves.push(newSquare);
            }
          }
        }

        // Vertical moves (same file)
        for (let r = 1; r <= 8; r++) {
          if (r !== rank) {
            const newSquare = `${file}${r}` as Square;
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
            const newSquare = `${newFile}${newRank}` as Square;

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
              const newSquare = `${newFile}${newRank}` as Square;

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
            const newSquare = `${newFile}${rank}` as Square;
            if (!boardState[newSquare]) {
              validMoves.push(newSquare);
            }
          }
        }

        for (let r = 1; r <= 8; r++) {
          if (r !== rank) {
            const newSquare = `${file}${r}` as Square;
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
              const newSquare = `${newFile}${newRank}` as Square;

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
            const newSquare = `${newFile}${newRank}` as Square;

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

  // Helper function to get valid moves for Mistform Knight
  const getMistformKnightMoves = (
    square: Square,
    boardState: Record<string, ChessPiece | undefined>
  ): Square[] => {
    const validMoves: Square[] = [];
    const [file, rank] = [square.charAt(0), parseInt(square.charAt(1))];
    const fileIndex = file.charCodeAt(0) - "a".charCodeAt(0);

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
        const newFile = String.fromCharCode("a".charCodeAt(0) + newFileIndex);
        const newSquare = `${newFile}${newRank}` as Square;

        // For Mistform Knight, the target square must be empty
        if (!boardState[newSquare]) {
          validMoves.push(newSquare);
        }
      }
    }

    return validMoves;
  };

  // Render the chessboard
  const renderBoard = () => {
    const board = [];
    // Determine ranks order based on player perspective to flip the board
    // Use playerPerspective if provided, otherwise fallback to currentPlayer
    const perspectiveColor = playerPerspective || currentPlayer;

    const ranks =
      perspectiveColor === "b"
        ? [1, 2, 3, 4, 5, 6, 7, 8] // Reversed for Black perspective
        : [8, 7, 6, 5, 4, 3, 2, 1]; // Standard for White perspective

    // Optionally flip files as well for a complete 180° rotation
    const files =
      perspectiveColor === "b"
        ? ["h", "g", "f", "e", "d", "c", "b", "a"] // Reversed for Black perspective
        : ["a", "b", "c", "d", "e", "f", "g", "h"]; // Standard for White perspective

    // Add an overlay for Veil of Shadows
    const veilOfShadowsOverlay =
      selectedSpell === "veilOfShadows" ? (
        <div
          className="absolute inset-0 bg-purple-900 bg-opacity-20 flex items-center justify-center z-10 cursor-pointer"
          onClick={() => {
            const success = castSpell(selectedSpell, []);
            if (success) {
              setTargetingMode(null);
              setSpellTargets([]);
              setValidTargets([]);
              showStatusMessage(
                "Veil of Shadows cast! Your opponent cannot see your half of the board for 2 turns.",
                5000
              );
              playSpellSound(selectedSpell);
            }
          }}
        >
          <div className="text-white text-xl font-bold bg-purple-800 bg-opacity-75 p-4 rounded-lg">
            Click anywhere to cast Veil of Shadows
          </div>
        </div>
      ) : null;

    for (const rank of ranks) {
      const row = [];
      for (const file of files) {
        const square = `${file}${rank}` as Square;
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
          <SquareComponent
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
            isLastMoveFrom={lastMove ? lastMove.from === square : false}
            isLastMoveTo={lastMove ? lastMove.to === square : false}
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

    return (
      <div className="relative">
        {veilOfShadowsOverlay}
        {board}
      </div>
    );
  };

  // Display targeting instructions based on selected spell
  const renderTargetingInstructions = () => {
    if (!selectedSpell || !targetingMode) return null;

    const spell = getSpellById(selectedSpell);
    if (!spell) return null;

    let instruction = "";
    switch (targetingMode) {
      case "none":
        if (selectedSpell === "veilOfShadows") {
          return null; // Don't render instruction here for Veil of Shadows, we'll show it on the board
        }
        instruction = `Click anywhere to cast ${spell.name}`;
        break;
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

    return instruction;
  };

  // Add helper function to reset UI state
  const resetUI = () => {
    setSpellTargets([]);
    setTargetingMode(null);
    setValidTargets([]);
  };

  return (
    <div className="flex flex-col items-center w-full relative">
      {/* Targeting instructions - Now positioned absolutely */}
      {(() => {
        const instructionText = renderTargetingInstructions();
        return instructionText ? (
          <div
            style={{
              position: "absolute",
              top: "-50px",
              left: "0",
              right: "0",
              zIndex: 100,
            }}
          >
            <div
              className="targeting-instructions"
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                padding: "8px",
                borderRadius: "4px",
                textAlign: "center",
                fontWeight: "bold",
                margin: "0 auto",
                maxWidth: "90%",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              {instructionText}
            </div>
          </div>
        ) : null;
      })()}

      {/* Status message indicator - Now positioned absolutely */}
      {showStatus && (
        <div
          style={{
            position: "absolute",
            top: "-50px",
            left: "0",
            right: "0",
            zIndex: 100,
          }}
        >
          <div
            className="status-message"
            style={{
              backgroundColor: "rgba(79, 70, 229, 0.2)",
              padding: "10px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold",
              border: "1px solid rgba(79, 70, 229, 0.4)",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              margin: "0 auto",
              maxWidth: "90%",
            }}
          >
            {statusMessage}
          </div>
        </div>
      )}

      <div className="chess-board">{renderBoard()}</div>

      {/* Piece Type Selector Dialog for Dark Conversion */}
      <PieceTypeSelector
        isOpen={showPieceConversionDialog}
        onSelect={handlePieceTypeSelect}
        onCancel={handlePieceTypeSelectorCancel}
      />
    </div>
  );
};

export default ChessBoard;
