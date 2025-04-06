import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { GameConfig, PlayerColor, Spell } from "../types/game";
import { SPELLS } from "../data/spells";
import { shuffle } from "../utils/helpers";

type GameState = "main-menu" | "spell-selection" | "game";

interface GameContextType {
  gameState: GameState;
  gameConfig: GameConfig;
  availableSpells: Spell[];
  setGameState: (state: GameState) => void;
  selectPlayerColor: (color: PlayerColor) => void;
  toggleSpellSelection: (spell: Spell) => void;
  startGame: () => void;
  resetGame: () => void;
}

const defaultGameConfig: GameConfig = {
  playerColor: "w",
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
    setGameConfig((prev) => ({ ...prev, playerColor: color }));
  };

  const toggleSpellSelection = (spell: Spell) => {
    setGameConfig((prev) => {
      const isSelected = prev.selectedSpells.some((s) => s.id === spell.id);
      let updatedSpells;

      if (isSelected) {
        // Remove spell
        updatedSpells = prev.selectedSpells.filter((s) => s.id !== spell.id);
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
