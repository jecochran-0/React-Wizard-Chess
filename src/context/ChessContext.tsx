import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { GameManager } from "../utils/GameManager";
import { BoardState, Square } from "../types/game";

// Define the type for glyph information
interface GlyphInfo {
  turnsLeft: number;
  triggered?: boolean;
}

interface ChessContextType {
  gameManager: GameManager;
  boardState: BoardState;
  selectedSquare: Square | null;
  validMoves: Square[];
  isInCheck: boolean;
  isInCheckmate: boolean;
  isGameDrawn: boolean;
  glyphs: Record<string, GlyphInfo>;
  lastMove: { from: Square; to: Square } | null;
  selectSquare: (square: Square | null) => void;
  makeMove: (from: Square, to: Square) => boolean;
  resetChessGame: () => void;
  updateCounter: number;
}

const ChessContext = createContext<ChessContextType | undefined>(undefined);

export const ChessProvider = ({ children }: { children: ReactNode }) => {
  const [gameManager] = useState<GameManager>(() => new GameManager());
  const [boardState, setBoardState] = useState<BoardState>(
    gameManager.getBoardState()
  );
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [isInCheck, setIsInCheck] = useState<boolean>(false);
  const [isInCheckmate, setIsInCheckmate] = useState<boolean>(false);
  const [isGameDrawn, setIsGameDrawn] = useState<boolean>(false);
  const [glyphs, setGlyphs] = useState<Record<string, GlyphInfo>>({});
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null
  );
  // Force rerender counter
  const [updateCounter, setUpdateCounter] = useState(0);

  // Update game state after moves
  const updateGameState = () => {
    setBoardState(gameManager.getBoardState());
    setIsInCheck(gameManager.isInCheck());
    setIsInCheckmate(gameManager.isInCheckmate());
    setIsGameDrawn(gameManager.isGameDrawn());
    setGlyphs(gameManager.getGlyphs());
    setUpdateCounter((prev) => prev + 1);
  };

  // Initialize game state
  useEffect(() => {
    updateGameState();
  }, []);

  // Select a square and calculate valid moves
  const selectSquare = (square: Square | null) => {
    setSelectedSquare(square);
    if (square) {
      setValidMoves(gameManager.getLegalMoves(square));
    } else {
      setValidMoves([]);
    }
  };

  // Make a move on the board
  const makeMove = (from: Square, to: Square): boolean => {
    const success = gameManager.makeMove(from, to);
    if (success) {
      updateGameState();
      setSelectedSquare(null);
      setValidMoves([]);
      setLastMove({ from, to });
    }
    return success;
  };

  // Reset the chess game
  const resetChessGame = () => {
    gameManager.resetGame();
    updateGameState();
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
  };

  return (
    <ChessContext.Provider
      value={{
        gameManager,
        boardState,
        selectedSquare,
        validMoves,
        isInCheck,
        isInCheckmate,
        isGameDrawn,
        glyphs,
        lastMove,
        selectSquare,
        makeMove,
        resetChessGame,
        updateCounter,
      }}
    >
      {children}
    </ChessContext.Provider>
  );
};

export const useChess = () => {
  const context = useContext(ChessContext);
  if (context === undefined) {
    throw new Error("useChess must be used within a ChessProvider");
  }
  return context;
};
