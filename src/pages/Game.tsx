import React, { useState, useEffect, useRef } from "react";
import ChessBoard from "../components/chess/ChessBoard";
import { ChessProvider, useChess } from "../context/ChessContext";
import { getSpellById } from "../utils/spells";
import { Spell, SpellId } from "../types/types";
import "../styles/SpellCard.css";
import gameBackgroundImage from "/assets/Game_Background.png";
import { useGame } from "../context/GameContext";
import { SoundProvider, useSound } from "../context/SoundContext";
import { Color } from "chess.js";

// Settings Panel Component
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
        position: "absolute",
        top: "20px",
        right: "20px",
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        cursor: "pointer",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 2000,
        transition: "transform 0.3s ease, background-color 0.3s ease",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.85)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.75)";
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  return (
    <>
      <SettingsIcon />

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            right: "20px",
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

const GameContent: React.FC<{ playerColor: string }> = ({ playerColor }) => {
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
    // Initialize battle theme music right away
    audioRef.current = new Audio("/assets/Sounds/wizardchess_battle_theme.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4; // Start at medium volume

    // Try to play the audio
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Handle autoplay restrictions
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

    // Set a small delay before starting the game load animations
    setTimeout(() => {
      // Lower battle theme volume during transition
      if (audioRef.current) {
        audioRef.current.volume = 0; // Completely mute during transition
      }

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
          // Add a final transition effect - fade to game
          setTransitionStep(3);

          // Start fading in the audio during the final transition
          if (audioRef.current) {
            startFadeInAudio(0, 0.3, 1500); // Fade from 0 to 0.3 over 1.5 seconds
          }

          // Fade out transition screen over 1.5 seconds
          setTimeout(() => {
            // Now actually remove the transition screen and show the game
            setShowMatchStartTransition(false);
            setIsGameLoaded(true);

            // Continue increasing the battle theme volume
            fadeInAudio();
          }, 1500); // 1.5 seconds for final fade out
        }, 2500); // 2.5 seconds for BEGIN display
      }, 2500); // 2.5 seconds for spells display
    }, 100);

    // Function to start fading in audio from a start volume to an end volume over a duration
    const startFadeInAudio = (
      startVol: number,
      endVol: number,
      duration: number
    ) => {
      if (!audioRef.current) return;

      audioRef.current.volume = startVol;
      const steps = Math.ceil(duration / 50); // Update every 50ms
      const increment = (endVol - startVol) / steps;
      let currentStep = 0;

      const fadeInterval = setInterval(() => {
        if (!audioRef.current) {
          clearInterval(fadeInterval);
          return;
        }

        currentStep++;
        if (currentStep < steps) {
          audioRef.current.volume = startVol + increment * currentStep;
        } else {
          audioRef.current.volume = endVol; // Ensure we reach exactly the target volume
          clearInterval(fadeInterval);
        }
      }, 50);
    };

    const fadeInAudio = () => {
      if (!audioRef.current) return;

      const targetVolume = 0.6; // Full volume after transition
      const currentVolume = audioRef.current.volume; // Get the current volume (which should be 0.3)
      startFadeInAudio(currentVolume, targetVolume, 1000); // Fade from current volume to 0.6 over 1 second
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
          opacity: transitionStep === 3 ? 0 : 1,
          transition: transitionStep === 3 ? "opacity 1.5s ease-out" : "none",
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

        {/* Transition particles that flow toward the game - only in Step 3 */}
        {transitionStep === 3 &&
          Array.from({ length: 80 }, (_, i) => (
            <div
              key={`flow-particle-${i}`}
              style={{
                position: "absolute",
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                boxShadow: `0 0 8px 3px ${
                  [
                    "rgba(138, 43, 226, 0.7)",
                    "rgba(65, 105, 225, 0.7)",
                    "rgba(255, 165, 0, 0.7)",
                  ][Math.floor(Math.random() * 3)]
                }`,
                opacity: 0.8,
                animation: `flow-to-center 1.5s forwards ease-in ${
                  Math.random() * 0.8
                }s`,
                zIndex: 10,
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

          {/* Step 3: Final transition - text expands and fades */}
          {transitionStep === 3 && (
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
                animation: "expand-fade 1.5s forwards",
                opacity: 1,
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
            
            @keyframes expand-fade {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(2.5); opacity: 0; }
            }
            
            @keyframes flow-to-center {
              0% { transform: translateX(0) translateY(0); opacity: 0.8; }
              100% { transform: translateX(calc(50vw - 50%)) translateY(calc(50vh - 50%)); opacity: 0; }
            }
            
            @keyframes burst-out {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(3); opacity: 0; }
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
      {/* Settings Panel */}
      <SettingsPanel bgAudioRef={audioRef} />

      <div
        className="game-entrance-animation"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          opacity: isGameLoaded ? 1 : 0,
          transition: "opacity 0.8s ease-in",
        }}
      >
        {/* Entry burst effect - particles radiate from center when game loads */}
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={`entrance-particle-${i}`}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: `${2 + Math.random() * 6}px`,
              height: `${2 + Math.random() * 6}px`,
              borderRadius: "50%",
              backgroundColor: "#fff",
              boxShadow: `0 0 10px 2px ${
                [
                  "rgba(138, 43, 226, 0.7)",
                  "rgba(65, 105, 225, 0.7)",
                  "rgba(255, 165, 0, 0.7)",
                ][Math.floor(Math.random() * 3)]
              }`,
              opacity: 0,
              animation: `burst-out 1.2s forwards ease-out ${
                0.1 + Math.random() * 0.5
              }s`,
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
                <ChessBoard playerPerspective={playerColor} />
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
                  maxHeight: "400px", // Add fixed maximum height
                  height: "calc(100vh - 300px)", // Responsive height based on viewport
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(138, 43, 226, 0.3) transparent",
                  padding: "0 4px",
                  overflowX: "hidden", // Prevent horizontal overflow
                }}
                className="custom-scrollbar" // Add class for custom scrollbar styling
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
                        wordBreak: "break-word", // Ensures long text wraps
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
          
          @keyframes scale-in {
            0% { transform: scale(0.8); opacity: 0; }
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
          
          @keyframes expand-fade {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          
          @keyframes flow-to-center {
            0% { transform: translateX(0) translateY(0); opacity: 0.8; }
            100% { transform: translateX(calc(50vw - 50%)) translateY(calc(50vh - 50%)); opacity: 0; }
          }
          
          @keyframes burst-out {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(3); opacity: 0; }
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
          
          /* Custom scrollbar styling */
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.3);
            border-radius: 10px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(138, 43, 226, 0.4);
            border-radius: 10px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(138, 43, 226, 0.6);
          }
          
          /* For Firefox */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(138, 43, 226, 0.4) rgba(15, 23, 42, 0.3);
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
  const { setPlayerSpells, initializePlayerColor } = useChess();
  const { gameConfig } = useGame(); // Access gameConfig to get the player's color choice

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

      // When initializing for a game as black, we should set the initial player to white
      // but make sure the board is rendered from black's perspective
      setPlayerSpells({
        w: validSpellIds,
        b: validSpellIds,
      });

      // Initialize the board orientation based on the player's color choice
      console.log(
        `Initializing game with player color: ${gameConfig.playerColor}`
      );
      initializePlayerColor(gameConfig.playerColor as Color);
    }
  }, [
    selectedGameSpells,
    setPlayerSpells,
    gameConfig.playerColor,
    initializePlayerColor,
  ]);

  return <GameContent playerColor={gameConfig.playerColor} />;
};

export default Game;
