/**
 * GameContext.tsx - Global Game State Management
 *
 * This file provides the global state management for the entire Wizard Chess application.
 * It manages the application flow, player configuration, and spell selection.
 *
 * ARCHITECTURE OVERVIEW:
 * - Uses React Context API for global state management
 * - Provides GameProvider component that wraps the entire app
 * - Exports useGame() hook for components to access global state
 * - Manages application flow: main-menu → spell-selection → game
 *
 * STATE MANAGEMENT:
 * - gameState: Controls which page is currently displayed
 * - gameConfig: Stores player settings and game configuration
 * - availableSpells: Randomly selected spells for the current game session
 *
 * DATA FLOW:
 * 1. GameProvider wraps entire app (in App.tsx)
 * 2. Components use useGame() hook to access global state
 * 3. State changes trigger re-renders across all consuming components
 * 4. State persists throughout the application lifecycle
 *
 * DEPENDENCIES:
 * - Uses types from ../types/game.ts (GameConfig, PlayerColor, Spell, ComputerOpponent)
 * - Uses spell data from ../data/spells.ts (SPELLS array)
 * - Uses utility functions from ../utils/helpers.ts (shuffle function)
 *
 * USED BY:
 * - App.tsx: Provides GameProvider wrapper
 * - MainMenu.tsx: Accesses gameConfig for player settings
 * - SpellSelection.tsx: Manages spell selection and availableSpells
 * - Game.tsx: Accesses gameConfig for game initialization
 */

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

/**
 * GameState Type Definition
 *
 * Defines the three possible states of the application:
 * - "main-menu": Landing page with player configuration
 * - "spell-selection": Page where players select their spell loadout
 * - "game": The actual chess game interface
 */
type GameState = "main-menu" | "spell-selection" | "game";

/**
 * GameContextType Interface
 *
 * Defines the shape of the context value that will be provided to all
 * components wrapped in GameProvider.
 *
 * STATE PROPERTIES:
 * - gameState: Current application state (which page to show)
 * - gameConfig: Player configuration and game settings
 * - availableSpells: Randomly selected spells for current game session
 *
 * STATE MUTATION FUNCTIONS:
 * - setGameState: Changes the current application state
 * - selectPlayerColor: Sets the player's color (white/black)
 * - setComputerOpponent: Configures computer opponent settings
 * - toggleSpellSelection: Adds/removes spells from player's loadout
 * - startGame: Advances the game flow to next state
 * - resetGame: Resets all state to initial values
 */
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

/**
 * Default Game Configuration
 *
 * Initial state for a new game session:
 * - playerColor: "w" (white pieces by default)
 * - computerOpponent: null (no AI opponent initially)
 * - selectedSpells: [] (no spells selected initially)
 * - mana: 10 (starting mana amount)
 * - maxMana: 15 (maximum mana cap)
 */
const defaultGameConfig: GameConfig = {
  playerColor: "w",
  computerOpponent: null,
  selectedSpells: [],
  mana: 10,
  maxMana: 15,
};

/**
 * GameContext Creation
 *
 * Creates the React Context that will hold our global game state.
 * Initialized as undefined to ensure proper error handling.
 */
const GameContext = createContext<GameContextType | undefined>(undefined);

/**
 * GameProvider Component
 *
 * PURPOSE: Provides global game state to all child components
 *
 * STATE MANAGEMENT:
 * - gameState: Controls application flow (main-menu → spell-selection → game)
 * - gameConfig: Stores player configuration and game settings
 * - availableSpells: Randomly selected spells for current session
 *
 * STATE MUTATION FUNCTIONS:
 * - selectPlayerColor: Updates player color and adjusts computer opponent color
 * - setComputerOpponent: Configures AI opponent with difficulty and color
 * - toggleSpellSelection: Manages spell selection (max 5 spells)
 * - startGame: Advances game flow and handles spell randomization
 * - resetGame: Resets all state to initial values
 *
 * DEBUGGING:
 * - Logs state changes to console for development debugging
 * - Tracks gameState and gameConfig changes
 *
 * USAGE:
 * - Wraps entire application in App.tsx
 * - Provides state to all components via useGame() hook
 */
export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>("main-menu");
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig);
  const [availableSpells, setAvailableSpells] = useState<Spell[]>([]);

  // Debug log for state changes
  useEffect(() => {
    console.log("Game state changed:", gameState);
    console.log("Current game config:", gameConfig);
  }, [gameState, gameConfig]);

  /**
   * selectPlayerColor Function
   *
   * PURPOSE: Updates the player's color choice and ensures computer opponent
   * takes the opposite color.
   *
   * LOGIC:
   * - Updates gameConfig.playerColor with new color
   * - If computer opponent exists, automatically assigns opposite color
   * - Maintains color consistency between player and AI
   *
   * USED BY: MainMenu.tsx for color selection buttons
   */
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

  /**
   * setComputerOpponent Function
   *
   * PURPOSE: Configures the computer opponent settings including difficulty
   * and color assignment.
   *
   * LOGIC:
   * - Updates gameConfig.computerOpponent with new settings
   * - If enabling computer without color, assigns opposite of player color
   * - Handles enabling/disabling computer opponent
   *
   * USED BY: MainMenu.tsx for computer opponent toggle and difficulty selection
   */
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

  /**
   * toggleSpellSelection Function
   *
   * PURPOSE: Adds or removes spells from the player's selected spell loadout.
   *
   * LOGIC:
   * - Checks if spell is already selected
   * - If selected: removes from selectedSpells array
   * - If not selected: adds to selectedSpells array (max 5 spells)
   * - Prevents selecting more than 5 spells
   *
   * USED BY: SpellSelection.tsx for spell card click handling
   */
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

  /**
   * startGame Function
   *
   * PURPOSE: Advances the game flow to the next state, handling spell
   * randomization and validation.
   *
   * FLOW LOGIC:
   * 1. If in "main-menu": Randomly selects 10 spells and moves to "spell-selection"
   * 2. If in "spell-selection": Validates 5 spells selected and moves to "game"
   * 3. Shows alert if insufficient spells selected
   *
   * SPELL RANDOMIZATION:
   * - Uses shuffle() utility to randomize SPELLS array
   * - Selects first 10 spells for the current session
   * - Ensures different spell combinations each game
   *
   * USED BY: MainMenu.tsx and SpellSelection.tsx for "Start Game" buttons
   */
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

  /**
   * resetGame Function
   *
   * PURPOSE: Resets all game state to initial values for a new game session.
   *
   * RESET ACTIONS:
   * - Resets gameConfig to defaultGameConfig
   * - Resets gameState to "main-menu"
   * - Clears all player selections and configurations
   *
   * USED BY: Game.tsx for "New Game" functionality
   */
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

/**
 * useGame Hook
 *
 * PURPOSE: Custom hook that provides access to the GameContext
 *
 * USAGE:
 * - Must be used within a GameProvider component
 * - Returns the complete GameContextType object
 * - Throws error if used outside of GameProvider
 *
 * RETURN VALUE:
 * - All state properties (gameState, gameConfig, availableSpells)
 * - All state mutation functions (setGameState, selectPlayerColor, etc.)
 *
 * USED BY: All components that need access to global game state
 */
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
