⚙️ SYSTEM ARCHITECTURE OVERVIEW
pgsql
Copy
Edit
+-----------------------------+
| Player UI |
| (Click board, select move) |
+-------------+--------------+
|
v
+-----------------------------+
| GameManager.js | <-- Routes actions
+-------------+--------------+
| \
 v v
+-------------+ +------------------+
| chess.js | | customBoardState |
| (legal | | (visual state, |
| rules) | | spells, effects) |
+-------------+ +------------------+
🧩 COMPONENT RESPONSIBILITIES
✅ chess.js
Responsible for:

Legal move validation (move legality, turn order)

Game state (check, checkmate, draw)

FEN strings for game state saving/restoring

PGN and move history

Only used for:

Normal, legal chess movement

Detecting game-ending conditions

Tracking standard board state

✅ customBoardState
ts
Copy
Edit
type Square = string; // e.g., 'e4'

type PieceCode = string; // e.g., 'wP', 'bQ'

interface PieceMeta {
piece: PieceCode;
effects?: string[]; // ["shielded", "anchor", etc.]
buffs?: Record<string, number>; // { 'emberCrown': 2 }
prevPositions?: Square[];
}

type BoardState = Record<Square, PieceMeta>;
Responsible for:

All rendering

Storing buffs, temporary changes, spell-related info

Visual logic

Spell logic

✅ GameManager
Handles all:

Routing: determining if an action is a move or spell

Calling chess.js or modifying customBoardState

Syncing the two after legal chess moves

Resolving spell effects and turn-based spell timers

🎮 GAME FLOW
On Turn Start:
Display current mana pool.

Player chooses move or spell.

If move:

Use chess.js.move()

On success, call syncCustomBoardFromChess()

If spell:

Use resolveSpell(spellName, args)

Update customBoardState only

If spell affects legality (e.g. Ember Crown) → rebuild FEN or overwrite chess state

Tick down temporary effect durations

End turn

🔄 SYNCING BETWEEN CHESS.JS AND CUSTOM BOARD
syncCustomBoardFromChess()
ts
Copy
Edit
function syncCustomBoardFromChess() {
const positions = chess.board(); // returns 2D array
for (let rank = 0; rank < 8; rank++) {
for (let file = 0; file < 8; file++) {
const piece = positions[rank][file];
const square = squareFromCoords(file, rank);
if (piece) {
customBoardState[square] = {
piece: `${piece.color}${piece.type.toUpperCase()}`,
prevPositions: [square]
};
} else {
delete customBoardState[square];
}
}
}
}
🧙‍♂️ SPELL IMPLEMENTATION
Each spell is handled in the SpellEngine module. Every spell should:

Validate all preconditions.

Update customBoardState (and metadata like buffs/timers).

Possibly rebuild FEN and reload into chess.js only if the spell breaks chess legality.

1. Astral Swap (4 Mana)
   Swap any two of your own pieces.

Neither piece may move into check.

Implementation:

ts
Copy
Edit
function castAstralSwap(sq1: Square, sq2: Square) {
const piece1 = customBoardState[sq1];
const piece2 = customBoardState[sq2];
if (!piece1 || !piece2) return false;
if (!piece1.piece.startsWith(currentPlayer) || !piece2.piece.startsWith(currentPlayer)) return false;

// simulate swap in a temp board, check if either ends in check using chess.js
const tempChess = new Chess(chess.fen());
tempChess.put(tempChess.get(sq1), sq2);
tempChess.put(tempChess.get(sq2), sq1);
if (tempChess.in_check()) return false;

[customBoardState[sq1], customBoardState[sq2]] = [piece2, piece1];
return true;
} 2. Phantom Step (2 Mana)
Move a piece ignoring collisions, no captures.

Implementation:

ts
Copy
Edit
function castPhantomStep(from: Square, to: Square) {
if (customBoardState[to]) return false; // no capture
customBoardState[to] = customBoardState[from];
delete customBoardState[from];
return true;
} 3. Ember Crown (6 Mana)
Transform a pawn to a queen for 3 turns → then it dies.

Implementation:

ts
Copy
Edit
function castEmberCrown(square: Square) {
const piece = customBoardState[square];
if (piece?.piece[1] !== 'P') return false;

piece.piece = `${piece.piece[0]}Q`;
piece.buffs = { ...piece.buffs, emberCrown: 3 };
}
At the start of each turn, decrement emberCrown. If 0, remove piece.

4. Arcane Anchor (3 Mana)
   Piece immune to capture, cannot move.

Implementation:

ts
Copy
Edit
function castArcaneAnchor(square: Square) {
customBoardState[square].effects?.push("anchored", "shielded");
}
Remove both effects after 1 turn.

5. Mistform Knight (4 Mana)
   Move knight, then summon clone that disappears next turn.

Implementation:

ts
Copy
Edit
function castMistformKnight(from: Square, to: Square) {
const knight = customBoardState[from];
customBoardState[to] = knight;
delete customBoardState[from];
customBoardState[to + '_clone'] = { piece: knight.piece, effects: ['mistClone'], lifespan: 1 };
}
Remove all pieces with mistClone effect on turn end.

6. Chrono Recall (3 Mana)
   Return a piece to position 2 turns ago.

Implementation:

```typescript
private castChronoRecall(target: Square): boolean {
  // Get the piece at the target square
  const piece = this.gameManager.getPieceAt(target);

  // Must target a piece owned by the current player
  const currentPlayer = this.gameManager.getCurrentPlayer();
  if (!piece || piece.color !== currentPlayer) {
    console.error("Target must be a piece owned by the current player");
    return false;
  }

  // Check if the piece has move history (exists for at least 2 turns)
  if (!piece.prevPositions || piece.prevPositions.length < 3) {
    console.error("Piece doesn't have enough move history");
    return false;
  }

  // Get the position from 2 moves ago
  const destination = piece.prevPositions[piece.prevPositions.length - 3];

  // Destination must be empty
  if (this.gameManager.getPieceAt(destination)) {
    console.error("Cannot recall to occupied square");
    return false;
  }

  // Check if the move would result in a king in check
  const tempBoard = new Chess(this.gameManager.getFEN());
  tempBoard.remove(target);
  tempBoard.put({ type: piece.type, color: piece.color }, destination);
  if (tempBoard.isCheck()) {
    console.error("Cannot recall as it would result in check");
    return false;
  }

  // Move the piece to the historical position and end the turn
  return this.gameManager.movePieceDirectly(target, destination, true);
}
```

7. Cursed Glyph (5 Mana)
   Trap square. Delay transformation.

Implementation:

```typescript
private castCursedGlyph(target: Square): boolean {
  // Verify target square is empty
  if (this.gameManager.getPieceAt(target)) {
    console.error("Target square must be empty");
    return false;
  }

  // Create a glyph effect that will trap the square
  const glyphEffect = this.createEffect("glyph", 2, "cursedGlyph", {
    triggered: false, // Will be set to true when a piece moves onto the square
    transformToPawn: true,
    removeOnExpire: true,
  });

  // Add the effect to the global game state with the target square
  this.gameManager.addGlyphToSquare(target, glyphEffect);

  console.log(`Cursed Glyph placed on ${target}`);
  return true;
}

// Must also implement hooks in the move validation and execution:
private checkForGlyphs(to: Square): void {
  const glyph = this.gameManager.getGlyphAt(to);
  if (glyph && glyph.source === "cursedGlyph") {
    // Mark the glyph as triggered
    glyph.modifiers.triggered = true;

    console.log(`Cursed Glyph at ${to} has been triggered!`);
  }
}

// In processEndOfTurnEffects():
private processGlyphEffects(): void {
  for (const square in this.gameManager.getGlyphs()) {
    const glyph = this.gameManager.getGlyphAt(square as Square);
    if (!glyph || glyph.source !== "cursedGlyph" || !glyph.modifiers.triggered) continue;

    if (glyph.duration <= 0) {
      // Transform the piece on this square to a pawn
      const piece = this.gameManager.getPieceAt(square as Square);
      if (piece && piece.type !== "p") {
        this.gameManager.transformPiece(square as Square, "p", "cursedGlyph");
        console.log(`Piece at ${square} transformed into a Pawn by Cursed Glyph!`);
      }

      // Remove the glyph
      this.gameManager.removeGlyph(square as Square);
    }
  }
}
```

8. King's Gambit (2 Mana)
   Move King twice in one turn.

Implementation:

```typescript
private castKingsGambit(): boolean {
  // Check that the current player's king isn't in check
  const tempBoard = new Chess(this.gameManager.getFEN());
  if (tempBoard.isCheck()) {
    console.error("Cannot cast King's Gambit while in check");
    return false;
  }

  // Create an effect that allows the king to move a second time
  const effect = this.createEffect("modifier", 1, "kingsGambit", {
    allowSecondKingMove: true,
    removeOnExpire: true,
  });

  // Add the effect to the global game state
  this.gameManager.addGlobalEffect(effect);

  // Update the UI to indicate that the player can move the king again
  console.log("King's Gambit cast - the king can move twice this turn");
  return true;
}
```

9. Dark Conversion (5 Mana)
   Sacrifice 3 pawns → summon Knight/Bishop.

Implementation:

```typescript
private castDarkConversion(targets: MultiTarget, newPieceType: "n" | "b"): boolean {
  // Verify we have exactly 3 pawn targets
  if (targets.length !== 3) {
    console.error("Dark Conversion requires exactly 3 pawn targets");
    return false;
  }

  const currentPlayer = this.gameManager.getCurrentPlayer();
  const summonSquare = targets[0]; // First selected square will be the summoning location

  // Check all targets are pawns owned by the current player
  for (let i = 0; i < 3; i++) {
    const piece = this.gameManager.getPieceAt(targets[i]);
    if (!piece || piece.color !== currentPlayer || piece.type !== "p") {
      console.error("All targets must be pawns owned by the current player");
      return false;
    }
  }

  // Check that the summon square is empty
  if (this.gameManager.getPieceAt(summonSquare)) {
    console.error("Summoning square must be empty");
    return false;
  }

  // Remove the three pawns
  for (let i = 0; i < 3; i++) {
    this.gameManager.removePiece(targets[i]);
  }

  // Add the new piece at the summon square
  this.gameManager.addPiece(
    summonSquare,
    newPieceType as PieceSymbol,
    currentPlayer as "w" | "b",
    []
  );

  console.log(`Successfully sacrificed 3 pawns to summon a ${newPieceType === "n" ? "Knight" : "Bishop"}`);
  return true;
}
```

10. Spirit Link (5 Mana)
    Link a major piece with pawns.

Implementation:

```typescript
private castSpiritLink(primary: Square, backups: Square[]): boolean {
  // Verify primary piece is a major piece (queen, rook, bishop, knight)
  const primaryPiece = this.gameManager.getPieceAt(primary);
  const currentPlayer = this.gameManager.getCurrentPlayer();

  if (!primaryPiece || primaryPiece.color !== currentPlayer) {
    console.error("Primary piece must be owned by the current player");
    return false;
  }

  if (primaryPiece.type === "p" || primaryPiece.type === "k") {
    console.error("Primary piece must be a major piece (queen, rook, bishop, knight)");
    return false;
  }

  // Verify backup pieces are pawns owned by the current player
  for (const square of backups) {
    const piece = this.gameManager.getPieceAt(square);
    if (!piece || piece.color !== currentPlayer || piece.type !== "p") {
      console.error("All backup pieces must be pawns owned by the current player");
      return false;
    }
  }

  // Create the spirit link effect
  const linkEffect = this.createEffect("link", 3, "spiritLink", {
    primarySquare: primary,
    backupSquares: backups,
    removeOnExpire: true,
  });

  // Add the effect to the primary piece
  this.gameManager.addEffect(primary, linkEffect);

  // Add visual effects to linked pieces
  const visualEffect = this.createEffect("visual", 3, "spiritLink", {
    isLinked: true,
    isPrimary: false,
    removeOnExpire: true,
  });

  for (const square of backups) {
    this.gameManager.addEffect(square, visualEffect);
  }

  console.log(`Spirit Link established between ${primary} and ${backups.join(", ")}`);
  return true;
}

// Must also implement a hook in the capture logic:
private handleCapture(square: Square): void {
  const piece = this.gameManager.getPieceAt(square);
  if (!piece) return;

  // Check if this piece has a spirit link effect
  const linkEffect = piece.effects.find(e => e.source === "spiritLink");
  if (linkEffect && linkEffect.modifiers) {
    // If the primary piece is captured, teleport it to the first backup
    const backupSquare = linkEffect.modifiers.backupSquares[0];

    // Remove the backup pawn
    this.gameManager.removePiece(backupSquare);

    // Move the primary piece to the backup location
    this.gameManager.movePieceDirectly(square, backupSquare, false);

    // Remove the spirit link effect
    this.gameManager.removeEffect(square, linkEffect.id);

    console.log(`Spirit Link triggered! ${piece.type} teleported to ${backupSquare}`);
  }
}
```

11. Second Wind (8 Mana)
    Move two pieces (no capture or check)

Implementation:

```typescript
private castSecondWind(): boolean {
  // Create an effect that allows for a second piece move
  const effect = this.createEffect("modifier", 1, "secondWind", {
    allowSecondMove: true,
    removeOnExpire: true,
  });

  // Add the effect to the global game state
  this.gameManager.addGlobalEffect(effect);

  console.log("Second Wind cast - you can move another piece this turn");
  return true;
}

// Implementation will also require tracking in the ChessBoard component:
// After a piece move, if secondWind effect is active, don't end turn
// and allow another piece to be moved.
```

12. Pressure Field (3 Mana)
    Prevent ending adjacent to Rooks

Implementation:

```typescript
private castPressureField(): boolean {
  // Create a global effect that prevents pieces from ending adjacent to rooks
  const effect = this.createEffect("field", 2, "pressureField", {
    preventAdjacentToRook: true,
    removeOnExpire: true,
  });

  // Add the effect to the global game state
  this.gameManager.addGlobalEffect(effect);

  console.log("Pressure Field cast - pieces cannot end adjacent to Rooks for 2 turns");
  return true;
}

// Must also implement a check in the move validation logic:
private isValidMove(from: Square, to: Square): boolean {
  // ... normal move validation ...

  // If pressure field is active, check if destination is adjacent to any rook
  const pressureFieldEffect = this.gameManager.getGlobalEffects()
    .find(e => e.source === "pressureField" && e.modifiers?.preventAdjacentToRook);

  if (pressureFieldEffect) {
    const isAdjacentToRook = this.isSquareAdjacentToRook(to);
    if (isAdjacentToRook) {
      console.error("Cannot move adjacent to a Rook while Pressure Field is active");
      return false;
    }
  }

  return true;
}

private isSquareAdjacentToRook(square: Square): boolean {
  const adjacentSquares = this.getAdjacentSquares(square);

  for (const adjSquare of adjacentSquares) {
    const piece = this.gameManager.getPieceAt(adjSquare);
    if (piece && piece.type === "r") {
      return true;
    }
  }

  return false;
}
```

13. Nullfield (5 Mana)
    Remove any spell effect.

Implementation:

```typescript
private castNullfield(target: Square): boolean {
  const piece = this.gameManager.getPieceAt(target);

  if (!piece) {
    console.error("Target square must contain a piece");
    return false;
  }

  // Check if the piece has any effects
  if (!piece.effects || piece.effects.length === 0) {
    console.error("Target piece doesn't have any effects to remove");
    return false;
  }

  // Remove all spell effects from the piece
  piece.effects = [];

  console.log(`Successfully removed all spell effects from ${target}`);
  return true;
}
```

14. Veil of Shadows (4 Mana)
    Hide board from enemy

Implementation:

```typescript
private castVeilOfShadows(): boolean {
  // Create a global effect that hides the board from the opponent
  const effect = this.createEffect("vision", 1, "veilOfShadows", {
    hideBoard: true,
    removeOnExpire: true,
  });

  // Add the effect to the global game state
  this.gameManager.addGlobalEffect(effect);

  console.log("Veil of Shadows cast - the opponent's vision will be obscured on their next turn");
  return true;
}

// Implementation will also require updates to the rendering logic in Square.tsx:
// If veilOfShadows is active and it's the opponent's turn, hide pieces unless they've been seen
```

15. Raise the Bonewalker (6 Mana)
    Summon pawn → auto-promote in 6 turns.

Implementation:

```typescript
private castRaiseBonewalker(target: Square): boolean {
  // Verify target square is empty
  if (this.gameManager.getPieceAt(target)) {
    console.error("Target square must be empty");
    return false;
  }

  const currentPlayer = this.gameManager.getCurrentPlayer();

  // Create a bonewalker effect that will transform the pawn to a rook after 6 turns
  const bonewalkerEffect = this.createEffect("transform", 6, "bonewalker", {
    finalType: "r", // Will become a rook
    removeOnExpire: false, // Don't remove the piece when the effect expires
  });

  // Add a pawn piece with the bonewalker effect
  this.gameManager.addPiece(
    target,
    "p" as PieceSymbol,
    currentPlayer as "w" | "b",
    [bonewalkerEffect]
  );

  // Add visual effect to make the pawn look like a bonewalker
  const visualEffect = this.createEffect("visual", 999, "bonewalker", {
    visualType: "bonewalker",
    removeOnExpire: false,
  });

  this.gameManager.addEffect(target, visualEffect);

  console.log(`Bonewalker summoned at ${target} - will transform to a Rook in 6 turns`);
  return true;
}

// Add this in processEndOfTurnEffects():
private processBonewalkerEffects(): void {
  for (const square in this.gameManager.getBoardState()) {
    const piece = this.gameManager.getPieceAt(square as Square);
    if (!piece) continue;

    const bonewalkerEffect = piece.effects.find(e => e.source === "bonewalker" && e.duration === 0);
    if (bonewalkerEffect) {
      // Transform the pawn to a rook
      this.gameManager.transformPiece(square as Square, "r", "bonewalker");
      console.log(`Bonewalker at ${square} transformed into a Rook!`);
    }
  }
}
```

📦 Final Notes
GameManager keeps state clean and routes logic.

chess.js is never altered directly — only reloaded via FEN if needed.

customBoardState is your sandbox.

All temporary effects are tracked in a timers or buffs registry.

Step 1. Implement Main Menu where the user can start a game with the computer, user can pick to play as white or black
Step 2. Spell Selection Phase that shows after the user clicks start game from the main menu, out of 15 possible spells, 10 are chosen to be avilable for the player to pick. The user can pick 5, after 5 are picked they can start the game
Step 3. After the user picks their spells, they are taken to the chess board where they can see their spells and the chess board
Step 4. The chess game functionality is implemented when the architecture outlined in this document
Step 5. Spell functionality is implemented
