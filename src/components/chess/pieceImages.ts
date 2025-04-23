// Import all chess piece images
import bBishop from "/assets/Chess_Sprites/b_bishop-min.png";
import bKing from "/assets/Chess_Sprites/b_king-min.png";
import bKnight from "/assets/Chess_Sprites/b_knight-min.png";
import bPawn from "/assets/Chess_Sprites/b_pawn-min.png";
import bQueen from "/assets/Chess_Sprites/b_queen-min.png";
import bRook from "/assets/Chess_Sprites/b_rook-min.png";
import wBishop from "/assets/Chess_Sprites/w_bishop-min.png";
import wKing from "/assets/Chess_Sprites/w_king-min.png";
import wKnight from "/assets/Chess_Sprites/w_knight-min.png";
import wPawn from "/assets/Chess_Sprites/w_pawn-min.png";
import wQueen from "/assets/Chess_Sprites/w_queen-min.png";
import wRook from "/assets/Chess_Sprites/w_rook-min.png";

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
