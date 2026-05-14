/**
 * Shared settings gear: background music volume (via ref) + SFX volume (SoundContext).
 * Used on MainMenu and SpellSelection so audio controls stay consistent.
 */
import React, { useState, useEffect } from "react";
import { useSound } from "../../context/SoundContext";

/** Default volume for main-menu theme when the page loads (0–1). */
export const DEFAULT_MENU_BACKGROUND_MUSIC_VOLUME = 0.28;

interface AudioSettingsPanelProps {
  bgAudioRef: React.RefObject<HTMLAudioElement | null>;
}

export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({
  bgAudioRef,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { volume, setVolume, playSelectSound } = useSound();
  const [musicVolume, setMusicVolume] = useState(
    DEFAULT_MENU_BACKGROUND_MUSIC_VOLUME
  );

  useEffect(() => {
    if (bgAudioRef.current) {
      setMusicVolume(bgAudioRef.current.volume);
    }
  }, [bgAudioRef]);

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setMusicVolume(newVolume);
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = newVolume;
      if (bgAudioRef.current.muted) {
        bgAudioRef.current.muted = false;
      }
    }
  };

  const handleEffectsVolumeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    playSelectSound();
  };

  const SettingsIcon = () => (
    <button
      type="button"
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
              type="button"
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
