/**
 * MainMenu.tsx - Main Menu Interface
 *
 * This is the landing page of the Wizard Chess application where players configure
 * their game settings before starting a match. It provides a magical-themed interface
 * with particle effects, background music, and game configuration options.
 *
 * ARCHITECTURE OVERVIEW:
 * - Uses GameContext for global game state management
 * - Uses SoundContext for audio management
 * - Implements magical visual effects with CSS animations
 * - Provides game configuration interface
 *
 * KEY FEATURES:
 * - Player color selection (White/Black pieces)
 * - Computer opponent configuration with difficulty settings
 * - Background music with volume controls
 * - Magical particle effects and animations
 * - Settings panel for audio configuration
 * - Responsive design for different screen sizes
 *
 * STATE MANAGEMENT:
 * - Uses GameContext for game configuration (playerColor, computerOpponent)
 * - Uses SoundContext for audio controls (volume, mute)
 * - Local state for UI interactions (settings panel, transitions)
 * - Background music management with HTMLAudioElement
 *
 * DATA FLOW:
 * 1. Reads gameConfig from GameContext via useGame() hook
 * 2. Updates gameConfig when player makes selections
 * 3. Calls startGame() to advance to spell selection phase
 * 4. Manages background music and sound effects via SoundContext
 *
 * DEPENDENCIES:
 * - GameContext: Global game state (./context/GameContext.tsx)
 * - SoundContext: Audio management (./context/SoundContext.tsx)
 * - PlayerColor type: From ../types/game.ts
 * - Background image: /assets/MainMenu.jpg
 *
 * USED BY: App.tsx when gameState === "main-menu"
 */

import { useGame } from "../context/GameContext";
import React, { useState, useEffect, useRef } from "react";
import { PlayerColor } from "../types/game";
import backgroundImage from "/assets/MainMenu.jpg";
import { SoundProvider, useSound } from "../context/SoundContext";

/**
 * SettingsPanel Component
 *
 * PURPOSE: Provides audio settings interface for the main menu.
 * Allows players to control music volume and sound effects volume.
 *
 * PROPS:
 * - bgAudioRef: Reference to the background music audio element
 *
 * STATE MANAGEMENT:
 * - isOpen: Controls visibility of the settings panel
 * - musicVolume: Controls background music volume
 * - Uses SoundContext for sound effects volume control
 *
 * FEATURES:
 * - Music volume slider with real-time control
 * - Sound effects volume slider with immediate feedback
 * - Toggle button to show/hide settings panel
 * - Magical-themed styling with backdrop blur
 *
 * USED BY: MainMenu component for audio configuration
 */
const SettingsPanel: React.FC<{
  bgAudioRef: React.RefObject<HTMLAudioElement | null>;
}> = ({ bgAudioRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { volume, setVolume, playSelectSound } = useSound();
  const [musicVolume, setMusicVolume] = useState(0.6);

  // Initialize music volume state based on current audio volume
  useEffect(() => {
    if (bgAudioRef.current) {
      setMusicVolume(bgAudioRef.current.volume);
    }
  }, [bgAudioRef]);

  // Handle music volume change with throttling
  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setMusicVolume(newVolume);

    // Set the music volume directly on the passed audio reference
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = newVolume;

      // If the music is currently muted but we're adjusting volume, unmute it
      if (bgAudioRef.current.muted) {
        bgAudioRef.current.muted = false;
      }
    }
  };

  // Handle effects volume change
  const handleEffectsVolumeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    // Play a sound effect when changing volume to provide immediate feedback
    playSelectSound();
  };

  // Settings icon to toggle panel
  const SettingsIcon = () => (
    <button
      onClick={() => setIsOpen(!isOpen)}
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
        zIndex: 2000,
      }}
      title="Sound Settings"
    >
      ⚙️
    </button>
  );

  return (
    <>
      <SettingsIcon />

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "15px",
            width: "280px",
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(8px)",
            borderRadius: "12px",
            padding: "20px",
            color: "white",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            zIndex: 2000,
            transform: isOpen ? "translateY(0)" : "translateY(-20px)",
            opacity: isOpen ? 1 : 0,
            transition: "transform 0.3s ease, opacity 0.3s ease",
            fontFamily: "'Cinzel', serif",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "1.2rem",
              textAlign: "center",
              backgroundImage:
                "linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow: "0 0 10px rgba(255, 165, 0, 0.3)",
            }}
          >
            Sound Settings
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "0.9rem",
              }}
            >
              Music Volume
            </label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicVolume}
                onChange={handleMusicVolumeChange}
                style={{
                  flex: 1,
                  height: "4px",
                  accentColor: "#ffd700",
                  background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${
                    musicVolume * 100
                  }%, #444 ${musicVolume * 100}%, #444 100%)`,
                  outline: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  marginLeft: "10px",
                  fontSize: "0.9rem",
                  minWidth: "40px",
                  textAlign: "right",
                }}
              >
                {Math.round(musicVolume * 100)}%
              </span>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "0.9rem",
              }}
            >
              Effect Volume
            </label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleEffectsVolumeChange}
                style={{
                  flex: 1,
                  height: "4px",
                  accentColor: "#ffd700",
                  background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${
                    volume * 100
                  }%, #444 ${volume * 100}%, #444 100%)`,
                  outline: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  marginLeft: "10px",
                  fontSize: "0.9rem",
                  minWidth: "40px",
                  textAlign: "right",
                }}
              >
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "'Cinzel', serif",
                fontSize: "0.9rem",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(51, 65, 85, 0.8)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.8)";
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * MainMenuWrapper Component
 *
 * PURPOSE: Wraps the MainMenu component with SoundProvider to provide
 * audio context for the main menu interface.
 *
 * ARCHITECTURE:
 * - Provides SoundContext to MainMenu component
 * - Enables audio functionality for background music and sound effects
 * - Acts as a bridge between App.tsx and MainMenu.tsx
 *
 * USAGE:
 * - Exported as default component for App.tsx to use
 * - Wraps MainMenu with necessary context providers
 */
export default function MainMenuWrapper() {
  return (
    <SoundProvider>
      <MainMenu />
    </SoundProvider>
  );
}

// Define keyframes for animations used in MainMenu
const keyframes = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
  @keyframes pulse-glow-title {
    0%, 100% { text-shadow: 0 0 20px rgba(255, 165, 0, 0.6), 0 0 40px rgba(255, 140, 0, 0.4); filter: brightness(1); }
    50% { text-shadow: 0 0 30px rgba(255, 165, 0, 0.9), 0 0 60px rgba(255, 140, 0, 0.7); filter: brightness(1.2); }
  }
  @keyframes sparkle-anim {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(0); opacity: 0; }
  }
  @keyframes menu-fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
  }
`;

/**
 * MainMenu Component
 *
 * PURPOSE: Main menu interface that provides game configuration options
 * and magical visual effects for the Wizard Chess application.
 *
 * STATE MANAGEMENT:
 * - Uses GameContext for game configuration (playerColor, computerOpponent)
 * - Local state for visual effects (sparkles, mana orbs, transitions)
 * - Background music management with HTMLAudioElement
 * - Transition state for smooth page transitions
 *
 * KEY FEATURES:
 * - Player color selection with visual feedback
 * - Computer opponent toggle with difficulty settings
 * - Magical particle effects (sparkles, mana orbs)
 * - Background music with autoplay handling
 * - Smooth transitions to spell selection
 * - Responsive design for mobile devices
 *
 * VISUAL EFFECTS:
 * - Floating sparkles with random positions and timing
 * - Mana orbs with different colors and animations
 * - Transition particles for page changes
 * - Magical styling with gradients and glows
 *
 * AUDIO FEATURES:
 * - Background music with loop and volume control
 * - Sound effects for button interactions
 * - Autoplay handling for browser restrictions
 * - Fade out effects during transitions
 *
 * USED BY: MainMenuWrapper component
 */
const MainMenu = () => {
  const { gameConfig, selectPlayerColor, setComputerOpponent, startGame } =
    useGame();
  const [sparklePositions, setSparklePositions] = useState<
    { x: number; y: number; delay: number; size: number }[]
  >([]);
  const [manaPositions, setManaPositions] = useState<
    { x: number; y: number; delay: number; size: number; color: string }[]
  >([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const handleComputerToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Enable computer opponent with default settings
      setComputerOpponent({
        enabled: true,
        color: gameConfig.playerColor === "w" ? "b" : "w", // Assign opposite color
        difficulty: "medium", // Default difficulty
      });
    } else {
      // Disable computer opponent
      setComputerOpponent(null);
    }
  };

  const handleDifficultyChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (gameConfig.computerOpponent) {
      setComputerOpponent({
        ...gameConfig.computerOpponent,
        difficulty: event.target.value as "easy" | "medium" | "hard",
      });
    }
  };

  // Handle game start with transition
  const handleStartGame = () => {
    // Play the MainMenuStart effect sound
    const startSound = new Audio("/assets/Sounds/MainMenuStart_effect.mp3");
    startSound.volume = 0.6;
    startSound.play().catch((e) => console.log("Cannot play start sound:", e));

    // Generate transition particles
    const particles = Array.from({ length: 100 }, () => ({
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
      const transitionSound = new Audio("/assets/Sounds/spell_selection.mp3");
      transitionSound.volume = 0.4;
      transitionSound
        .play()
        .catch((e) => console.log("Cannot play transition sound:", e));
    }

    // Fade out current music if not muted
    if (audioRef.current && !audioRef.current.muted) {
      const fadeAudio = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.1) {
          audioRef.current.volume -= 0.1;
        } else {
          clearInterval(fadeAudio);
        }
      }, 100);
    }

    // Wait for animation to complete then start the game
    setTimeout(() => {
      startGame(); // This function should handle navigation/page change
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
          title="Language"
          onClick={() => console.log("Language clicked")}
        >
          🌐
        </button>
      </div>

      {/* Settings in top right */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          zIndex: 10,
        }}
      >
        <SettingsPanel bgAudioRef={audioRef} />
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
            animation: `float 10s infinite ${mana.delay}s`,
            zIndex: 0,
          }}
        />
      ))}

      {/* Transition particles */}
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

      {/* Main content container with transition */}
      <div
        className={
          isTransitioning ? "main-content transitioning" : "main-content"
        }
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          transition: "opacity 1.2s ease-out, transform 1.2s ease-out",
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning
            ? "scale(0.9) translateY(20px)"
            : "scale(1) translateY(0)",
        }}
      >
        {/* Title with magical styling */}
        <div
          style={{
            position: "relative",
            marginBottom: "1.5rem",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(3rem, 10vw, 6rem)",
              fontWeight: "bold",
              textAlign: "center",
              fontFamily: "'Cinzel', serif",
              backgroundImage:
                "linear-gradient(135deg, #ffb347 10%, #ffcc33 45%, #ffd700 70%, #ffe766 90%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: "1px rgba(255, 255, 255, 0.1)",
              textShadow:
                "0 0 15px rgba(255, 165, 0, 0.6), 0 0 30px rgba(255, 140, 0, 0.4)",
              animation: "pulse-glow-title 2.5s infinite",
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
            width: "90%",
            maxWidth: "500px",
            background:
              "linear-gradient(135deg, rgba(46, 30, 91, 0.85) 0%, rgba(58, 63, 189, 0.7) 100%)",
            backdropFilter: "blur(8px)",
            borderRadius: "1rem",
            padding: "clamp(1.5rem, 5vw, 2.5rem)",
            boxShadow:
              "0 0 30px rgba(58, 63, 189, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            marginBottom: "1.5rem",
            position: "relative",
            overflow: "hidden",
            animation:
              "float 6s ease-in-out infinite, menu-fade-in 0.8s ease-out forwards",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L90 50 L70 90 L30 90 L10 50 L30 10 L70 10 L90 50 Z' stroke='rgba(255,255,255,0.07)' fill='none'/%3E%3C/svg%3E")`,
            paddingBottom: gameConfig.computerOpponent ? "1rem" : "1.5rem",
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
              gap: "1.5rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => handleColorSelect("w")}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "0.8rem 2rem",
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
                padding: "0.8rem 2rem",
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

          {/* --- Computer Opponent Settings --- */}
          <div
            style={{
              marginTop: "1.2rem",
              padding: "0.8rem",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              borderRadius: "0.5rem",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                fontSize: "1rem",
                fontFamily: "'Cinzel', serif",
                color: "#eee",
              }}
            >
              <input
                type="checkbox"
                checked={!!gameConfig.computerOpponent}
                onChange={handleComputerToggle}
                style={{
                  marginRight: "10px",
                  accentColor: "#ffb347",
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />
              Play against Computer
            </label>

            {gameConfig.computerOpponent && (
              <div style={{ marginTop: "0.8rem", paddingLeft: "28px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "0.9rem",
                    color: "#ccc",
                  }}
                >
                  Difficulty:
                </label>
                <select
                  value={gameConfig.computerOpponent.difficulty}
                  onChange={handleDifficultyChange}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(30, 41, 59, 0.8)",
                    color: "white",
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.9rem",
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            )}
          </div>
          {/* --- End Computer Opponent Settings --- */}

          <button
            onClick={handleStartGame}
            disabled={isTransitioning}
            className="start-game-button"
            style={{
              width: "100%",
              backgroundColor: "rgba(168, 74, 47, 0.7)",
              color: "white",
              padding: "0.8rem 2rem",
              borderRadius: "0.7rem",
              fontWeight: "bold",
              fontSize: "clamp(1rem, 4vw, 1.2rem)",
              fontFamily: "'Cinzel', serif",
              border: "2px solid rgba(255, 200, 120, 0.3)",
              cursor: isTransitioning ? "default" : "pointer",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s",
              textShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
              animation: "button-pulse 5s infinite",
              opacity: isTransitioning ? 0.7 : 1,
            }}
            onMouseOver={(e) => {
              if (!isTransitioning) {
                e.currentTarget.style.backgroundColor =
                  "rgba(168, 74, 47, 0.9)";
                e.currentTarget.style.boxShadow =
                  "0 0 15px rgba(255, 160, 10, 0.7)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseOut={(e) => {
              if (!isTransitioning) {
                e.currentTarget.style.backgroundColor =
                  "rgba(168, 74, 47, 0.7)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }
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
            Wizard's Chess combines traditional chess with magical spells.
            Choose your side, select your arcane abilities, and outwit your
            opponent with strategy and sorcery. Each turn, you'll gain 1 mana
            (up to 15) to cast powerful spells that can turn the tide of battle.
          </p>
        </div>
      </div>

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
        {keyframes}
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
            50% { transform: translateY(-15px); }
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
          
          @keyframes transition-particle {
            0% { transform: scale(0) translate(0, 0); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: scale(2) translate(var(--random-x, 50px), var(--random-y, -50px)); opacity: 0; }
          }
          
          @keyframes screen-transition {
            0% { background-color: rgba(0, 0, 0, 0); backdrop-filter: blur(0px); }
            50% { background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); }
            100% { background-color: rgba(0, 0, 0, 1); backdrop-filter: blur(12px); }
          }
          
          .begin-journey-btn:hover .button-shine {
            top: 60%;
            left: 150%;
            transition: all 0.7s;
          }

          /* Base button styles */
          .player-select-button, .start-game-button {
            transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
          }

          .player-select-button:hover:not(:disabled),
          .start-game-button:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
          }

          /* Media Query for smaller screens */
          @media (max-width: 768px) {
            .main-title {
              margin-bottom: 1.5rem; /* Reduce margin */
            }
            .menu-box {
              padding: 1.5rem; /* Adjust padding */
            }
            .player-select-container {
              gap: 1rem; /* Reduce gap */
              margin-bottom: 1rem;
            }
            .player-select-button {
              padding: 0.6rem 1.2rem;
              font-size: 0.9rem;
            }
            .computer-settings-container {
              margin-top: 1rem;
              padding: 0.6rem;
            }
            .computer-settings-label {
               font-size: 0.9rem;
            }
            .difficulty-select {
               padding: 6px 8px;
               font-size: 0.8rem;
            }
            .start-game-button {
               padding: 0.7rem 1.5rem;
            }
          }

          @media (max-width: 480px) {
            .main-title {
               font-size: 3rem; /* Further reduce title size */
            }
             .menu-box {
               width: 95%; /* Increase width usage slightly */
               padding: 1rem;
             }
             .player-select-container {
                flex-direction: column; /* Stack color choice vertically */
                align-items: stretch; /* Make buttons full width */
             }
             .computer-settings-container {
                margin-top: 0.8rem;
             }
             .start-game-button {
                width: 100%; /* Full width start button */
             }
          }
        `}
      </style>
    </div>
  );
};
