import { useGame } from "../context/GameContext";

const Game = () => {
  const { gameConfig } = useGame();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Wizard's Chess</h1>

      <div className="bg-[#3b0764] p-4 rounded-lg w-full max-w-2xl mb-6">
        <div className="text-center mb-4">
          <p className="text-gray-400">
            Playing as {gameConfig.playerColor === "w" ? "White" : "Black"}
          </p>
          <div className="mt-2">
            <span className="mr-2">Mana:</span>
            <span className="text-[#a855f7]">
              {gameConfig.mana}/{gameConfig.maxMana}
            </span>
          </div>
        </div>

        <div className="h-96 flex items-center justify-center bg-gray-800 rounded-lg mb-4">
          <p className="text-gray-400">
            Chess board will be implemented in the next step
          </p>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Your Spells</h3>
          <div className="grid grid-cols-5 gap-2">
            {gameConfig.selectedSpells.map((spell) => (
              <div
                key={spell.id}
                className="bg-[#0f172a] p-2 rounded text-center"
                title={`${spell.name} (${spell.manaCost} Mana): ${spell.description}`}
              >
                <div className="text-2xl mb-1">{spell.icon}</div>
                <div className="text-xs">{spell.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() =>
          alert("Game functionality will be implemented in the next step")
        }
        className="bg-[#6b21a8] hover:bg-[#a855f7] text-white font-bold py-2 px-4 rounded"
      >
        End Turn
      </button>
    </div>
  );
};

export default Game;
