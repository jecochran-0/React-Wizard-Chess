import React, { useState } from "react";
import ChessBoard from "../components/chess/ChessBoard";
import { ChessProvider, useChess } from "../context/ChessContext";
import SpellCard from "../components/chess/SpellCard";
import { getSpellById } from "../utils/spells";
import { Spell, SpellId } from "../types/types";
import "../styles/SpellCard.css";
import backgroundImage from "/assets/MainMenu_Background.png";

const GameContent: React.FC = () => {
  const {
    currentPlayer,
    playerMana,
    playerSpells,
    selectedSpell,
    selectSpell,
    endTurn,
    gameLog,
  } = useChess();

  const [logExpanded, setLogExpanded] = useState(true);

  // Get spell objects from spell IDs
  const spells =
    playerSpells[currentPlayer]
      ?.map((id: SpellId) => getSpellById(id))
      .filter(Boolean) || [];

  // Handle spell selection
  const handleSpellSelect = (spellId: SpellId) => {
    if (selectedSpell === spellId) {
      // Deselect if already selected
      selectSpell(null);
    } else {
      selectSpell(spellId);
    }
  };

  // Handle end turn button click
  const handleEndTurn = () => {
    endTurn();
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
                backgroundColor: currentPlayer === "w" ? "#d1d5db" : "black",
                color: currentPlayer === "w" ? "#1e293b" : "white",
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
              {playerMana[currentPlayer]}/10
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
        {/* Spells panel - fixed width */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            padding: "8px",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            borderRadius: "0 0 8px 0",
            width: "110px",
            margin: "0",
            height: "fit-content",
          }}
        >
          <h2
            style={{
              fontSize: "12px",
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
              alignItems: "center",
              gap: "8px",
            }}
          >
            {spells.map(
              (spell: Spell) =>
                spell && (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    isSelected={selectedSpell === spell.id}
                    isDisabled={false}
                    playerMana={playerMana[currentPlayer]}
                    onSelect={handleSpellSelect}
                  />
                )
            )}
          </div>

          <button
            onClick={handleEndTurn}
            style={{
              backgroundColor: "rgba(147, 51, 234, 0.9)",
              color: "white",
              padding: "8px",
              borderRadius: "4px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              marginTop: "12px",
              transition: "all 0.3s",
            }}
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
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
            }}
            onClick={() => setLogExpanded(!logExpanded)}
          >
            Game Log
            <span>{logExpanded ? "▲" : "▼"}</span>
          </h2>

          {logExpanded && (
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
              {gameLog.length > 0 ? (
                gameLog.map((entry, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "4px",
                      padding: "2px 0",
                      borderBottom:
                        index < gameLog.length - 1
                          ? "1px solid rgba(100, 116, 139, 0.2)"
                          : "none",
                    }}
                  >
                    {entry}
                  </div>
                ))
              ) : (
                <p>Game started. White to move.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Game: React.FC = () => {
  return (
    <ChessProvider>
      <GameContent />
    </ChessProvider>
  );
};

export default Game;
