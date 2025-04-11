import React from "react";
import { useChess } from "../../context/ChessContext";

interface ComputerSettingsProps {
  className?: string;
}

const ComputerSettings: React.FC<ComputerSettingsProps> = ({ className }) => {
  const {
    isComputerOpponentEnabled,
    computerPlayerColor,
    computerDifficulty,
    toggleComputerOpponent,
    setComputerPlayerColor,
    setComputerDifficulty,
  } = useChess();

  return (
    <div
      className={`bg-slate-800 bg-opacity-90 rounded-lg p-5 shadow-lg backdrop-blur ${
        className || ""
      }`}
    >
      <h2 className="text-xl font-semibold text-amber-400 mb-4">
        Computer Opponent
      </h2>

      <div className="mb-4">
        <label className="inline-flex items-center cursor-pointer">
          <span className="mr-3 text-white">Enable Computer Opponent</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isComputerOpponentEnabled}
              onChange={(e) => toggleComputerOpponent(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </div>
        </label>
      </div>

      {isComputerOpponentEnabled && (
        <>
          <div className="mb-4">
            <label className="block text-white mb-2">Computer Color</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-amber-500 focus:ring-amber-500"
                  name="computerColor"
                  value="b"
                  checked={computerPlayerColor === "b"}
                  onChange={() => setComputerPlayerColor("b")}
                />
                <span className="ml-2 text-white">Black</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-amber-500 focus:ring-amber-500"
                  name="computerColor"
                  value="w"
                  checked={computerPlayerColor === "w"}
                  onChange={() => setComputerPlayerColor("w")}
                />
                <span className="ml-2 text-white">White</span>
              </label>
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-white mb-2">Difficulty</label>
            <select
              className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={computerDifficulty}
              onChange={(e) =>
                setComputerDifficulty(
                  e.target.value as "easy" | "medium" | "hard"
                )
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="mt-4 text-gray-400 text-sm">
            <p>
              <strong>Easy:</strong> Makes random moves and occasionally casts
              spells.
            </p>
            <p>
              <strong>Medium:</strong> Makes tactical moves and uses spells
              intelligently.
            </p>
            <p>
              <strong>Hard:</strong> Makes strategic moves and optimizes spell
              usage.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ComputerSettings;
