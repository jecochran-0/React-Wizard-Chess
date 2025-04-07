import { GameProvider, useGame } from "./context/GameContext";
import { ChessProvider } from "./context/ChessContext";
import MainMenu from "./pages/MainMenu";
import SpellSelection from "./pages/SpellSelection";
import Game from "./pages/Game";

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

function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

export default App;
