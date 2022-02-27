import Chess from "chess.js";
import { EngineEval } from "../engine/EngineEval";

export class MoveOutcome {
  static CORRECT_MOVE = new MoveOutcome("CORRECT_MOVE");
  static WRONG_MOVE = new MoveOutcome("WRONG_MOVE");
  static ILLEGAL_MOVE = new MoveOutcome("ILLEGAL_MOVE");
}

export class GameController {
  constructor(props) {
    console.log(props);
    this.reference = new Chess();
    try {
      this.reference.load_pgn(props.referencePgn);
    } catch (e) {
      console.log(props.referencePgn);
      throw e;
    }
    this.game = new Chess();
    this.playthroughEval = new EngineEval({
      onEvalCallback: props.onPlaythroughEval,
      onEvalDone: props.onPlaythroughEvalDone,
    });
    this.referenceEval = new EngineEval({
      onEvalCallback: props.onReferenceEval,
      onEvalDone: props.onReferenceEvalDone,
    });
  }

  _isPrefix(game, reference) {
    for (const i in game) {
      if (reference[i] !== game[i]) {
        return false;
      }
    }
    return true;
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
    if (this.game.history().length === 0) {
      return undefined;
    }
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
    if (this.game.history().length === 0) {
      return "start";
    }
    const referenceMove = this.getReferenceMove();
    const lastMove = this.getAlgebraicLastMove();
    this.game.undo();
    if (!this.game.move(referenceMove)) {
      throw new Error("something went wrong");
    }
    const fen = this.game.fen();
    this.game.undo();
    if (!this.game.move(lastMove)) {
      throw new Error("something went wrong");
    }
    return fen;
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

  gameIsOver() {
    return this.game.history().length === this.reference.history().length;
  }

  getHeaders() {
    return this.reference.header();
  }

  evaluatePosition() {
    this.playthroughEval.evaluatePosition(this.game.fen());
  }

  evaluateReferencePosition() {
    this.referenceEval.evaluatePosition(this.getReferenceFen());
  }
}
