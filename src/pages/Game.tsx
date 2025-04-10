import React, { useState, useEffect, useRef } from "react";
import ChessBoard from "../components/chess/ChessBoard";
import { ChessProvider, useChess } from "../context/ChessContext";
import SpellCard from "../components/chess/SpellCard";
import { getSpellById } from "../utils/spells";
import { Spell, SpellId } from "../types/types";
import "../styles/SpellCard.css";
import gameBackgroundImage from "/assets/Game_Background.png";
import { useGame } from "../context/GameContext";

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
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Set a small timeout to allow for CSS transitions to begin
    setTimeout(() => {
      setIsGameLoaded(true);
    }, 100);

    // Initialize background music with fade-in
    audioRef.current = new Audio("/assets/Sounds/wizardchess_battle_theme.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0; // Start with 0 volume for fade-in

    const playPromise = audioRef.current.play();

    // Handle autoplay restrictions
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Audio autoplay prevented:", error);

        // Add a one-time event listener for user interaction to start audio
        const startAudio = () => {
          if (audioRef.current) {
            audioRef.current
              .play()
              .catch((e) => console.log("Still cannot play audio:", e));
            fadeInAudio();
          }
          document.removeEventListener("click", startAudio);
          document.removeEventListener("keydown", startAudio);
        };

        document.addEventListener("click", startAudio, { once: true });
        document.addEventListener("keydown", startAudio, { once: true });
      });
    }

    // Fade in the audio
    const fadeInAudio = () => {
      const fadeInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.volume < 0.6) {
          audioRef.current.volume += 0.05;
        } else {
          clearInterval(fadeInterval);
        }
      }, 100);
    };

    fadeInAudio();

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

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
        backgroundImage: `url(${gameBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: isGameLoaded ? 1 : 0,
        transition: "opacity 1.5s ease-in",
        position: "relative",
      }}
    >
      {/* Game entrance animation */}
      <div
        className="game-entrance-animation"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          opacity: isGameLoaded ? 0 : 1,
          transition: "opacity 1.5s ease-out",
        }}
      >
        {/* Magical particles for entrance */}
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={`entrance-particle-${i}`}
            style={{
              position: "absolute",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              borderRadius: "50%",
              backgroundColor: "#fff",
              boxShadow: "0 0 15px 5px rgba(135, 206, 250, 0.8)",
              opacity: 0,
              animation: `game-entrance-particle 1.5s ease-out ${
                Math.random() * 0.5
              }s forwards`,
            }}
          />
        ))}
      </div>

      {/* Arcane overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L70 30 L30 30 Z' stroke='rgba(255,255,255,0.03)' fill='none'/%3E%3Ccircle cx='50' cy='50' r='30' stroke='rgba(255,255,255,0.02)' fill='none'/%3E%3Ccircle cx='50' cy='50' r='15' stroke='rgba(255,255,255,0.03)' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: "300px 300px",
          opacity: 0.3,
          mixBlendMode: "overlay",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Header with game info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          borderBottom: "1px solid rgba(100, 116, 139, 0.3)",
          backdropFilter: "blur(5px)",
          transform: isGameLoaded ? "translateY(0)" : "translateY(-50px)",
          opacity: isGameLoaded ? 1 : 0,
          transition: "transform 1s ease-out, opacity 1s ease-out",
          zIndex: 2,
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            margin: 0,
            background:
              "linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 10px rgba(255, 165, 0, 0.3)",
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

          {/* Sound control button */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !audioRef.current.muted;
              }
            }}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
              color: "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              transition: "all 0.2s",
              padding: 0,
              fontSize: "16px",
            }}
            title="Toggle Music"
          >
            {audioRef.current?.muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {/* Main game area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 60px)",
          width: "100%",
          opacity: isGameLoaded ? 1 : 0,
          transform: isGameLoaded ? "scale(1)" : "scale(0.95)",
          transition: "opacity 1.2s ease-out, transform 1.2s ease-out",
          transitionDelay: "0.3s",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Top section containing board and game log */}
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Chess board - centered and larger */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexGrow: 1,
              padding: "10px",
              opacity: isGameLoaded ? 1 : 0,
              transform: isGameLoaded ? "scale(1)" : "scale(0.9)",
              transition: "opacity 1s ease-out, transform 1s ease-out",
              transitionDelay: "0.7s",
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
              backdropFilter: "blur(5px)",
              borderRadius: "0 0 0 8px",
              width: "180px",
              margin: "0",
              color: "white",
              height: "fit-content",
              transform: isGameLoaded ? "translateX(0)" : "translateX(50px)",
              opacity: isGameLoaded ? 1 : 0,
              transition: "transform 1s ease-out, opacity 1s ease-out",
              transitionDelay: "0.5s",
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
                  maxHeight: "400px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  fontSize: "12px",
                  marginTop: "4px",
                  opacity: isGameLoaded ? 1 : 0,
                  transition: "opacity 0.5s ease-out",
                  transitionDelay: "1s",
                }}
              >
                {gameLog.length === 0 ? (
                  <div
                    style={{
                      padding: "4px",
                      color: "rgba(255, 255, 255, 0.6)",
                      fontStyle: "italic",
                    }}
                  >
                    No moves yet
                  </div>
                ) : (
                  gameLog.map((log, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "4px",
                        backgroundColor: "rgba(100, 116, 139, 0.1)",
                        borderRadius: "4px",
                        opacity: isGameLoaded ? 1 : 0,
                        transform: isGameLoaded
                          ? "translateX(0)"
                          : "translateX(10px)",
                        transition:
                          "opacity 0.3s ease-out, transform 0.3s ease-out",
                        transitionDelay: `${1 + index * 0.05}s`,
                      }}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Spells panel - moved to bottom */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            padding: "8px",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(5px)",
            borderRadius: "8px 8px 0 0",
            margin: "0",
            transform: isGameLoaded ? "translateY(0)" : "translateY(50px)",
            opacity: isGameLoaded ? 1 : 0,
            transition: "transform 1s ease-out, opacity 1s ease-out",
            transitionDelay: "0.5s",
          }}
        >
          <h2
            style={{
              fontSize: "12px",
              fontWeight: "600",
              margin: "0",
              textAlign: "center",
              paddingRight: "12px",
              borderRight: "1px solid rgba(100, 116, 139, 0.5)",
              color: "white",
              alignSelf: "center",
            }}
          >
            Your Spells
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {spells.map((spell, index) => {
              if (!spell) return null;

              return (
                <div
                  key={spell.id}
                  style={{
                    opacity: isGameLoaded ? 1 : 0,
                    transform: isGameLoaded
                      ? "translateY(0)"
                      : "translateY(20px)",
                    transition:
                      "opacity 0.5s ease-out, transform 0.5s ease-out",
                    transitionDelay: `${0.6 + index * 0.1}s`,
                  }}
                >
                  <SpellCard
                    spell={spell}
                    isSelected={selectedSpell === spell.id}
                    isDisabled={false}
                    playerMana={playerMana[currentPlayer]}
                    onSelect={handleSpellSelect}
                  />
                </div>
              );
            })}
          </div>

          <button
            onClick={handleEndTurn}
            style={{
              backgroundColor: "rgba(147, 51, 234, 0.9)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s",
              opacity: isGameLoaded ? 1 : 0,
              transform: isGameLoaded ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "1.2s",
              marginLeft: "auto",
              alignSelf: "center",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(167, 71, 254, 0.9)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(147, 51, 234, 0.9)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            End Turn
          </button>
        </div>
      </div>

      {/* CSS animations */}
      <style>
        {`
          @keyframes game-entrance-particle {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: scale(3) rotate(360deg); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

const Game: React.FC = () => {
  const { gameConfig } = useGame();

  return (
    <ChessProvider>
      <GameWithSpells selectedGameSpells={gameConfig.selectedSpells} />
    </ChessProvider>
  );
};

// Map from kebab-case to camelCase
const spellIdMapping: Record<string, string> = {
  "astral-swap": "astralSwap",
  "phantom-step": "phantomStep",
  "ember-crown": "emberCrown",
  "arcane-anchor": "arcaneArmor", // Note: using arcaneArmor for arcane-anchor
  "mistform-knight": "mistformKnight",
  "chrono-recall": "chronoRecall",
  "cursed-glyph": "cursedGlyph",
  "kings-gambit": "kingsGambit",
  "dark-conversion": "darkConversion",
  "spirit-link": "spiritLink",
  "second-wind": "secondWind",
  "pressure-field": "pressureField",
  nullfield: "nullfield",
  "veil-shadows": "veilOfShadows",
  bonewalker: "raiseBonewalker",
};

// New component to handle setting spells
const GameWithSpells: React.FC<{ selectedGameSpells: Spell[] }> = ({
  selectedGameSpells,
}) => {
  const { setPlayerSpells } = useChess();

  // Adding a ref to track if we've already processed the spells
  const hasProcessedSpells = React.useRef(false);

  useEffect(() => {
    // Only process spells once to avoid infinite console logs and rerenders
    if (
      selectedGameSpells &&
      selectedGameSpells.length > 0 &&
      !hasProcessedSpells.current
    ) {
      // Set the flag to true so we don't reprocess
      hasProcessedSpells.current = true;

      // Convert from game spells format to chess context format
      const spellIds = selectedGameSpells.map((spell) => {
        // Use the mapping object to get the correct ID
        const spellId =
          spellIdMapping[spell.id] ||
          // Fallback to regex replacement if not in mapping
          spell.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

        return spellId as SpellId;
      });

      // Ensure we have exactly 5 spells for each player
      const validSpellIds = spellIds.slice(0, 5);

      // Set the same spells for both players for now
      setPlayerSpells({
        w: validSpellIds,
        b: validSpellIds,
      });
    }
  }, [selectedGameSpells, setPlayerSpells]);

  return <GameContent />;
};

export default Game;
