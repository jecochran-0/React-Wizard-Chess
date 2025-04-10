import React, { useState, useEffect, useRef } from "react";
import ChessBoard from "../components/chess/ChessBoard";
import { ChessProvider, useChess } from "../context/ChessContext";
import { getSpellById } from "../utils/spells";
import { Spell, SpellId } from "../types/types";
import "../styles/SpellCard.css";
import gameBackgroundImage from "/assets/Game_Background.png";
import { useGame } from "../context/GameContext";
import { SoundProvider, useSound } from "../context/SoundContext";

// Map spell IDs to their respective image paths
const spellImageMapping: Record<string, string> = {
  astralSwap: "/assets/Chess_Spells/ChatGPT Image Apr 4, 2025, 05_35_35 PM.png",
  phantomStep: "/assets/Chess_Spells/Phantom_Step.png",
  emberCrown: "/assets/Chess_Spells/Ember_Crown.png",
  arcaneArmor: "/assets/Chess_Spells/Arcane_Anchor.png",
  mistformKnight: "/assets/Chess_Spells/Mistform_Knight.png",
  chronoRecall: "/assets/Chess_Spells/Chrono_Recall.png",
  cursedGlyph: "/assets/Chess_Spells/Cursed_Glyph.png",
  kingsGambit: "/assets/Chess_Spells/Kings_Gambit.png",
  darkConversion: "/assets/Chess_Spells/Dark_Conversion.png",
  spiritLink: "/assets/Chess_Spells/Spirit_Link.png",
  secondWind: "/assets/Chess_Spells/Second_Wind.png",
  pressureField: "/assets/Chess_Spells/Pressure_Field.png",
  nullfield: "/assets/Chess_Spells/nullfield.png",
  veilOfShadows: "/assets/Chess_Spells/Veil_Of_Shadows.png",
  bonewalker: "/assets/Chess_Spells/Raise_The_Bonewalker.png",
};

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

  const {
    playMoveSound,
    playPieceDyingSound,
    playSelectSound,
    playSpellSelectedSound,
    playKingCheckSound,
    playKingCheckmateSound,
    playSpellSound,
    isMuted,
    setIsMuted,
  } = useSound();

  const [logExpanded, setLogExpanded] = useState(true);
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [showMatchStartTransition, setShowMatchStartTransition] =
    useState(true);
  const [transitionStep, setTransitionStep] = useState(1); // 1: Show spells, 2: Show Begin, 3: Done
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const matchStartSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Set a small delay before starting the game load animations
    setTimeout(() => {
      // Play match start sound effect
      matchStartSoundRef.current = new Audio(
        "/assets/Sounds/MatchStart_effect.mp3"
      );
      matchStartSoundRef.current.volume = 0.7;
      matchStartSoundRef.current
        .play()
        .catch((e) => console.log("Cannot play match start sound:", e));

      // Transition step 1: Show spells for 2.5 seconds
      setTimeout(() => {
        // Transition step 2: Show BEGIN for 2.5 seconds
        setTransitionStep(2);

        setTimeout(() => {
          // Transition step 3: Done, show game
          setTransitionStep(3);
          setShowMatchStartTransition(false);
          setIsGameLoaded(true);

          // Now initialize and fade in game music
          audioRef.current = new Audio(
            "/assets/Sounds/wizardchess_battle_theme.mp3"
          );
          audioRef.current.loop = true;
          audioRef.current.volume = 0;

          const playPromise = audioRef.current.play();

          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.log("Audio autoplay prevented:", error);

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

          fadeInAudio();
        }, 2500); // 2.5 seconds for BEGIN display
      }, 2500); // 2.5 seconds for spells display
    }, 100);

    const fadeInAudio = () => {
      const fadeInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.volume < 0.3) {
          audioRef.current.volume += 0.01;
        } else {
          clearInterval(fadeInterval);
        }
      }, 100);
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (matchStartSoundRef.current) {
        matchStartSoundRef.current.pause();
        matchStartSoundRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    if (gameLog.length > 0) {
      const latestLog = gameLog[gameLog.length - 1];

      if (latestLog.includes("captured")) {
        playPieceDyingSound();
      } else if (latestLog.includes("check")) {
        playKingCheckSound();
      } else if (latestLog.includes("checkmate")) {
        playKingCheckmateSound();
      } else if (latestLog.includes("cast")) {
        const spellCastMatch = latestLog.match(/cast\s+(\w+)/i);
        if (spellCastMatch && spellCastMatch[1]) {
          const spellName = spellCastMatch[1].toLowerCase();

          const spellId = Object.keys(spellSoundMap).find(
            (id) =>
              id.toLowerCase().includes(spellName) ||
              spellName.includes(id.toLowerCase())
          );

          if (spellId) {
            playSpellSound(spellId as SpellId);
          }
        }
      } else if (latestLog.includes("moved")) {
        playMoveSound();
      }
    }
  }, [
    gameLog,
    playMoveSound,
    playPieceDyingSound,
    playKingCheckSound,
    playKingCheckmateSound,
    playSpellSound,
  ]);

  const spells =
    playerSpells[currentPlayer]
      ?.map((id: SpellId) => getSpellById(id))
      .filter(Boolean) || [];

  const handleSpellSelect = (spellId: SpellId) => {
    playSpellSelectedSound();

    if (selectedSpell === spellId) {
      selectSpell(null);
    } else {
      selectSpell(spellId);
    }
  };

  const handleEndTurn = () => {
    playSelectSound();
    endTurn();
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !audioRef.current.muted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  // Render match start transition
  if (showMatchStartTransition) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${gameBackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Arcane particles */}
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={`particle-${i}`}
            style={{
              position: "absolute",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 5}px`,
              height: `${2 + Math.random() * 5}px`,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              boxShadow: "0 0 10px 2px rgba(255, 255, 255, 0.6)",
              opacity: Math.random() * 0.7,
              animation: `float-particle ${
                3 + Math.random() * 5
              }s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Transition content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
          }}
        >
          {/* Step 1: Your Spells */}
          {transitionStep === 1 && (
            <>
              <h1
                style={{
                  fontSize: "4rem",
                  fontFamily: "'Cinzel', serif",
                  textAlign: "center",
                  backgroundImage:
                    "linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%, #ffe766 90%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  WebkitTextStroke: "1px rgba(255, 255, 255, 0.2)",
                  textShadow:
                    "0 0 20px rgba(255, 165, 0, 0.7), 0 0 40px rgba(255, 140, 0, 0.5)",
                  animation: "pulse-glow 2s infinite, scale-in 0.7s ease-out",
                }}
              >
                YOUR SPELLS
              </h1>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "1rem",
                  animation: "fade-in 0.7s ease-out",
                }}
              >
                {playerSpells[currentPlayer].map((spellId, index) => {
                  const spell = getSpellById(spellId);
                  return spell ? (
                    <div
                      key={spell.id}
                      style={{
                        animation: `slide-in-right 0.5s ease-out forwards ${
                          index * 0.1
                        }s`,
                        opacity: 0,
                        transform: "translateX(-50px)",
                      }}
                    >
                      <img
                        src={
                          spellImageMapping[spell.id] ||
                          `/assets/Chess_Spells/${spell.id}.png`
                        }
                        alt={spell.name}
                        style={{
                          width: "120px",
                          borderRadius: "0.5rem",
                          boxShadow: "0 0 20px rgba(255, 165, 0, 0.7)",
                        }}
                        onError={(e) => {
                          // If image fails to load, show a colored placeholder with spell name
                          const target = e.target as HTMLImageElement;
                          const canvas = document.createElement("canvas");
                          canvas.width = 120;
                          canvas.height = 168; // Approximate 2.5:3.5 aspect ratio
                          const ctx = canvas.getContext("2d");
                          if (ctx) {
                            // Draw gradient background
                            const gradient = ctx.createLinearGradient(
                              0,
                              0,
                              0,
                              canvas.height
                            );
                            gradient.addColorStop(0, "#2e1e5b");
                            gradient.addColorStop(1, "#3a3fbd");
                            ctx.fillStyle = gradient;
                            ctx.fillRect(0, 0, canvas.width, canvas.height);

                            // Draw spell name
                            ctx.fillStyle = "#ffffff";
                            ctx.font = "bold 14px Arial";
                            ctx.textAlign = "center";
                            ctx.fillText(
                              spell.name,
                              canvas.width / 2,
                              canvas.height / 2
                            );
                          }
                          target.src = canvas.toDataURL();
                        }}
                      />
                    </div>
                  ) : null;
                })}
              </div>
            </>
          )}

          {/* Step 2: Begin */}
          {transitionStep === 2 && (
            <h1
              style={{
                fontSize: "7rem",
                fontFamily: "'Cinzel', serif",
                backgroundImage:
                  "linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%, #ffe766 90%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                WebkitTextStroke: "2px rgba(255, 255, 255, 0.3)",
                textShadow:
                  "0 0 30px rgba(255, 165, 0, 0.9), 0 0 60px rgba(255, 140, 0, 0.7)",
                animation: "pulse-glow 1s infinite, scale-in 0.7s ease-out",
              }}
            >
              BEGIN!
            </h1>
          )}
        </div>

        {/* CSS Animations */}
        <style>
          {`
            @keyframes pulse-glow {
              0%, 100% { opacity: 0.9; filter: brightness(1); }
              50% { opacity: 1; filter: brightness(1.2); }
            }
            
            @keyframes scale-in {
              0% { transform: scale(0.5); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes fade-in {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            
            @keyframes slide-in-right {
              0% { transform: translateX(-50px); opacity: 0; }
              100% { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes float-particle {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-20px) scale(1.2); }
            }
          `}
        </style>
      </div>
    );
  }

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
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        {/* Game status bar - now at the top of the entire layout */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 20px",
            width: "calc(100% - 430px)", // Adjust width to match board container width
            marginBottom: "15px",
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(3px)",
            borderRadius: "8px",
            transform: isGameLoaded ? "translateY(0)" : "translateY(-20px)",
            opacity: isGameLoaded ? 1 : 0,
            transition: "transform 1s ease-out, opacity 1s ease-out",
            transitionDelay: "0.4s",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
            borderRight: "1px solid rgba(30, 30, 60, 0.4)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L70 30 L30 30 Z' stroke='rgba(255,255,255,0.05)' fill='none'/%3E%3Ccircle cx='50' cy='50' r='30' stroke='rgba(255,255,255,0.03)' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: "100px 100px",
            marginLeft: "155px", // Align with board container
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              background:
                "linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(51, 65, 85, 0.85) 100%)",
              borderRadius: "6px",
              color: "white",
              boxShadow: "0 0 10px rgba(59, 130, 246, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Arcane rune decoration */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0 L40 20 L20 40 L0 20 Z' stroke='rgba(255,255,255,0.1)' fill='none'/%3E%3C/svg%3E")`,
                backgroundSize: "20px 20px",
                opacity: 0.5,
                mixBlendMode: "overlay",
                zIndex: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: "bold",
                position: "relative",
                zIndex: 1,
              }}
            >
              Turn:
            </span>
            <span
              style={{
                fontWeight: "bold",
                backgroundColor: currentPlayer === "w" ? "#d1d5db" : "#111827",
                backgroundImage:
                  currentPlayer === "w"
                    ? "linear-gradient(135deg, #d1d5db 0%, #f9fafb 100%)"
                    : "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                color: currentPlayer === "w" ? "#1e293b" : "white",
                padding: "3px 10px",
                borderRadius: "4px",
                fontFamily: "'Cinzel', serif",
                boxShadow:
                  currentPlayer === "w"
                    ? "0 0 8px rgba(255, 255, 255, 0.5)"
                    : "0 0 8px rgba(0, 0, 0, 0.5)",
                border:
                  currentPlayer === "w"
                    ? "1px solid rgba(255, 255, 255, 0.7)"
                    : "1px solid rgba(50, 50, 50, 0.7)",
                position: "relative",
                zIndex: 1,
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
              padding: "6px 12px",
              background:
                "linear-gradient(135deg, rgba(88, 28, 135, 0.7) 0%, rgba(109, 40, 217, 0.7) 100%)",
              borderRadius: "6px",
              color: "white",
              boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Magical energy animation */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' stroke='rgba(139, 92, 246, 0.15)' fill='none'/%3E%3Ccircle cx='30' cy='30' r='15' stroke='rgba(139, 92, 246, 0.1)' fill='none'/%3E%3C/svg%3E")`,
                backgroundSize: "30px 30px",
                opacity: 0.7,
                mixBlendMode: "overlay",
                animation: "rotate-magic 10s linear infinite",
                zIndex: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: "bold",
                position: "relative",
                zIndex: 1,
              }}
            >
              Mana:
            </span>
            <span
              style={{
                background: "linear-gradient(to right, #a855f7, #d8b4fe)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                fontWeight: "bold",
                fontFamily: "'Cinzel', serif",
                textShadow: "0 0 5px rgba(168, 85, 247, 0.7)",
                fontSize: "16px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {playerMana[currentPlayer]}/10
            </span>

            <button
              onClick={toggleMute}
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
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
                background:
                  "linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(51, 65, 85, 0.85) 100%)",
              }}
              title="Toggle Sound"
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>

        {/* Main content row (contains spells, board, game log) */}
        <div
          style={{
            display: "flex",
            flex: 1,
            width: "100%",
          }}
        >
          {/* Spell cards column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "10px",
              width: "140px",
              background: "rgba(15, 23, 42, 0.3)",
              backdropFilter: "blur(3px)",
              borderRadius: "8px",
              marginRight: "15px",
              height: "auto", // Will be sized by content
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
                gap: "15px",
                paddingTop: "15px",
                paddingBottom: "15px",
              }}
            >
              {spells.map((spell, index) => {
                if (!spell) return null;

                return (
                  <div
                    key={spell.id}
                    onClick={() => handleSpellSelect(spell.id)}
                    style={{
                      opacity: isGameLoaded ? 1 : 0,
                      transition:
                        "opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease",
                      transitionDelay: `${0.6 + index * 0.1}s`,
                      cursor: "pointer",
                      position: "relative",
                      width: "100px", // Reduced width to fit better
                      boxShadow:
                        selectedSpell === spell.id
                          ? "0 0 15px 5px rgba(168, 85, 247, 0.7)"
                          : "0 4px 6px rgba(0, 0, 0, 0.3)",
                      transform:
                        selectedSpell === spell.id
                          ? "translateY(-5px)"
                          : "translateY(0)",
                      animation:
                        selectedSpell === spell.id
                          ? "pulse 1.5s infinite"
                          : "none",
                      transformOrigin: "center center",
                    }}
                    className="spell-card-hover"
                  >
                    <img
                      src={
                        spellImageMapping[spell.id] ||
                        `/assets/Chess_Spells/${spell.id}.png`
                      }
                      alt={spell.name}
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                      onError={(e) => {
                        // If image fails to load, show a colored placeholder with spell name
                        const target = e.target as HTMLImageElement;
                        const canvas = document.createElement("canvas");
                        canvas.width = 100;
                        canvas.height = 140;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                          // Draw gradient background
                          const gradient = ctx.createLinearGradient(
                            0,
                            0,
                            0,
                            canvas.height
                          );
                          gradient.addColorStop(0, "#2e1e5b");
                          gradient.addColorStop(1, "#3a3fbd");
                          ctx.fillStyle = gradient;
                          ctx.fillRect(0, 0, canvas.width, canvas.height);

                          // Draw spell name
                          ctx.fillStyle = "#ffffff";
                          ctx.font = "bold 12px Arial";
                          ctx.textAlign = "center";
                          ctx.fillText(
                            spell.name,
                            canvas.width / 2,
                            canvas.height / 2
                          );
                        }
                        target.src = canvas.toDataURL();
                      }}
                    />

                    {/* Mana cost badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        backgroundColor: "rgba(139, 92, 246, 0.9)",
                        color: "white",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "bold",
                        border: "2px solid white",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                        zIndex: 2,
                      }}
                    >
                      {spell.manaCost}
                    </div>

                    {/* Add a disabled overlay when not enough mana */}
                    {playerMana[currentPlayer] < spell.manaCost && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        Need Mana
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

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

          {/* Board container - center area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              height: "auto",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.3)",
              backdropFilter: "blur(3px)",
              borderRadius: "8px",
              padding: "15px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Chess board */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                opacity: isGameLoaded ? 1 : 0,
                transition: "opacity 1s ease-out",
                transitionDelay: "0.7s",
              }}
            >
              <div
                style={{
                  transform: "scale(1.7)",
                  transformOrigin: "center center",
                }}
              >
                <ChessBoard />
              </div>
            </div>
          </div>

          {/* Game log */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "12px",
              background:
                "linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(44, 31, 75, 0.6) 100%)",
              backdropFilter: "blur(3px)",
              width: "260px",
              color: "white",
              height: "auto", // Will match sibling's height
              transform: isGameLoaded ? "translateX(0)" : "translateX(50px)",
              opacity: isGameLoaded ? 1 : 0,
              transition: "transform 1s ease-out, opacity 1s ease-out",
              transitionDelay: "0.5s",
              borderLeft: "1px solid rgba(100, 116, 139, 0.3)",
              boxShadow: "inset 0 0 15px rgba(138, 43, 226, 0.15)",
              position: "relative",
              overflow: "hidden",
              borderRadius: "8px",
              marginLeft: "15px",
            }}
          >
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
      </div>

      <style>
        {`
          @keyframes game-entrance-particle {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: scale(3) rotate(360deg); opacity: 0; }
          }
          
          @keyframes rotate-magic {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0% { box-shadow: 0 0 8px 2px rgba(168, 85, 247, 0.7); }
            50% { box-shadow: 0 0 12px 4px rgba(168, 85, 247, 0.9); }
            100% { box-shadow: 0 0 8px 2px rgba(168, 85, 247, 0.7); }
          }
          
          .spell-card-hover {
            transition: all 0.3s ease;
            overflow: visible;
          }
          
          .spell-card-hover:hover {
            transform: translateY(-2px) scale(1.05);
            z-index: 10;
          }
          
          .spell-card-hover:hover::before {
            content: '';
            position: absolute;
            top: -8px;
            left: -8px;
            right: -8px;
            bottom: -8px;
            background: linear-gradient(45deg, rgba(138, 43, 226, 0), rgba(138, 43, 226, 0.5), rgba(138, 43, 226, 0));
            background-size: 200% 200%;
            animation: shine 1.5s linear infinite;
            border-radius: 5px;
            z-index: -1;
            opacity: 0.7;
          }
          
          .spell-card-hover:hover::after {
            content: '';
            position: absolute;
            inset: -3px;
            background: radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.3), transparent 70%);
            filter: blur(5px);
            z-index: -1;
            opacity: 0.7;
          }
          
          @keyframes shine {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
};

const Game: React.FC = () => {
  const { gameConfig } = useGame();

  return (
    <SoundProvider>
      <ChessProvider>
        <GameWithSpells selectedGameSpells={gameConfig.selectedSpells} />
      </ChessProvider>
    </SoundProvider>
  );
};

const spellIdMapping: Record<string, string> = {
  "astral-swap": "astralSwap",
  "phantom-step": "phantomStep",
  "ember-crown": "emberCrown",
  "arcane-anchor": "arcaneArmor",
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

const spellSoundMap: Record<string, string> = {
  arcaneArmor: "ArcaneAnchor_effect.mp3",
  astralSwap: "AstralSwap_effect.mp3",
  chronoRecall: "ChronoRecall_effect.mp3",
  cursedGlyph: "CursedGlyph_effect.mp3",
  darkConversion: "DarkConversion_effect.mp3",
  emberCrown: "EmberQueen_effect.mp3",
  kingsGambit: "KingsGambit_effect.mp3",
  mistformKnight: "Mistknight_effect.mp3",
  nullfield: "Nullfield_effect.mp3",
  phantomStep: "PhantomStep_Effect.mp3",
  veilOfShadows: "VeilOfShadows_effect.mp3",
};

const GameWithSpells: React.FC<{ selectedGameSpells: Spell[] }> = ({
  selectedGameSpells,
}) => {
  const { setPlayerSpells } = useChess();

  const hasProcessedSpells = React.useRef(false);

  useEffect(() => {
    if (
      selectedGameSpells &&
      selectedGameSpells.length > 0 &&
      !hasProcessedSpells.current
    ) {
      hasProcessedSpells.current = true;

      const spellIds = selectedGameSpells.map((spell) => {
        const spellId =
          spellIdMapping[spell.id] ||
          spell.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

        return spellId as SpellId;
      });

      const validSpellIds = spellIds.slice(0, 5);

      setPlayerSpells({
        w: validSpellIds,
        b: validSpellIds,
      });
    }
  }, [selectedGameSpells, setPlayerSpells]);

  return <GameContent />;
};

export default Game;
