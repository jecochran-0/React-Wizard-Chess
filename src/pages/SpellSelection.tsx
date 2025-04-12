import { useGame } from "../context/GameContext";
import { useState, useEffect, useRef } from "react";

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
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionParticles, setTransitionParticles] = useState<
    {
      x: number;
      y: number;
      size: number;
      delay: number;
      duration: number;
      color: string;
    }[]
  >([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create random sparkle positions
    const newSparkles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: 3 + Math.random() * 5,
    }));
    setSparklePositions(newSparkles);

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

    // Set page as loaded to trigger animations
    setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const isSpellSelected = (spellId: string) => {
    return selectedSpells.some((spell) => spell.id === spellId);
  };

  // Return random entrance values for each card
  const getRandomEntrance = (index: number) => {
    // Define entrance patterns with more variety and arc paths
    const entrances = [
      {
        x: "-120vw",
        y: "10vh",
        rotate: "-20deg",
        scale: 0.6,
        delay: 0.05 * index,
      }, // From left
      {
        x: "120vw",
        y: "-5vh",
        rotate: "15deg",
        scale: 0.7,
        delay: 0.05 * index,
      }, // From right
      {
        x: "10vw",
        y: "-120vh",
        rotate: "-5deg",
        scale: 0.8,
        delay: 0.05 * index,
      }, // From top
      {
        x: "-20vw",
        y: "120vh",
        rotate: "10deg",
        scale: 0.5,
        delay: 0.05 * index,
      }, // From bottom
      {
        x: "-110vw",
        y: "-110vh",
        rotate: "-30deg",
        scale: 0.6,
        delay: 0.05 * index,
      }, // From top-left
      {
        x: "110vw",
        y: "-110vh",
        rotate: "30deg",
        scale: 0.7,
        delay: 0.05 * index,
      }, // From top-right
      {
        x: "-110vw",
        y: "110vh",
        rotate: "20deg",
        scale: 0.7,
        delay: 0.05 * index,
      }, // From bottom-left
      {
        x: "110vw",
        y: "110vh",
        rotate: "-25deg",
        scale: 0.6,
        delay: 0.05 * index,
      }, // From bottom-right
    ];

    // Select a random entrance pattern with some variety
    const entranceIndex = Math.floor(
      (index + Math.floor(Math.random() * 3)) % entrances.length
    );
    return entrances[entranceIndex];
  };

  // Return a random mana color for effects
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

  // Handle start game with transition effect
  const handleStartGame = () => {
    if (selectedSpells.length !== 5 || isTransitioning) return;

    // Play SpellsSelected effect sound
    const spellsSelectedSound = new Audio(
      "/assets/Sounds/SpellsSelected_effect.mp3"
    );
    spellsSelectedSound.volume = 0.8;
    spellsSelectedSound
      .play()
      .catch((e) => console.log("Cannot play spell selection sound:", e));

    // Generate transition particles
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 8,
      delay: Math.random() * 0.5,
      duration: 0.5 + Math.random() * 1,
      color: getRandomManaColor().replace("0.7", "0.9"),
    }));
    setTransitionParticles(particles);

    // Start transition
    setIsTransitioning(true);

    // Play transition sound if needed
    if (audioRef.current && !audioRef.current.muted) {
      const transitionSound = new Audio("/assets/Sounds/spell_cast_major.mp3");
      transitionSound.volume = 0.4;
      transitionSound
        .play()
        .catch((e) => console.log("Cannot play transition sound:", e));
    }

    // We're keeping the battle theme playing at its current volume
    // instead of fading it out, so it continues into the game screen

    // Wait for animation to complete then navigate
    setTimeout(() => {
      startGame(); // This will change the gameState to 'game'
    }, 1500); // Match this time with the CSS animation duration
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
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.85) 50%, rgba(59, 7, 100, 0.85) 100%), url("/assets/MainMenu_Background.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        overflow: "hidden", // Changed from auto to hidden for better animations
        opacity: isPageLoaded ? 1 : 0,
        transition: "opacity 1s ease-in",
      }}
    >
      {/* Ancient arcane overlay - matches main menu */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L70 30 L30 30 Z' stroke='rgba(255,255,255,0.05)' fill='none'/%3E%3Ccircle cx='50' cy='50' r='30' stroke='rgba(255,255,255,0.03)' fill='none'/%3E%3Ccircle cx='50' cy='50' r='15' stroke='rgba(255,255,255,0.05)' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: "300px 300px",
          opacity: 0.4,
          mixBlendMode: "overlay",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Golden magical overlay - like main menu */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, rgba(255, 165, 0, 0.15) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
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

      {/* Title with magical fade-in - updated to match main menu style */}
      <div
        style={{
          position: "relative",
          marginBottom: "2.5rem",
          width: "100%",
          maxWidth: "800px",
          opacity: isPageLoaded ? 1 : 0,
          transform: isPageLoaded ? "translateY(0)" : "translateY(-50px)",
          transition: "opacity 1.5s ease-out, transform 1.5s ease-out",
        }}
      >
        <h1
          style={{
            fontSize: "4rem",
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
            animation: "magical-swirl 10s infinite",
            margin: "0",
            position: "relative",
          }}
        >
          Choose Your Magical Spells
        </h1>
        <h2
          style={{
            fontSize: "1.5rem",
            textAlign: "center",
            fontFamily: "'Cinzel', serif",
            backgroundImage:
              "linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            marginTop: "1rem",
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

      {/* Main Card with arcane-themed design - similar to main menu */}
      <div
        style={{
          width: "100%",
          maxWidth: "950px",
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

        {/* Spell Cards Grid - with fly-in animations */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
            width: "100%",
            marginBottom: "1.5rem",
            perspective: "1500px", // Enhanced 3D perspective for cards
            transformStyle: "preserve-3d",
          }}
        >
          {availableSpells.map((spell, index) => {
            const entrance = getRandomEntrance(index);

            return (
              <div
                key={spell.id}
                onClick={() => toggleSpellSelection(spell)}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  transition: isPageLoaded
                    ? "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)"
                    : "none",
                  transform: isPageLoaded
                    ? isSpellSelected(spell.id)
                      ? "translateY(-5px) scale(1.05) rotateY(0deg)"
                      : "translateY(0) scale(1) rotateY(0deg)"
                    : `translate3d(${entrance.x}, ${entrance.y}, 0) rotate(${entrance.rotate}) scale(${entrance.scale})`,
                  opacity: isPageLoaded ? 1 : 0,
                  animation:
                    isPageLoaded && isSpellSelected(spell.id)
                      ? "float 4s ease-in-out infinite"
                      : "none",
                  transitionDelay: `${entrance.delay + Math.random() * 0.1}s`,
                  transformOrigin: "center center",
                  willChange: "transform, opacity", // Performance hint
                  zIndex: isPageLoaded ? 2 : 1, // Higher z-index during animation
                }}
                className={`spell-card ${
                  isSpellSelected(spell.id) ? "selected" : ""
                }`}
              >
                {/* Arcane Rune Circle - appears when selected */}
                {isSpellSelected(spell.id) && (
                  <div
                    style={{
                      position: "absolute",
                      inset: "-15px",
                      borderRadius: "50%",
                      background: "transparent",
                      border: "2px solid rgba(100, 255, 100, 0.4)",
                      zIndex: 0,
                      animation: "rotate-rune 8s linear infinite",
                    }}
                  />
                )}

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

                {/* Magic trail during animation */}
                {!isPageLoaded && (
                  <div
                    className="magic-trail"
                    style={{
                      position: "absolute",
                      inset: "-30px",
                      borderRadius: "1.5rem",
                      background: `linear-gradient(to bottom, transparent, ${
                        index % 2 === 0
                          ? "rgba(255, 215, 0, 0.3)"
                          : "rgba(147, 51, 234, 0.3)"
                      })`,
                      filter: "blur(10px)",
                      opacity: 0.6,
                      zIndex: 0,
                      transformOrigin: "center center",
                    }}
                  />
                )}

                {/* Magic Particles - appear when hovering */}
                <div className="magic-particles"></div>

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
                    transform: isPageLoaded
                      ? "rotateY(0deg)"
                      : "rotateY(180deg)",
                    transition:
                      "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transitionDelay: `${entrance.delay + 0.2}s`,
                    filter: isPageLoaded ? "none" : "blur(5px)",
                  }}
                  onLoad={(e) => {
                    // Add a subtle animation when each image loads
                    const img = e.currentTarget;
                    if (isPageLoaded) {
                      img.style.animation = "card-pulse 0.5s ease-out";
                    }
                  }}
                />

                {/* Description overlay that appears on hover */}
                <div className="description-overlay">
                  <div className="spell-name">{spell.name}</div>
                  <div className="spell-description">{spell.description}</div>
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "10px",
                      color: "#93c5fd",
                    }}
                  >
                    Cost: {spell.manaCost} mana
                  </div>
                </div>

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
                      animation: "pulse-glow 2s infinite",
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
            );
          })}
        </div>
      </div>

      {/* Start Game Button - with magical animation - updated to match main menu */}
      <button
        onClick={handleStartGame}
        disabled={selectedSpells.length !== 5 || isTransitioning}
        className="begin-journey-btn"
        style={{
          width: "100%",
          maxWidth: "250px",
          backgroundColor:
            selectedSpells.length === 5 && !isTransitioning
              ? "rgba(168, 74, 47, 0.7)"
              : "rgba(100, 100, 100, 0.7)",
          color: "white",
          padding: "0.9rem 1rem",
          borderRadius: "0.7rem",
          fontWeight: "bold",
          fontSize: "1.1rem",
          fontFamily: "'Cinzel', serif",
          border:
            selectedSpells.length === 5 && !isTransitioning
              ? "2px solid rgba(255, 200, 120, 0.3)"
              : "2px solid rgba(150, 150, 150, 0.3)",
          cursor:
            selectedSpells.length === 5 && !isTransitioning
              ? "pointer"
              : "not-allowed",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s",
          textShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
          animation: "button-pulse 5s infinite",
          opacity: isPageLoaded ? (isTransitioning ? 0.5 : 1) : 0,
          transform: isPageLoaded
            ? isTransitioning
              ? "scale(0.95)"
              : "translateY(0)"
            : "translateY(50px)",
          transitionDelay: "0.8s",
        }}
        onMouseOver={(e) => {
          if (selectedSpells.length === 5 && !isTransitioning) {
            e.currentTarget.style.backgroundColor = "rgba(168, 74, 47, 0.9)";
            e.currentTarget.style.boxShadow =
              "0 0 15px rgba(255, 160, 10, 0.7)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }
        }}
        onMouseOut={(e) => {
          if (selectedSpells.length === 5 && !isTransitioning) {
            e.currentTarget.style.backgroundColor = "rgba(168, 74, 47, 0.7)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {selectedSpells.length === 5
          ? "Begin Battle"
          : `Select ${5 - selectedSpells.length} More Spell${
              5 - selectedSpells.length !== 1 ? "s" : ""
            }`}

        {/* Button shine effect - matches main menu */}
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
      </button>

      {/* Copyright info - matches main menu */}
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

      {/* Transition particles effect */}
      {isTransitioning &&
        transitionParticles.map((particle, index) => (
          <div
            key={`transition-${index}`}
            style={{
              position: "absolute",
              top: `${particle.y}%`,
              left: `${particle.x}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderRadius: "50%",
              backgroundColor: particle.color,
              boxShadow: `0 0 15px 5px ${particle.color}`,
              opacity: 0,
              zIndex: 100,
              animation: `transition-particle ${particle.duration}s ease-out ${particle.delay}s forwards`,
            }}
          />
        ))}

      {/* Screen transition overlay */}
      {isTransitioning && (
        <div
          className="transition-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0)",
            backdropFilter: "blur(0px)",
            zIndex: 50,
            animation: "screen-transition 1.5s forwards",
          }}
        />
      )}

      {/* Add CSS animations */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Uncial+Antiqua&display=swap');
          
          @keyframes sparkle {
            0% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0); }
          }
          
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; filter: brightness(1); }
            50% { opacity: 1; filter: brightness(1.2); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes rotate-rune {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes rotate-magic {
            0% { transform: rotate(30deg); }
            100% { transform: rotate(390deg); }
          }
          
          @keyframes card-pulse {
            0% { transform: scale(1.1); filter: brightness(1.5); }
            100% { transform: scale(1); filter: brightness(1); }
          }
          
          @keyframes motion-blur {
            0% { opacity: 0.8; transform: scale(1.1) translateY(0px); }
            100% { opacity: 0; transform: scale(0.9) translateY(20px); }
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
          
          .spell-card-container {
            backface-visibility: hidden; /* For smoother transforms */
          }
          
          .spell-card-container:hover {
            z-index: 10;
            transform: scale(1.08) translateY(-8px) !important;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          }
          
          .spell-card-container:hover .magic-particles {
            opacity: 1;
          }
          
          .magic-particles {
            position: absolute;
            inset: -10px;
            border-radius: 1.5rem;
            background-image: radial-gradient(circle at 50% 50%, transparent 90%, rgba(255, 255, 255, 0.5) 100%);
            z-index: 0;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
          }
          
          .magic-particles::before,
          .magic-particles::after {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.8);
            animation: particle-float 3s infinite;
            opacity: 0;
          }
          
          .magic-particles::before {
            top: 20%;
            left: 10%;
            animation-delay: 0.5s;
          }
          
          .magic-particles::after {
            top: 70%;
            right: 10%;
            animation-delay: 1.5s;
          }
          
          @keyframes particle-float {
            0% { transform: translate(0, 0); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translate(0, -20px); opacity: 0; }
          }
          
          .begin-journey-btn:hover .button-shine {
            top: 60%;
            left: 150%;
            transition: all 0.7s;
          }
          
          /* Description overlay styles */
          .description-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(15, 23, 42, 0.85);
            color: white;
            padding: 10px;
            font-size: 12px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            z-index: 10;
            border-radius: 1rem;
            border: 1px solid rgba(138, 43, 226, 0.5);
            overflow: hidden;
          }
          
          .spell-card-container:hover .description-overlay {
            opacity: 1;
          }
          
          .description-overlay .spell-name {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 14px;
            color: #93c5fd;
            font-family: 'Cinzel', serif;
          }
          
          .description-overlay .spell-description {
            line-height: 1.4;
            padding: 0 5px;
            margin-bottom: 5px;
          }
        `}
      </style>
    </div>
  );
};

export default SpellSelection;
