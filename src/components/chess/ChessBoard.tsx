import React from "react";
import Square from "./Square";
import { Square as SquareType } from "../../types/game";
import { useChess } from "../../context/ChessContext";

const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const ChessBoard: React.FC = () => {
  const {
    boardState,
    selectedSquare,
    validMoves,
    isInCheck,
    lastMove,
    glyphs,
    selectSquare,
    makeMove,
  } = useChess();

  // Function to handle square click
  const handleSquareClick = (square: SquareType) => {
    console.log(`Square clicked: ${square}`);

    // If a piece is already selected and this is a valid move, process the move
    if (selectedSquare && validMoves.includes(square)) {
      makeMove(selectedSquare, square);
    }
    // If clicking on a piece, select it and calculate valid moves
    else if (boardState[square] && boardState[square].piece) {
      selectSquare(square);
    }
    // If clicking elsewhere, deselect
    else {
      selectSquare(null);
    }
  };

  // Get king square for check highlighting
  const getKingSquare = (color: "w" | "b"): SquareType | null => {
    for (const square in boardState) {
      const piece = boardState[square];
      if (piece.piece === `${color}K`) {
        return square as SquareType;
      }
    }
    return null;
  };

  const kingInCheck = isInCheck ? getKingSquare(isInCheck ? "b" : "w") : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gridTemplateRows: "repeat(8, 1fr)",
        width: "min(70vh, 600px)",
        height: "min(70vh, 600px)",
        border: "10px solid #8B4513",
        boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
      }}
    >
      {RANKS.map((rank, rankIndex) =>
        FILES.map((file, fileIndex) => {
          const square = `${file}${rank}` as SquareType;
          const isLight = (rankIndex + fileIndex) % 2 !== 0;
          const piece = boardState[square] || null;
          const isSelected = selectedSquare === square;
          const isValidMove = validMoves.includes(square);
          const isLastMove =
            lastMove && (lastMove.from === square || lastMove.to === square);

          // Check if king is in check
          const isCheck = kingInCheck === square;

          // Check if square has a glyph
          const hasGlyph = Object.keys(glyphs).includes(square);

          return (
            <Square
              key={square}
              square={square}
              piece={piece}
              isLight={isLight}
              isSelected={isSelected}
              isValidMove={isValidMove}
              isLastMove={!!isLastMove}
              isCheck={isCheck}
              hasGlyph={hasGlyph}
              onClick={handleSquareClick}
            />
          );
        })
      )}
    </div>
  );
};

export default ChessBoard;
