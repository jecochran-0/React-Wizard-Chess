import React, { useState, useEffect } from "react";
import Square from "./Square";
import { useGame } from "../../context/GameContext";
import { BoardState, PieceMeta, Square as SquareType } from "../../types/game";

const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

// Initial board setup for a new game
const INITIAL_BOARD_STATE: BoardState = {
  a8: { piece: "bR" },
  b8: { piece: "bN" },
  c8: { piece: "bB" },
  d8: { piece: "bQ" },
  e8: { piece: "bK" },
  f8: { piece: "bB" },
  g8: { piece: "bN" },
  h8: { piece: "bR" },
  a7: { piece: "bP" },
  b7: { piece: "bP" },
  c7: { piece: "bP" },
  d7: { piece: "bP" },
  e7: { piece: "bP" },
  f7: { piece: "bP" },
  g7: { piece: "bP" },
  h7: { piece: "bP" },

  a2: { piece: "wP" },
  b2: { piece: "wP" },
  c2: { piece: "wP" },
  d2: { piece: "wP" },
  e2: { piece: "wP" },
  f2: { piece: "wP" },
  g2: { piece: "wP" },
  h2: { piece: "wP" },
  a1: { piece: "wR" },
  b1: { piece: "wN" },
  c1: { piece: "wB" },
  d1: { piece: "wQ" },
  e1: { piece: "wK" },
  f1: { piece: "wB" },
  g1: { piece: "wN" },
  h1: { piece: "wR" },
};

interface MoveType {
  from: SquareType;
  to: SquareType;
}

const ChessBoard: React.FC = () => {
  const { gameConfig } = useGame();
  const [boardState, setBoardState] = useState<BoardState>(INITIAL_BOARD_STATE);
  const [selectedSquare, setSelectedSquare] = useState<SquareType | null>(null);
  const [validMoves, setValidMoves] = useState<SquareType[]>([]);
  const [lastMove, setLastMove] = useState<MoveType | null>(null);
  const [inCheck, setInCheck] = useState<boolean>(false);
  const [glyphs, setGlyphs] = useState<Record<string, any>>({}); // Squares with cursed glyphs

  // Function to handle square click
  const handleSquareClick = (square: SquareType) => {
    // This is a placeholder for future implementation of move and spell logic
    console.log(`Square clicked: ${square}`);

    // If a piece is already selected and this is a valid move, process the move
    if (selectedSquare && validMoves.includes(square)) {
      // Move logic will be implemented in Step 4
      console.log(`Move from ${selectedSquare} to ${square}`);

      // For now, just clear selection
      setSelectedSquare(null);
      setValidMoves([]);

      // Remember the last move for highlighting
      setLastMove({ from: selectedSquare, to: square });
    }
    // If clicking on a piece, select it and calculate valid moves
    else if (boardState[square] && boardState[square].piece) {
      setSelectedSquare(square);

      // Placeholder for valid move calculation (will be replaced with chess.js logic)
      // For now, just show empty squares as valid moves
      const tempValidMoves: SquareType[] = [];
      for (const sq of Object.keys(boardState)) {
        if (!boardState[sq] || !boardState[sq].piece) {
          tempValidMoves.push(sq as SquareType);
        }
      }
      setValidMoves(tempValidMoves);
    }
    // If clicking an empty square, clear selection
    else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Render the board
  return (
    <div
      className="chess-board-container"
      style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}
    >
      <div
        className="chess-board"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
          gap: "1px",
          border: "10px solid #8b5a2b", // Brown wooden border
          borderRadius: "4px",
          boxShadow: "0 5px 20px rgba(0, 0, 0, 0.5)",
          aspectRatio: "1",
        }}
      >
        {RANKS.map((rank, rankIndex) =>
          FILES.map((file, fileIndex) => {
            const square = file + rank as SquareType;
            const isLight = (rankIndex + fileIndex) % 2 === 1;
            const piece = boardState[square] || null;

            const isSquareSelected = selectedSquare === square;
            const isValidMove = validMoves.includes(square);
            const isInLastMove =
              lastMove && (lastMove.from === square || lastMove.to === square);
            const isInCheck = inCheck && piece && piece.piece.endsWith("K");
            const hasGlyph = square in glyphs;

            return (
              <Square
                key={square}
                square={square}
                piece={piece}
                isLight={isLight}
                isSelected={isSquareSelected}
                isValidMove={isValidMove}
                isLastMove={isInLastMove}
                isCheck={isInCheck}
                hasGlyph={hasGlyph}
                onClick={handleSquareClick}
              />
            );
          })
        )}
      </div>

      {/* Board coordinates */}
      <div
        className="files-notation"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          marginTop: "5px",
        }}
      >
        {FILES.map((file) => (
          <div key={file} style={{ textAlign: "center", fontSize: "14px" }}>
            {file}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChessBoard;
