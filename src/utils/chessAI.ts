import { Chess, Move, PieceSymbol, Square } from "chess.js";
import { AIDifficulty } from "../types/game";

type ChessMove = {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
};

// Piece values for evaluation
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0, // King's value is not used in material calculation
};

// Positional bonus tables for improved AI evaluation
const PAWN_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, -20, -20, 10, 10, 5, 5, -5, -10, 0, 0, -10,
  -5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, 5, 10, 25, 25, 10, 5, 5, 10, 10, 20, 30,
  30, 20, 10, 10, 50, 50, 50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30,
  0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20,
  15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

/**
 * Chess AI implementation that provides different difficulty levels
 */
export class ChessAI {
  /**
   * Get the best move for the current position based on the difficulty level
   *
   * @param chess The current chess game state
   * @param difficulty The AI difficulty level
   * @returns The best move for the AI to make
   */
  static getAIMove(chess: Chess, difficulty: AIDifficulty): ChessMove | null {
    console.log(`[ChessAI] Generating move for difficulty: ${difficulty}`);
    console.log(`[ChessAI] Current position FEN: ${chess.fen()}`);
    console.log(`[ChessAI] Current turn: ${chess.turn()}`);

    // If the game is over, return null
    if (chess.isGameOver()) {
      console.log("[ChessAI] Game is over, no move generated");
      return null;
    }

    // If difficulty is "none", don't generate a move
    if (difficulty === "none") {
      console.log("[ChessAI] Difficulty is none, no AI move needed");
      return null;
    }

    // Get all legal moves with verbose format to include from/to information
    const moves = chess.moves({ verbose: true });
    console.log(`[ChessAI] Found ${moves.length} legal moves`);

    if (moves.length === 0) {
      console.log("[ChessAI] No legal moves available");
      return null;
    }

    // Log the current board state
    console.log("[ChessAI] Current board:");
    const board = chess.board();

    // Print a simplified view of the board
    for (let rank = 0; rank < 8; rank++) {
      let rankStr = "";
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          rankStr += piece.color + piece.type + " ";
        } else {
          rankStr += ".. ";
        }
      }
      console.log(`[ChessAI] ${8 - rank}: ${rankStr}`);
    }

    // For "apprentice" difficulty: Pick a random move
    if (difficulty === "apprentice") {
      const randomIndex = Math.floor(Math.random() * moves.length);
      const randomMove = moves[randomIndex];

      console.log(
        `[ChessAI] Apprentice AI selected random move: ${randomMove.from} to ${randomMove.to}`
      );
      const moveResult = {
        from: randomMove.from as Square,
        to: randomMove.to as Square,
        promotion: randomMove.promotion,
      };

      // Verify that the selected move is valid in the current position
      try {
        const testChess = new Chess(chess.fen());
        const moveCheck = testChess.move({
          from: moveResult.from,
          to: moveResult.to,
          promotion: moveResult.promotion,
        });

        if (moveCheck) {
          console.log("[ChessAI] Validated move is legal");
        } else {
          console.error(
            "[ChessAI] Move validation failed even though it came from legal moves list!"
          );
        }
      } catch (error) {
        console.error("[ChessAI] Error validating move:", error);
      }

      return moveResult;
    }

    // For "novice" difficulty: Pick a decent move, but not always the best one
    if (difficulty === "novice") {
      // Evaluate all moves with a simple evaluation function
      const evaluatedMoves = moves.map((move) => {
        // Make the move
        const newChess = new Chess(chess.fen());
        newChess.move(move);

        // Evaluate the resulting position
        const evaluation = this.evaluatePosition(newChess);

        return {
          move,
          evaluation,
        };
      });

      // Sort moves by evaluation
      evaluatedMoves.sort((a, b) => b.evaluation - a.evaluation);

      // Take a random move from the top half of the moves
      const topHalfIndex = Math.floor(
        Math.random() * Math.max(1, Math.floor(evaluatedMoves.length / 2))
      );
      const selectedMove = evaluatedMoves[topHalfIndex].move;

      console.log(
        `[ChessAI] Novice AI selected move: ${selectedMove.from} to ${selectedMove.to}`
      );
      return {
        from: selectedMove.from as Square,
        to: selectedMove.to as Square,
        promotion: selectedMove.promotion,
      };
    }

    // For "master" difficulty: Use minimax algorithm with alpha-beta pruning
    if (difficulty === "master") {
      // Evaluate the moves with minimax algorithm
      const SEARCH_DEPTH = 3;

      const bestMove = this.findBestMove(chess, SEARCH_DEPTH);

      if (bestMove) {
        console.log(
          `[ChessAI] Master AI selected move: ${bestMove.from} to ${bestMove.to}`
        );
        return bestMove;
      } else {
        // Fallback to a simple move if minimax fails
        console.log("[ChessAI] Minimax failed, falling back to random move");
        const randomIndex = Math.floor(Math.random() * moves.length);
        const randomMove = moves[randomIndex];
        return {
          from: randomMove.from as Square,
          to: randomMove.to as Square,
          promotion: randomMove.promotion,
        };
      }
    }

    // Fallback to a random move if difficulty is not recognized
    console.log("[ChessAI] Using fallback random move selection");
    const randomIndex = Math.floor(Math.random() * moves.length);
    const randomMove = moves[randomIndex];
    return {
      from: randomMove.from as Square,
      to: randomMove.to as Square,
      promotion: randomMove.promotion,
    };
  }

  /**
   * Find the best move using minimax algorithm with alpha-beta pruning
   */
  private static findBestMove(chess: Chess, depth: number): ChessMove | null {
    let bestMove: Move | null = null;
    let bestValue = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    const isMaximizingPlayer = true;

    // Get all legal moves
    const moves = chess.moves({ verbose: true });

    for (const move of moves) {
      // Make the move
      const newChess = new Chess(chess.fen());
      newChess.move(move);

      // Evaluate the move
      const value = this.minimax(
        newChess,
        depth - 1,
        alpha,
        beta,
        !isMaximizingPlayer
      );

      // Update the best move
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
        alpha = value; // Update alpha for pruning
      }
    }

    if (bestMove) {
      return {
        from: bestMove.from as Square,
        to: bestMove.to as Square,
        promotion: bestMove.promotion,
      };
    }

    return null;
  }

  /**
   * Minimax algorithm with alpha-beta pruning
   */
  private static minimax(
    chess: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean
  ): number {
    // Base case: depth is 0 or game is over
    if (depth === 0 || chess.isGameOver()) {
      return this.evaluatePosition(chess);
    }

    if (isMaximizingPlayer) {
      let value = -Infinity;
      const moves = chess.moves({ verbose: true });

      for (const move of moves) {
        const newChess = new Chess(chess.fen());
        newChess.move(move);
        value = Math.max(
          value,
          this.minimax(newChess, depth - 1, alpha, beta, false)
        );
        alpha = Math.max(alpha, value);
        if (beta <= alpha) {
          break; // Beta cutoff
        }
      }

      return value;
    } else {
      let value = Infinity;
      const moves = chess.moves({ verbose: true });

      for (const move of moves) {
        const newChess = new Chess(chess.fen());
        newChess.move(move);
        value = Math.min(
          value,
          this.minimax(newChess, depth - 1, alpha, beta, true)
        );
        beta = Math.min(beta, value);
        if (beta <= alpha) {
          break; // Alpha cutoff
        }
      }

      return value;
    }
  }

  /**
   * Evaluate a chess position
   * Returns a positive value for positions good for white, negative for positions good for black
   */
  private static evaluatePosition(chess: Chess): number {
    // Check if game is over
    if (chess.isCheckmate()) {
      // Checkmate is worst/best outcome
      return chess.turn() === "w" ? -10000 : 10000;
    }

    if (chess.isDraw()) {
      return 0; // Draw is neutral
    }

    // Material counting
    let score = 0;
    const board = chess.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = board[i][j];
        if (square) {
          const pieceValue = PIECE_VALUES[square.type] || 0;

          // Add positional bonus based on piece type and position
          let positionalBonus = 0;
          const squareIndex = i * 8 + j;

          if (square.type === "p") {
            positionalBonus =
              PAWN_TABLE[
                square.color === "w" ? squareIndex : 63 - squareIndex
              ] / 100;
          } else if (square.type === "n") {
            positionalBonus =
              KNIGHT_TABLE[
                square.color === "w" ? squareIndex : 63 - squareIndex
              ] / 100;
          }

          score +=
            square.color === "w"
              ? pieceValue + positionalBonus
              : -(pieceValue + positionalBonus);
        }
      }
    }

    // Check threat (slight advantage)
    if (chess.isCheck()) {
      score += chess.turn() === "w" ? -0.5 : 0.5;
    }

    // Mobility (number of legal moves)
    const mobilityScore = chess.moves().length * 0.1;
    score += chess.turn() === "w" ? mobilityScore : -mobilityScore;

    return score;
  }
}
