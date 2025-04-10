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

      {/* Main game area */}
      <div
        style={{
          display: "flex",
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
        {/* Spells panel - moved to left side */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "10px",
            width: "200px",
            margin: "0",
            height: "100%",
            transform: isGameLoaded ? "translateX(0)" : "translateX(-50px)",
            opacity: isGameLoaded ? 1 : 0,
            transition: "transform 1s ease-out, opacity 1s ease-out",
            transitionDelay: "0.5s",
            borderRight: "1px solid rgba(100, 116, 139, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-around",
              gap: "30px",
              flexGrow: 1,
              paddingTop: "20px",
              paddingBottom: "20px",
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
                      ? "scale(1.2)"
                      : "translateY(20px) scale(1.2)",
                    transition:
                      "opacity 0.5s ease-out, transform 0.5s ease-out",
                    transitionDelay: `${0.6 + index * 0.1}s`,
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <SpellCard
                    spell={spell}
                    isSelected={selectedSpell === spell.id}
                    isDisabled={false}
                    playerMana={playerMana[currentPlayer]}
                    onSelect={handleSpellSelect}
                    showText={false}
                  />
                </div>
              );
            })}
          </div>

          {/* Keyboard shortcut for ending turn - visually hidden but functional */}
          <button
            onClick={handleEndTurn}
            aria-label="End Turn"
            title="Press to end turn"
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              padding: 0,
              margin: "-1px",
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            End Turn
          </button>
        </div>

        {/* Center column with chess board */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Game board with header - moved together */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "all 0.5s ease-out",
              transform: isGameLoaded ? "scale(1)" : "scale(0.9)",
              width: "90%",
              maxWidth: "900px",
            }}
          >
            {/* Game info header - attached to the board */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 20px",
                width: "100%",
                marginBottom: "8px",
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(3px)",
                borderRadius: "8px 8px 0 0",
                transform: isGameLoaded ? "translateY(0)" : "translateY(-20px)",
                opacity: isGameLoaded ? 1 : 0,
                transition: "transform 1s ease-out, opacity 1s ease-out",
                transitionDelay: "0.4s",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                borderRight: "1px solid rgba(30, 30, 60, 0.4)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              }}
            >
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
                    backgroundColor:
                      currentPlayer === "w" ? "#d1d5db" : "black",
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

            {/* Chess board - centered */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "85vh",
                opacity: isGameLoaded ? 1 : 0,
                transition: "opacity 1s ease-out",
                transitionDelay: "0.7s",
              }}
            >
              <div
                style={{
                  transform: "scale(1.8)",
                  transformOrigin: "center center",
                  maxHeight: "85vh",
                }}
              >
                <ChessBoard />
              </div>
            </div>
          </div>
        </div>

        {/* Game log - with magical theme */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "12px",
            background:
              "linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(44, 31, 75, 0.6) 100%)",
            backdropFilter: "blur(3px)",
            width: "180px",
            margin: "10px 10px 10px 0",
            color: "white",
            height: "calc(100% - 20px)",
            maxHeight: "calc(100vh - 80px)",
            transform: isGameLoaded ? "translateX(0)" : "translateX(50px)",
            opacity: isGameLoaded ? 1 : 0,
            transition: "transform 1s ease-out, opacity 1s ease-out",
            transitionDelay: "0.5s",
            borderLeft: "1px solid rgba(100, 116, 139, 0.3)",
            boxShadow: "inset 0 0 15px rgba(138, 43, 226, 0.15)",
            position: "relative",
            overflow: "hidden",
            borderRadius: "8px 0 0 8px",
          }}
        >
          {/* Magical overlay for game log */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' stroke='rgba(138, 43, 226, 0.1)' fill='none' stroke-dasharray='5 3'/%3E%3Ccircle cx='50' cy='50' r='30' stroke='rgba(138, 43, 226, 0.07)' fill='none'/%3E%3C/svg%3E")`,
              backgroundSize: "200px 200px",
              zIndex: -1,
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />

          <h2
            style={{
              fontSize: "14px",
              margin: "0 0 12px 0",
              textAlign: "center",
              padding: "6px 0",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              color: "rgba(255, 255, 255, 0.9)",
              fontFamily: "'Cinzel', serif",
              background:
                "linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.2), transparent)",
              borderBottom: "1px solid rgba(138, 43, 226, 0.3)",
              position: "relative",
              textShadow: "0 0 8px rgba(138, 43, 226, 0.5)",
            }}
            onClick={() => setLogExpanded(!logExpanded)}
          >
            <span style={{ margin: "0 auto" }}>Game Log</span>
            <span style={{ position: "absolute", right: "0" }}>
              {logExpanded ? "▲" : "▼"}
            </span>
          </h2>

          {logExpanded && (
            <div
              style={{
                flexGrow: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "12px",
                opacity: isGameLoaded ? 1 : 0,
                transition: "opacity 0.5s ease-out",
                transitionDelay: "1s",
                height: "100%",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(138, 43, 226, 0.3) transparent",
                padding: "0 4px",
              }}
            >
              {gameLog.length === 0 ? (
                <div
                  style={{
                    padding: "8px",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontStyle: "italic",
                    textAlign: "center",
                    background: "rgba(0, 0, 0, 0.2)",
                    borderRadius: "4px",
                    border: "1px dashed rgba(138, 43, 226, 0.2)",
                  }}
                >
                  No moves yet
                </div>
              ) : (
                gameLog.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "4px",
                      opacity: isGameLoaded ? 1 : 0,
                      transform: isGameLoaded
                        ? "translateX(0)"
                        : "translateX(10px)",
                      transition:
                        "opacity 0.3s ease-out, transform 0.3s ease-out",
                      transitionDelay: `${1 + index * 0.05}s`,
                      background: "rgba(15, 23, 42, 0.3)",
                      borderLeft:
                        index % 2 === 0
                          ? "2px solid rgba(138, 43, 226, 0.4)"
                          : "2px solid rgba(65, 105, 225, 0.4)",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                      marginBottom: "2px",
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
