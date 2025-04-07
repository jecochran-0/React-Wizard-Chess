import { Chess, Color, PieceSymbol, Square as ChessJSSquare } from "chess.js";
import { BoardState, Square, PlayerColor, PieceMeta } from "../types/game";

/**
 * SpellEngine handles all spell casting functionality and effects
 * as described in the implementation document.
 */
export class SpellEngine {
  private customBoardState: BoardState;
  private chess: Chess;
  private currentPlayer: PlayerColor;
  private glyphs: Record<string, { turnsLeft: number; triggered?: boolean }> =
    {};
  private linkedGroups: Array<{
    primary: Square;
    backups: Square[];
    turnsLeft: number;
  }> = [];
  private bonewalkers: Record<string, number> = {};

  constructor(
    customBoardState: BoardState,
    chess: Chess,
    currentPlayer: PlayerColor
  ) {
    this.customBoardState = customBoardState;
    this.chess = chess;
    this.currentPlayer = currentPlayer;
  }

  /**
   * Update references to the latest game state
   */
  public updateReferences(
    customBoardState: BoardState,
    chess: Chess,
    currentPlayer: PlayerColor
  ) {
    this.customBoardState = customBoardState;
    this.chess = chess;
    this.currentPlayer = currentPlayer;
  }

  /**
   * Swap any two of your own pieces.
   * Neither piece may move into check.
   */
  public castAstralSwap(sq1: Square, sq2: Square): boolean {
    const piece1 = this.customBoardState[sq1];
    const piece2 = this.customBoardState[sq2];

    // Check if both squares have pieces that belong to current player
    if (!piece1 || !piece2) return false;
    if (
      !piece1.piece.startsWith(this.currentPlayer) ||
      !piece2.piece.startsWith(this.currentPlayer)
    )
      return false;

    // Simulate swap in a temp board to check if it results in check
    const tempChess = new Chess(this.chess.fen());

    // Remove both pieces
    tempChess.remove(sq1 as ChessJSSquare);
    tempChess.remove(sq2 as ChessJSSquare);

    // Put them back in swapped positions
    const piece1Type = piece1.piece[1].toLowerCase() as PieceSymbol;
    const piece1Color = piece1.piece[0] as Color;
    const piece2Type = piece2.piece[1].toLowerCase() as PieceSymbol;
    const piece2Color = piece2.piece[0] as Color;

    tempChess.put(
      { type: piece1Type, color: piece1Color },
      sq2 as ChessJSSquare
    );
    tempChess.put(
      { type: piece2Type, color: piece2Color },
      sq1 as ChessJSSquare
    );

    // Check if this puts the player in check
    if (tempChess.inCheck()) return false;

    // Perform the swap in customBoardState
    [this.customBoardState[sq1], this.customBoardState[sq2]] = [piece2, piece1];

    // Update position history
    if (!piece1.prevPositions) piece1.prevPositions = [sq1];
    if (!piece2.prevPositions) piece2.prevPositions = [sq2];

    piece1.prevPositions.push(sq2);
    piece2.prevPositions.push(sq1);

    return true;
  }

  /**
   * Move a piece ignoring collisions, no captures.
   */
  public castPhantomStep(from: Square, to: Square): boolean {
    // Check if source has a piece and target is empty
    const piece = this.customBoardState[from];
    if (!piece) return false;
    if (this.customBoardState[to]) return false; // No capture allowed

    // Check if the piece belongs to the current player
    if (!piece.piece.startsWith(this.currentPlayer)) return false;

    // Move the piece
    this.customBoardState[to] = piece;
    delete this.customBoardState[from];

    // Update position history
    if (!piece.prevPositions) piece.prevPositions = [from];
    piece.prevPositions.push(to);

    return true;
  }

  /**
   * Transform a pawn to a queen for 3 turns → then it dies.
   */
  public castEmberCrown(square: Square): boolean {
    const piece = this.customBoardState[square];
    if (!piece) return false;
    if (piece.piece[1] !== "P") return false; // Must be a pawn
    if (!piece.piece.startsWith(this.currentPlayer)) return false; // Must be your pawn

    // Transform pawn to queen
    piece.piece = `${piece.piece[0]}Q`;

    // Add or update the buff
    if (!piece.buffs) piece.buffs = {};
    piece.buffs.emberCrown = 3;

    return true;
  }

  /**
   * Piece immune to capture, cannot move.
   */
  public castArcaneAnchor(square: Square): boolean {
    const piece = this.customBoardState[square];
    if (!piece) return false;
    if (!piece.piece.startsWith(this.currentPlayer)) return false; // Must be your piece

    // Add effects
    if (!piece.effects) piece.effects = [];
    piece.effects.push("anchored", "shielded");

    // Add timer to remove effects after 1 turn
    if (!piece.buffs) piece.buffs = {};
    piece.buffs.arcaneAnchor = 1;

    return true;
  }

  /**
   * Move knight, then summon clone that disappears next turn.
   */
  public castMistformKnight(from: Square, to: Square): boolean {
    const knight = this.customBoardState[from];
    if (!knight) return false;

    // Check if the piece is a knight and belongs to current player
    if (knight.piece[1] !== "N") return false;
    if (!knight.piece.startsWith(this.currentPlayer)) return false;

    // Check if target square is empty
    if (this.customBoardState[to]) return false;

    // Move the knight
    this.customBoardState[to] = knight;
    delete this.customBoardState[from];

    // Update position history
    if (!knight.prevPositions) knight.prevPositions = [from];
    knight.prevPositions.push(to);

    // Create the clone at the original position
    this.customBoardState[from] = {
      piece: knight.piece,
      effects: ["mistClone"],
      buffs: { mistClone: 1 },
    };

    return true;
  }

  /**
   * Return a piece to position 2 turns ago.
   */
  public castChronoRecall(square: Square): boolean {
    const piece = this.customBoardState[square];
    if (!piece) return false;
    if (!piece.piece.startsWith(this.currentPlayer)) return false; // Must be your piece

    // Check if piece has history
    if (!piece.prevPositions || piece.prevPositions.length < 3) return false;

    // Get position from 2 turns ago (current position is at the end of the array)
    const prevIndex = piece.prevPositions.length - 3;
    if (prevIndex < 0) return false;

    const prev = piece.prevPositions[prevIndex];

    // Check if target square is occupied
    if (this.customBoardState[prev]) return false;

    // Move the piece
    this.customBoardState[prev] = piece;
    delete this.customBoardState[square];

    // Update position history
    piece.prevPositions.push(prev);

    return true;
  }

  /**
   * Trap square. Delay transformation.
   */
  public castCursedGlyph(square: Square): boolean {
    // Can't place a glyph on a square with a piece of your color
    const piece = this.customBoardState[square];
    if (piece && piece.piece.startsWith(this.currentPlayer)) return false;

    // Set up the glyph
    this.glyphs[square] = { turnsLeft: 1 };

    return true;
  }

  /**
   * Check if a glyph has been triggered
   */
  public checkGlyphTrigger(square: Square): void {
    if (this.glyphs[square]) {
      this.glyphs[square].triggered = true;
    }
  }

  /**
   * Move King twice in one turn.
   */
  public castKingsGambit(from: Square, to: Square): boolean {
    const piece = this.customBoardState[from];
    if (!piece) return false;

    // Check if the piece is a king and belongs to current player
    if (piece.piece[1] !== "K") return false;
    if (!piece.piece.startsWith(this.currentPlayer)) return false;

    // Check if the move is legal
    try {
      const move = this.chess.move({
        from: from as ChessJSSquare,
        to: to as ChessJSSquare,
      });
      if (!move) return false;

      // Update custom board state to match
      const newPiece = { ...piece };
      if (!newPiece.prevPositions) newPiece.prevPositions = [from];
      newPiece.prevPositions.push(to);

      this.customBoardState[to] = newPiece;
      delete this.customBoardState[from];

      // Add a flag to allow a second king move
      if (!newPiece.buffs) newPiece.buffs = {};
      newPiece.buffs.kingsGambit = 1;

      return true;
    } catch {
      // Move was invalid
      return false;
    }
  }

  /**
   * Sacrifice 3 pawns → summon Knight/Bishop.
   */
  public castDarkConversion(
    pawnSquares: Square[],
    pieceType: "N" | "B",
    summonSquare: Square
  ): boolean {
    // Check if we have 3 pawns
    if (pawnSquares.length !== 3) return false;
    if (this.customBoardState[summonSquare]) return false; // Target must be empty

    // Verify all squares have pawns of current player's color
    for (const sq of pawnSquares) {
      const piece = this.customBoardState[sq];
      if (
        !piece ||
        piece.piece[1] !== "P" ||
        !piece.piece.startsWith(this.currentPlayer)
      ) {
        return false;
      }
    }

    // Remove the pawns
    pawnSquares.forEach((sq) => delete this.customBoardState[sq]);

    // Summon the new piece
    this.customBoardState[summonSquare] = {
      piece: this.currentPlayer + pieceType,
      effects: ["darkConverted"],
      prevPositions: [summonSquare],
    };

    return true;
  }

  /**
   * Link a major piece with pawns.
   */
  public castSpiritLink(primary: Square, backups: Square[]): boolean {
    if (backups.length === 0) return false;

    // Check if primary square has a piece
    const primaryPiece = this.customBoardState[primary];
    if (!primaryPiece) return false;
    if (!primaryPiece.piece.startsWith(this.currentPlayer)) return false;

    // Check if it's a major piece (Q, R, B, N)
    const pieceType = primaryPiece.piece[1];
    if (
      pieceType !== "Q" &&
      pieceType !== "R" &&
      pieceType !== "B" &&
      pieceType !== "N"
    ) {
      return false;
    }

    // Check if backup squares have pawns of the same color
    for (const sq of backups) {
      const piece = this.customBoardState[sq];
      if (
        !piece ||
        piece.piece[1] !== "P" ||
        !piece.piece.startsWith(this.currentPlayer)
      ) {
        return false;
      }
    }

    // Create the link
    this.linkedGroups.push({
      primary,
      backups,
      turnsLeft: 3,
    });

    // Mark pieces as linked
    if (!primaryPiece.effects) primaryPiece.effects = [];
    primaryPiece.effects.push("linked");

    for (const sq of backups) {
      const piece = this.customBoardState[sq];
      if (!piece.effects) piece.effects = [];
      piece.effects.push("linked");
    }

    return true;
  }

  /**
   * Handle capture event for spirit links
   */
  public onCapture(square: Square): void {
    const group = this.getLinkedGroup(square);
    if (!group) return;

    // If primary piece was captured
    if (group.primary === square) {
      // Remove all backup pawns
      group.backups.forEach((sq) => delete this.customBoardState[sq]);
    } else if (group.backups.includes(square)) {
      // If a backup pawn was captured, teleport primary to a new location
      const validSquares = this.findEmptySquares();
      if (validSquares.length > 0) {
        const newSq = validSquares[0];
        const piece = this.customBoardState[group.primary];
        this.customBoardState[newSq] = piece;
        delete this.customBoardState[group.primary];

        // Update position history
        if (!piece.prevPositions) piece.prevPositions = [group.primary];
        piece.prevPositions.push(newSq);

        // Update the group
        group.primary = newSq;
        group.backups = group.backups.filter((sq) => sq !== square);
      }
    }

    // If no more backups, remove the link
    if (group.backups.length === 0) {
      this.removeLink(group);
    }
  }

  private getLinkedGroup(square: Square) {
    return this.linkedGroups.find(
      (g) => g.primary === square || g.backups.includes(square)
    );
  }

  private removeLink(group: {
    primary: Square;
    backups: Square[];
    turnsLeft: number;
  }) {
    // Remove from linked groups
    this.linkedGroups = this.linkedGroups.filter((g) => g !== group);

    // Remove effect from primary piece
    const primaryPiece = this.customBoardState[group.primary];
    if (primaryPiece && primaryPiece.effects) {
      primaryPiece.effects = primaryPiece.effects.filter((e) => e !== "linked");
    }

    // Remove effect from backup pieces
    for (const sq of group.backups) {
      const piece = this.customBoardState[sq];
      if (piece && piece.effects) {
        piece.effects = piece.effects.filter((e) => e !== "linked");
      }
    }
  }

  /**
   * Find empty squares on the board
   */
  private findEmptySquares(): Square[] {
    const result: Square[] = [];
    const ranks = "12345678";
    const files = "abcdefgh";

    for (const rank of ranks) {
      for (const file of files) {
        const square = (file + rank) as Square;
        if (!this.customBoardState[square]) {
          result.push(square);
        }
      }
    }

    return result;
  }

  /**
   * Move two pieces (no capture or check)
   */
  public castSecondWind(moves: Array<{ from: Square; to: Square }>): boolean {
    if (moves.length !== 2) return false;

    // Check if all pieces belong to current player and target squares are empty
    for (const move of moves) {
      const piece = this.customBoardState[move.from];
      if (!piece) return false;
      if (!piece.piece.startsWith(this.currentPlayer)) return false;
      if (this.customBoardState[move.to]) return false; // No capture
    }

    // Execute the moves
    for (const move of moves) {
      const piece = this.customBoardState[move.from];
      this.customBoardState[move.to] = piece;
      delete this.customBoardState[move.from];

      // Update position history
      if (!piece.prevPositions) piece.prevPositions = [move.from];
      piece.prevPositions.push(move.to);
    }

    return true;
  }

  /**
   * Prevent ending adjacent to Rooks
   */
  public castPressureField(): boolean {
    // Add a global flag for pressure field
    this.customBoardState["global"] = {
      ...this.customBoardState["global"],
      piece: "global",
      buffs: {
        ...(this.customBoardState["global"]?.buffs || {}),
        pressureField: 3,
      },
    };

    return true;
  }

  public hasPressureField(): boolean {
    return !!this.customBoardState["global"]?.buffs?.pressureField;
  }

  /**
   * Check if a move would end adjacent to a rook
   */
  public isAdjacentToRook(square: Square, playerColor: PlayerColor): boolean {
    if (!this.hasPressureField()) return false;

    const adjacentSquares = this.getAdjacentSquares(square);
    for (const adjSq of adjacentSquares) {
      const piece = this.customBoardState[adjSq];
      if (piece && piece.piece[1] === "R" && piece.piece[0] !== playerColor) {
        return true;
      }
    }

    return false;
  }

  private getAdjacentSquares(square: Square): Square[] {
    const file = square.charAt(0);
    const rank = parseInt(square.charAt(1));
    const files = "abcdefgh";
    const fileIdx = files.indexOf(file);

    const result: Square[] = [];

    // Check all 8 adjacent squares
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue; // Skip the square itself

        const newFileIdx = fileIdx + i;
        const newRank = rank + j;

        if (newFileIdx >= 0 && newFileIdx < 8 && newRank >= 1 && newRank <= 8) {
          result.push((files[newFileIdx] + newRank) as Square);
        }
      }
    }

    return result;
  }

  /**
   * Remove any spell effect.
   */
  public castNullfield(square: Square): boolean {
    const piece = this.customBoardState[square];
    if (!piece) return false;

    // Clear all effects and buffs
    piece.effects = [];
    piece.buffs = {};

    // Remove from linked groups if applicable
    const group = this.getLinkedGroup(square);
    if (group) {
      this.removeLink(group);
    }

    return true;
  }

  /**
   * Hide board from enemy
   */
  public castVeilOfShadows(): boolean {
    // Add a global veil effect
    this.customBoardState["global"] = {
      ...this.customBoardState["global"],
      piece: "global",
      buffs: {
        ...(this.customBoardState["global"]?.buffs || {}),
        veilOfShadows: 1,
      },
    };

    return true;
  }

  public hasVeilOfShadows(): boolean {
    return !!this.customBoardState["global"]?.buffs?.veilOfShadows;
  }

  /**
   * Summon pawn → auto-promote in 6 turns.
   */
  public castRaiseTheBonewalker(square: Square): boolean {
    if (this.customBoardState[square]) return false; // Square must be empty

    // Create a pawn
    this.customBoardState[square] = {
      piece: this.currentPlayer + "P",
      effects: ["bonewalker"],
      buffs: { bonewalker: 6 },
      prevPositions: [square],
    };

    // Track the bonewalker
    this.bonewalkers[square] = 6;

    return true;
  }

  /**
   * Process game effects at the end of turn
   */
  public processEndOfTurnEffects(): void {
    this.processBonewalkers();
    this.decrementBuffs();
    this.decrementLinkedGroups();
    this.processGlyphs();
  }

  private processBonewalkers(): void {
    for (const sq in this.bonewalkers) {
      this.bonewalkers[sq]--;

      // Update the buff in the piece as well
      const piece = this.customBoardState[sq];
      if (piece && piece.buffs && piece.buffs.bonewalker) {
        piece.buffs.bonewalker = this.bonewalkers[sq];
      }

      if (this.bonewalkers[sq] <= 0) {
        // Promote to rook
        if (piece) {
          piece.piece = piece.piece[0] + "R";
          piece.effects =
            piece.effects?.filter((e) => e !== "bonewalker") || [];
          delete piece.buffs?.bonewalker;
        }

        delete this.bonewalkers[sq];
      }
    }
  }

  private decrementBuffs(): void {
    // Process all pieces
    for (const sq in this.customBoardState) {
      const piece = this.customBoardState[sq];
      if (!piece?.buffs) continue;

      // Decrement all buffs and remove expired ones
      for (const buffName in piece.buffs) {
        piece.buffs[buffName]--;

        if (piece.buffs[buffName] <= 0) {
          delete piece.buffs[buffName];

          // Handle special cleanup for specific buffs
          this.handleExpiredBuff(sq, buffName, piece);
        }
      }

      // Clean up empty buffs object
      if (Object.keys(piece.buffs).length === 0) {
        delete piece.buffs;
      }
    }
  }

  private handleExpiredBuff(
    square: Square,
    buffName: string,
    piece: PieceMeta
  ): void {
    switch (buffName) {
      case "emberCrown":
        // Piece with expired Ember Crown dies
        delete this.customBoardState[square];
        break;

      case "arcaneAnchor":
        // Remove anchored and shielded effects
        if (piece.effects) {
          piece.effects = piece.effects.filter(
            (e) => e !== "anchored" && e !== "shielded"
          );
        }
        break;

      case "mistClone":
        // Remove the clone
        delete this.customBoardState[square];
        break;
    }
  }

  private decrementLinkedGroups(): void {
    for (const group of this.linkedGroups) {
      group.turnsLeft--;

      if (group.turnsLeft <= 0) {
        this.removeLink(group);
      }
    }

    // Remove expired groups
    this.linkedGroups = this.linkedGroups.filter((g) => g.turnsLeft > 0);
  }

  private processGlyphs(): void {
    for (const square in this.glyphs) {
      if (this.glyphs[square].triggered) {
        // Transform piece on triggered glyph
        const piece = this.customBoardState[square];
        if (piece) {
          piece.piece = piece.piece[0] + "P"; // Transform to pawn
        }

        // Remove the glyph
        delete this.glyphs[square];
      } else {
        // Decrement glyph timer
        this.glyphs[square].turnsLeft--;
        if (this.glyphs[square].turnsLeft <= 0) {
          delete this.glyphs[square];
        }
      }
    }
  }

  /**
   * Get the current glyphs
   */
  public getGlyphs(): Record<
    string,
    { turnsLeft: number; triggered?: boolean }
  > {
    return { ...this.glyphs };
  }
}
