import React, { useEffect } from "react";

interface PopupProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  autoCloseDelay?: number;
}

const Popup: React.FC<PopupProps> = ({
  message,
  isOpen,
  onClose,
  autoCloseDelay = 2000,
}) => {
  // Auto-close the popup after the specified delay
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen, onClose, autoCloseDelay]);

  if (!isOpen) return null;

  return (
    <div
      className="popup-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        className="popup-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(135deg, rgba(116, 58, 213, 0.85) 0%, rgba(86, 11, 173, 0.9) 100%)",
          color: "white",
          padding: "1.5rem",
          borderRadius: "1rem",
          maxWidth: "450px",
          width: "90%",
          boxShadow:
            "0 0 30px rgba(138, 75, 255, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          animation: "popup-fade-in 0.3s ease-out",
        }}
      >
        {/* Magical effects */}
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

        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: "1.1rem",
              marginBottom: "1rem",
              textShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
            }}
          >
            {message}
          </p>

          <button
            onClick={onClose}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              fontWeight: "bold",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              cursor: "pointer",
              transition: "all 0.2s",
              textShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.boxShadow =
                "0 0 15px rgba(168, 85, 247, 0.7)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            OK
          </button>
        </div>
      </div>

      {/* CSS animations */}
      <style>
        {`
          @keyframes popup-fade-in {
            from { 
              opacity: 0;
              transform: scale(0.9);
            }
            to { 
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Popup;
