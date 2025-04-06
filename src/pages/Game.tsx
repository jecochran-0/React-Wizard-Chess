import { useGame } from "../context/GameContext";
import ChessBoard from "../components/chess/ChessBoard";
import SpellCard from "../components/chess/SpellCard";
import { useState } from "react";

const Game = () => {
  const { gameConfig } = useGame();
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null);
  const [currentPlayer] = useState<"w" | "b">("w"); // White starts

  const handleSpellClick = (spellId: string) => {
    // Toggle selected spell
    setSelectedSpell((prev) => (prev === spellId ? null : spellId));
  };

  // Determine if this is the player's turn
  const isPlayerTurn = currentPlayer === gameConfig.playerColor;

  // Check if player has enough mana to cast a spell
  const canCastSpell = (manaCost: number) => {
    return isPlayerTurn && gameConfig.mana >= manaCost;
  };

  return (
    <div
      className="game-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #0f172a 100%)",
        color: "white",
        padding: "1rem",
      }}
    >
      {/* Header with game info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          backgroundColor: "rgba(30, 41, 59, 0.7)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              margin: 0,
              backgroundImage:
                "linear-gradient(135deg, #a855f7 10%, #d8b4fe 80%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Wizard's Chess
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.3rem 0.6rem",
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              borderRadius: "0.4rem",
            }}
          >
            <span>Turn:</span>
            <span
              style={{
                fontWeight: "bold",
                color: currentPlayer === "w" ? "#f8fafc" : "#1e293b",
                backgroundColor: currentPlayer === "w" ? "#94a3b8" : "#f8fafc",
                padding: "0.1rem 0.5rem",
                borderRadius: "0.3rem",
              }}
            >
              {currentPlayer === "w" ? "White" : "Black"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.3rem 0.6rem",
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              borderRadius: "0.4rem",
            }}
          >
            <span>Mana:</span>
            <span
              style={{
                color: "#a855f7",
                fontWeight: "bold",
              }}
            >
              {gameConfig.mana}/{gameConfig.maxMana}
            </span>
          </div>
        </div>
      </div>

      {/* Main game area: spells on left, board in center */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "1rem",
          flexGrow: 1,
          flexWrap: "wrap",
        }}
      >
        {/* Spells panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            padding: "1rem",
            backgroundColor: "rgba(30, 41, 59, 0.7)",
            borderRadius: "0.5rem",
            minWidth: "200px",
            maxWidth: "250px",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              margin: "0 0 0.5rem 0",
              textAlign: "center",
              borderBottom: "1px solid rgba(100, 116, 139, 0.5)",
              paddingBottom: "0.5rem",
            }}
          >
            Your Spells
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              flexGrow: 1,
            }}
          >
            {gameConfig.selectedSpells.map((spell) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                isSelected={selectedSpell === spell.id}
                isDisabled={!canCastSpell(spell.manaCost)}
                onClick={() => handleSpellClick(spell.id)}
              />
            ))}
          </div>

          <button
            onClick={() =>
              alert(
                "End turn functionality will be implemented in the next step"
              )
            }
            style={{
              backgroundColor: isPlayerTurn
                ? "rgba(147, 51, 234, 0.9)"
                : "rgba(75, 85, 99, 0.7)",
              color: "white",
              padding: "0.6rem",
              borderRadius: "0.4rem",
              fontWeight: "bold",
              border: "none",
              cursor: isPlayerTurn ? "pointer" : "not-allowed",
              marginTop: "0.5rem",
              transition: "all 0.3s",
            }}
            disabled={!isPlayerTurn}
          >
            End Turn
          </button>
        </div>

        {/* Chess board */}
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ChessBoard />
        </div>

        {/* Game log - could be added in the future */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "1rem",
            backgroundColor: "rgba(30, 41, 59, 0.7)",
            borderRadius: "0.5rem",
            minWidth: "200px",
            maxWidth: "250px",
            height: "100%",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              margin: "0 0 0.5rem 0",
              textAlign: "center",
              borderBottom: "1px solid rgba(100, 116, 139, 0.5)",
              paddingBottom: "0.5rem",
            }}
          >
            Game Log
          </h2>

          <div
            style={{
              fontSize: "0.9rem",
              color: "#94a3b8",
              flexGrow: 1,
              overflowY: "auto",
            }}
          >
            <p>Game started. White to move.</p>
            <p>Game log will be implemented in next steps.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
