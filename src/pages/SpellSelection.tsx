import { useGame } from "../context/GameContext";
import { useState, useEffect } from "react";

// Import all spell card images
import astralSwapImg from "/assets/Chess_Spells/ChatGPT Image Apr 4, 2025, 05_35_35 PM.png";
import phantomStepImg from "/assets/Chess_Spells/Phantom_Step.png";
import emberCrownImg from "/assets/Chess_Spells/Ember_Crown.png";
import arcaneAnchorImg from "/assets/Chess_Spells/Arcane_Anchor.png";
import mistformKnightImg from "/assets/Chess_Spells/Mistform_Knight.png";
import chronoRecallImg from "/assets/Chess_Spells/Chrono_Recall.png";
import cursedGlyphImg from "/assets/Chess_Spells/Cursed_Glyph.png";
import kingsGambitImg from "/assets/Chess_Spells/Kings_Gambit.png";
import darkConversionImg from "/assets/Chess_Spells/Dark_Conversion.png";
import spiritLinkImg from "/assets/Chess_Spells/Spirit_Link.png";
import secondWindImg from "/assets/Chess_Spells/Second_Wind.png";
import pressureFieldImg from "/assets/Chess_Spells/Pressure_Field.png";
import nullfieldImg from "/assets/Chess_Spells/nullfield.png";
import veilOfShadowsImg from "/assets/Chess_Spells/Veil_Of_Shadows.png";
import bonewalkerImg from "/assets/Chess_Spells/Raise_The_Bonewalker.png";

// Map spell IDs to their respective images
const spellImages: Record<string, string> = {
  "astral-swap": astralSwapImg,
  "phantom-step": phantomStepImg,
  "ember-crown": emberCrownImg,
  "arcane-anchor": arcaneAnchorImg,
  "mistform-knight": mistformKnightImg,
  "chrono-recall": chronoRecallImg,
  "cursed-glyph": cursedGlyphImg,
  "kings-gambit": kingsGambitImg,
  "dark-conversion": darkConversionImg,
  "spirit-link": spiritLinkImg,
  "second-wind": secondWindImg,
  "pressure-field": pressureFieldImg,
  nullfield: nullfieldImg,
  "veil-shadows": veilOfShadowsImg,
  bonewalker: bonewalkerImg,
};

const SpellSelection = () => {
  const { gameConfig, availableSpells, toggleSpellSelection, startGame } =
    useGame();
  const { selectedSpells } = gameConfig;
  const [sparklePositions, setSparklePositions] = useState<
    { x: number; y: number; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    // Create random sparkle positions
    const newSparkles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: 3 + Math.random() * 5,
    }));
    setSparklePositions(newSparkles);
  }, []);

  const isSpellSelected = (spellId: string) => {
    return selectedSpells.some((spell) => spell.id === spellId);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        color: "white",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #3b0764 100%)",
        position: "relative",
        overflow: "auto",
      }}
    >
      {/* Magical overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, rgba(255, 165, 0, 0.1) 0%, transparent 70%)",
          pointerEvents: "none",
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
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Title */}
      <div
        style={{
          position: "relative",
          marginBottom: "1.5rem",
          width: "100%",
          maxWidth: "800px",
        }}
      >
        <h1
          style={{
            fontSize: "3.5rem",
            fontWeight: "bold",
            textAlign: "center",
            backgroundImage:
              "linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%, #ffe766 90%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            textShadow:
              "0 0 20px rgba(255, 165, 0, 0.7), 0 0 40px rgba(255, 140, 0, 0.5)",
            animation: "pulse-glow 3s infinite",
            margin: "0",
          }}
        >
          Choose Your Magical Spells
        </h1>
        <h2
          style={{
            fontSize: "1.5rem",
            textAlign: "center",
            backgroundImage:
              "linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            marginTop: "0.5rem",
            marginBottom: "0",
            textShadow: "0 0 10px rgba(255, 165, 0, 0.5)",
          }}
        >
          Select 5 spells from the {availableSpells.length} available
        </h2>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "120%",
            height: "120%",
            backgroundImage:
              "radial-gradient(circle, rgba(255, 165, 0, 0.3) 0%, transparent 70%)",
            filter: "blur(20px)",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Spell Cards Grid - adjust to make cards fit better */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          width: "100%",
          maxWidth: "900px",
          marginBottom: "1.5rem",
        }}
      >
        {availableSpells.map((spell) => (
          <div
            key={spell.id}
            onClick={() => toggleSpellSelection(spell)}
            style={{
              position: "relative",
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: isSpellSelected(spell.id)
                ? "translateY(-5px) scale(1.05)"
                : "translateY(0) scale(1)",
              animation: isSpellSelected(spell.id)
                ? "float 4s ease-in-out infinite"
                : "none",
            }}
          >
            {/* Card Glow Effect */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "1rem",
                boxShadow: isSpellSelected(spell.id)
                  ? "0 0 20px 5px rgba(100, 255, 100, 0.7), 0 0 40px 15px rgba(50, 205, 50, 0.4)"
                  : "0 0 15px 2px rgba(255, 215, 0, 0.6), 0 0 30px 5px rgba(255, 140, 0, 0.3)",
                opacity: isSpellSelected(spell.id) ? 1 : 0.8,
                transition: "all 0.3s ease",
                zIndex: 1,
              }}
            />

            {/* Card Image */}
            <img
              src={spellImages[spell.id]}
              alt={spell.name}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "1rem",
                position: "relative",
                zIndex: 2,
                border: isSpellSelected(spell.id)
                  ? "3px solid rgba(100, 255, 100, 0.8)"
                  : "2px solid rgba(255, 215, 0, 0.6)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
                aspectRatio: "2.5/3.5", // Keep consistent card proportions
                objectFit: "cover",
              }}
            />

            {/* Selection Checkmark */}
            {isSpellSelected(spell.id) && (
              <div
                style={{
                  position: "absolute",
                  top: "0.5rem",
                  right: "0.5rem",
                  backgroundColor: "rgba(50, 205, 50, 0.9)",
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 3,
                  boxShadow: "0 0 10px rgba(50, 205, 50, 0.8)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  width="15px"
                  height="15px"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            )}

            {/* Mana Cost */}
            <div
              style={{
                position: "absolute",
                bottom: "0.5rem",
                right: "0.5rem",
                backgroundColor: "rgba(70, 130, 180, 0.8)",
                color: "white",
                padding: "0.1rem 0.4rem",
                borderRadius: "0.3rem",
                fontSize: "0.8rem",
                fontWeight: "bold",
                zIndex: 3,
                boxShadow: "0 0 5px rgba(70, 130, 180, 0.5)",
              }}
            >
              {spell.manaCost} mana
            </div>
          </div>
        ))}
      </div>

      {/* Start Game Button */}
      <button
        onClick={startGame}
        disabled={selectedSpells.length !== 5}
        style={{
          width: "100%",
          maxWidth: "250px",
          backgroundColor:
            selectedSpells.length === 5
              ? "rgba(147, 51, 234, 0.9)"
              : "rgba(100, 100, 100, 0.7)",
          color: "white",
          padding: "0.8rem",
          borderRadius: "0.7rem",
          fontWeight: "bold",
          fontSize: "1.2rem",
          border:
            selectedSpells.length === 5
              ? "2px solid rgba(216, 180, 254, 0.6)"
              : "2px solid rgba(150, 150, 150, 0.3)",
          cursor: selectedSpells.length === 5 ? "pointer" : "not-allowed",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s",
          textShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
          boxShadow:
            selectedSpells.length === 5
              ? "0 0 20px rgba(147, 51, 234, 0.6)"
              : "none",
        }}
        onMouseOver={(e) => {
          if (selectedSpells.length === 5) {
            e.currentTarget.style.backgroundColor = "rgba(167, 71, 254, 0.9)";
            e.currentTarget.style.transform = "translateY(-3px)";
          }
        }}
        onMouseOut={(e) => {
          if (selectedSpells.length === 5) {
            e.currentTarget.style.backgroundColor = "rgba(147, 51, 234, 0.9)";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {selectedSpells.length === 5 ? (
          <>
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
            Start Game
          </>
        ) : (
          `Select ${5 - selectedSpells.length} More Spell${
            selectedSpells.length === 4 ? "" : "s"
          }`
        )}
      </button>

      {/* CSS animations */}
      <style>
        {`
          @keyframes sparkle {
            0% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0); }
          }
          
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(-5px) scale(1.05); }
            50% { transform: translateY(-10px) scale(1.05); }
          }
        `}
      </style>
    </div>
  );
};

export default SpellSelection;
