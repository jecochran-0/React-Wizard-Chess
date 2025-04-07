import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Square } from "chess.js";
import GameManager from "../game/GameManager";
import { PlayerSpells, SpellId } from "../types/types";

// Define the type for targets in castSpell
type SpellTargetData = Square | Square[] | { from: Square; to: Square };

export type ChessContextType = {
  gameManager: GameManager;
  currentPlayer: "w" | "b";
  selectedPiece: Square | null;
  setSelectedPiece: (square: Square | null) => void;
  legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  kingInCheck: Square | null;
  playerMana: Record<"w" | "b", number>;
  playerSpells: PlayerSpells;
  selectedSpell: SpellId | null;
  selectSpell: (spellId: SpellId | null) => void;
  castSpell: (spellId: SpellId, targets: SpellTargetData) => boolean;
  endTurn: () => void;
  gameLog: string[];
  addToGameLog: (entry: string) => void;
};

const ChessContext = createContext<ChessContextType | undefined>(undefined);

export const ChessProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [gameManager] = useState(() => new GameManager());
  const [currentPlayer, setCurrentPlayer] = useState<"w" | "b">(
    gameManager.getCurrentPlayer()
  );
  const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null
  );
  const [kingInCheck, setKingInCheck] = useState<Square | null>(null);
  const [playerMana, setPlayerMana] = useState<Record<"w" | "b", number>>({
    w: 10,
    b: 10,
  });
  const [playerSpells, setPlayerSpells] = useState<PlayerSpells>({
    w: ["astralSwap", "emberCrown", "frostShield"],
    b: ["shadowStrike", "arcaneArmor", "timeWarp"],
  });
  const [selectedSpell, setSelectedSpell] = useState<SpellId | null>(null);
  const [gameLog, setGameLog] = useState<string[]>([]);

  // Initialize game state
  useEffect(() => {
    updateGameState();
  }, []);

  // Update legal moves when a piece is selected
  useEffect(() => {
    if (selectedPiece) {
      const moves = gameManager.getLegalMovesFrom(selectedPiece);
      setLegalMoves(moves);
    } else {
      setLegalMoves([]);
    }
  }, [selectedPiece, gameManager]);

  // Check for king in check on every board change
  useEffect(() => {
    const kingPos = gameManager.getKingInCheckPosition();
    setKingInCheck(kingPos);
  }, [gameManager, currentPlayer]);

  // Update the game state variables from the game manager
  const updateGameState = () => {
    setCurrentPlayer(gameManager.getCurrentPlayer());
    setKingInCheck(gameManager.getKingInCheckPosition());
  };

  // Select a spell
  const selectSpell = (spellId: SpellId | null) => {
    setSelectedSpell(spellId);
    // Deselect any selected piece when selecting a spell
    setSelectedPiece(null);
  };

  // Cast a spell
  const castSpell = (spellId: SpellId, targets: SpellTargetData): boolean => {
    // Only allow the current player to cast spells
    if (gameManager.getCurrentPlayer() !== currentPlayer) {
      console.error("Not your turn");
      return false;
    }

    // Check if player has enough mana
    const spellCost = gameManager.getSpellCost(spellId);
    if (playerMana[currentPlayer] < spellCost) {
      console.error("Not enough mana");
      return false;
    }

    // Use GameManager to cast the spell
    const success = gameManager.castSpell(spellId, targets);

    if (success) {
      // Deduct mana cost
      setPlayerMana((prev) => ({
        ...prev,
        [currentPlayer]: prev[currentPlayer] - spellCost,
      }));

      // Deselect the spell
      setSelectedSpell(null);

      // Add to game log
      addToGameLog(
        `${currentPlayer === "w" ? "White" : "Black"} cast ${spellId}`
      );

      return true;
    }

    return false;
  };

  // End the current turn
  const endTurn = () => {
    // Clear selections
    setSelectedPiece(null);
    setSelectedSpell(null);

    // Process end of turn effects
    gameManager.endTurn();

    // Update current player
    const newPlayer = gameManager.getCurrentPlayer();
    setCurrentPlayer(newPlayer);

    // Refresh mana for the new player
    setPlayerMana((prev) => ({
      ...prev,
      [newPlayer]: Math.min(prev[newPlayer] + 2, 10), // Add 2 mana, capped at 10
    }));

    // Add to game log
    addToGameLog(
      `${currentPlayer === "w" ? "White" : "Black"} ended their turn`
    );
    addToGameLog(`${newPlayer === "w" ? "White" : "Black"} to move`);
  };

  // Add entry to game log
  const addToGameLog = (entry: string) => {
    setGameLog((prev) => [...prev, entry]);
  };

  return (
    <ChessContext.Provider
      value={{
        gameManager,
        currentPlayer,
        selectedPiece,
        setSelectedPiece,
        legalMoves,
        lastMove,
        kingInCheck,
        playerMana,
        playerSpells,
        selectedSpell,
        selectSpell,
        castSpell,
        endTurn,
        gameLog,
        addToGameLog,
      }}
    >
      {children}
    </ChessContext.Provider>
  );
};

export const useChess = () => {
  const context = useContext(ChessContext);
  if (!context) {
    throw new Error("useChess must be used within a ChessProvider");
  }
  return context;
};
