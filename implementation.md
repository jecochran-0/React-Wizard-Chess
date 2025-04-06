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

ts
Copy
Edit
function castChronoRecall(square: Square) {
const piece = customBoardState[square];
const prev = piece.prevPositions?.at(-3);
if (!prev || customBoardState[prev]) return false;
customBoardState[prev] = piece;
delete customBoardState[square];
} 7. Cursed Glyph (5 Mana)
Trap square. Delay transformation.

Implementation:

ts
Copy
Edit
glyphs[square] = { turnsLeft: 1 };

function checkGlyphTrigger(square) {
if (glyphs[square]) {
glyphs[square].triggered = true;
}
}

// On end of next turn
if (glyphs[square]?.triggered) {
customBoardState[square].piece = customBoardState[square].piece[0] + 'P';
} 8. King’s Gambit (2 Mana)
Move King twice in one turn.

Implementation: Track a kingDoubleMove flag. Temporarily allow two legal king moves using chess.js.move().

9. Dark Conversion (5 Mana)
   Sacrifice 3 pawns → summon Knight/Bishop.

Implementation:

ts
Copy
Edit
function castDarkConversion(pawnSquares: Square[], pieceType: 'N' | 'B', summonSquare: Square) {
if (pawnSquares.length !== 3) return false;
pawnSquares.forEach(sq => delete customBoardState[sq]);
customBoardState[summonSquare] = { piece: currentPlayer + pieceType };
} 10. Spirit Link (5 Mana)
Link a major piece with pawns.

ts
Copy
Edit
linkedGroups.push({
primary: 'c4',
backups: ['a2', 'a3', 'a4'],
turnsLeft: 3
});

function onCapture(square) {
if (isLinked(square)) {
const group = getLinkGroup(square);
group.backups.forEach(sq => delete customBoardState[sq]);
teleportToNewLocation(group.primary, group.backups);
removeLink(group);
}
} 11. Second Wind (8 Mana)
Move two pieces (no capture or check)

Allow customMove() from-to, validate destination is empty, and move only.

12. Pressure Field (3 Mana)
    Prevent ending adjacent to Rooks

During enemy move validation, check if destSquare is adjacent to any Rook square. If so, invalidate move.

13. Nullfield (5 Mana)
    Remove any spell effect.

Clear all buffs and effects from selected piece/square.

14. Veil of Shadows (4 Mana)
    Hide board from enemy

On enemy turn, render empty squares unless seenBefore.

15. Raise the Bonewalker (6 Mana)
    Summon pawn → auto-promote in 6 turns.

ts
Copy
Edit
bonewalkers[square] = 6;

function tickBonewalkers() {
for (const sq in bonewalkers) {
bonewalkers[sq]--;
if (bonewalkers[sq] <= 0) {
customBoardState[sq].piece = currentPlayer + 'R';
delete bonewalkers[sq];
}
}
}
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
