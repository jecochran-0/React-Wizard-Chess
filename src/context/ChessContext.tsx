import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Chess, Square, Color } from "chess.js";
import GameManager from "../game/GameManager";
import {
  PieceMeta,
  SpellId,
  PlayerSpells,
  SpellTarget,
  SpellTargetType,
} from "../types/types";

// Define the context type
export interface ChessContextType {
  // Game state
  currentPlayer: Color;
  playerMana: { w: number; b: number };
  playerSpells: PlayerSpells;
  boardState: Record<Square, PieceMeta>;
  gameLog: string[];

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
    targets: Square | Square[] | { from: Square; to: Square }
  ) => boolean;
  endTurn: () => void;
}

// Create the context with a default value
const ChessContext = createContext<ChessContextType | undefined>(undefined);

// Default spells for each player
const defaultPlayerSpells: PlayerSpells = {
  w: ["astralSwap", "emberCrown", "frostShield", "shadowStrike", "arcaneArmor"],
  b: ["astralSwap", "emberCrown", "frostShield", "shadowStrike", "arcaneArmor"],
};

// Provider component
export const ChessProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initialize the game manager
  const [gameManager] = useState(() => new GameManager(defaultPlayerSpells));

  // Game state
  const [currentPlayer, setCurrentPlayer] = useState<Color>(
    gameManager.getCurrentPlayer()
  );
  const [playerMana, setPlayerMana] = useState(gameManager.getPlayerMana());
  const [boardState, setBoardState] = useState<Record<Square, PieceMeta>>(
    gameManager.getBoardState() as Record<Square, PieceMeta>
  );
  const [gameLog, setGameLog] = useState<string[]>(gameManager.getGameLog());

  // Selected state
  const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<SpellId | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);

  // Update legal moves when a piece is selected
  useEffect(() => {
    if (selectedPiece) {
      const chess = new Chess(gameManager.getFEN());
      const moves = chess.moves({ square: selectedPiece, verbose: true });
      setLegalMoves(moves.map((move) => move.to as Square));
    } else {
      setLegalMoves([]);
    }
  }, [selectedPiece, gameManager]);

  // Update game state after moves
  useEffect(() => {
    // Update current player
    setCurrentPlayer(gameManager.getCurrentPlayer());

    // Update board state
    setBoardState(gameManager.getBoardState() as Record<Square, PieceMeta>);

    // Update player mana
    setPlayerMana(gameManager.getPlayerMana());

    // Update game log
    setGameLog(gameManager.getGameLog());
  }, [gameManager]);

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

  // Make a move
  const makeMove = (from: Square, to: Square): boolean => {
    const result = gameManager.makeMove(from, to);

    if (result) {
      // Update UI state after the move
      setCurrentPlayer(gameManager.getCurrentPlayer());
      setBoardState(gameManager.getBoardState() as Record<Square, PieceMeta>);
      setPlayerMana(gameManager.getPlayerMana());
      setGameLog(gameManager.getGameLog());

      // Clear selection
      setSelectedPiece(null);
    }

    return result;
  };

  // Cast a spell
  const castSpell = (
    spellId: SpellId,
    targets: Square | Square[] | { from: Square; to: Square }
  ): boolean => {
    const result = gameManager.castSpell(spellId, targets);

    if (result) {
      // Update UI state after spell cast
      setCurrentPlayer(gameManager.getCurrentPlayer());
      setBoardState(gameManager.getBoardState() as Record<Square, PieceMeta>);
      setPlayerMana(gameManager.getPlayerMana());
      setGameLog(gameManager.getGameLog());

      // Clear spell selection
      setSelectedSpell(null);
    }

    return result;
  };

  // End the current turn
  const endTurn = () => {
    gameManager.endTurn();

    // Update UI state after ending turn
    setCurrentPlayer(gameManager.getCurrentPlayer());
    setBoardState(gameManager.getBoardState() as Record<Square, PieceMeta>);
    setPlayerMana(gameManager.getPlayerMana());
    setGameLog(gameManager.getGameLog());

    // Clear selections
    setSelectedPiece(null);
    setSelectedSpell(null);
  };

  // Context value
  const contextValue: ChessContextType = {
    currentPlayer,
    playerMana,
    playerSpells: gameManager.getPlayerSpells(),
    boardState,
    gameLog,
    selectedPiece,
    selectedSpell,
    legalMoves,
    selectPiece,
    selectSpell,
    makeMove,
    castSpell,
    endTurn,
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
