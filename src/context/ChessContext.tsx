import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Chess, Square, Color } from "chess.js";
import GameManager from "../game/GameManager";
import { ComputerPlayer } from "../game/ComputerPlayer";
import { useGame } from "./GameContext";
import { PieceMeta, SpellId, PlayerSpells, Effect } from "../types/types";
import { ChessGameStatus } from "../types/game";

// Define the context type
export interface ChessContextType {
  // Game state
  currentPlayer: Color;
  playerMana: { w: number; b: number };
  playerSpells: PlayerSpells;
  lastMove: { from: Square; to: Square } | null;
  boardState: Record<Square, PieceMeta>;
  gameLog: string[];
  boardGlyphs: Record<string, { effect: Effect }>;
  currentTurnNumber: number;
  gameStatus: ChessGameStatus;

  // Selected items
  selectedPiece: Square | null;
  selectedSpell: SpellId | null;
  legalMoves: Square[];

  // Game actions
  selectPiece: (square: Square | null) => void;
  selectSpell: (spellId: SpellId | null) => void;
  makeMove: (from: Square, to: Square) => boolean;
  castSpell: (
    spellId: SpellId,
    targets: Square | Square[] | { from: Square; to: Square },
    pieceType?: "n" | "b"
  ) => boolean;
  endTurn: () => void;

  // Function to trigger computer move (async)
  triggerComputerMove: () => Promise<void>;

  // Game setup
  setPlayerSpells: (playerSpells: PlayerSpells) => void;
  initializePlayerColor: (color: Color) => void;
}

// Create the context with a default value
const ChessContext = createContext<ChessContextType | undefined>(undefined);

// Initial default spells for testing (these will be replaced)
const initialPlayerSpells: PlayerSpells = {
  w: [],
  b: [],
};

// Provider component
export const ChessProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { gameConfig } = useGame();
  // Initialize the game manager with empty spell lists
  const [gameManager] = useState(() => new GameManager(initialPlayerSpells));
  const [playerSpells, setPlayerSpells] =
    useState<PlayerSpells>(initialPlayerSpells);

  // Game state
  const [currentPlayer, setCurrentPlayer] = useState<Color>(
    gameManager.getCurrentPlayer()
  );
  const [playerMana, setPlayerMana] = useState(gameManager.getPlayerMana());
  const [boardState, setBoardState] = useState<Record<Square, PieceMeta>>(
    gameManager.getBoardState() as Record<Square, PieceMeta>
  );
  const [gameLog, setGameLog] = useState<string[]>(gameManager.getGameLog());
  const [boardGlyphs, setBoardGlyphs] = useState<
    Record<string, { effect: Effect }>
  >(gameManager.getGlyphs());
  const [currentTurnNumber, setCurrentTurnNumber] = useState<number>(
    gameManager.getCurrentTurnNumber()
  );
  const [gameStatus, setGameStatus] = useState<ChessGameStatus>(
    gameManager.getGameStatus()
  );

  // Selected state
  const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<SpellId | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);

  // State for the computer player instance
  const [computerPlayer, setComputerPlayer] = useState<ComputerPlayer | null>(
    null
  );

  // State to track if computer is thinking
  const [isComputerThinking, setIsComputerThinking] = useState(false);

  // State for last move
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null
  );

  // Initialize computer player based on game config
  useEffect(() => {
    if (gameConfig.computerOpponent) {
      console.log("Initializing Computer Player:", gameConfig.computerOpponent);
      const compPlayer = new ComputerPlayer(
        gameManager,
        gameConfig.computerOpponent.color
      );
      setComputerPlayer(compPlayer);
    } else {
      setComputerPlayer(null);
    }
  }, [gameConfig.computerOpponent, gameManager]);

  // Update the gameManager when player spells change
  useEffect(() => {
    // Only update if the player spells actually have values (not empty arrays)
    if (playerSpells.w.length > 0 || playerSpells.b.length > 0) {
      console.log("Updating player spells in GameManager:", playerSpells);
      gameManager.updatePlayerSpells(playerSpells);
    }
  }, [playerSpells, gameManager]);

  // Update legal moves when a piece is selected
  useEffect(() => {
    if (selectedPiece) {
      // First check if the selected piece has a preventMovement effect (Arcane Anchor)
      const selectedPieceMeta = boardState[selectedPiece];
      if (selectedPieceMeta?.effects) {
        const hasPreventMovementEffect = selectedPieceMeta.effects.some(
          (effect: Effect) => effect.modifiers?.preventMovement === true
        );

        if (hasPreventMovementEffect) {
          console.log(
            `Piece at ${selectedPiece} cannot move due to Arcane Anchor effect`
          );
          setLegalMoves([]);
          return;
        }
      }

      const chess = new Chess(gameManager.getFEN());
      const moves = chess.moves({ square: selectedPiece, verbose: true });

      // Filter out moves that would capture pieces protected by any effect
      const filteredMoves = moves.filter((move) => {
        // Check if this move is a capture
        if (move.captured) {
          const targetSquare = move.to as Square;
          // Get the target piece from our custom board state
          const targetPiece = boardState[targetSquare as Square];

          // If the piece has any effects with preventCapture, filter it out
          if (targetPiece && targetPiece.effects) {
            const isProtected = targetPiece.effects.some(
              (effect: { modifiers?: { preventCapture?: boolean } }) =>
                effect.modifiers?.preventCapture === true
            );

            if (isProtected) {
              console.log(
                `Filtering out protected piece at ${targetSquare} from legal moves`
              );
              return false;
            }
          }
        }
        return true;
      });

      setLegalMoves(filteredMoves.map((move) => move.to as Square));
    } else {
      setLegalMoves([]);
    }

    // If it's the computer's turn immediately after initialization, trigger its move
    if (
      computerPlayer &&
      gameManager.getCurrentPlayer() === computerPlayer.getColor() &&
      !isComputerThinking
    ) {
      console.log("Game initialized, triggering computer's first move...");
      triggerComputerMove();
    }
  }, [
    selectedPiece,
    gameManager,
    boardState,
    computerPlayer,
    isComputerThinking,
  ]);

  // Update game state after moves
  useEffect(() => {
    // Update current player
    setCurrentPlayer(gameManager.getCurrentPlayer());

    // Add debugging to check board state before updating
    const newBoardState = gameManager.getBoardState() as Record<
      Square,
      PieceMeta
    >;
    console.log("Board state from GameManager:", newBoardState);

    // Log a few specific pieces to check if they have position history
    for (const square in newBoardState) {
      const piece = newBoardState[square as Square];
      if (piece && piece.prevPositions) {
        console.log(
          `GameManager: Piece at ${square} has position history:`,
          piece.prevPositions
        );
      }
    }

    // Update board state
    setBoardState(newBoardState);

    // Update board glyphs
    setBoardGlyphs(gameManager.getGlyphs());

    // Log the React state after update (will be visible in next render)
    setTimeout(() => {
      console.log("Board state in React after update:");
      for (const square in boardState) {
        const piece = boardState[square as Square];
        if (piece && piece.prevPositions) {
          console.log(
            `React: Piece at ${square} has position history:`,
            piece.prevPositions
          );
        }
      }
    }, 0);

    // Update player mana
    setPlayerMana(gameManager.getPlayerMana());

    // Update game log
    setGameLog(gameManager.getGameLog());

    // Update current turn number
    setCurrentTurnNumber(gameManager.getCurrentTurnNumber());

    // Update game status
    setGameStatus(gameManager.getGameStatus());

    // Update last move
    setLastMove(gameManager.getLastMove());
  }, [gameManager, boardState]);

  // Select a piece
  const selectPiece = (square: Square | null) => {
    setSelectedPiece(square);
    if (square) {
      setSelectedSpell(null);
    }
  };

  // Select a spell
  const selectSpell = (spellId: SpellId | null) => {
    setSelectedSpell(spellId);
    if (spellId) {
      setSelectedPiece(null);
    }
  };

  // Function to update state after any move (player or computer)
  const updateStateAfterAction = () => {
    setCurrentPlayer(gameManager.getCurrentPlayer());
    setLastMove(gameManager.getLastMove());
    setGameStatus(gameManager.getGameStatus());
    setBoardState(gameManager.getBoardState() as Record<Square, PieceMeta>);
    setPlayerMana(gameManager.getPlayerMana());
    setGameLog(gameManager.getGameLog());
    setBoardGlyphs(gameManager.getGlyphs());
    setCurrentTurnNumber(gameManager.getCurrentTurnNumber());
    // Clear selections
    setSelectedPiece(null);
    setSelectedSpell(null);
    console.log("State updated after action.");
  };

  // Function to trigger computer move
  const triggerComputerMove = async () => {
    if (
      computerPlayer &&
      gameManager.getCurrentPlayer() === computerPlayer.getColor() &&
      !isComputerThinking
    ) {
      console.log("Triggering computer move...");
      // Set thinking state immediately for UI feedback
      setIsComputerThinking(true);

      // Add a delay to simulate thinking
      await new Promise((resolve) => setTimeout(resolve, 800)); // 800ms thinking delay

      try {
        const moveMade = await computerPlayer.makeMove();
        if (moveMade) {
          console.log("Computer finished its turn.");
          // State update will happen naturally as GameManager state changes are reflected,
          // or potentially triggered by the completion of the computer's move.
          // We might need explicit update here depending on async timing
          updateStateAfterAction();
        } else {
          console.log("Computer move failed or no action taken.");
          // Handle game end state? Checkmate/Stalemate?
        }
      } catch (error) {
        console.error("Error during computer turn:", error);
      } finally {
        setIsComputerThinking(false);
      }
    } else {
      if (isComputerThinking) {
        console.log("Computer is already thinking.");
      } else {
        console.log("Not computer's turn or computer not enabled.");
      }
    }
  };

  // Make a move
  const makeMove = (from: Square, to: Square): boolean => {
    const movingPiece = boardState[from as Square];
    const isKing = movingPiece && movingPiece.type === "k";
    const hasKingsGambitEffect =
      isKing &&
      movingPiece.effects?.some(
        (effect) =>
          effect.source === "kingsGambit" &&
          effect.modifiers?.allowSecondKingMove === true
      );

    console.log(
      `Making move: ${from} to ${to}, hasKingsGambitEffect: ${hasKingsGambitEffect}`
    );

    const result = gameManager.makeMove(from, to);

    if (result) {
      // If this is a king with Kings Gambit effect, we want to keep the same player's turn
      if (hasKingsGambitEffect) {
        console.log(
          `King with Kings Gambit effect moved from ${from} to ${to}, preventing turn end`
        );

        // Update board state but don't change the current player
        setBoardState(gameManager.getBoardState() as Record<Square, PieceMeta>);
        setPlayerMana(gameManager.getPlayerMana());
        setGameLog(gameManager.getGameLog());

        // Update board glyphs
        const updatedGlyphs = gameManager.getGlyphs();
        setBoardGlyphs(updatedGlyphs);

        // Don't clear selection for Kings Gambit so the player can select the king again
        // But we're now selecting the king at its new position in the ChessBoard component
      } else {
        // Normal move - update state
        updateStateAfterAction();
      }

      // Trigger computer move if it's its turn
      if (
        result &&
        !hasKingsGambitEffect &&
        computerPlayer &&
        gameManager.getCurrentPlayer() === computerPlayer.getColor()
      ) {
        console.log("Move successful, triggering computer's turn...");
        // Trigger async computer move
        triggerComputerMove();
      }
    }

    return result;
  };

  // Cast a spell
  const castSpell = (
    spellId: SpellId,
    targets: Square | Square[] | { from: Square; to: Square },
    pieceType?: "n" | "b"
  ): boolean => {
    // If this is a Dark Conversion spell with a pieceType, we need to handle it specially
    if (spellId === "darkConversion" && pieceType && Array.isArray(targets)) {
      // For Dark Conversion, we need to include the piece type in the first target
      const targetInfo = [...targets];

      // This will be handled by the SpellEngine.castDarkConversion method
      console.log(`Casting Dark Conversion with piece type: ${pieceType}`);
      const result = gameManager.castSpell(spellId, targetInfo, pieceType);

      if (result) {
        // Update state after spell cast
        updateStateAfterAction();

        // Trigger computer move if it's its turn
        if (
          result &&
          computerPlayer &&
          gameManager.getCurrentPlayer() === computerPlayer.getColor()
        ) {
          console.log("Spell cast successful, triggering computer's turn...");
          triggerComputerMove();
        }
      }

      return result;
    }

    // Standard spell casting for all other spells
    const result = gameManager.castSpell(spellId, targets);

    if (result) {
      // Update state after standard spell cast
      updateStateAfterAction();

      // Trigger computer move if it's its turn
      if (
        result &&
        computerPlayer &&
        gameManager.getCurrentPlayer() === computerPlayer.getColor()
      ) {
        console.log("Spell cast successful, triggering computer's turn...");
        triggerComputerMove();
      }
    }

    return result;
  };

  // End the current turn
  const endTurn = () => {
    // Important: Track who ended their turn before calling endTurn
    const playerEndingTurn = gameManager.getCurrentPlayer();
    console.log(`Player ${playerEndingTurn} is ending their turn`);

    // Call endTurn on the game manager
    gameManager.endTurn();

    // Update state after ending human turn
    updateStateAfterAction();

    // After human ends turn, check if it's computer's turn
    if (
      computerPlayer &&
      gameManager.getCurrentPlayer() === computerPlayer.getColor()
    ) {
      console.log("Human ended turn, triggering computer's turn...");
      triggerComputerMove();
    }
  };

  // Update player spells (called after spell selection phase)
  const updatePlayerSpells = (newSpells: PlayerSpells) => {
    setPlayerSpells(newSpells);
  };

  // Initialize player color
  const initializePlayerColor = (color: Color) => {
    gameManager.initializePlayerColor(color);
    setCurrentPlayer(color);
    setPlayerMana(gameManager.getPlayerMana());
    setBoardState(gameManager.getBoardState() as Record<Square, PieceMeta>);
    setGameLog(gameManager.getGameLog());
    setBoardGlyphs(gameManager.getGlyphs());
  };

  // Context value
  const contextValue: ChessContextType = {
    currentPlayer,
    playerMana,
    playerSpells,
    boardState,
    gameLog,
    boardGlyphs,
    selectedPiece,
    selectedSpell,
    legalMoves,
    currentTurnNumber,
    gameStatus,
    triggerComputerMove,
    selectPiece,
    selectSpell,
    makeMove,
    castSpell,
    endTurn,
    setPlayerSpells: updatePlayerSpells,
    initializePlayerColor,
    lastMove,
  };

  return (
    <ChessContext.Provider value={contextValue}>
      {children}
    </ChessContext.Provider>
  );
};

// Custom hook to use the chess context
export const useChess = (): ChessContextType => {
  const context = useContext(ChessContext);
  if (context === undefined) {
    throw new Error("useChess must be used within a ChessProvider");
  }
  return context;
};
