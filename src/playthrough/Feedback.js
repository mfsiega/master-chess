import React, { Component } from "react";
import { Button } from 'react-bootstrap';

import { EngineEval } from "../engine/EngineEval";
import { EngineEvalComponent } from "../engine/EngineEvalComponent";

export class Feedback extends Component {
  constructor(props) {
    super(props);
    this.referenceEngine = new EngineEval({
      onEvalCallback: (_engineEval) => {},
      fen: this.props.referenceFen,
      onEvalDone: this.onReferenceEvalDone.bind(this)
    });
    this.tryAgainCallback = this.props.tryAgainCallback;
    this.continueCallback = this.props.continueCallback;
    this.wrongMoveEvaluationCallback = this.props.wrongMoveEvaluationCallback;
    this.state = {};
  }

  onPlaythroughEvalDone(engineEval) {
    this.playthroughEval = engineEval;
    if (this.referenceEval) {
      const wrongMoveEvaluation = {
        playthroughEval: this.playthroughEval,
        referenceEval: this.referenceEval
      };
      this.setState({wrongMoveEvaluation});
      this.wrongMoveEvaluationCallback(wrongMoveEvaluation);
      this.playthroughEval = undefined;
      this.referenceEval = undefined;
    }
  }

  onReferenceEvalDone(engineEval) {
    this.referenceEval = engineEval;
    if (this.playthroughEval) {
      const wrongMoveEvaluation = {
        playthroughEval: this.playthroughEval,
        referenceEval: this.referenceEval
      };
      this.setState({wrongMoveEvaluation});
      this.wrongMoveEvaluationCallback(wrongMoveEvaluation);
      this.playthroughEval = undefined;
      this.referenceEval = undefined;
    }
  }

  render() {
    if (this.props.handlingWrongMove) {
      this.referenceEngine.evaluatePosition(this.props.referenceFen);
    } else {
      if (this.state.wrongMoveEvaluation) {
        this.state.wrongMoveEvaluation = undefined;
      }
    }
    let cpl = undefined;
    if (this.state.wrongMoveEvaluation) {
      cpl = this.state.wrongMoveEvaluation.playthroughEval.score - this.state.wrongMoveEvaluation.referenceEval.score;
      cpl = cpl.toFixed(1);
    }
    return (
      <div
        className="h-100"
      >
        <div
          className="feedback-row"
        >
          Evaluation:
          <EngineEvalComponent 
            fen={this.props.fen}
            onEvalDone={this.onPlaythroughEvalDone.bind(this)}/>
        </div>
        <div
          className="feedback-row"
          style={{display: this.props.lastPlayerMove && !this.props.gameOver ? "block" : "none"}}
        >
          You played {this.props.lastPlayerMove} {this.props.handlingWrongMove 
            ? ` - they played ${this.props.handlingWrongMove.referencePlayed}` 
            : ' - correct!'}
          <br/>
          { this.props.handlingWrongMove
            ? (this.state.wrongMoveEvaluation ? `Eval diff: ${cpl}` : 'Evaluation...')
            : ''
          }
        </div>
        <div
          className="feedback-row"
          style={{display: this.props.lastPlayerMove ? "none" : "block"}}>
          </div>
        <div
          className="feedback-row"
          style={{display: this.props.handlingWrongMove ? "block" : "none"}}>
            <div className="h-50">
              <Button
                variant="primary"
                onClick={this.tryAgainCallback.bind(this)}>
                Try Again
              </Button>
            </div>
            <div className="h-50">
              <Button
                variant="primary"
                onClick={this.continueCallback.bind(this)}>
                  Continue
              </Button>
            </div>
        </div>
      </div>
    );
  }
}
