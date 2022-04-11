import React, { Component } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Chessground from "react-chessground";
import "react-chessground/dist/styles/chessground.css";

import { GameController, MoveOutcome } from "./GameController";
import { Feedback } from "./Feedback";
import { MoveList } from "./MoveList";
import { GameInfo } from "./GameInfo";
import { EngineEval } from "../engine/EngineEval";

export class EventType {
  static MOVE_PLAYED = new EventType("MOVE_PLAYED");
  static MOVE_AUTOPLAYED = new EventType("MOVE_AUTOPLAYED");
  static MOVE_MISMATCH = new EventType("MOVE_MISMATCH");

  constructor(name) {
    this.name = name;
  }

  toString() {
    return `EventType.${this.name}`;
  }
}

export class PlaythroughState {
  static WAITING_FOR_PGN = new PlaythroughState("WAITING_FOR_PGN");
  static WAITING_FOR_MOVE = new PlaythroughState("WAITING_FOR_MOVE");
  static WAITING_FOR_AUTOPLAY = new PlaythroughState("WAITING_FOR_AUTOPLAY");
  static EVALUATING_WRONG_MOVE = new PlaythroughState("EVALUATING_WRONG_MOVE");
  static DONE_EVALUATING_MOVE = new PlaythroughState(
    "DONE_EVALUATING_WRONG_MOVE"
  );

  constructor(name) {
    this.name = name;
  }

  toString() {
    return `PlaythroughState.${this.name}`;
  }
}

export class PlaythroughController extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.playthroughState = props.playthroughState;
    this.pgn = props.pgn;
    if (this.pgn) {
      this.gameController = new GameController(props.pgn);
    }
    this.state = {
      movelist: [],
      fen: "start",
      handlingWrongMove: false,
      moveScores: [],
      cpls: [],
      justContinued: false,
    };
  }

  onMove(from, to) {
    const move = { from, to };
    if (this.playthroughState === PlaythroughState.WAITING_FOR_PGN) {
      this.setState({
        fen: "start",
      });
      return;
    }
    if (this.playthroughState !== PlaythroughState.WAITING_FOR_MOVE) {
      throw new Error(
        `expected state WAITING_FOR_MOVE, actually ${this.playthroughState.toString()}`
      );
    }
    const result = this.gameController.tryMove(move);
    const moveScores = [...this.state.moveScores];
    const cpls = [...this.state.cpls];
    switch (result) {
      case MoveOutcome.ILLEGAL_MOVE: {
        this.gameController.undoLastMove();
        break;
      }
      case MoveOutcome.WRONG_MOVE: {
        // 1. Set state to EVALUATING_WRONG_MOVE.
        // 2. Update feedback by passing via state to props.
        //     a. Indicate the wrong move and the reference move.
        //     b. Feedback will trigger the evaluation.
        // TODO: support a config that autoplays the right move instead.
        this.playthroughState = PlaythroughState.EVALUATING_WRONG_MOVE;
        break;
      }
      case MoveOutcome.CORRECT_MOVE: {
        const nextMove = this.gameController.nextMove();
        if (nextMove) {
          this.autoplayCallback = setTimeout(() => {
            this.onAutoplay(nextMove);
          }, 500);
          this.playthroughState = PlaythroughState.WAITING_FOR_AUTOPLAY;
        }
        moveScores.push("CORRECT");
        cpls.push(0);
        break;
      }
    }
    if (this.state.analysisEnabled) {
      this.gameController.evaluatePosition();
    }
    if (this.playthroughState === PlaythroughState.EVALUATING_WRONG_MOVE) {
      this.gameController.evaluatePosition();
      this.gameController.evaluateReferencePosition();
      if (this.state.playthroughEvalDone && this.state.referenceEvalDone) {
        this.updateWrongMoveScore();
        this.playthroughState = PlaythroughState.DONE_EVALUATING_MOVE;
      }
    }
    this.setState({
      movelist: [...this.gameController.getMoveList()],
      fen: this.gameController.getFen(),
      lastMove:
        result === MoveOutcome.CORRECT_MOVE ? [from, to] : this.state.lastMove,
      lastPlayerMove: this.gameController.getAlgebraicLastMove(),
      handlingWrongMove:
        result === MoveOutcome.WRONG_MOVE
          ? {
              youPlayed: this.gameController.getAlgebraicLastMove(),
              referencePlayed: this.gameController.getReferenceMove(),
            }
          : undefined,
      moveScores,
      cpls,
      playthroughEvalScore: undefined,
      playthroughEvalDepth: undefined,
      playthroughEvalDone: false,
      referenceEvalScore: undefined,
      referenceEvalDepth: undefined,
      referenceEvalDone: false,
      justContinued: false,
    });
  }

  onAutoplay(nextMove) {
    if (this.playthroughState !== PlaythroughState.WAITING_FOR_AUTOPLAY) {
      throw new Error("unexpected autoplay");
    }
    const result = this.gameController.tryMove(nextMove);
    if (result !== MoveOutcome.CORRECT_MOVE) {
      console.log(nextMove);
      throw new Error("invalid autoplay");
    }
    this.autoplayCallback = undefined;
    this.playthroughState = PlaythroughState.WAITING_FOR_MOVE;
    this.setState({
      movelist: [...this.gameController.getMoveList()],
      fen: this.gameController.getFen(),
      lastMove: this.gameController.getLastMove(),
      playthroughEvalDone: false,
    });
  }

  onTryAgain() {
    throw new Error("unimplemented");
  }

  // TODO: playthrough states.
  onContinue() {
    console.log("on continue");
    let undidLastMove = false;
    const moveScores = [...this.state.moveScores];
    if (
      this.playthroughState === PlaythroughState.EVALUATING_WRONG_MOVE ||
      this.playthroughState === PlaythroughState.DONE_EVALUATING_MOVE
    ) {
      this.gameController.undoLastMove();
      undidLastMove = true;
      console.log("undid last move");
    } else {
      this.state.moveScores.push("PASS");
    }
    this.setState({
      movelist: [...this.gameController.getMoveList()],
      fen: this.gameController.getFen(),
      lastMove: this.gameController.getLastMove() || "",
      handlingWrongMove: undefined,
      justContinued: true,
    });
    this.playthroughState = PlaythroughState.WAITING_FOR_AUTOPLAY;
    const referenceMove = this.gameController.nextMove();
    this.autoplayCallback = setTimeout(
      () => {
        this.onAutoplay(referenceMove);
        this.playthroughState = PlaythroughState.WAITING_FOR_AUTOPLAY;
        const nextMove = this.gameController.nextMove();
        this.autoplayCallback = setTimeout(() => {
          this.onAutoplay(nextMove);
        }, 500);
      },
      undidLastMove ? 500 : 10
    );
  }

  updateWrongMoveScore() {
    const evalDiff =
      this.state.playthroughEvalScore - this.state.referenceEvalScore;
    const score = (() => {
      if (evalDiff > 2.0) {
        return "DOUBLE_EXCLAM";
      }
      if (evalDiff > 0.5) {
        return "EXCLAM";
      }
      if (evalDiff > -0.25) {
        return "INTERESTING";
      }
      if (evalDiff > -1.0) {
        return "INACCURACY";
      }
      return "MISTAKE";
    })();
    const moveScores = [...this.state.moveScores];
    const cpls = [...this.state.cpls];
    moveScores.push(score);
    cpls.push(evalDiff * 100);
    this.setState({ moveScores, cpls });
  }

  onToggleEngineAnalysis(checked) {
    this.setState({ analysisEnabled: checked });
    this.gameController.evaluatePosition();
  }

  async onSkipOpening() {
    let i = 0;
    while (i < 5) {
      this.state.moveScores.push("PASS");
      this.playthroughState = PlaythroughState.WAITING_FOR_AUTOPLAY;
      const referenceMove = this.gameController.nextMove();
      this.onAutoplay(referenceMove);
      await new Promise((r) => setTimeout(r, 250));
      this.playthroughState = PlaythroughState.WAITING_FOR_AUTOPLAY;
      const nextMove = this.gameController.nextMove();
      this.onAutoplay(nextMove);
      await new Promise((r) => setTimeout(r, 500));
      i++;
    }
  }

  onPlaythroughEval(engineEval) {
    console.log(`playthroughEval: ${JSON.stringify(engineEval)}`);
    if (!this.state.playthroughEvalDone) {
      this.setState({
        playthroughEvalScore: engineEval.score,
        playthroughEvalDepth: engineEval.depth,
        playthroughEvalDone: false,
      });
    }
  }

  onPlaythroughEvalDone(engineEval) {
    console.log(`playthroughEvalDone: ${JSON.stringify(engineEval)}`);
    this.setState({
      playthroughEvalScore: engineEval.score,
      playthroughEvalDepth: engineEval.depth,
      playthroughEvalDone: true,
    });

    if (
      this.state.playthroughEvalDone &&
      this.state.referenceEvalDone &&
      this.playthroughState === PlaythroughState.EVALUATING_WRONG_MOVE
    ) {
      this.updateWrongMoveScore();
      this.playthroughState = PlaythroughState.DONE_EVALUATING_MOVE;
    }
  }

  onReferenceEval(engineEval) {
    console.log(`referenceEval: ${JSON.stringify(engineEval)}`);
    if (!this.state.referenceEvalDone) {
      this.setState({
        referenceEvalScore: engineEval.score,
        referenceEvalDepth: engineEval.depth,
        referenceEvalDone: false,
      });
    }
  }

  onReferenceEvalDone(engineEval) {
    console.log(`referenceEvalDone: ${JSON.stringify(engineEval)}`);
    this.setState({
      referenceEvalScore: engineEval.score,
      referenceEvalDepth: engineEval.depth,
      referenceEvalDone: true,
    });

    if (
      this.state.playthroughEvalDone &&
      this.state.referenceEvalDone &&
      this.playthroughState === PlaythroughState.EVALUATING_WRONG_MOVE
    ) {
      this.updateWrongMoveScore();
      this.playthroughState = PlaythroughState.DONE_EVALUATING_MOVE;
    }
  }

  componentDidMount() {
    const height = this.divElement.clientHeight;
    this.setState({ containerHeight: height });
  }

  render() {
    if (this.props.pgn && !this.gameController) {
      this.gameController = new GameController({
        referencePgn: this.props.pgn,
        onPlaythroughEval: this.onPlaythroughEval.bind(this),
        onPlaythroughEvalDone: this.onPlaythroughEvalDone.bind(this),
        onReferenceEval: this.onReferenceEval.bind(this),
        onReferenceEvalDone: this.onReferenceEvalDone.bind(this),
      });
      this.playthroughState = PlaythroughState.WAITING_FOR_MOVE;
    }
    return (
      <div
        className="PlaythroughController"
        ref={(divElement) => {
          this.divElement = divElement;
        }}
        height="100%"
        style={{
          padding: "16px",
        }}
      >
        <Container>
          <Row>
            <Col>
              <GameInfo
                pgnHeaders={this.gameController?.getHeaders() || undefined}
                playthroughEval={{
                  done: this.state.playthroughEvalDone,
                  score: this.state.playthroughEvalScore,
                  depth: this.state.playthroughEvalDepth,
                }}
                toggleAnalysisCallback={this.onToggleEngineAnalysis.bind(this)}
                analysisEnabled={this.state.analysisEnabled}
                skipOpeningCallback={
                  this.gameController?.getMoveList().length === 0
                    ? this.onSkipOpening.bind(this)
                    : undefined
                }
              />
              <Feedback
                fen={this.state.fen}
                referenceFen={
                  this.gameController
                    ? this.gameController.getReferenceFen()
                    : "start"
                }
                gameOver={this.gameController?.gameIsOver()}
                handlingWrongMove={this.state.handlingWrongMove}
                lastPlayerMove={this.state.lastPlayerMove}
                justContinued={this.state.justContinued}
                tryAgainCallback={this.onTryAgain.bind(this)}
                continueCallback={this.onContinue.bind(this)}
                containerHeight={this.state.containerHeight}
                cpls={this.state.cpls}
                style={{
                  padding: "8px",
                }}
                playthroughEval={{
                  done: this.state.playthroughEvalDone,
                  score: this.state.playthroughEvalScore,
                  depth: this.state.playthroughEvalDepth,
                }}
                referenceEval={{
                  done: this.state.referenceEvalDone,
                  score: this.state.referenceEvalScore,
                  depth: this.state.referenceEvalDepth,
                }}
              />
            </Col>
            <Col>
              <Chessground
                fen={this.state.fen}
                onMove={this.onMove.bind(this)}
                lastMove={this.state.lastMove}
                movable={{
                  free: false,
                  dests: this.gameController?.getLegalMoves(),
                }}
                draggable={{
                  centerPiece: true,
                  showGhost: true,
                }}
                addDimensionsCssVars={true}
              />
            </Col>
            <Col>
              <div>
                <MoveList
                  movelist={this.state.movelist}
                  moveScores={this.state.moveScores}
                  containerHeight={this.state.containerHeight}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}
