import GameManager from "./GameManager";
import { Color, Square } from "chess.js";
import { SpellId, Effect } from "../types/types";

// Type for spell targets
type SingleTarget = Square;
type MultiTarget = Square[];
type FromToTarget = { from: Square; to: Square };
type SpellTargetData = SingleTarget | MultiTarget | FromToTarget;

// Interface for a piece with square information
interface PieceWithSquare {
  piece: {
    type: string;
    color: string;
    effects?: Effect[];
    hasMoved?: boolean;
  };
  square: string;
}

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 100, // pawn
  n: 320, // knight
  b: 330, // bishop
  r: 500, // rook
  q: 900, // queen
  k: 20000, // king - artificially high to prioritize king safety
};

export class ComputerPlayer {
  private gameManager: GameManager;
  private difficulty: "easy" | "medium" | "hard";
  private color: Color;

  constructor(
    gameManager: GameManager,
    color: Color = "b",
    difficulty: "easy" | "medium" | "hard" = "medium"
  ) {
    this.gameManager = gameManager;
    this.difficulty = difficulty;
    this.color = color;
  }

  /**
   * Asynchronously makes a move as the computer player (spell and/or standard move).
   * @returns Promise<boolean> indicating if a primary action (spell or move) was successfully initiated.
   */
  async makeMove(): Promise<boolean> {
    // Check if it's the computer's turn
    if (this.gameManager.getCurrentPlayer() !== this.color) {
      console.log("Not computer's turn");
      return false;
    }

    console.log(`Computer Player (${this.color}) is making a move...`);

    // Log the player color and current player
    console.log(
      `Computer color: ${
        this.color
      }, Current player: ${this.gameManager.getCurrentPlayer()}`
    );

    // Get all possible moves
    const possibleMoves = this.getAllPossibleMoves();
    console.log(`Found ${possibleMoves.length} possible moves`);

    if (possibleMoves.length === 0) {
      console.error("Computer has no legal moves available");
      return false;
    }

    // Decide between casting a spell or making a regular move
    const spellDecision = this.shouldCastSpell();

    if (spellDecision && Math.random() < this.getSpellUsageProbability()) {
      // Cast the selected spell
      console.log(`Computer casting spell: ${spellDecision.spellId}`);

      try {
        const success = this.gameManager.castSpell(
          spellDecision.spellId,
          spellDecision.targets,
          spellDecision.pieceType
        );

        if (success) {
          console.log("Computer successfully cast spell");
          // CRITICAL CHECK: Did the spell end the turn?
          if (this.gameManager.getCurrentPlayer() === this.color) {
            console.log(
              "Spell did not end turn. Computer attempting standard move..."
            );
            // Get fresh possible moves AFTER the spell potentially changed the board
            const movesAfterSpell = this.getAllPossibleMoves();

            // Add a delay before making the standard move
            await new Promise((resolve) => setTimeout(resolve, 750)); // 750ms delay

            console.log("Executing delayed standard move after spell.");
            if (this.gameManager.getCurrentPlayer() === this.color) {
              // Wait for the standard move to complete as well
              await this._makeStandardMove(movesAfterSpell);
            } else {
              console.warn(
                "Computer turn ended before delayed move could execute."
              );
            }
          } else {
            console.log("Spell ended the turn.");
          }
          return true; // Spell cast was the main action, return true
        }
      } catch (error) {
        console.error("Error while computer casting spell:", error);
      }
    }

    // If we didn't cast a spell, or spell failed, make a standard move
    console.log("Computer attempting standard move (no spell cast).");
    return this._makeStandardMove(possibleMoves);
  }

  /**
   * Selects the best move based on difficulty level
   */
  private selectBestMove(): { from: Square; to: Square } | null {
    const possibleMoves = this.getAllPossibleMoves();

    if (possibleMoves.length === 0) {
      return null;
    }

    switch (this.difficulty) {
      case "easy":
        return this.getRandomMove(possibleMoves);
      case "medium":
        return this.getBasicTacticalMove(possibleMoves);
      case "hard":
        return this.getAdvancedStrategicMove(possibleMoves);
      default:
        return this.getRandomMove(possibleMoves);
    }
  }

  /**
   * Get all possible moves for the computer
   */
  private getAllPossibleMoves(): Array<{ from: Square; to: Square }> {
    const pieces = this.gameManager.getAllPieces();
    const moves: Array<{ from: Square; to: Square }> = [];

    // Filter to only include computer's pieces
    const computerPieces = pieces.filter(
      (p: PieceWithSquare) => p.piece.color === this.color
    );

    // Get legal moves for each piece
    computerPieces.forEach((pieceData: PieceWithSquare) => {
      const square = pieceData.square as Square;
      const legalMoves = this.gameManager.getLegalMovesFrom(square);

      // For each legal destination, add a move
      legalMoves.forEach((toSquare: Square) => {
        moves.push({ from: square, to: toSquare });
      });
    });

    return moves;
  }

  /**
   * Select a random move
   */
  private getRandomMove(moves: Array<{ from: Square; to: Square }>): {
    from: Square;
    to: Square;
  } {
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }

  /**
   * Select a basic tactical move (medium difficulty)
   * Prioritizes captures and checks
   */
  private getBasicTacticalMove(moves: Array<{ from: Square; to: Square }>): {
    from: Square;
    to: Square;
  } {
    // Create a copy for evaluation
    const evaluatedMoves = [...moves].map((move) => ({
      ...move,
      score: 0,
    }));

    // Evaluate each move
    for (const move of evaluatedMoves) {
      const boardState = this.gameManager.getBoardState();
      const toPiece = boardState[move.to];

      // Prioritize captures based on piece value
      if (toPiece && toPiece.color !== this.color) {
        move.score += PIECE_VALUES[toPiece.type] || 0;
      }
    }

    // Sort by score (highest first)
    evaluatedMoves.sort((a, b) => b.score - a.score);

    // 70% chance to pick the best move, 30% chance for random move from top 3
    if (Math.random() < 0.7 || evaluatedMoves.length < 3) {
      return { from: evaluatedMoves[0].from, to: evaluatedMoves[0].to };
    } else {
      // Pick randomly from top 3 moves
      const randomIndex = Math.floor(
        Math.random() * Math.min(3, evaluatedMoves.length)
      );
      return {
        from: evaluatedMoves[randomIndex].from,
        to: evaluatedMoves[randomIndex].to,
      };
    }
  }

  /**
   * Select an advanced strategic move (hard difficulty)
   * Considers piece development, board control, king safety
   */
  private getAdvancedStrategicMove(
    moves: Array<{ from: Square; to: Square }>
  ): { from: Square; to: Square } {
    // Create a copy for evaluation
    const evaluatedMoves = [...moves].map((move) => ({
      ...move,
      score: 0,
    }));

    // Evaluate each move
    for (const move of evaluatedMoves) {
      const boardState = this.gameManager.getBoardState();
      const fromPiece = boardState[move.from];
      const toPiece = boardState[move.to];

      // Base score
      let score = 0;

      // Prioritize captures based on piece value
      if (toPiece && toPiece.color !== this.color) {
        score += PIECE_VALUES[toPiece.type] || 0;
      }

      // Prioritize center control for knights and bishops
      if (fromPiece && (fromPiece.type === "n" || fromPiece.type === "b")) {
        const centerValue = this.evaluateCentralControl(move.to);
        score += centerValue;
      }

      // Prioritize piece development in early game
      if (
        fromPiece &&
        !fromPiece.hasMoved &&
        (fromPiece.type === "n" || fromPiece.type === "b")
      ) {
        score += 50;
      }

      move.score = score;
    }

    // Sort by score (highest first)
    evaluatedMoves.sort((a, b) => b.score - a.score);

    // 90% chance to pick the best move, 10% chance for second best
    if (Math.random() < 0.9 || evaluatedMoves.length < 2) {
      return { from: evaluatedMoves[0].from, to: evaluatedMoves[0].to };
    } else {
      return { from: evaluatedMoves[1].from, to: evaluatedMoves[1].to };
    }
  }

  /**
   * Evaluate how central a square is (for positional play)
   */
  private evaluateCentralControl(square: Square): number {
    const file = square.charAt(0);
    const rank = parseInt(square.charAt(1));

    // Calculate distance from center (e4, d4, e5, d5)
    const fileDistance = Math.min(
      Math.abs(file.charCodeAt(0) - "e".charCodeAt(0)),
      Math.abs(file.charCodeAt(0) - "d".charCodeAt(0))
    );

    const rankDistance = Math.min(Math.abs(rank - 4), Math.abs(rank - 5));

    // Calculate a score based on centrality (higher = more central)
    const centralityScore = 30 - (fileDistance * 10 + rankDistance * 10);
    return Math.max(0, centralityScore);
  }

  /**
   * Decides whether to cast a spell and which one to use
   */
  private shouldCastSpell(): {
    spellId: SpellId;
    targets: SpellTargetData;
    pieceType?: "n" | "b";
  } | null {
    // Get available spells for the computer
    const playerSpells = this.gameManager.getPlayerSpells();
    const availableSpells = playerSpells[this.color];

    if (!availableSpells || availableSpells.length === 0) {
      return null;
    }

    // Get current mana
    const mana = this.gameManager.getPlayerMana()[this.color];

    // Filter spells by available mana
    const affordableSpells = availableSpells.filter((spellId) => {
      const cost = this.gameManager.getSpellCost(spellId);
      return cost <= mana;
    });

    if (affordableSpells.length === 0) {
      return null;
    }

    // For easy difficulty: just pick a random affordable spell
    if (this.difficulty === "easy") {
      return this.getRandomSpellDecision(affordableSpells);
    }

    // For medium and hard difficulty: make more strategic spell decisions
    // Prioritize high-impact spells based on board state
    return this.getStrategicSpellDecision(affordableSpells);
  }

  /**
   * Selects a random spell and valid targets
   */
  private getRandomSpellDecision(spells: SpellId[]): {
    spellId: SpellId;
    targets: SpellTargetData;
    pieceType?: "n" | "b";
  } | null {
    // Pick a random spell
    const randomIndex = Math.floor(Math.random() * spells.length);
    const selectedSpellId = spells[randomIndex];

    // Find valid targets for this spell
    const targets = this.findValidTargetsForSpell(selectedSpellId);

    if (!targets) {
      return null;
    }

    return {
      spellId: selectedSpellId,
      targets: targets,
      pieceType:
        selectedSpellId === "darkConversion"
          ? Math.random() < 0.5
            ? "n"
            : "b"
          : undefined,
    };
  }

  /**
   * Makes a strategic spell decision based on the current board state
   */
  private getStrategicSpellDecision(spells: SpellId[]): {
    spellId: SpellId;
    targets: SpellTargetData;
    pieceType?: "n" | "b";
  } | null {
    // For each spell, calculate a priority score
    const evaluatedSpells = spells.map((spellId) => {
      let score = 0;

      // Calculate score based on spell type and board state
      switch (spellId) {
        case "emberCrown":
          // Prioritize Ember Crown on advanced pawns
          score = this.evaluateEmberCrownScore();
          break;
        case "arcaneAnchor":
          // Prioritize Arcane Anchor on valuable pieces under threat
          score = this.evaluateArcaneAnchorScore();
          break;
        // Add more cases for other spells

        default:
          // Base score for other spells
          score = 50;
      }

      return {
        spellId: spellId,
        score: score,
      };
    });

    // Sort by score (highest first)
    evaluatedSpells.sort((a, b) => b.score - a.score);

    // Try spells in order of priority
    for (const evalSpell of evaluatedSpells) {
      const targets = this.findValidTargetsForSpell(evalSpell.spellId);

      if (targets) {
        return {
          spellId: evalSpell.spellId,
          targets: targets,
          pieceType:
            evalSpell.spellId === "darkConversion"
              ? Math.random() < 0.5
                ? "n"
                : "b"
              : undefined,
        };
      }
    }

    return null;
  }

  /**
   * Find valid targets for a specific spell
   */
  private findValidTargetsForSpell(spellId: SpellId): SpellTargetData | null {
    const boardState = this.gameManager.getBoardState();
    const pieces = this.gameManager.getAllPieces();
    const computerPieces = pieces.filter(
      (p: PieceWithSquare) => p.piece.color === this.color
    );

    switch (spellId) {
      case "emberCrown": {
        // Target a pawn, preferably one that's advanced
        const pawns = computerPieces.filter(
          (p: PieceWithSquare) => p.piece.type === "p"
        );

        if (pawns.length === 0) return null;

        // Sort pawns by rank (most advanced first for white, least advanced first for black)
        pawns.sort((a: PieceWithSquare, b: PieceWithSquare) => {
          const rankA = parseInt(a.square.charAt(1));
          const rankB = parseInt(b.square.charAt(1));
          return this.color === "w" ? rankB - rankA : rankA - rankB;
        });

        // Return the most advanced pawn
        return pawns[0].square as Square;
      }

      case "arcaneAnchor": {
        // Target a valuable piece (queen, rook)
        const valuablePieces = computerPieces.filter(
          (p: PieceWithSquare) => p.piece.type === "q" || p.piece.type === "r"
        );

        if (valuablePieces.length === 0) return null;

        // Pick the most valuable piece
        const targetPiece = valuablePieces.sort(
          (a: PieceWithSquare, b: PieceWithSquare) =>
            (PIECE_VALUES[b.piece.type] || 0) -
            (PIECE_VALUES[a.piece.type] || 0)
        )[0];

        return targetPiece.square as Square;
      }

      case "phantomStep": {
        // Find a piece that has valuable non-capture moves
        const knights = computerPieces.filter(
          (p: PieceWithSquare) => p.piece.type === "n"
        );

        if (knights.length === 0) return null;

        // Pick a random knight
        const randomKnight =
          knights[Math.floor(Math.random() * knights.length)];

        // Get potential knight moves
        const potentialSquares = this.getKnightMoveSquares(randomKnight.square);

        // Filter to empty squares
        const emptySquares = potentialSquares.filter((sq) => !boardState[sq]);

        if (emptySquares.length === 0) return null;

        // Pick a random destination
        const randomDestination =
          emptySquares[Math.floor(Math.random() * emptySquares.length)];

        return {
          from: randomKnight.square as Square,
          to: randomDestination as Square,
        };
      }

      // Add more cases for other spells

      default:
        // For spells without specific targeting strategy, return null
        return null;
    }
  }

  /**
   * Get all possible knight move squares from a given position
   */
  private getKnightMoveSquares(square: string): string[] {
    const file = square.charAt(0);
    const rank = parseInt(square.charAt(1));
    const moves = [];

    // All potential knight moves
    const offsets = [
      { file: 1, rank: 2 },
      { file: 2, rank: 1 },
      { file: 2, rank: -1 },
      { file: 1, rank: -2 },
      { file: -1, rank: -2 },
      { file: -2, rank: -1 },
      { file: -2, rank: 1 },
      { file: -1, rank: 2 },
    ];

    for (const offset of offsets) {
      const newFile = String.fromCharCode(file.charCodeAt(0) + offset.file);
      const newRank = rank + offset.rank;

      // Check if the new position is on the board
      if (newFile >= "a" && newFile <= "h" && newRank >= 1 && newRank <= 8) {
        moves.push(`${newFile}${newRank}`);
      }
    }

    return moves;
  }

  /**
   * Evaluate score for Ember Crown spell
   */
  private evaluateEmberCrownScore(): number {
    const pieces = this.gameManager.getAllPieces();
    const pawns = pieces.filter(
      (p: PieceWithSquare) =>
        p.piece.color === this.color && p.piece.type === "p"
    );

    if (pawns.length === 0) return 0;

    // Calculate score based on how advanced the pawns are
    let maxScore = 0;

    pawns.forEach((pawn: PieceWithSquare) => {
      const rank = parseInt(pawn.square.charAt(1));
      let score = 0;

      // Higher score for more advanced pawns
      if (this.color === "w") {
        score = (rank - 2) * 20; // White pawns start on rank 2
      } else {
        score = (7 - rank) * 20; // Black pawns start on rank 7
      }

      if (score > maxScore) {
        maxScore = score;
      }
    });

    return maxScore;
  }

  /**
   * Evaluate score for Arcane Anchor spell
   */
  private evaluateArcaneAnchorScore(): number {
    const pieces = this.gameManager.getAllPieces();
    const valuablePieces = pieces.filter(
      (p: PieceWithSquare) =>
        p.piece.color === this.color &&
        (p.piece.type === "q" || p.piece.type === "r")
    );

    if (valuablePieces.length === 0) return 0;

    // Higher score for more valuable pieces
    return valuablePieces.reduce((maxScore, piece) => {
      const pieceValue = PIECE_VALUES[piece.piece.type] || 0;
      return Math.max(maxScore, pieceValue / 10);
    }, 0);
  }

  /**
   * Determine the probability of using a spell based on difficulty
   */
  private getSpellUsageProbability(): number {
    switch (this.difficulty) {
      case "easy":
        return 0.3; // 30% chance to use a spell when available
      case "medium":
        return 0.5; // 50% chance
      case "hard":
        return 0.7; // 70% chance
      default:
        return 0.5;
    }
  }

  /**
   * Set the computer's color
   */
  setColor(color: Color): void {
    this.color = color;
  }

  /**
   * Gets the color the computer is playing.
   */
  getColor(): Color {
    return this.color;
  }

  /**
   * Set the computer's difficulty
   */
  setDifficulty(difficulty: "easy" | "medium" | "hard"): void {
    this.difficulty = difficulty;
  }

  /**
   * Asynchronously attempts to make a standard chess move based on difficulty.
   * @param possibleMoves - List of available legal moves.
   * @returns Promise<boolean> indicating if a move was successfully made.
   */
  private async _makeStandardMove(
    possibleMoves: Array<{ from: Square; to: Square }>
  ): Promise<boolean> {
    if (possibleMoves.length === 0) {
      console.log("Computer has no standard moves available.");
      return false;
    }

    let moveDecision;

    try {
      // Select move based on difficulty
      switch (this.difficulty) {
        case "easy":
          moveDecision = this.getRandomMove(possibleMoves);
          break;
        case "medium":
          moveDecision = this.getBasicTacticalMove(possibleMoves);
          break;
        case "hard":
          moveDecision = this.getAdvancedStrategicMove(possibleMoves);
          break;
        default:
          moveDecision = this.getRandomMove(possibleMoves); // Fallback
          break;
      }

      if (moveDecision) {
        console.log(
          `Computer attempting standard move: ${moveDecision.from} to ${moveDecision.to}`
        );

        // Try to make the move using the game manager (assuming makeMove is synchronous)
        const success = this.gameManager.makeMove(
          moveDecision.from,
          moveDecision.to
        );

        if (success) {
          console.log("Computer successfully made standard move");
          return true;
        } else {
          console.warn(
            "Computer standard move failed (potentially invalid after spell?)"
          );
          // Optionally, could try a random move as fallback, but might be complex if state changed mid-turn
        }
      } else {
        console.warn("Could not decide on a standard move.");
      }
    } catch (error) {
      console.error(
        "Error during computer standard move selection/execution:",
        error
      );
    }

    console.warn("Computer failed to execute a standard move this attempt.");
    return false;
  }
}
