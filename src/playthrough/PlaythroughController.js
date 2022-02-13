import React, { Component } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Chessground from "react-chessground";
import "react-chessground/dist/styles/chessground.css";

import { GameController, MoveOutcome } from "./GameController";
import { Feedback } from "./Feedback";
import { MoveList } from "./MoveList";

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
  static WAITING_FOR_MOVE = new PlaythroughState("WAITING_FOR_MOVE");
  static WAITING_FOR_AUTOPLAY = new PlaythroughState("WAITING_FOR_AUTOPLAY");
  static EVALUATING_WRONG_MOVE = new PlaythroughState("EVALUATING_WRONG_MOVE");

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
    this.playthroughState = props.playthroughState;
    this.pgn = props.pgn;
    this.gameController = new GameController(props.pgn);
    this.state = {
      movelist: [],
      fen: "start",
      handlingWrongMove: false,
      moveScores: [],
    };
  }

  onMove(from, to) {
    const move = { from, to };
    if (this.playthroughState !== PlaythroughState.WAITING_FOR_MOVE) {
      throw new Error(
        `expected state WAITING_FOR_MOVE, actually ${this.playthroughState.toString()}`
      );
    }
    const result = this.gameController.tryMove(move);
    const moveScores = [...this.state.moveScores];
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
          }, 1500);
          this.playthroughState = PlaythroughState.WAITING_FOR_AUTOPLAY;
        }
        moveScores.push("CORRECT");
        break;
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
    });
  }

  onAutoplay(nextMove) {
    if (this.playthroughState !== PlaythroughState.WAITING_FOR_AUTOPLAY) {
      throw new Error("unexpected autoplay");
    }
    const result = this.gameController.tryMove(nextMove);
    if (result !== MoveOutcome.CORRECT_MOVE) {
      throw new Error("invalid autoplay");
    }
    this.autoplayCallback = undefined;
    this.playthroughState = PlaythroughState.WAITING_FOR_MOVE;
    this.setState({
      movelist: [...this.gameController.getMoveList()],
      fen: this.gameController.getFen(),
      lastMove: this.gameController.getLastMove(),
    });
  }

  onTryAgain() {
    throw new Error("unimplemented");
  }

  onContinue() {
    this.gameController.undoLastMove();
    this.setState({
      movelist: [...this.gameController.getMoveList()],
      fen: this.gameController.getFen(),
      lastMove: this.gameController.getLastMove(),
      handlingWrongMove: undefined,
    });
    this.playthroughState = PlaythroughState.WAITING_FOR_AUTOPLAY;
    const referenceMove = this.gameController.nextMove();
    this.autoplayCallback = setTimeout(() => {
      this.onAutoplay(referenceMove);
      this.playthroughState = PlaythroughState.WAITING_FOR_AUTOPLAY;
      const nextMove = this.gameController.nextMove();
      this.autoplayCallback = setTimeout(() => {
        this.onAutoplay(nextMove);
      }, 500);
    }, 500);
  }

  onWrongMoveEvaluation(evaluation) {
    const score = (() => {
      const evalDiff =
        evaluation.playthroughEval.score - evaluation.referenceEval.score;
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
    moveScores.push(score);
    this.setState({ moveScores });
  }

  componentDidMount() {
    const height = this.divElement.clientHeight;
    this.setState({ containerHeight: height });
  }

  render() {
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
              <Feedback
                fen={this.state.fen}
                referenceFen={this.gameController.getReferenceFen()}
                gameOver={
                  this.state.fen === this.gameController.getReferenceFen()
                }
                handlingWrongMove={this.state.handlingWrongMove}
                lastPlayerMove={this.state.lastPlayerMove}
                tryAgainCallback={this.onTryAgain.bind(this)}
                continueCallback={this.onContinue.bind(this)}
                wrongMoveEvaluationCallback={this.onWrongMoveEvaluation.bind(
                  this
                )}
                containerHeight={this.state.containerHeight}
              />
            </Col>
            <Col>
              <Chessground
                fen={this.state.fen}
                onMove={this.onMove.bind(this)}
                lastMove={this.state.lastMove}
                movable={{
                  free: false,
                  dests: this.gameController.getLegalMoves(),
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
