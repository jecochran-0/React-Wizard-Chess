import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  GameConfig,
  PlayerColor,
  Spell,
  ComputerOpponent,
} from "../types/game";
import { SPELLS } from "../data/spells";
import { shuffle } from "../utils/helpers";

type GameState = "main-menu" | "spell-selection" | "game";

interface GameContextType {
  gameState: GameState;
  gameConfig: GameConfig;
  availableSpells: Spell[];
  setGameState: (state: GameState) => void;
  selectPlayerColor: (color: PlayerColor) => void;
  setComputerOpponent: (computer: ComputerOpponent | null) => void;
  toggleSpellSelection: (spell: Spell) => void;
  startGame: () => void;
  resetGame: () => void;
}

const defaultGameConfig: GameConfig = {
  playerColor: "w",
  computerOpponent: null,
  selectedSpells: [],
  mana: 10,
  maxMana: 15,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>("main-menu");
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig);
  const [availableSpells, setAvailableSpells] = useState<Spell[]>([]);

  // Debug log for state changes
  useEffect(() => {
    console.log("Game state changed:", gameState);
    console.log("Current game config:", gameConfig);
  }, [gameState, gameConfig]);

  const selectPlayerColor = (color: PlayerColor) => {
    setGameConfig((prev: GameConfig) => {
      const newConfig = { ...prev, playerColor: color };
      // If computer opponent exists, ensure it takes the opposite color
      if (newConfig.computerOpponent) {
        newConfig.computerOpponent.color = color === "w" ? "b" : "w";
      }
      return newConfig;
    });
  };

  // Function to enable/disable/configure the computer opponent
  const setComputerOpponent = (computer: ComputerOpponent | null) => {
    setGameConfig((prev: GameConfig) => {
      const newConfig = { ...prev, computerOpponent: computer };
      // If enabling the computer, assign the opposite color of the player
      if (computer && !computer.color) {
        computer.color = prev.playerColor === "w" ? "b" : "w";
      }
      return newConfig;
    });
  };

  const toggleSpellSelection = (spell: Spell) => {
    setGameConfig((prev: GameConfig) => {
      const isSelected = prev.selectedSpells.some((s) => s.id === spell.id);
      let updatedSpells;

      if (isSelected) {
        // Remove spell
        updatedSpells = prev.selectedSpells.filter(
          (s: Spell) => s.id !== spell.id
        );
      } else {
        // Add spell if less than 5 selected
        if (prev.selectedSpells.length < 5) {
          updatedSpells = [...prev.selectedSpells, spell];
        } else {
          return prev; // Don't add more than 5 spells
        }
      }

      return {
        ...prev,
        selectedSpells: updatedSpells,
      };
    });
  };

  const startGame = () => {
    // Before starting the actual game, we need to choose 10 spells out of 15
    // for the spell selection phase
    if (gameState === "main-menu") {
      // Randomly select 10 spells to offer
      const randomSpells = shuffle([...SPELLS]).slice(0, 10);
      setAvailableSpells(randomSpells);
      setGameState("spell-selection");
    } else if (gameState === "spell-selection") {
      if (gameConfig.selectedSpells.length === 5) {
        setGameState("game");
      } else {
        // Show alert if fewer than 5 spells selected
        alert("Please select 5 spells before starting the game.");
      }
    }
  };

  const resetGame = () => {
    setGameConfig(defaultGameConfig);
    setGameState("main-menu");
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        gameConfig,
        availableSpells,
        setGameState,
        selectPlayerColor,
        setComputerOpponent,
        toggleSpellSelection,
        startGame,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
