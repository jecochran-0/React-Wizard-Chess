import React from "react";

/**
 * Interface for the PieceTypeSelector component props
 */
interface PieceTypeSelectorProps {
  isOpen: boolean;
  onSelect: (pieceType: "n" | "b") => void;
  onCancel: () => void;
}

/**
 * Component that displays a dialog for selecting a piece type (Knight or Bishop)
 * Used by the Dark Conversion spell to let the player choose which piece to summon
 */
const PieceTypeSelector: React.FC<PieceTypeSelectorProps> = ({
  isOpen,
  onSelect,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderRadius: "8px",
          padding: "20px",
          width: "300px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(139, 92, 246, 0.5)",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            margin: "0 0 15px 0",
            textAlign: "center",
            color: "white",
            borderBottom: "1px solid rgba(139, 92, 246, 0.5)",
            paddingBottom: "10px",
          }}
        >
          Choose a Piece to Summon
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: "#d1d5db",
            marginBottom: "15px",
            textAlign: "center",
          }}
        >
          Select which piece you want to summon with Dark Conversion:
        </p>

        <p
          style={{
            fontSize: "14px",
            color: "#ffb700",
            marginBottom: "15px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Note: The new piece will replace the first pawn you selected.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            marginBottom: "20px",
          }}
        >
          <div
            onClick={() => onSelect("n")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              padding: "10px",
              borderRadius: "4px",
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              transition: "all 0.2s",
              width: "100px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(49, 46, 129, 0.6)";
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.6)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.8)";
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
            }}
          >
            <div
              style={{
                fontSize: "40px",
                marginBottom: "5px",
              }}
            >
              ♘
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "white",
                fontWeight: "600",
              }}
            >
              Knight
            </div>
          </div>

          <div
            onClick={() => onSelect("b")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              padding: "10px",
              borderRadius: "4px",
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              transition: "all 0.2s",
              width: "100px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(49, 46, 129, 0.6)";
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.6)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.8)";
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
            }}
          >
            <div
              style={{
                fontSize: "40px",
                marginBottom: "5px",
              }}
            >
              ♗
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "white",
                fontWeight: "600",
              }}
            >
              Bishop
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              backgroundColor: "rgba(127, 29, 29, 0.7)",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(185, 28, 28, 0.8)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(127, 29, 29, 0.7)";
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PieceTypeSelector;
