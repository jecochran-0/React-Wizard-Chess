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
    const loadTimer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(loadTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const isSpellSelected = (spellId: string) => {
    return selectedSpells.some((spell) => spell.id === spellId);
  };

  // Return random entrance values for each card (Kept for animation)
  const getRandomEntrance = (index: number) => {
    const entrances = [
      {
        x: "-120vw",
        y: "10vh",
        rotate: "-20deg",
        scale: 0.6,
        delay: 0.05 * index,
      },
      {
        x: "120vw",
        y: "-5vh",
        rotate: "15deg",
        scale: 0.7,
        delay: 0.05 * index,
      },
      {
        x: "10vw",
        y: "-120vh",
        rotate: "-5deg",
        scale: 0.8,
        delay: 0.05 * index,
      },
      {
        x: "-20vw",
        y: "120vh",
        rotate: "10deg",
        scale: 0.5,
        delay: 0.05 * index,
      },
      {
        x: "-110vw",
        y: "-110vh",
        rotate: "-30deg",
        scale: 0.6,
        delay: 0.05 * index,
      },
      {
        x: "110vw",
        y: "-110vh",
        rotate: "30deg",
        scale: 0.7,
        delay: 0.05 * index,
      },
      {
        x: "-110vw",
        y: "110vh",
        rotate: "20deg",
        scale: 0.7,
        delay: 0.05 * index,
      },
      {
        x: "110vw",
        y: "110vh",
        rotate: "-25deg",
        scale: 0.6,
        delay: 0.05 * index,
      },
    ];
    const entranceIndex = Math.floor(
      (index + Math.floor(Math.random() * 3)) % entrances.length
    );
    return entrances[entranceIndex];
  };

  // Return a random mana color for effects (Kept for animation)
  const getRandomManaColor = () => {
    const colors = [
      "rgba(46, 30, 91, 0.7)",
      "rgba(58, 63, 189, 0.7)",
      "rgba(168, 74, 47, 0.7)",
      "rgba(89, 46, 131, 0.7)",
      "rgba(206, 146, 49, 0.7)",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle start game with transition effect (Logic unchanged)
  const handleStartGame = () => {
    if (selectedSpells.length !== 5 || isTransitioning) return;
    const spellsSelectedSound = new Audio(
      "/assets/Sounds/SpellsSelected_effect.mp3"
    );
    spellsSelectedSound.volume = 0.8;
    spellsSelectedSound
      .play()
      .catch((e) => console.log("Cannot play spell selection sound:", e));
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 8,
      delay: Math.random() * 0.5,
      duration: 0.5 + Math.random() * 1,
      color: getRandomManaColor().replace("0.7", "0.9"),
    }));
    setTransitionParticles(particles);
    setIsTransitioning(true);
    if (audioRef.current && !audioRef.current.muted) {
      const transitionSound = new Audio("/assets/Sounds/spell_cast_major.mp3");
      transitionSound.volume = 0.4;
      transitionSound
        .play()
        .catch((e) => console.log("Cannot play transition sound:", e));
    }
    setTimeout(() => {
      startGame();
    }, 1500);
  };

  // --- REFACTORED JSX Structure ---
  return (
    <div className={`spell-selection-page ${isPageLoaded ? "loaded" : ""}`}>
      <div className="background-overlay ancient-overlay"></div>
      <div className="background-overlay golden-overlay"></div>

      {sparklePositions.map((sparkle, index) => (
        <div
          key={`sparkle-${index}`}
          className="sparkle"
          style={{
            top: `${sparkle.y}%`,
            left: `${sparkle.x}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            animationDelay: `${sparkle.delay}s`,
          }}
        />
      ))}

      <div className="title-container">
        <h1 className="main-title">Choose Your Magical Spells</h1>
        <h2 className="sub-title">
          Select 5 spells from the {availableSpells.length} available
        </h2>
        <div className="title-glow"></div>
      </div>

      <div className="main-card">
        <div className="main-card-border"></div>
        <div className="scrollable-card-grid">
          {availableSpells.map((spell, index) => {
            const entrance = getRandomEntrance(index);
            const selected = isSpellSelected(spell.id);
            return (
              <div
                key={spell.id}
                className={`spell-card-container ${selected ? "selected" : ""}`}
                onClick={() => toggleSpellSelection(spell)}
                tabIndex={0} // Make it focusable
                style={{
                  // Keep dynamic styles for animation
                  transition: isPageLoaded
                    ? "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)"
                    : "none",
                  transform: isPageLoaded
                    ? selected
                      ? "translateY(-5px) scale(1.05)"
                      : "translateY(0) scale(1)"
                    : `translate3d(${entrance.x}, ${entrance.y}, 0) rotate(${entrance.rotate}) scale(${entrance.scale})`,
                  opacity: isPageLoaded ? 1 : 0,
                  animation:
                    isPageLoaded && selected
                      ? "float 4s ease-in-out infinite"
                      : "none",
                  transitionDelay: `${entrance.delay + Math.random() * 0.1}s`,
                }}
              >
                {selected && <div className="rune-circle"></div>}
                <div className="card-glow"></div>
                {!isPageLoaded && (
                  <div
                    className="magic-trail"
                    style={{
                      background: `linear-gradient(to bottom, transparent, ${
                        index % 2 === 0
                          ? "rgba(255, 215, 0, 0.3)"
                          : "rgba(147, 51, 234, 0.3)"
                      })`,
                    }}
                  />
                )}
                <div className="magic-particles"></div>
                <img
                  src={spellImages[spell.id]}
                  alt={spell.name}
                  className="spell-image"
                  style={{
                    // Keep dynamic styles for animation
                    transform: isPageLoaded
                      ? "rotateY(0deg)"
                      : "rotateY(180deg)",
                    transition:
                      "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transitionDelay: `${entrance.delay + 0.2}s`,
                    filter: isPageLoaded ? "none" : "blur(5px)",
                  }}
                  onLoad={(e) => {
                    if (isPageLoaded) {
                      e.currentTarget.classList.add("image-loaded");
                    }
                  }}
                />
                <div className="description-overlay">
                  <div className="overlay-spell-name">{spell.name}</div>
                  <div className="overlay-spell-description">
                    {spell.description}
                  </div>
                  <div className="overlay-mana-cost">
                    Cost: {spell.manaCost} mana
                  </div>
                </div>
                {selected && (
                  <div className="selection-checkmark">
                    <svg viewBox="0 0 24 24" fill="white">
                      <path d="M0 0h24v24H0z" fill="none" />
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}
                <div className="mana-cost">{spell.manaCost}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Spells Info - Visible on mobile */}
      <div className="selected-spells-container">
        <h3>Selected Spells ({selectedSpells.length}/5)</h3>
        {selectedSpells.length > 0 ? (
          selectedSpells.map((spell) => (
            <div key={`selected-${spell.id}`} className="selected-spell-item">
              <span className="selected-spell-name">{spell.name}</span>
              <span className="selected-mana-cost">
                ({spell.manaCost} mana)
              </span>
            </div>
          ))
        ) : (
          <p>No spells selected yet</p>
        )}
      </div>

      <button
        onClick={handleStartGame}
        disabled={selectedSpells.length !== 5 || isTransitioning}
        className={`begin-journey-btn ${
          selectedSpells.length === 5 && !isTransitioning ? "enabled" : ""
        }`}
        style={{
          // Keep dynamic styles for animation
          opacity: isPageLoaded ? (isTransitioning ? 0.5 : 1) : 0,
          transform: isPageLoaded
            ? isTransitioning
              ? "scale(0.95)"
              : "translateY(0)"
            : "translateY(50px)",
          transitionDelay: "0.8s",
        }}
      >
        {selectedSpells.length === 5
          ? "Begin Battle"
          : `Select ${5 - selectedSpells.length} More Spell${
              5 - selectedSpells.length !== 1 ? "s" : ""
            }`}
        <div className="button-shine"></div>
      </button>

      <div className="copyright-info">© 2025 WizardWorks</div>

      {/* Transition particles effect (Keep structure) */}
      {isTransitioning &&
        transitionParticles.map((particle, index) => (
          <div
            key={`transition-${index}`}
            className="transition-particle"
            style={{
              top: `${particle.y}%`,
              left: `${particle.x}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              boxShadow: `0 0 15px 5px ${particle.color}`,
              animation: `transition-particle ${particle.duration}s ease-out ${particle.delay}s forwards`,
            }}
          />
        ))}

      {/* Screen transition overlay (Keep structure) */}
      {isTransitioning && <div className="transition-overlay"></div>}

      {/* --- REWRITTEN CSS --- */}
      <style>{`
        /* Import Fonts */
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Uncial+Antiqua&display=swap');
          
        /* Base Styles (Desktop First) */
        .spell-selection-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: white;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #3b0764 100%);
          background-image: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.85) 50%, rgba(59, 7, 100, 0.85) 100%), url("/assets/MainMenu_Background.png");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          overflow: hidden;
          opacity: 0; /* Fade in on load */
          transition: opacity 1s ease-in;
          font-family: 'Cinzel', serif;
        }
        .spell-selection-page.loaded {
          opacity: 1;
        }

        /* Background Overlays */
        .background-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .ancient-overlay {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L70 30 L30 30 Z' stroke='rgba(255,255,255,0.05)' fill='none'/%3E%3Ccircle cx='50' cy='50' r='30' stroke='rgba(255,255,255,0.03)' fill='none'/%3E%3Ccircle cx='50' cy='50' r='15' stroke='rgba(255,255,255,0.05)' fill='none'/%3E%3C/svg%3E");
          background-size: 300px 300px;
          opacity: 0.4;
          mix-blend-mode: overlay;
        }
        .golden-overlay {
          background: radial-gradient(circle at center, rgba(255, 165, 0, 0.15) 0%, transparent 70%);
        }

        /* Sparkles */
        .sparkle {
          position: absolute;
          border-radius: 50%;
          background-color: #fff;
          box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8), 0 0 20px 6px rgba(255, 160, 10, 0.6);
          opacity: 0;
          animation: sparkle 3s infinite;
          z-index: 1;
          pointer-events: none;
        }

        /* Title Section */
        .title-container {
          position: relative;
          margin-bottom: 2.5rem;
          width: 100%;
          max-width: 800px;
          text-align: center;
          opacity: 0; /* Controlled by parent load animation */
          transform: translateY(-50px); /* Controlled by parent load animation */
          transition: opacity 1.5s ease-out, transform 1.5s ease-out;
        }
        .spell-selection-page.loaded .title-container {
          opacity: 1;
          transform: translateY(0);
        }
        .main-title {
          font-size: 4rem;
          font-weight: bold;
          font-family: 'Cinzel', serif;
          background-image: linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%, #ffe766 90%);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.2);
          text-shadow: 0 0 20px rgba(255, 165, 0, 0.7), 0 0 40px rgba(255, 140, 0, 0.5);
          animation: magical-swirl 10s infinite;
          margin: 0;
          position: relative;
        }
        .sub-title {
          font-size: 1.5rem;
          font-family: 'Cinzel', serif;
          background-image: linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          margin-top: 1rem;
          margin-bottom: 0;
          text-shadow: 0 0 10px rgba(255, 165, 0, 0.5);
        }
        .title-glow {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 120%; height: 120%;
          background-image: radial-gradient(circle, rgba(255, 165, 0, 0.3) 0%, transparent 70%);
          filter: blur(20px);
          z-index: -1;
          pointer-events: none;
        }

        /* Main Card Section */
        .main-card {
          width: 100%;
          max-width: 1000px; /* Increased max-width slightly */
          margin: 0 auto 1.5rem auto;
          background: linear-gradient(135deg, rgba(46, 30, 91, 0.85) 0%, rgba(58, 63, 189, 0.7) 100%);
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L90 50 L70 90 L30 90 L10 50 L30 10 L70 10 L90 50 Z' stroke='rgba(255,255,255,0.07)' fill='none'/%3E%3C/svg%3E");
          background-size: 100px 100px;
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          padding: 2rem; /* Generous padding for desktop */
          box-shadow: 0 0 30px rgba(58, 63, 189, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          animation: float 6s ease-in-out infinite;
        }
        .main-card-border {
          position: absolute;
          inset: 0;
          border-radius: 1rem;
          border: 8px solid transparent;
          background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L40 0 L40 40 L0 40 Z' stroke='rgba(255,255,255,0.1)' fill='none' stroke-dasharray='2 4'/%3E%3C/svg%3E");
          background-size: 20px 20px;
          background-position: 0 0;
          opacity: 0.5;
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        /* Spell Cards Grid */
        .scrollable-card-grid {
          overflow-y: auto;
          max-height: 65vh;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          padding: 1.5rem;
          justify-items: center;
          position: relative;
        }

        @media (max-width: 1200px) {
          .scrollable-card-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 900px) {
          .scrollable-card-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 600px) {
          .scrollable-card-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            padding: 1rem;
          }
          
          .selection-title {
            font-size: 2.5rem !important;
          }
          
          .start-game-button {
            font-size: 1.2rem !important;
            padding: 0.5rem 1.5rem !important;
          }
        }

        .selected-spells-container {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          max-width: 90%;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .selected-spells-container {
            gap: 10px;
          }
        }

        @media (max-width: 480px) {
          .selected-spells-container {
            gap: 8px;
          }
        }

        /* Individual Spell Card */
          .spell-card-container {
          position: relative;
          cursor: pointer;
          transform-origin: center center;
          will-change: transform, opacity;
          backface-visibility: hidden; /* Smoother transforms */
          outline: none; /* Remove default focus outline */
          z-index: 2; /* Default z-index */
        }
        .spell-card-container:hover,
        .spell-card-container:focus-visible {
            z-index: 10; /* Bring hovered/focused card to front */
            transform: scale(1.08) translateY(-8px) !important; /* Override dynamic transform */
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          }
        .spell-card-container.selected {
             /* Selected state handled by dynamic styles for now */
        }
        .spell-card-container:focus-visible { /* Custom focus style */
             box-shadow: 0 0 15px 5px rgba(100, 255, 100, 0.8);
             border-radius: 1rem; /* Apply radius to focus shadow container */
        }

        .rune-circle {
           position: absolute; inset: -15px; border-radius: 50%;
           background: transparent; border: 2px solid rgba(100, 255, 100, 0.4);
           z-index: 0; animation: rotate-rune 8s linear infinite; pointer-events: none;
        }
        .card-glow {
            position: absolute; inset: 0; border-radius: 1rem;
            transition: all 0.3s ease; z-index: 1; pointer-events: none;
            box-shadow: 0 0 15px 2px rgba(255, 215, 0, 0.6), 0 0 30px 5px rgba(255, 140, 0, 0.3);
            opacity: 0.8;
        }
        .spell-card-container.selected .card-glow {
            box-shadow: 0 0 20px 5px rgba(100, 255, 100, 0.7), 0 0 40px 15px rgba(50, 205, 50, 0.4);
            opacity: 1;
          }
        .magic-trail {
            position: absolute; inset: -30px; border-radius: 1.5rem;
            filter: blur(10px); opacity: 0.6; z-index: 0;
            transform-origin: center center; pointer-events: none;
        }
          .magic-particles {
            position: absolute; inset: -10px; border-radius: 1.5rem;
            background-image: radial-gradient(circle at 50% 50%, transparent 90%, rgba(255, 255, 255, 0.5) 100%);
            z-index: 0; opacity: 0; transition: opacity 0.3s; pointer-events: none;
        }
         .spell-card-container:hover .magic-particles { opacity: 1; } /* Show particles on hover */
         .magic-particles::before, .magic-particles::after { /* Particle definition */
            content: ''; position: absolute; width: 8px; height: 8px;
            border-radius: 50%; background-color: rgba(255, 255, 255, 0.8);
            animation: particle-float 3s infinite; opacity: 0;
         }
         .magic-particles::before { top: 20%; left: 10%; animation-delay: 0.5s; }
         .magic-particles::after { top: 70%; right: 10%; animation-delay: 1.5s; }

        .spell-image {
          display: block; /* Remove extra space below image */
          width: 100%; height: auto; border-radius: 1rem;
          position: relative; z-index: 2; /* Above glow/trail */
          border: 2px solid rgba(255, 215, 0, 0.6);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
          aspect-ratio: 2.5 / 3.5; object-fit: cover;
        }
        .spell-card-container.selected .spell-image {
            border: 3px solid rgba(100, 255, 100, 0.8);
        }
        .spell-image.image-loaded { /* Animation for image load */
            animation: card-pulse 0.5s ease-out;
        }

        .description-overlay {
          position: absolute; inset: 0; background-color: rgba(15, 23, 42, 0.9);
          color: white; padding: 0.8rem; opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease; display: flex; flex-direction: column;
          justify-content: center; align-items: center; text-align: center;
          z-index: 3; border-radius: 1rem; backdrop-filter: blur(3px); overflow: hidden;
        }
        .spell-card-container:hover .description-overlay,
        .spell-card-container:focus-visible .description-overlay {
          opacity: 1;
        }
        .overlay-spell-name {
          font-weight: bold; margin-bottom: 0.4rem; font-size: 0.9rem;
          color: #ffd700; font-family: 'Cinzel', serif;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%;
        }
        .overlay-spell-description {
          font-size: 0.75rem; line-height: 1.3; margin-bottom: 0.3rem;
          max-height: 60%; /* Limit height */
          overflow-y: auto; /* Allow scrolling if needed */
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        .overlay-spell-description::-webkit-scrollbar { width: 4px; }
        .overlay-spell-description::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.3); border-radius: 2px; }
        .overlay-mana-cost {
          margin-top: auto; /* Push to bottom */
          font-size: 0.7rem; color: #93c5fd;
        }

        .selection-checkmark {
          position: absolute; top: 0.5rem; right: 0.5rem; background-color: rgba(50, 205, 50, 0.9);
          width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; z-index: 3;
          box-shadow: 0 0 10px rgba(50, 205, 50, 0.8); animation: pulse-glow 2s infinite;
        }
        .selection-checkmark svg { width: 15px; height: 15px; }

        .mana-cost {
            position: absolute;
          top: 0.5rem; /* Move to top */
          right: 0.5rem;
          width: 1.8rem; /* Fixed size for circle */
          height: 1.8rem;
          background: linear-gradient(135deg, #6b21a8, #4f46e5); /* Purple/Indigo gradient */
            color: white;
          border-radius: 50%; /* Make it a circle */
          display: flex; /* Center content */
            align-items: center;
          justify-content: center;
          font-size: 0.85rem; /* Slightly larger font */
          font-weight: 600; /* Semi-bold */
          z-index: 3;
          border: 2px solid white; /* White border */
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4); /* Adjusted shadow */
          pointer-events: none;
        }

        /* Selected Spells Info (Mobile Only) */
        .selected-spells-info {
          width: 100%; max-width: 1000px; /* Match main card width */
          margin: 0 auto 1rem auto; /* Space between card and button */
          padding: 0.5rem; background: rgba(15, 23, 42, 0.7);
          border-radius: 0.5rem; display: none; /* Hidden by default */
          text-align: center; border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .selected-spells-info h3 {
          font-size: 0.9rem; margin: 0 0 0.5rem 0; color: rgba(255, 255, 255, 0.8);
        }
        .selected-spell-item {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          margin-bottom: 0.3rem; font-size: 0.8rem;
        }
        .selected-spell-name { color: #93c5fd; font-weight: bold; }
        .selected-mana-cost { font-size: 0.7rem; opacity: 0.8; }
        .selected-spells-info p { font-size: 0.8rem; opacity: 0.7; margin: 0.5rem 0; }

        /* Begin Journey Button */
        .begin-journey-btn {
          width: 100%; max-width: 250px; background-color: rgba(100, 100, 100, 0.7);
          color: rgba(255, 255, 255, 0.7); padding: 0.9rem 1rem; border-radius: 0.7rem;
          font-weight: bold; font-size: 1.1rem; font-family: 'Cinzel', serif;
          border: 2px solid rgba(150, 150, 150, 0.3); cursor: not-allowed;
          position: relative; overflow: hidden; transition: all 0.3s, opacity 0.5s, transform 0.5s; /* Include opacity/transform */
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
          /* animation: button-pulse 5s infinite; */ /* Pulse only when enabled */
        }
        .begin-journey-btn.enabled {
          background-color: rgba(168, 74, 47, 0.7); color: white;
          border: 2px solid rgba(255, 200, 120, 0.3); cursor: pointer;
          animation: button-pulse 5s infinite; /* Enable pulse */
        }
        .begin-journey-btn.enabled:hover {
          background-color: rgba(168, 74, 47, 0.9);
          box-shadow: 0 0 15px rgba(255, 160, 10, 0.7);
          transform: translateY(-2px) !important; /* Override dynamic style */
        }
        .button-shine {
          position: absolute; top: -180%; left: -50%; width: 200%; height: 200%;
          background-color: rgba(255, 255, 255, 0.2); transform: rotate(45deg);
          transition: all 0.7s; pointer-events: none;
          animation: button-sheen 5s infinite;
        }
         .begin-journey-btn.enabled:hover .button-shine {
            top: 60%; left: 150%; transition: all 0.7s;
        }

        /* Copyright */
        .copyright-info {
          position: absolute; bottom: 10px; right: 15px;
          font-size: 0.8rem; color: rgba(255, 255, 255, 0.6);
          z-index: 2;
        }

        /* Transition Effects */
        .transition-particle {
          position: absolute; border-radius: 50%; opacity: 0; z-index: 100;
            pointer-events: none;
          }
        .transition-overlay {
          position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0);
          backdrop-filter: blur(0px); z-index: 50; pointer-events: none;
          animation: screen-transition 1.5s forwards;
        }


        /* --- Keyframes (Mostly unchanged) --- */
        @keyframes sparkle { 0% { opacity: 0; transform: scale(0); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0); } }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.5; filter: brightness(1); } 50% { opacity: 1; filter: brightness(1.2); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes rotate-rune { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes card-pulse { 0% { transform: scale(1.1); filter: brightness(1.5); } 100% { transform: scale(1); filter: brightness(1); } }
        @keyframes particle-float { 0% { transform: translate(0, 0); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translate(0, -20px); opacity: 0; } }
        @keyframes magical-swirl { 0% { filter: hue-rotate(0deg) brightness(1); } 50% { filter: hue-rotate(10deg) brightness(1.1); } 100% { filter: hue-rotate(0deg) brightness(1); } }
        @keyframes button-pulse { 0%, 100% { box-shadow: 0 0 10px rgba(255, 165, 0, 0.4); } 50% { box-shadow: 0 0 20px rgba(255, 165, 0, 0.7); } }
        @keyframes button-sheen { 0% { left: -50%; top: -180%; } 33% { left: 150%; top: 60%; } 100% { left: 150%; top: 60%; } }
        @keyframes transition-particle { 0% { transform: scale(0) rotate(0deg); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(3) rotate(360deg); opacity: 0; } }
        @keyframes screen-transition { 0% { background-color: rgba(0, 0, 0, 0); backdrop-filter: blur(0px); } 100% { background-color: rgba(0, 0, 0, 1); backdrop-filter: blur(10px); } }

        /* --- Responsive Styles --- */

        /* Tablet (Example: 1024px) */
        @media (max-width: 1024px) {
          .spell-selection-page { padding: 1.5rem; }
          .main-title { font-size: 3.5rem; }
          .sub-title { font-size: 1.3rem; }
          .main-card { max-width: 90%; padding: 1.5rem; }
          .scrollable-card-grid { gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
          .begin-journey-btn { max-width: 220px; font-size: 1rem; padding: 0.8rem; }
        }

        /* Mobile (768px) - Major changes */
        @media (max-width: 768px) {
          .spell-selection-page { padding: 0.8rem; justify-content: flex-start; /* Align top */ }
          .title-container { margin-bottom: 1rem; }
          .main-title { display: none; } /* Hide main title */
          .sub-title { font-size: 1.1rem; margin-top: 0.5rem; }

          .main-card {
              max-width: 100%; /* Use full width */
              padding: 0.8rem; /* Reduced padding */
              margin-bottom: 1rem;
              animation: none; /* Disable float animation */
          }
          .main-card-border { display: none; } /* Hide decorative border */

          .scrollable-card-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr)); /* Back to 5 columns */
            gap: 0.2rem; /* Minimal gap between cards */
            perspective: none; /* Disable 3D perspective */
            transform-style: flat;
            /* Remove overflow/height constraints */
          }

          /* Card container - Remove vertical layout constraints */
          .spell-card-container {
             /* max-width: 250px; */ /* REVERTED */
             /* margin-left: auto; */ /* REVERTED */
             /* margin-right: auto; */ /* REVERTED */
             min-width: 0; /* Ensure it can shrink */
          }

          /* Simplify card interactions/styles for mobile */
          .spell-card-container:hover,
          .spell-card-container:focus-visible {
              transform: scale(1.05) !important; /* Slightly more hover pop */
          }
          .card-glow {
             box-shadow: 0 0 8px 1px rgba(255, 215, 0, 0.5); /* Simpler glow */
             opacity: 0.7;
          }
          .spell-card-container.selected .card-glow {
             box-shadow: 0 0 12px 3px rgba(100, 255, 100, 0.6); /* Simpler selected glow */
            opacity: 1;
          }
          .rune-circle { inset: -8px; border-width: 1px; animation: none; } /* Simpler rune */
          .magic-particles { display: none; } /* Hide particles */
          .spell-image { border-width: 1px; }
          .spell-card-container.selected .spell-image { border-width: 2px; }

          /* Adjust overlay for tap */
          .description-overlay {
              padding: 0.3rem;
              background-color: rgba(15, 23, 42, 0.95); /* Slightly more opaque */
              border: none;
              transition: opacity 0.2s ease; /* Faster transition */
          }
          /* Use active state for tap feedback instead of hover */
          .spell-card-container:active .description-overlay { opacity: 1; }
          @media (hover: hover) { /* Apply hover only on devices that support it */
             .spell-card-container:hover .description-overlay,
             .spell-card-container:focus-visible .description-overlay { opacity: 1; }
             .spell-card-container:active .description-overlay { opacity: 1; } /* Ensure tap works too */
          }
           @media (hover: none) { /* Only apply active state for tap on touch devices */
               .spell-card-container:hover .description-overlay { opacity: 0; } /* Disable hover */
               .spell-card-container:focus-visible .description-overlay { opacity: 0; } /* Disable focus */
               .spell-card-container:active .description-overlay { opacity: 1; }
           }

          .overlay-spell-name { font-size: clamp(0.45rem, 2.5vw, 0.65rem); margin-bottom: 0.1rem; }
          .overlay-spell-description { font-size: clamp(0.4rem, 2vw, 0.5rem); line-height: 1.1; }
          .overlay-mana-cost { font-size: clamp(0.4rem, 1.8vw, 0.55rem); }

          .selection-checkmark {
             width: clamp(0.8rem, 3.5vw, 1.1rem); /* Responsive size */
             height: clamp(0.8rem, 3.5vw, 1.1rem);
             top: 2px; right: 2px; animation: none;
             box-shadow: 0 0 3px rgba(50, 205, 50, 0.5);
          }
          .selection-checkmark svg { width: 60%; height: 60%; }

          .mana-cost {
             width: clamp(1rem, 4.5vw, 1.4rem); /* Responsive size */
             height: clamp(1rem, 4.5vw, 1.4rem);
             top: 2px; /* Adjust position */
             right: 2px;
             font-size: clamp(0.5rem, 2.5vw, 0.7rem); /* Responsive font */
             border-width: 1px;
             box-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
          }

          .selected-spells-container { display: block; } /* Show selected info */

          .begin-journey-btn {
            max-width: 200px; font-size: 0.9rem; padding: 0.7rem; margin-top: auto; /* Push to bottom */
          }
          .begin-journey-btn.enabled:active { /* Tap feedback */
             transform: scale(0.97) !important;
          }
          .button-shine { animation: none; background: none; } /* Disable sheen */

          .copyright-info { font-size: 0.7rem; bottom: 5px; right: 5px; }

          /* Simplify animations further */
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
          @keyframes pulse-glow { 0%, 100% { opacity: 0.9; filter: none; } 50% { opacity: 1; filter: none; } }
        }

        /* Smaller Mobile (480px) */
        @media (max-width: 480px) {
           .spell-selection-page { padding: 0.5rem; }
           .sub-title { font-size: 1rem; }
           .main-card { padding: 0.3rem; } /* Very tight padding */
           .scrollable-card-grid {
             gap: 0.1rem; /* Minimum gap */
             /* grid-template-columns: 1fr; */ /* Ensure it uses 5 columns */
           }

           .spell-card-container {
             /* max-width: 200px; */ /* REVERTED */
           }

           /* Further shrink internal elements */
           .overlay-spell-name { font-size: clamp(0.4rem, 2.5vw, 0.55rem); }
           .overlay-spell-description { font-size: clamp(0.35rem, 2vw, 0.45rem); }
           .overlay-mana-cost { font-size: clamp(0.35rem, 1.8vw, 0.5rem); }
           .mana-cost {
               width: clamp(0.8rem, 4.5vw, 1.2rem);
               height: clamp(0.8rem, 4.5vw, 1.2rem);
               font-size: clamp(0.4rem, 2.5vw, 0.6rem);
               top: 1px;
               right: 1px;
           }
           .selection-checkmark {
               width: clamp(0.7rem, 3.5vw, 1rem);
               height: clamp(0.7rem, 3.5vw, 1rem);
               top: 1px;
               right: 1px;
           }
           .selection-checkmark svg { width: 55%; height: 55%; }

           .selected-spells-container { padding: 0.4rem; }
           .selected-spells-container h3 { font-size: 0.8rem; }
           .selected-spell-item { font-size: 0.7rem; }

           .begin-journey-btn { max-width: 180px; font-size: 0.8rem; padding: 0.6rem; }
        }

      `}</style>
    </div>
  );
};

export default SpellSelection;
