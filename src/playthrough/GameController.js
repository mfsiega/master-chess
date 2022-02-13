import Chess from "chess.js";

export class MoveOutcome {
  static CORRECT_MOVE = new MoveOutcome("CORRECT_MOVE");
  static WRONG_MOVE = new MoveOutcome("WRONG_MOVE");
  static ILLEGAL_MOVE = new MoveOutcome("ILLEGAL_MOVE");
}

export class GameController {
  _isPrefix(game, reference) {
    for (const i in game) {
      if (reference[i] !== game[i]) {
        return false;
      }
    }
    return true;
  }

  constructor(referencePgn) {
    this.reference = new Chess();
    try {
      this.reference.load_pgn(referencePgn);
    } catch (e) {
      console.log(this.referencePgn);
    }
    this.game = new Chess();
  }

  // Try to play the move in the ongoing game; return the outcome.
  tryMove(potentialMove) {
    const move = this.game.move(potentialMove);

    if (!move) {
      return MoveOutcome.ILLEGAL_MOVE;
    }

    if (!this._isPrefix(this.game.history(), this.reference.history())) {
      return MoveOutcome.WRONG_MOVE;
    }

    return MoveOutcome.CORRECT_MOVE;
  }

  undoLastMove() {
    this.game.undo();
  }

  getMoveList() {
    const movelist = [];
    for (const elem of this.game.history()) {
      const lastMove = movelist.pop();
      if (!lastMove) {
        // First turn.
        movelist.push({
          whiteMove: elem,
        });
      } else {
        if (lastMove.blackMove) {
          movelist.push(lastMove);
          movelist.push({
            whiteMove: elem,
          });
        } else {
          lastMove.blackMove = elem;
          movelist.push(lastMove);
        }
      }
    }
    return movelist;
  }

  getLastMove() {
    const verboseLastMove = this.game.history({ verbose: true })[
      this.game.history().length - 1
    ];
    return [verboseLastMove.from, verboseLastMove.to];
  }

  getAlgebraicLastMove() {
    return this.game.history()[this.game.history().length - 1];
  }

  // Get the move from the reference game for the same "index" as the
  // current game.
  getReferenceMove() {
    return this.reference.history()[this.game.history().length - 1];
  }

  getFen() {
    return this.game.fen();
  }

  getReferenceFen() {
    // Make the next move.
    const nextMove = this.nextMove();
    if (this.game.move(nextMove)) {
      const fen = this.game.fen();
      this.game.undo();
      return fen;
    }
    return this.game.fen();
  }

  nextMove() {
    if (this.game.history().length < this.reference.history().length) {
      return this.reference.history()[this.game.history().length];
    }
    return undefined;
  }

  getLegalMoves() {
    const legalMoves = new Map();
    for (const file of "abcdefgh") {
      for (const rank of "12345678") {
        const src = file + rank;
        const dests = this.game.moves({ square: src, verbose: true });
        if (dests.length)
          legalMoves.set(
            src,
            dests.map((m) => m.to)
          );
      }
    }
    return legalMoves;
  }
}
