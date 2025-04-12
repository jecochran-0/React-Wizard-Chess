import GameManager from "./GameManager";
import { Color, Square, Piece } from "chess.js";
import { SpellId, Effect } from "../types/types";
import { Chess } from "chess.js";

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

// --- Evaluation Constants ---
const CENTER_SQUARES = ["d4", "e4", "d5", "e5"];
const SEMI_CENTER_SQUARES = [
  "c3",
  "d3",
  "e3",
  "f3",
  "c4",
  "f4",
  "c5",
  "f5",
  "c6",
  "d6",
  "e6",
  "f6",
];
const REPETITION_PENALTY = -1000;
const SPELL_PREFERENCE_THRESHOLD = 75; // Spell needs to be this much better than a move to be preferred

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
    // Check game status first
    const currentStatus = this.gameManager.getGameStatus();
    if (
      currentStatus === "checkmate" ||
      currentStatus === "stalemate" ||
      currentStatus === "draw"
    ) {
      console.log(`Game over (${currentStatus}). Computer cannot move.`);
      return false;
    }

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

    // Check again if moves are possible, though checkmate/stalemate should cover this
    if (
      possibleMoves.length === 0 &&
      this.gameManager.getGameStatus() === "active"
    ) {
      console.warn(
        "Computer has no legal moves, but game is not over? This might indicate an issue."
      );
      return false;
    }

    // --- Determine Best Move and Best Spell ---
    const bestMoveResult = this._findBestStandardMove(possibleMoves);
    const bestSpellResult = this.shouldCastSpell(); // Gets best affordable spell + score

    const bestMoveScore = bestMoveResult ? bestMoveResult.score : -Infinity;
    const bestSpellScore = bestSpellResult ? bestSpellResult.score : -Infinity;

    console.log(`Best Move Score: ${bestMoveScore}`);
    console.log(`Best Spell Score: ${bestSpellScore}`);

    // --- Decide Action: Spell vs Move ---
    let castChosenSpell = false;
    if (
      bestSpellResult &&
      bestSpellScore > bestMoveScore + SPELL_PREFERENCE_THRESHOLD && // Spell must be significantly better
      Math.random() < this.getSpellUsageProbability() // Difficulty-based probability check
    ) {
      console.log("Computer decided to cast a spell.");
      castChosenSpell = true;
    } else {
      console.log("Computer decided to make a standard move.");
    }

    // --- Execute Chosen Action ---
    if (castChosenSpell && bestSpellResult) {
      // Cast the selected spell
      console.log(
        `Computer casting spell: ${bestSpellResult.decision.spellId}`
      );

      try {
        const success = this.gameManager.castSpell(
          bestSpellResult.decision.spellId,
          bestSpellResult.decision.targets,
          bestSpellResult.decision.pieceType
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
              // Find the best move *now* and execute it
              const bestMoveAfterSpell =
                this._findBestStandardMove(movesAfterSpell);
              if (bestMoveAfterSpell) {
                await this._executeMove(bestMoveAfterSpell.move);
              } else {
                console.warn("Could not find a move after spell cast.");
              }
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

    // If spell wasn't chosen or failed, make the best standard move
    if (!castChosenSpell) {
      if (bestMoveResult) {
        console.log("Executing best standard move.");
        // Make the actual move using the details from the best evaluated move
        const moveSuccess = await this._executeMove(bestMoveResult.move);
        if (moveSuccess) return true;
        // Fallback if the chosen best move somehow fails
        console.warn("Best move execution failed, attempting random move.");
      } else {
        // Fallback if no best move was found at all
        console.warn("No best standard move found, attempting random move.");
      }
      // Fallback to random move if best move wasn't found or failed
      const randomMove = this.getRandomMove(possibleMoves);
      if (randomMove) {
        console.log("Executing random fallback move.");
        return await this._executeMove(randomMove);
      }
    } else if (!bestSpellResult && bestMoveResult) {
      // This case handles when spell was preferred but failed to find a valid spell decision
      // Default to making the best standard move
      console.log("Spell decision failed, defaulting to best standard move.");
      return await this._executeMove(bestMoveResult.move);
    }

    // If absolutely nothing works (e.g., spell cast failed and no move possible/chosen)
    console.error("Computer failed to execute any action.");
    return false;
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
  // @ts-ignore - Used in testing/debugging
  private getBasicTacticalMove(moves: Array<{ from: Square; to: Square }>): {
    from: Square;
    to: Square;
  } {
    // Evaluate moves based on resulting board state score
    const evaluatedMoves = moves
      .map((move) => {
        let score = -Infinity; // Default to worst score
        const tempChess = this.simulateChessMove(move.from, move.to);
        if (tempChess) {
          score = this.evaluateBoardState(tempChess.board()); // Evaluate the simulated board
          const resultingFEN = tempChess.fen();
          if (this.gameManager.isPositionRepeated(resultingFEN)) {
            score += REPETITION_PENALTY;
          }
        }
        return { ...move, score };
      })
      .filter((move) => move.score > -Infinity); // Filter out failed simulations

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
  // @ts-ignore - Used in testing/debugging
  private getAdvancedStrategicMove(
    moves: Array<{ from: Square; to: Square }>
  ): { from: Square; to: Square } {
    // Use the same evaluation logic as medium for now, just potentially pick differently
    const evaluatedMoves = moves
      .map((move) => {
        let score = -Infinity;
        const tempChess = this.simulateChessMove(move.from, move.to);
        if (tempChess) {
          score = this.evaluateBoardState(tempChess.board()); // Evaluate the simulated board
          const resultingFEN = tempChess.fen();
          if (this.gameManager.isPositionRepeated(resultingFEN)) {
            score += REPETITION_PENALTY;
          }
        }
        return { ...move, score };
      })
      .filter((move) => move.score > -Infinity);

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
  // @ts-ignore - Used in testing/debugging
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
    decision: {
      spellId: SpellId;
      targets: SpellTargetData;
      pieceType?: "n" | "b";
    };
    score: number;
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
    decision: {
      spellId: SpellId;
      targets: SpellTargetData;
      pieceType?: "n" | "b";
    };
    score: number;
  } | null {
    // Pick a random spell
    const randomIndex = Math.floor(Math.random() * spells.length);
    const selectedSpellId = spells[randomIndex];

    // Find valid targets for this spell
    const targets = this.findValidTargetsForSpell(selectedSpellId);

    if (!targets) {
      return null;
    }

    const decision = {
      spellId: selectedSpellId,
      targets: targets,
      pieceType:
        selectedSpellId === "darkConversion"
          ? ((Math.random() < 0.5 // Cast result of ternary
              ? "n"
              : "b") as "n" | "b")
          : undefined,
    };

    return { decision, score: 0 };
  }

  /**
   * Makes a strategic spell decision based on the current board state
   */
  private getStrategicSpellDecision(affordableSpells: SpellId[]): {
    decision: {
      spellId: SpellId;
      targets: SpellTargetData;
      pieceType?: "n" | "b";
    };
    score: number;
  } | null {
    const evaluatedSpells = [];
    for (const spellId of affordableSpells) {
      const targets = this.findValidTargetsForSpell(spellId);
      if (!targets && spellId !== "secondWind") continue; // Skip if no valid target (except self-target)

      const pieceType =
        spellId === "darkConversion"
          ? Math.random() < 0.5
            ? "n"
            : "b"
          : undefined;

      // Evaluate the *current* board state as a proxy
      const score = this.getHeuristicSpellScore(spellId);
      evaluatedSpells.push({ spellId, targets, pieceType, score });
    }

    // Sort by score (highest first)
    evaluatedSpells.sort((a, b) => b.score - a.score);

    // Return the best evaluated spell decision
    if (evaluatedSpells.length > 0 && evaluatedSpells[0].score > -Infinity) {
      // TODO: Compare best spell score with best move score before deciding
      const bestSpell = evaluatedSpells[0];
      const decision = {
        spellId: bestSpell.spellId,
        targets: bestSpell.targets as SpellTargetData,
        pieceType: bestSpell.pieceType as "n" | "b" | undefined,
      };
      return { decision, score: bestSpell.score };
    } else {
      return null;
    }
  }

  /**
   * Find valid targets for a specific spell
   */
  private findValidTargetsForSpell(spellId: SpellId): SpellTargetData | null {
    const boardState = this.gameManager.getBoardState();
    const pieces = this.gameManager.getAllPieces();
    const computerPieces = pieces.filter(
      (p: PieceWithSquare) =>
        p.piece.color === this.color &&
        !p.piece.effects?.some((e) => e.source === "cursedGlyph") // Exclude cursed pieces
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

      default: {
        // Create a new scope for the default case
        {
          // Find computer's pieces
          const allComputerPieces = pieces.filter(
            (p: PieceWithSquare) =>
              p.piece.color === this.color &&
              !p.piece.effects?.some((e) => e.source === "cursedGlyph") // Exclude cursed pieces
          );
          if (allComputerPieces.length === 0) return null; // No pieces to target

          // const enemyPieces = pieces.filter(p => p.piece.color !== this.color); // Unused for now

          // Find all empty squares
          const allSquares = Array.from({ length: 8 }, (_, i) =>
            Array.from(
              { length: 8 },
              (_, j) => `${String.fromCharCode(97 + j)}${i + 1}`
            )
          ).flat();
          const occupiedSquares = pieces.map((p: PieceWithSquare) => p.square);
          const emptySquares = allSquares.filter(
            (sq) => !occupiedSquares.includes(sq)
          );

          switch (spellId) {
            case "astralSwap": {
              {
                if (allComputerPieces.length < 2) return null;
                const indices = Array.from(allComputerPieces.keys());
                const i1 = indices.splice(
                  Math.floor(Math.random() * indices.length),
                  1
                )[0];
                const i2 = indices[Math.floor(Math.random() * indices.length)];
                const targetSquares = [
                  allComputerPieces[i1].square,
                  allComputerPieces[i2].square,
                ] as Square[];

                // Evaluate if the swap is strategically valuable
                const piece1 = allComputerPieces.find(
                  (p) => p.square === targetSquares[0]
                );
                const piece2 = allComputerPieces.find(
                  (p) => p.square === targetSquares[1]
                );

                if (!piece1 || !piece2) return null; // Should not happen if targets are valid

                // Avoid swapping identical pieces unless one is threatened (basic check)
                // TODO: Add actual threat detection
                if (piece1.piece.type === piece2.piece.type) {
                  // Allow swap only if it saves a piece or achieves clear positional gain
                  // Placeholder: Disallow identical swaps for now unless threat detection is added
                  console.log(
                    "Computer avoiding Astral Swap between identical pieces."
                  );
                  return null;
                }

                return targetSquares as Square[];
              }
            }
            case "mistformKnight": {
              {
                const kingSquare = allComputerPieces.find(
                  (p) => p.piece.type === "k"
                )?.square;
                if (!kingSquare) return null;
                const kingRank = parseInt(kingSquare[1]);
                const kingFile = kingSquare[0];
                const adjacentSquares = [
                  `${kingFile}${kingRank + 1}`,
                  `${kingFile}${kingRank - 1}`,
                  `${String.fromCharCode(
                    kingFile.charCodeAt(0) + 1
                  )}${kingRank}`,
                  `${String.fromCharCode(
                    kingFile.charCodeAt(0) - 1
                  )}${kingRank}`,
                  `${String.fromCharCode(kingFile.charCodeAt(0) + 1)}${
                    kingRank + 1
                  }`,
                  `${String.fromCharCode(kingFile.charCodeAt(0) + 1)}${
                    kingRank - 1
                  }`,
                  `${String.fromCharCode(kingFile.charCodeAt(0) - 1)}${
                    kingRank + 1
                  }`,
                  `${String.fromCharCode(kingFile.charCodeAt(0) - 1)}${
                    kingRank - 1
                  }`,
                ].filter(
                  (sq) =>
                    sq[0] >= "a" &&
                    sq[0] <= "h" &&
                    parseInt(sq[1]) >= 1 &&
                    parseInt(sq[1]) <= 8
                );
                const validEmptyAdjacent = adjacentSquares.filter((sq) =>
                  emptySquares.includes(sq)
                );
                return validEmptyAdjacent.length > 0
                  ? (validEmptyAdjacent[
                      Math.floor(Math.random() * validEmptyAdjacent.length)
                    ] as Square)
                  : null;
              }
            }
            case "chronoRecall": {
              {
                // Find a piece that has moved and can return to a safer/better previous square
                const candidates = allComputerPieces.filter(
                  (p) =>
                    p.piece.hasMoved &&
                    p.piece.prevPositions &&
                    p.piece.prevPositions.length > 1
                );
                if (candidates.length === 0) return null;

                // Simple logic: pick a random candidate for now
                // TODO: Evaluate if previous positions are actually better/safer
                const targetPiece =
                  candidates[Math.floor(Math.random() * candidates.length)];
                return targetPiece.square as Square;
              }
            }
            case "cursedGlyph": {
              {
                return emptySquares.length > 0
                  ? (emptySquares[
                      Math.floor(Math.random() * emptySquares.length)
                    ] as Square)
                  : null;
              }
            }
            case "kingsGambit": {
              {
                const king = allComputerPieces.find(
                  (p) => p.piece.type === "k"
                );
                // Ensure king has legal moves available after the spell would be cast (potential first move)
                if (!king) return null;
                const kingMoves = this.gameManager.getLegalMovesFrom(
                  king.square as Square
                );
                return kingMoves.length > 0 ? (king.square as Square) : null;
              }
            }
            case "darkConversion": {
              {
                // Prefer pawns that are closer to promotion or can attack something valuable after conversion
                const pawns = allComputerPieces.filter(
                  (p) => p.piece.type === "p"
                );
                if (pawns.length === 0) return null;
                // Simple logic: pick a random pawn for now
                // TODO: Add evaluation for best pawn to convert
                const targetPawn =
                  pawns[Math.floor(Math.random() * pawns.length)];
                return targetPawn.square as Square;
              }
            }
            case "spiritLink": {
              {
                if (allComputerPieces.length < 2) return null;
                const indices = Array.from(allComputerPieces.keys());
                const i1 = indices.splice(
                  Math.floor(Math.random() * indices.length),
                  1
                )[0];
                const i2 = indices[Math.floor(Math.random() * indices.length)];
                return [
                  allComputerPieces[i1].square,
                  allComputerPieces[i2].square,
                ] as Square[];
              }
            }
            case "veilOfShadows": {
              {
                return allComputerPieces.length > 0
                  ? (allComputerPieces[
                      Math.floor(Math.random() * allComputerPieces.length)
                    ].square as Square)
                  : null;
              }
            }
            case "raiseBonewalker": {
              {
                const targetRank1 = this.color === "w" ? 1 : 8;
                const targetRank2 = this.color === "w" ? 2 : 7;
                const validSquares = emptySquares.filter(
                  (sq) =>
                    parseInt(sq[1]) === targetRank1 ||
                    parseInt(sq[1]) === targetRank2
                );
                return validSquares.length > 0
                  ? (validSquares[
                      Math.floor(Math.random() * validSquares.length)
                    ] as Square)
                  : null;
              }
            }
            case "secondWind": {
              {
                // Self-targeted, no specific square needed by findValidTargetsForSpell
                return null;
              }
            }
            default: {
              console.warn(
                `Computer does not know how to find targets for spell: ${spellId}`
              );
              return null;
            }
          }
        } // End of inner scope for default case logic
      } // End of default block scope
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
   * Evaluate score for Dark Conversion spell
   */
  private evaluateDarkConversionScore(): number {
    // Check if converting a pawn could lead to immediate capture or check
    // Basic score for now
    return 60; // Moderate priority
  }

  /**
   * Evaluate score for Chrono Recall spell
   */
  private evaluateChronoRecallScore(): number {
    // Check if a valuable piece is currently threatened
    // Basic score for now
    return 70; // Moderate-high priority if a piece is threatened
  }

  /**
   * Evaluate score for Kings Gambit spell
   */
  private evaluateKingsGambitScore(): number {
    // Check if king has safe moves available after the spell
    const king = this.gameManager
      .getAllPieces()
      .find((p) => p.piece.color === this.color && p.piece.type === "k");
    if (!king) return 0;
    const kingMoves = this.gameManager.getLegalMovesFrom(king.square as Square);
    // TODO: Check safety of potential second move
    return kingMoves.length > 0 ? 40 : 0; // Low-moderate priority, depends on safety
  }

  /**
   * Evaluate score for Astral Swap spell
   */
  private evaluateAstralSwapScore(): number {
    // Check if swapping could save a threatened piece or improve position
    // Basic score for now
    return 55; // Moderate priority
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

  // --- Simulation Helpers ---

  /**
   * Simulates a standard move on a temporary chess instance.
   * IMPORTANT: This is a simplified simulation and does NOT account for
   * spell effects or custom game logic changes from the move.
   * It primarily helps evaluate basic captures and resulting checks/FEN.
   * @returns A new Chess instance representing the state after the move, or null.
   */
  private simulateChessMove(from: Square, to: Square): Chess | null {
    try {
      const tempChess = new Chess(this.gameManager.getFEN());
      const moveResult = tempChess.move({ from, to });
      return moveResult ? tempChess : null;
    } catch {
      // Ignore errors during simulation (e.g., illegal move attempts)
      return null;
    }
  }

  /**
   * Simulate a spell cast to evaluate the result
   */
  // @ts-ignore - Used in future development
  private simulateSpellCast() {
    // implementation will be completed in future iterations
  }

  // --- Board Evaluation Logic ---

  /**
   * Evaluates a given board state represented by chess.js Pieces.
   * Higher scores are better for the computer.
   * @param board - The board representation from chess.js.
   * @returns A numerical score representing the board state.
   */
  private evaluateBoardState(board: (Piece | null)[][]): number {
    // NOTE: Wrapping the entire content in a block to avoid lexical declaration issues
    {
      let score = 0;
      // const opponentColor = this.color === "w" ? "b" : "w"; // Unused for now

      // Use try-catch for safety during evaluation
      try {
        // 1. Material Calculation & Positional Factors
        for (let rank = 0; rank < 8; rank++) {
          for (let file = 0; file < 8; file++) {
            const piece = board[rank][file];
            if (piece) {
              // Create a block scope for declarations within the loop
              {
                const square = `${String.fromCharCode(97 + file)}${8 - rank}`; // Calculate square name
                const pieceValue = PIECE_VALUES[piece.type] || 0;
                let positionalScore = 0;

                // Bonus for center control
                if (CENTER_SQUARES.includes(square)) {
                  positionalScore += 10;
                } else if (SEMI_CENTER_SQUARES.includes(square)) {
                  positionalScore += 5;
                }

                // Bonus for advanced pawns
                if (piece.type === "p") {
                  if (piece.color === "w" && 8 - rank >= 5)
                    positionalScore += (8 - rank - 4) * 10;
                  if (piece.color === "b" && 8 - rank <= 4)
                    positionalScore += (5 - (8 - rank)) * 10;
                }

                if (piece.color === this.color) {
                  score += pieceValue + positionalScore;
                } else {
                  score -= pieceValue + positionalScore;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error during board evaluation:", error);
        return 0; // Return neutral score on error
      }

      // TODO: Add King Safety, Checks, Spell Effects evaluations

      return score;
    }
  }

  // --- Helper for placeholder spell scoring ---
  private getHeuristicSpellScore(spellId: SpellId): number {
    {
      switch (spellId) {
        case "emberCrown": {
          return this.evaluateEmberCrownScore();
        }
        case "arcaneAnchor": {
          return this.evaluateArcaneAnchorScore();
        }
        case "darkConversion": {
          return this.evaluateDarkConversionScore();
        }
        case "chronoRecall": {
          return this.evaluateChronoRecallScore();
        }
        case "kingsGambit": {
          return this.evaluateKingsGambitScore();
        }
        case "astralSwap": {
          return this.evaluateAstralSwapScore();
        }
        default: {
          return 50; // Default base score
        }
      }
    }
  }

  // --- Move Evaluation Helpers (Refactored) ---

  private _findBestStandardMove(
    possibleMoves: Array<{ from: Square; to: Square }>
  ): { move: { from: Square; to: Square }; score: number } | null {
    {
      if (possibleMoves.length === 0) return null;

      // Use difficulty to select evaluation method
      let evaluatedMoves;
      switch (this.difficulty) {
        case "easy":
          // Easy just picks random, evaluation score isn't really used here
          const randomMove = this.getRandomMove(possibleMoves);
          // Assign a dummy score for consistency, though it won't be used for decision
          return { move: randomMove, score: 0 };
        case "medium": {
          evaluatedMoves = this.evaluateMovesTactically(possibleMoves);
          break;
        }
        case "hard": {
          evaluatedMoves = this.evaluateMovesStrategically(possibleMoves);
          break;
        }
        default: {
          evaluatedMoves = this.evaluateMovesTactically(possibleMoves);
          break;
        }
      }

      if (!evaluatedMoves || evaluatedMoves.length === 0) return null;

      // For Medium/Hard, pick based on probability
      let chosenMoveData;
      if (this.difficulty === "medium") {
        if (Math.random() < 0.7 || evaluatedMoves.length < 3) {
          chosenMoveData = evaluatedMoves[0];
        } else {
          const randomIndex = Math.floor(
            Math.random() * Math.min(3, evaluatedMoves.length)
          );
          chosenMoveData = evaluatedMoves[randomIndex];
        }
      } else {
        // Hard difficulty
        if (Math.random() < 0.9 || evaluatedMoves.length < 2) {
          chosenMoveData = evaluatedMoves[0];
        } else {
          chosenMoveData = evaluatedMoves[1];
        }
      }

      return {
        move: { from: chosenMoveData.from, to: chosenMoveData.to },
        score: chosenMoveData.score,
      };
    }
  }

  private evaluateMovesTactically(
    moves: Array<{ from: Square; to: Square }>
  ): Array<{ from: Square; to: Square; score: number }> {
    {
      // Evaluate moves based on resulting board state score
      const evaluatedMoves = moves
        .map((move) => {
          let score = -Infinity; // Default to worst score
          const tempChess = this.simulateChessMove(move.from, move.to);
          if (tempChess) {
            score = this.evaluateBoardState(tempChess.board()); // Evaluate the simulated board
            const resultingFEN = tempChess.fen();
            if (this.gameManager.isPositionRepeated(resultingFEN)) {
              score += REPETITION_PENALTY;
            }
          }
          return { ...move, score };
        })
        .filter((move) => move.score > -Infinity); // Filter out failed simulations

      // Sort by score (highest first)
      evaluatedMoves.sort((a, b) => b.score - a.score);

      return evaluatedMoves;
    }
  }

  /**
   * Select an advanced strategic move (hard difficulty)
   * Considers piece development, board control, king safety
   */
  private evaluateMovesStrategically(
    moves: Array<{ from: Square; to: Square }>
  ): Array<{ from: Square; to: Square; score: number }> {
    {
      // Use the same evaluation logic as medium for now, just potentially pick differently
      const evaluatedMoves = moves
        .map((move) => {
          let score = -Infinity;
          const tempChess = this.simulateChessMove(move.from, move.to);
          if (tempChess) {
            score = this.evaluateBoardState(tempChess.board()); // Evaluate the simulated board
            const resultingFEN = tempChess.fen();
            if (this.gameManager.isPositionRepeated(resultingFEN)) {
              score += REPETITION_PENALTY;
            }
          }
          return { ...move, score };
        })
        .filter((move) => move.score > -Infinity);

      // Sort by score (highest first)
      evaluatedMoves.sort((a, b) => b.score - a.score);

      return evaluatedMoves;
    }
  }

  // Helper to execute a move (used by makeMove)
  private async _executeMove(move: {
    from: Square;
    to: Square;
  }): Promise<boolean> {
    try {
      console.log(`Computer executing move: ${move.from} to ${move.to}`);
      // Note: gameManager.makeMove is currently synchronous in the base code.
      // If it were async, we would await it here.
      const success = this.gameManager.makeMove(move.from, move.to);
      if (success) {
        console.log("Move execution successful.");
      } else {
        console.warn("Move execution failed.");
      }
      return success;
    } catch (error) {
      console.error(`Error executing move ${move.from} to ${move.to}:`, error);
      return false;
    }
  }
}
