/**
 * SoundContext.tsx - Audio Management System
 *
 * This file provides comprehensive audio management for the Wizard Chess application.
 * It handles sound effects, background music, volume controls, and audio state management.
 *
 * ARCHITECTURE OVERVIEW:
 * - Uses React Context API for global audio state management
 * - Manages HTMLAudioElement instances for all sound effects
 * - Provides volume control and muting functionality
 * - Handles sound conflict management and priority system
 *
 * AUDIO SYSTEM FEATURES:
 * - Sound Effects: Move, capture, selection, spell casting, check/checkmate
 * - Spell-Specific Sounds: Each spell has its unique audio effect
 * - Volume Control: Global volume with individual sound volume ratios
 * - Mute Functionality: Complete audio muting capability
 * - Conflict Management: Priority system to prevent audio overlap
 *
 * SOUND CATEGORIES:
 * - UI Sounds: Selection, spell selection (lower volume, priority 1)
 * - Game Sounds: Move, piece capture (normal volume, priority 1-2)
 * - Important Sounds: Check, checkmate, spell effects (high volume, priority 2-3)
 *
 * DATA FLOW:
 * 1. SoundProvider initializes all audio elements on mount
 * 2. Components use useSound() hook to access audio functions
 * 3. Sound functions play audio with appropriate volume and priority
 * 4. Volume changes update all audio elements in real-time
 *
 * DEPENDENCIES:
 * - Uses SpellId type from ../types/types.ts for spell sound mapping
 * - Audio files stored in /assets/Sounds/ directory
 *
 * USED BY:
 * - MainMenu.tsx: Background music and UI sounds
 * - ChessBoard.tsx: Move sounds and game effects
 * - SpellCard.tsx: Spell selection sounds
 * - Game.tsx: Check/checkmate sounds
 */

import React, {
  createContext,
  useContext,
  useRef,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { SpellId } from "../types/types";

// Define types for our sound effects
interface SoundEffects {
  move: HTMLAudioElement;
  pieceDying: HTMLAudioElement;
  select: HTMLAudioElement;
  spellSelected: HTMLAudioElement;
  kingCheck: HTMLAudioElement;
  kingCheckmate: HTMLAudioElement;
  spellSounds: Record<string, HTMLAudioElement>;
}

interface SoundContextType {
  playMoveSound: () => void;
  playPieceDyingSound: () => void;
  playSelectSound: () => void;
  playSpellSelectedSound: () => void;
  playKingCheckSound: () => void;
  playKingCheckmateSound: () => void;
  playSpellSound: (spellId: SpellId) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Map spell IDs to their sound file names
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
  // Add any other spell mappings here
};

/**
 * SoundProvider Component
 *
 * PURPOSE: Provides audio management functionality to all child components.
 * Manages sound effects, volume control, and audio state for the entire application.
 *
 * STATE MANAGEMENT:
 * - isMuted: Global mute state for all audio
 * - volume: Global volume level (0.0 to 1.0)
 * - soundsLoaded: Tracks when all audio files are loaded
 * - soundEffects: Ref to all loaded audio elements
 * - currentlyPlaying: Tracks currently playing sounds for conflict management
 *
 * AUDIO INITIALIZATION:
 * - Loads all sound effect files on component mount
 * - Sets up spell-specific sound mappings
 * - Applies initial volume settings
 * - Handles cleanup on component unmount
 *
 * VOLUME MANAGEMENT:
 * - Updates all audio elements when volume changes
 * - Maintains volume ratios for different sound types
 * - Applies volume changes to currently playing sounds
 *
 * CONFLICT MANAGEMENT:
 * - Priority system prevents audio overlap
 * - High-priority sounds can interrupt lower-priority ones
 * - Maintains volume ratios during conflicts
 *
 * USAGE:
 * - Wraps components that need audio functionality
 * - Used by MainMenu, Game, and other components with audio
 */
export const SoundProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const soundEffects = useRef<SoundEffects | null>(null);
  const currentlyPlaying = useRef<Set<HTMLAudioElement>>(new Set());

  // Initialize sound effects
  useEffect(() => {
    // Load all sound effects
    soundEffects.current = {
      move: new Audio("/assets/Sounds/Move_effect.mp3"),
      pieceDying: new Audio("/assets/Sounds/PieceDying_effect.mp3"),
      select: new Audio("/assets/Sounds/Select_effect.mp3"),
      spellSelected: new Audio("/assets/Sounds/SpellsSelected_effect.mp3"),
      kingCheck: new Audio("/assets/Sounds/KingCheck_effect.mp3"),
      kingCheckmate: new Audio("/assets/Sounds/KingCheckmate_effect.mp3"),
      spellSounds: {},
    };

    // Load all spell-specific sounds
    Object.entries(spellSoundMap).forEach(([spellId, filename]) => {
      if (soundEffects.current) {
        soundEffects.current.spellSounds[spellId] = new Audio(
          `/assets/Sounds/${filename}`
        );
      }
    });

    // Set the volume for all sounds
    const setInitialVolume = () => {
      if (soundEffects.current) {
        soundEffects.current.move.volume = volume;
        soundEffects.current.pieceDying.volume = volume;
        soundEffects.current.select.volume = volume * 0.4; // Lower volume for UI sounds
        soundEffects.current.spellSelected.volume = volume * 0.6;
        soundEffects.current.kingCheck.volume = volume;
        soundEffects.current.kingCheckmate.volume = volume;

        // Set volume for all spell sounds
        Object.values(soundEffects.current.spellSounds).forEach((sound) => {
          sound.volume = volume;
        });
      }
    };

    setInitialVolume();
    setSoundsLoaded(true);

    // Cleanup function
    return () => {
      if (soundEffects.current) {
        Object.values(soundEffects.current).forEach((sound) => {
          if (sound instanceof Audio) {
            sound.pause();
            sound.src = "";
          }
        });

        Object.values(soundEffects.current.spellSounds).forEach((sound) => {
          sound.pause();
          sound.src = "";
        });
      }
    };
  }, []);

  // Update volume whenever it changes
  useEffect(() => {
    if (soundEffects.current) {
      // Apply volume to all sound effects
      soundEffects.current.move.volume = volume;
      soundEffects.current.pieceDying.volume = volume;
      soundEffects.current.select.volume = volume * 0.4;
      soundEffects.current.spellSelected.volume = volume * 0.6;
      soundEffects.current.kingCheck.volume = volume;
      soundEffects.current.kingCheckmate.volume = volume;

      // Update volume for all spell sounds
      Object.values(soundEffects.current.spellSounds).forEach((sound) => {
        sound.volume = volume;
      });

      // Also update the volume of any currently playing sounds
      currentlyPlaying.current.forEach((sound) => {
        // For UI sounds, keep their relative volume ratios
        if (sound === soundEffects.current?.select) {
          sound.volume = volume * 0.4;
        } else if (sound === soundEffects.current?.spellSelected) {
          sound.volume = volume * 0.6;
        } else {
          sound.volume = volume;
        }
      });
    }
  }, [volume]);

  // Helper function to play sounds with conflict management
  const playSound = (sound: HTMLAudioElement, priority: number = 1) => {
    if (isMuted || !soundsLoaded) return;

    // For high priority sounds, stop other sounds in the same category
    if (priority >= 2) {
      currentlyPlaying.current.forEach((audio) => {
        if (audio !== sound) {
          // Don't stop move and UI sounds, but lower their volume
          if (
            audio === soundEffects.current?.move ||
            audio === soundEffects.current?.select
          ) {
            audio.volume = audio.volume * 0.3; // Reduce volume temporarily
          } else {
            audio.pause();
            audio.currentTime = 0;
          }
        }
      });
    }

    // If the sound is already playing, reset it
    if (sound.currentTime > 0) {
      sound.currentTime = 0;
    } else {
      // Add to currently playing set
      currentlyPlaying.current.add(sound);

      // Remove from set when done playing
      sound.onended = () => {
        currentlyPlaying.current.delete(sound);

        // Restore volumes of any lowered sounds
        if (soundEffects.current) {
          soundEffects.current.move.volume = volume;
          soundEffects.current.select.volume = volume * 0.4;
        }
      };
    }

    // Play the sound
    sound.play().catch((error) => console.log("Error playing sound:", error));
  };

  // Public methods to play different sounds
  const playMoveSound = () => {
    if (soundEffects.current) {
      playSound(soundEffects.current.move, 1);
    }
  };

  const playPieceDyingSound = () => {
    if (soundEffects.current) {
      playSound(soundEffects.current.pieceDying, 2);
    }
  };

  const playSelectSound = () => {
    if (soundEffects.current) {
      playSound(soundEffects.current.select, 1);
    }
  };

  const playSpellSelectedSound = () => {
    if (soundEffects.current) {
      playSound(soundEffects.current.spellSelected, 1);
    }
  };

  const playKingCheckSound = () => {
    if (soundEffects.current) {
      playSound(soundEffects.current.kingCheck, 3);
    }
  };

  const playKingCheckmateSound = () => {
    if (soundEffects.current) {
      playSound(soundEffects.current.kingCheckmate, 3);
    }
  };

  const playSpellSound = (spellId: SpellId) => {
    if (soundEffects.current && soundEffects.current.spellSounds[spellId]) {
      playSound(soundEffects.current.spellSounds[spellId], 2);
    }
  };

  const contextValue: SoundContextType = {
    playMoveSound,
    playPieceDyingSound,
    playSelectSound,
    playSpellSelectedSound,
    playKingCheckSound,
    playKingCheckmateSound,
    playSpellSound,
    isMuted,
    setIsMuted,
    volume,
    setVolume,
  };

  return (
    <SoundContext.Provider value={contextValue}>
      {children}
    </SoundContext.Provider>
  );
};

/**
 * useSound Hook
 *
 * PURPOSE: Custom hook that provides access to the SoundContext
 *
 * USAGE:
 * - Must be used within a SoundProvider component
 * - Returns the complete SoundContextType object
 * - Throws error if used outside of SoundProvider
 *
 * RETURN VALUE:
 * - Sound playing functions (playMoveSound, playSpellSound, etc.)
 * - Volume control (volume, setVolume)
 * - Mute control (isMuted, setIsMuted)
 *
 * SOUND FUNCTIONS:
 * - playMoveSound: Plays sound for piece movements
 * - playPieceDyingSound: Plays sound for piece captures
 * - playSelectSound: Plays sound for UI selections
 * - playSpellSelectedSound: Plays sound for spell selection
 * - playKingCheckSound: Plays sound for check situations
 * - playKingCheckmateSound: Plays sound for checkmate
 * - playSpellSound: Plays spell-specific sound effects
 *
 * USED BY: All components that need audio functionality
 */
export const useSound = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
};
