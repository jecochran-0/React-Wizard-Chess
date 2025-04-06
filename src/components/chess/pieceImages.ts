// Import all chess piece images
import bBishop from "/assets/Chess_Sprites/b_bishop.png";
import bKing from "/assets/Chess_Sprites/b_king.png";
import bKnight from "/assets/Chess_Sprites/b_knight.png";
import bPawn from "/assets/Chess_Sprites/b_pawn.png";
import bQueen from "/assets/Chess_Sprites/b_queen.png";
import bRook from "/assets/Chess_Sprites/b_rook.png";
import wBishop from "/assets/Chess_Sprites/w_bishop.png";
import wKing from "/assets/Chess_Sprites/w_king.png";
import wKnight from "/assets/Chess_Sprites/w_knight.png";
import wPawn from "/assets/Chess_Sprites/w_pawn.png";
import wQueen from "/assets/Chess_Sprites/w_queen.png";
import wRook from "/assets/Chess_Sprites/w_rook.png";

export type PieceCode =
  | "bB"
  | "bK"
  | "bN"
  | "bP"
  | "bQ"
  | "bR"
  | "wB"
  | "wK"
  | "wN"
  | "wP"
  | "wQ"
  | "wR";

// Map piece codes to their respective images
const pieceImages: Record<PieceCode, string> = {
  bB: bBishop,
  bK: bKing,
  bN: bKnight,
  bP: bPawn,
  bQ: bQueen,
  bR: bRook,
  wB: wBishop,
  wK: wKing,
  wN: wKnight,
  wP: wPawn,
  wQ: wQueen,
  wR: wRook,
};

export default pieceImages;
