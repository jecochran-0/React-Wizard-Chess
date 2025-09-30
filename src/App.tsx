/**
 * App.tsx - Main Application Component
 *
 * This is the root component of the Wizard Chess application. It serves as the main router
 * that determines which page to display based on the current game state.
 *
 * ARCHITECTURE OVERVIEW:
 * - Uses React Context for global state management
 * - Implements a simple state-based routing system
 * - Wraps the entire app in GameProvider for global game state
 * - Conditionally wraps Game page in ChessProvider for chess-specific state
 *
 * DATA FLOW:
 * 1. GameProvider provides global game state (gameState, player config, etc.)
 * 2. GameContent reads gameState from GameContext via useGame() hook
 * 3. Based on gameState value, renders appropriate page component
 * 4. Game page gets additional ChessProvider for chess-specific state
 *
 * STATE DEPENDENCIES:
 * - Depends on GameContext.gameState for routing decisions
 * - GameContext is defined in ./context/GameContext.tsx
 * - ChessContext is defined in ./context/ChessContext.tsx
 *
 * COMPONENT HIERARCHY:
 * App
 * └── GameProvider (provides global game state)
 *     └── GameContent (reads gameState and routes)
 *         ├── MainMenu (when gameState === "main-menu")
 *         ├── SpellSelection (when gameState === "spell-selection")
 *         └── ChessProvider (when gameState === "game")
 *             └── Game (main chess game interface)
 */

import { GameProvider, useGame } from "./context/GameContext";
import { ChessProvider } from "./context/ChessContext";
import MainMenu from "./pages/MainMenu";
import SpellSelection from "./pages/SpellSelection";
import Game from "./pages/Game";

/**
 * GameContent Component
 *
 * PURPOSE: Acts as the main router for the application, determining which page
 * to render based on the current game state.
 *
 * STATE USAGE:
 * - Uses gameState from GameContext via useGame() hook
 * - gameState can be: "main-menu" | "spell-selection" | "game"
 *
 * ROUTING LOGIC:
 * - "main-menu" → Renders MainMenu component (landing page)
 * - "spell-selection" → Renders SpellSelection component (spell loadout selection)
 * - "game" → Renders Game component wrapped in ChessProvider (actual chess game)
 * - default → Falls back to MainMenu (safety fallback)
 *
 * CONTEXT DEPENDENCIES:
 * - Requires GameContext to be available (provided by GameProvider in App)
 * - Uses useGame() hook to access gameState from GameContext
 */
function GameContent() {
  const { gameState } = useGame();

  switch (gameState) {
    case "main-menu":
      return <MainMenu />;
    case "spell-selection":
      return <SpellSelection />;
    case "game":
      return (
        <ChessProvider>
          <Game />
        </ChessProvider>
      );
    default:
      return <MainMenu />;
  }
}

/**
 * App Component
 *
 * PURPOSE: Root component that sets up the application's context providers
 * and renders the main content.
 *
 * CONTEXT PROVIDERS:
 * - GameProvider: Provides global game state (gameState, player config, etc.)
 *   - Defined in ./context/GameContext.tsx
 *   - Contains: gameState, playerColor, computerOpponent, etc.
 *   - Used by: All components that need global game state
 *
 * COMPONENT STRUCTURE:
 * - Wraps entire app in GameProvider for global state access
 * - Renders GameContent which handles routing based on gameState
 * - GameContent conditionally wraps Game in ChessProvider for chess-specific state
 *
 * STATE FLOW:
 * 1. GameProvider initializes with default game state
 * 2. GameContent reads gameState and routes to appropriate page
 * 3. Each page component can access global state via useGame() hook
 * 4. Game page gets additional chess state via ChessProvider
 */
function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

export default App;
