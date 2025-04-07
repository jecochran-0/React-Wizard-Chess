import { useGame } from "../context/GameContext";
import { useChess } from "../context/ChessContext";
import ChessBoard from "../components/chess/ChessBoard";
import SpellCard from "../components/chess/SpellCard";
import { useState, useEffect } from "react";
import backgroundImage from "/assets/MainMenu_Background.png";

const Game = () => {
  const { gameConfig } = useGame();
  const { gameManager, updateCounter } = useChess();
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<"w" | "b">(
    gameManager.getCurrentPlayer()
  );

  // Update current player after each move
  useEffect(() => {
    const player = gameManager.getCurrentPlayer();
    setCurrentPlayer(player);
  }, [gameManager, updateCounter]);

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
      style={{
        height: "100vh",
        width: "100vw",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header with game info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          borderBottom: "1px solid rgba(100, 116, 139, 0.3)",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            margin: 0,
            background: "linear-gradient(135deg, #a855f7 10%, #d8b4fe 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Wizard's Chess
        </h1>

        <div style={{ display: "flex", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px",
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              borderRadius: "6px",
              color: "white",
            }}
          >
            <span>Turn:</span>
            <span
              style={{
                fontWeight: "bold",
                backgroundColor: currentPlayer === "w" ? "#d1d5db" : "white",
                color: "#1e293b",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              {currentPlayer === "w" ? "White" : "Black"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px",
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              borderRadius: "6px",
              color: "white",
            }}
          >
            <span>Mana:</span>
            <span style={{ color: "#a855f7", fontWeight: "bold" }}>
              {gameConfig.mana}/{gameConfig.maxMana}
            </span>
          </div>
        </div>
      </div>

      {/* Main game area */}
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          height: "calc(100vh - 60px)",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        {/* Spells panel - fixed width and height */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            padding: "8px",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            borderRadius: "0 0 8px 0",
            width: "110px",
            height: "360px",
            margin: "0",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: "11px",
              fontWeight: "600",
              margin: "0",
              textAlign: "center",
              borderBottom: "1px solid rgba(100, 116, 139, 0.5)",
              paddingBottom: "4px",
              marginBottom: "4px",
              color: "white",
            }}
          >
            Your Spells
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "290px",
              overflow: "hidden",
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
              padding: "4px",
              borderRadius: "4px",
              fontWeight: "600",
              border: "none",
              cursor: isPlayerTurn ? "pointer" : "not-allowed",
              marginTop: "auto",
              transition: "all 0.3s",
              fontSize: "11px",
            }}
            disabled={!isPlayerTurn}
          >
            End Turn
          </button>
        </div>

        {/* Chess board - centered */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexGrow: 1,
            padding: "10px",
          }}
        >
          <ChessBoard />
        </div>

        {/* Game log - fixed width */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "10px",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            borderRadius: "0 0 0 8px",
            width: "180px",
            margin: "0",
            color: "white",
            height: "fit-content",
          }}
        >
          <h2
            style={{
              fontSize: "14px",
              margin: "0",
              textAlign: "center",
              borderBottom: "1px solid rgba(100, 116, 139, 0.5)",
              paddingBottom: "6px",
            }}
          >
            Game Log
          </h2>

          <div
            style={{
              padding: "8px",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "4px",
              fontSize: "12px",
              maxHeight: "300px",
              overflow: "auto",
            }}
          >
            <p>Game started. White to move.</p>
            <p style={{ color: "#94a3b8", fontSize: "10px" }}>
              Game log will be implemented in next steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
