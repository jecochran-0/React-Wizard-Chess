import { useGame } from "../context/GameContext";
import { PlayerColor } from "../types/game";
import backgroundImage from "/assets/MainMenu_Background.png";
import { useState, useEffect } from "react";

const MainMenu = () => {
  const { gameConfig, selectPlayerColor, startGame } = useGame();
  const [sparklePositions, setSparklePositions] = useState<
    { x: number; y: number; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    // Create random sparkle positions
    const newSparkles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: 3 + Math.random() * 7,
    }));
    setSparklePositions(newSparkles);
  }, []);

  const handleColorSelect = (color: PlayerColor) => {
    selectPlayerColor(color);
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
      }}
    >
      {/* Magical overlay to brighten the scene */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
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
              "0 0 10px 2px rgba(255, 255, 255, 0.8), 0 0 20px 6px rgba(168, 85, 247, 0.6)",
            opacity: 0,
            animation: `sparkle 3s infinite ${sparkle.delay}s`,
          }}
        />
      ))}

      {/* Title with magical styling */}
      <div
        style={{
          position: "relative",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "5rem",
            fontWeight: "bold",
            textAlign: "center",
            backgroundImage:
              "linear-gradient(135deg, #ff9df5 10%, #c382f5 45%, #9e5ffb 70%, #eca0ff 90%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextStroke: "1px rgba(255, 255, 255, 0.2)",
            textShadow:
              "0 0 20px rgba(168, 85, 247, 0.7), 0 0 40px rgba(107, 33, 168, 0.5)",
            animation: "pulse-glow 3s infinite",
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
              "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)",
            filter: "blur(20px)",
            zIndex: -1,
          }}
        />
      </div>

      {/* Main Card with wizard-themed design */}
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background:
            "linear-gradient(135deg, rgba(116, 58, 213, 0.85) 0%, rgba(86, 11, 173, 0.9) 100%)",
          backdropFilter: "blur(8px)",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow:
            "0 0 30px rgba(138, 75, 255, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          marginBottom: "2rem",
          position: "relative",
          overflow: "hidden",
          animation: "float 6s ease-in-out infinite",
        }}
      >
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

        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background:
              "linear-gradient(45deg, transparent 48%, rgba(255, 255, 255, 0.1) 50%, transparent 52%)",
            backgroundSize: "10px 10px",
            pointerEvents: "none",
            opacity: 0.5,
          }}
        />

        <h2
          style={{
            fontSize: "1.7rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
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
            marginBottom: "1.5rem",
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
              padding: "1rem",
              borderRadius: "0.7rem",
              backgroundColor:
                gameConfig.playerColor === "w"
                  ? "rgba(255, 255, 255, 0.25)"
                  : "rgba(255, 255, 255, 0.1)",
              border:
                gameConfig.playerColor === "w"
                  ? "2px solid rgba(255, 255, 255, 0.8)"
                  : "2px solid rgba(255, 255, 255, 0.2)",
              boxShadow:
                gameConfig.playerColor === "w"
                  ? "0 0 15px rgba(255, 255, 255, 0.7), inset 0 0 10px rgba(255, 255, 255, 0.3)"
                  : "none",
              transition: "all 0.3s",
              cursor: "pointer",
              transform:
                gameConfig.playerColor === "w" ? "translateY(-4px)" : "none",
            }}
          >
            <span
              style={{
                fontSize: "2.5rem",
                marginBottom: "0.5rem",
                textShadow:
                  gameConfig.playerColor === "w"
                    ? "0 0 10px rgba(255, 255, 255, 0.7)"
                    : "none",
              }}
            >
              ♙
            </span>
            <span style={{ fontWeight: "600" }}>White</span>

            {gameConfig.playerColor === "w" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%)",
                  animation: "pulse-glow 2s infinite",
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
              padding: "1rem",
              borderRadius: "0.7rem",
              backgroundColor:
                gameConfig.playerColor === "b"
                  ? "rgba(0, 0, 0, 0.5)"
                  : "rgba(0, 0, 0, 0.3)",
              border:
                gameConfig.playerColor === "b"
                  ? "2px solid rgba(0, 0, 0, 0.8)"
                  : "2px solid rgba(0, 0, 0, 0.2)",
              boxShadow:
                gameConfig.playerColor === "b"
                  ? "0 0 15px rgba(0, 0, 0, 0.7), inset 0 0 10px rgba(148, 61, 251, 0.3)"
                  : "none",
              transition: "all 0.3s",
              cursor: "pointer",
              transform:
                gameConfig.playerColor === "b" ? "translateY(-4px)" : "none",
            }}
          >
            <span
              style={{
                fontSize: "2.5rem",
                marginBottom: "0.5rem",
                textShadow:
                  gameConfig.playerColor === "b"
                    ? "0 0 10px rgba(148, 61, 251, 0.7)"
                    : "none",
              }}
            >
              ♟
            </span>
            <span style={{ fontWeight: "600" }}>Black</span>

            {gameConfig.playerColor === "b" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at center, rgba(148, 61, 251, 0.2) 0%, transparent 70%)",
                  animation: "pulse-glow 2s infinite",
                }}
              />
            )}
          </button>
        </div>

        <button
          onClick={startGame}
          style={{
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            color: "white",
            padding: "0.9rem 1rem",
            borderRadius: "0.7rem",
            fontWeight: "bold",
            fontSize: "1.1rem",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s",
            textShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
            e.currentTarget.style.boxShadow =
              "0 0 15px rgba(168, 85, 247, 0.7)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-180%",
              left: "-50%",
              width: "200%",
              height: "200%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              transform: "rotate(45deg)",
              transition: "all 0.7s",
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
          backgroundColor: "rgba(118, 74, 188, 0.5)",
          backdropFilter: "blur(5px)",
          padding: "1.5rem",
          borderRadius: "0.75rem",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 20px rgba(107, 33, 168, 0.3)",
        }}
      >
        <h3
          style={{
            fontWeight: "bold",
            marginBottom: "0.75rem",
            color: "#ffffff",
            fontSize: "1.3rem",
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

      {/* CSS animations */}
      <style>
        {`
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
        `}
      </style>
    </div>
  );
};

export default MainMenu;
