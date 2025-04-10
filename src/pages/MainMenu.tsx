import { useGame } from "../context/GameContext";
import { PlayerColor } from "../types/game";
import backgroundImage from "/assets/MainMenu_Background.png";
import { useState, useEffect, useRef } from "react";

const MainMenu = () => {
  const { gameConfig, selectPlayerColor, startGame } = useGame();
  const [sparklePositions, setSparklePositions] = useState<
    { x: number; y: number; delay: number; size: number }[]
  >([]);
  const [manaPositions, setManaPositions] = useState<
    { x: number; y: number; delay: number; size: number; color: string }[]
  >([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Create random sparkle positions with constraints to prevent overflow
    const newSparkles = Array.from({ length: 20 }, () => ({
      x: 5 + Math.random() * 90, // Keep within 5-95% range
      y: 5 + Math.random() * 90, // Keep within 5-95% range
      delay: Math.random() * 3,
      size: 3 + Math.random() * 7,
    }));
    setSparklePositions(newSparkles);

    // Create floating mana orbs with constraints
    const newManaOrbs = Array.from({ length: 15 }, () => ({
      x: 5 + Math.random() * 90, // Keep within 5-95% range
      y: 5 + Math.random() * 90, // Keep within 5-95% range
      delay: Math.random() * 5,
      size: 5 + Math.random() * 10,
      color: getRandomManaColor(),
    }));
    setManaPositions(newManaOrbs);

    // Initialize background music
    audioRef.current = new Audio("/assets/Sounds/wizardchess_theme.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.6; // Set initial volume to 60%

    // Try to play automatically
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
          }
          document.removeEventListener("click", startAudio);
          document.removeEventListener("keydown", startAudio);
        };

        document.addEventListener("click", startAudio, { once: true });
        document.addEventListener("keydown", startAudio, { once: true });
      });
    }

    // Cleanup function to stop audio when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const getRandomManaColor = () => {
    const colors = [
      "rgba(46, 30, 91, 0.7)", // Deep indigo
      "rgba(58, 63, 189, 0.7)", // Sapphire
      "rgba(168, 74, 47, 0.7)", // Ember glow
      "rgba(89, 46, 131, 0.7)", // Rich purple
      "rgba(206, 146, 49, 0.7)", // Gold amber
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleColorSelect = (color: PlayerColor) => {
    selectPlayerColor(color);
  };

  // Toggle mute function
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        color: "white",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        overflow: "hidden", // Prevent scrollbars
      }}
    >
      {/* Top left icons */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          left: "15px",
          display: "flex",
          gap: "10px",
          zIndex: 10,
        }}
      >
        <button
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
          title="Settings"
          onClick={() => console.log("Settings clicked")}
        >
          ⚙️
        </button>
        <button
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
          title="Language"
          onClick={() => console.log("Language clicked")}
        >
          🌐
        </button>
        <button
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
          title={isMuted ? "Unmute Music" : "Mute Music"}
          onClick={toggleMute}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* Ancient arcane overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.25)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L70 30 L30 30 Z' stroke='rgba(255,255,255,0.05)' fill='none'/%3E%3Ccircle cx='50' cy='50' r='30' stroke='rgba(255,255,255,0.03)' fill='none'/%3E%3Ccircle cx='50' cy='50' r='15' stroke='rgba(255,255,255,0.05)' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: "300px 300px",
          opacity: 0.4,
          mixBlendMode: "overlay",
        }}
      />

      {/* Magical sparkles */}
      {sparklePositions.map((sparkle, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: `${sparkle.y}%`,
            left: `${sparkle.x}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            borderRadius: "50%",
            backgroundColor: "#fff",
            boxShadow:
              "0 0 10px 2px rgba(255, 255, 255, 0.8), 0 0 20px 6px rgba(255, 160, 10, 0.6)",
            opacity: 0,
            animation: `sparkle 3s infinite ${sparkle.delay}s`,
            zIndex: 1,
          }}
        />
      ))}

      {/* Floating mana orbs */}
      {manaPositions.map((mana, index) => (
        <div
          key={`mana-${index}`}
          style={{
            position: "absolute",
            top: `${mana.y}%`,
            left: `${mana.x}%`,
            width: `${mana.size}px`,
            height: `${mana.size}px`,
            borderRadius: "50%",
            backgroundColor: mana.color,
            boxShadow: `0 0 10px 2px ${
              mana.color
            }, 0 0 20px 6px ${mana.color.replace("0.7", "0.3")}`,
            opacity: 0.7,
            animation: `float-up 10s infinite ${mana.delay}s`,
            zIndex: 0,
          }}
        />
      ))}

      {/* Title with magical styling */}
      <div
        style={{
          position: "relative",
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "5rem",
            fontWeight: "bold",
            textAlign: "center",
            fontFamily: "'Cinzel', serif",
            backgroundImage:
              "linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%, #ffe766 90%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextStroke: "1px rgba(255, 255, 255, 0.2)",
            textShadow:
              "0 0 20px rgba(255, 165, 0, 0.7), 0 0 40px rgba(255, 140, 0, 0.5)",
            animation: "magical-swirl 10s infinite", // Removed pulse-glow animation
            position: "relative",
          }}
        >
          Wizard's Chess
        </h1>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "120%",
            height: "120%",
            backgroundImage:
              "radial-gradient(circle, rgba(255, 165, 0, 0.4) 0%, transparent 70%)",
            filter: "blur(20px)",
            zIndex: -1,
          }}
        />
      </div>

      {/* Main Card with arcane-themed design */}
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background:
            "linear-gradient(135deg, rgba(46, 30, 91, 0.85) 0%, rgba(58, 63, 189, 0.7) 100%)",
          backdropFilter: "blur(8px)",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow:
            "0 0 30px rgba(58, 63, 189, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          marginBottom: "1.5rem",
          position: "relative",
          overflow: "hidden",
          animation: "float 6s ease-in-out infinite",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L90 50 L70 90 L30 90 L10 50 L30 10 L70 10 L90 50 Z' stroke='rgba(255,255,255,0.07)' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: "100px 100px",
        }}
      >
        {/* Ancient rune frame border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius: "1rem",
            border: "8px solid transparent",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L40 0 L40 40 L0 40 Z' stroke='rgba(255,255,255,0.1)' fill='none' stroke-dasharray='2 4'/%3E%3C/svg%3E")`,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0",
            opacity: 0.5,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />

        {/* Magical card effects */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background:
              "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 60%)",
            transform: "rotate(-15deg)",
            pointerEvents: "none",
          }}
        />

        <h2
          style={{
            fontSize: "1.7rem",
            fontFamily: "'Cinzel', serif",
            fontWeight: "bold",
            marginBottom: "1.2rem",
            textAlign: "center",
            position: "relative",
            color: "#ffffff",
            textShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
          }}
        >
          Choose Your Side
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1.2rem",
            position: "relative",
          }}
        >
          <button
            onClick={() => handleColorSelect("w")}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "0.8rem",
              borderRadius: "0.7rem",
              backgroundColor:
                gameConfig.playerColor === "w"
                  ? "rgba(220, 240, 255, 0.15)"
                  : "rgba(255, 255, 255, 0.1)",
              border:
                gameConfig.playerColor === "w"
                  ? "2px solid rgba(220, 240, 255, 0.6)"
                  : "2px solid rgba(255, 255, 255, 0.2)",
              boxShadow:
                gameConfig.playerColor === "w"
                  ? "0 0 12px rgba(135, 206, 250, 0.5), inset 0 0 10px rgba(220, 240, 255, 0.2)"
                  : "none",
              transition: "all 0.3s",
              cursor: "pointer",
              transform:
                gameConfig.playerColor === "w" ? "translateY(-4px)" : "none",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {gameConfig.playerColor === "w" && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "100%",
                  background:
                    "linear-gradient(180deg, rgba(220,240,255,0.15) 0%, rgba(220,240,255,0) 70%)",
                  opacity: 0.6,
                  pointerEvents: "none",
                }}
              />
            )}
            {gameConfig.playerColor === "w" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "0.6rem",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background:
                    "repeating-linear-gradient(45deg, rgba(135,206,250,0.05), rgba(135,206,250,0.05) 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px)",
                  opacity: 0.5,
                  pointerEvents: "none",
                }}
              />
            )}
            <span
              style={{
                fontSize: "2.5rem",
                marginBottom: "0.5rem",
                color: gameConfig.playerColor === "w" ? "#ffffff" : "#dddddd",
                textShadow:
                  gameConfig.playerColor === "w"
                    ? "0 0 8px rgba(135, 206, 250, 0.8), 0 0 2px rgba(255, 255, 255, 0.9)"
                    : "none",
                position: "relative",
                zIndex: 2,
              }}
            >
              ♙
            </span>
            <span
              style={{
                fontWeight: "600",
                position: "relative",
                zIndex: 2,
                color: gameConfig.playerColor === "w" ? "#ffffff" : "#dddddd",
                textShadow:
                  gameConfig.playerColor === "w"
                    ? "0 0 4px rgba(0, 0, 0, 0.5)"
                    : "none",
              }}
            >
              White
            </span>

            {gameConfig.playerColor === "w" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "0.7rem",
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(135, 206, 250, 0.15) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            )}
            {gameConfig.playerColor === "w" && (
              <div
                style={{
                  position: "absolute",
                  width: "150%",
                  height: "8px",
                  bottom: "-4px",
                  left: "-25%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(135, 206, 250, 0.5) 50%, transparent)",
                  animation: "light-sweep 2s infinite",
                  pointerEvents: "none",
                }}
              />
            )}
          </button>

          <button
            onClick={() => handleColorSelect("b")}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "0.8rem",
              borderRadius: "0.7rem",
              backgroundColor:
                gameConfig.playerColor === "b"
                  ? "rgba(20, 20, 35, 0.8)"
                  : "rgba(0, 0, 0, 0.3)",
              border:
                gameConfig.playerColor === "b"
                  ? "2px solid rgba(20, 20, 35, 0.9)"
                  : "2px solid rgba(0, 0, 0, 0.2)",
              boxShadow:
                gameConfig.playerColor === "b"
                  ? "0 0 12px rgba(30, 0, 60, 0.5), inset 0 0 8px rgba(75, 0, 130, 0.3)"
                  : "none",
              transition: "all 0.3s",
              cursor: "pointer",
              transform:
                gameConfig.playerColor === "b" ? "translateY(-4px)" : "none",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {gameConfig.playerColor === "b" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0, rgba(0,0,0,0) 5px, rgba(75,0,130,0.05) 5px, rgba(75,0,130,0.05) 10px)",
                  opacity: 0.5,
                  pointerEvents: "none",
                }}
              />
            )}
            {gameConfig.playerColor === "b" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "0.6rem",
                  border: "1px solid rgba(0,0,0,0.7)",
                  opacity: 0.8,
                  pointerEvents: "none",
                }}
              />
            )}
            <span
              style={{
                fontSize: "2.5rem",
                marginBottom: "0.5rem",
                color: gameConfig.playerColor === "b" ? "#ffffff" : "#dddddd",
                textShadow:
                  gameConfig.playerColor === "b"
                    ? "0 0 8px rgba(75, 0, 130, 0.8), 0 0 2px rgba(0, 0, 0, 0.9)"
                    : "none",
                position: "relative",
                zIndex: 2,
              }}
            >
              ♟
            </span>
            <span
              style={{
                fontWeight: "600",
                position: "relative",
                zIndex: 2,
                color: gameConfig.playerColor === "b" ? "#ffffff" : "#dddddd",
                textShadow:
                  gameConfig.playerColor === "b"
                    ? "0 0 4px rgba(0, 0, 0, 0.7)"
                    : "none",
              }}
            >
              Black
            </span>

            {gameConfig.playerColor === "b" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "0.7rem",
                  background:
                    "radial-gradient(circle at 70% 30%, rgba(75, 0, 130, 0.2) 0%, rgba(0, 0, 0, 0.1) 70%)",
                  pointerEvents: "none",
                }}
              />
            )}
            {gameConfig.playerColor === "b" && (
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, transparent 0%, rgba(75, 0, 130, 0.15) 50%, transparent 100%)",
                  animation: "shadow-move 3s infinite alternate",
                  pointerEvents: "none",
                }}
              />
            )}
          </button>
        </div>

        <button
          onClick={startGame}
          className="begin-journey-btn"
          style={{
            width: "100%",
            backgroundColor: "rgba(168, 74, 47, 0.7)",
            color: "white",
            padding: "0.9rem 1rem",
            borderRadius: "0.7rem",
            fontWeight: "bold",
            fontSize: "1.1rem",
            fontFamily: "'Cinzel', serif",
            border: "2px solid rgba(255, 200, 120, 0.3)",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s",
            textShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
            animation: "button-pulse 5s infinite",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(168, 74, 47, 0.9)";
            e.currentTarget.style.boxShadow =
              "0 0 15px rgba(255, 160, 10, 0.7)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(168, 74, 47, 0.7)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div
            className="button-shine"
            style={{
              position: "absolute",
              top: "-180%",
              left: "-50%",
              width: "200%",
              height: "200%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              transform: "rotate(45deg)",
              transition: "all 0.7s",
              animation: "button-sheen 5s infinite",
            }}
          />
          Begin Your Journey
        </button>
      </div>

      {/* How to Play section with magical styling */}
      <div
        style={{
          maxWidth: "450px",
          textAlign: "center",
          color: "#ffffff",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(5px)",
          padding: "1.5rem",
          borderRadius: "0.75rem",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 20px rgba(46, 30, 91, 0.3)",
          opacity: 0.9,
        }}
      >
        <h3
          style={{
            fontWeight: "bold",
            marginBottom: "0.75rem",
            color: "#ffffff",
            fontSize: "1.3rem",
            fontFamily: "'Cinzel', serif",
            textShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
          }}
        >
          How to Play
        </h3>
        <p
          style={{
            lineHeight: "1.6",
            textShadow: "0 0 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          Wizard's Chess combines traditional chess with magical spells. Choose
          your side, select your arcane abilities, and outwit your opponent with
          strategy and sorcery. Each turn, you'll gain 1 mana (up to 15) to cast
          powerful spells that can turn the tide of battle.
        </p>
      </div>

      {/* Copyright info */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "15px",
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        © 2025 WizardWorks
      </div>

      {/* CSS animations */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Uncial+Antiqua&display=swap');
          
          @keyframes sparkle {
            0% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0); }
          }
          
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes float-up {
            0% { transform: translateY(10px); opacity: 0.1; }
            50% { opacity: 0.7; }
            100% { transform: translateY(-10px); opacity: 0.1; }
          }
          
          @keyframes magical-swirl {
            0% { filter: hue-rotate(0deg) brightness(1); }
            50% { filter: hue-rotate(10deg) brightness(1.1); }
            100% { filter: hue-rotate(0deg) brightness(1); }
          }
          
          @keyframes button-pulse {
            0%, 100% { box-shadow: 0 0 10px rgba(255, 165, 0, 0.4); }
            50% { box-shadow: 0 0 20px rgba(255, 165, 0, 0.7); }
          }
          
          @keyframes button-sheen {
            0% { left: -50%; top: -180%; }
            33% { left: 150%; top: 60%; }
            100% { left: 150%; top: 60%; }
          }
          
          @keyframes light-sweep {
            0% { transform: translateX(-100%) scaleX(0.5); opacity: 0; }
            50% { transform: translateX(0%) scaleX(1); opacity: 0.7; }
            100% { transform: translateX(100%) scaleX(0.5); opacity: 0; }
          }
          
          @keyframes shadow-move {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
          }
          
          .begin-journey-btn:hover .button-shine {
            top: 60%;
            left: 150%;
            transition: all 0.7s;
          }
        `}
      </style>
    </div>
  );
};

export default MainMenu;
